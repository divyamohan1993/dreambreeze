'use client';

/**
 * React hook integrating FanController with the fan store and sleep store.
 *
 * In auto mode, it reacts to posture + sleep stage changes and smoothly
 * ramps fan speed using the smoothSpeed algorithm.
 */

import { useCallback, useEffect, useRef } from 'react';
import { DemoFanController, mapPostureToSpeed, smoothSpeed, type FanController } from '@/lib/fan/fan-controller';
import { MQTTFanController, type MQTTConfig } from '@/lib/fan/mqtt-client';
import { WebhookFanController, type WebhookConfig } from '@/lib/fan/webhook-client';
import { useFanStore, type ConnectionType, type FanMode } from '@/stores/fan-store';
import { useSleepStore } from '@/stores/sleep-store';

export interface UseFanControlReturn {
  speed: number;
  targetSpeed: number;
  mode: FanMode;
  isConnected: boolean;
  connectionType: ConnectionType;
  speedLevel: string;
  setSpeed: (speed: number) => Promise<void>;
  setMode: (mode: FanMode) => void;
  connectDemo: () => Promise<void>;
  connectMQTT: (config: MQTTConfig) => Promise<boolean>;
  connectWebhook: (config: WebhookConfig) => Promise<boolean>;
  disconnect: () => Promise<void>;
}

const RAMP_INTERVAL_MS = 200; // how often we step toward target speed

export function useFanControl(): UseFanControlReturn {
  const controllerRef = useRef<FanController | null>(null);
  const rampTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    speed,
    targetSpeed,
    mode,
    isConnected,
    connectionType,
    speedLevel,
    setSpeed: storeSetSpeed,
    setMode: storeSetMode,
    setTargetSpeed,
    connect: storeConnect,
    disconnect: storeDisconnect,
  } = useFanStore();

  const currentPosture = useSleepStore((s) => s.currentPosture);
  const currentSleepStage = useSleepStore((s) => s.currentSleepStage);
  const isTracking = useSleepStore((s) => s.isTracking);

  // Speed ramping loop: smoothly approach target
  useEffect(() => {
    if (!isConnected || mode === 'off') {
      if (rampTimerRef.current) {
        clearInterval(rampTimerRef.current);
        rampTimerRef.current = null;
      }
      return;
    }

    rampTimerRef.current = setInterval(() => {
      const { speed: currentSpeed, targetSpeed: target } = useFanStore.getState();
      if (currentSpeed === target) return;

      const nextSpeed = smoothSpeed(currentSpeed, target);
      storeSetSpeed(nextSpeed);
      controllerRef.current?.setSpeed(nextSpeed).catch(() => {
        // Silent failure — we will retry next interval
      });
    }, RAMP_INTERVAL_MS);

    return () => {
      if (rampTimerRef.current) {
        clearInterval(rampTimerRef.current);
        rampTimerRef.current = null;
      }
    };
  }, [isConnected, mode, storeSetSpeed]);

  // Auto mode: react to posture + stage changes
  useEffect(() => {
    if (mode !== 'auto' || !isTracking || !isConnected) return;

    const mapped = mapPostureToSpeed(currentPosture, currentSleepStage);
    setTargetSpeed(mapped);

    // Also log a fan adjustment event
    useSleepStore.getState().addEvent({
      timestamp: Date.now(),
      type: 'fan_adjustment',
      data: {
        speed: mapped,
        posture: currentPosture,
        stage: currentSleepStage,
        source: 'auto',
      },
    });
  }, [currentPosture, currentSleepStage, mode, isTracking, isConnected, setTargetSpeed]);

  // ── Connection methods ──────────────────────────────────────────────────

  const setSpeed = useCallback(
    async (newSpeed: number) => {
      setTargetSpeed(newSpeed);
      if (mode === 'manual' && controllerRef.current) {
        storeSetSpeed(newSpeed);
        await controllerRef.current.setSpeed(newSpeed);
      }
    },
    [mode, setTargetSpeed, storeSetSpeed],
  );

  const setMode = useCallback(
    (newMode: FanMode) => {
      storeSetMode(newMode);
      if (newMode === 'off') {
        setTargetSpeed(0);
        controllerRef.current?.setSpeed(0);
      }
    },
    [storeSetMode, setTargetSpeed],
  );

  const connectDemo = useCallback(async () => {
    const controller = new DemoFanController((s) => storeSetSpeed(s));
    await controller.connect();
    controllerRef.current = controller;
    storeConnect('demo');
  }, [storeConnect, storeSetSpeed]);

  const connectMQTT = useCallback(
    async (config: MQTTConfig): Promise<boolean> => {
      const controller = new MQTTFanController(config);
      const success = await controller.connect();
      if (success) {
        controllerRef.current = controller;
        storeConnect('mqtt');
      }
      return success;
    },
    [storeConnect],
  );

  const connectWebhook = useCallback(
    async (config: WebhookConfig): Promise<boolean> => {
      const controller = new WebhookFanController(config);
      const success = await controller.connect();
      if (success) {
        controllerRef.current = controller;
        storeConnect('webhook');
      }
      return success;
    },
    [storeConnect],
  );

  const disconnect = useCallback(async () => {
    await controllerRef.current?.disconnect();
    controllerRef.current = null;
    storeDisconnect();
  }, [storeDisconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.disconnect();
    };
  }, []);

  return {
    speed,
    targetSpeed,
    mode,
    isConnected,
    connectionType,
    speedLevel,
    setSpeed,
    setMode,
    connectDemo,
    connectMQTT,
    connectWebhook,
    disconnect,
  };
}
