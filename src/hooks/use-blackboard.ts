'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  blackboard,
  type BlackboardState,
  type PreSleepContext,
  type WeatherData,
} from '@/lib/ai/blackboard';
import {
  createController,
  type BlackboardController,
} from '@/lib/ai/controller';
import { useFanStore } from '@/stores/fan-store';
import { useAudioStore } from '@/stores/audio-store';
import { useSleepStore } from '@/stores/sleep-store';

const CYCLE_INTERVAL = 30_000; // 30 seconds

export function useBlackboard() {
  const [snapshot, setSnapshot] = useState<BlackboardState | null>(null);
  const [insights, setInsights] = useState<
    Array<{ message: string; category: string; timestamp: number }>
  >([]);
  const [cycleCount, setCycleCount] = useState(0);
  const controllerRef = useRef<BlackboardController | null>(null);

  const sleepStore = useSleepStore();

  // Create controller on mount
  useEffect(() => {
    const controller = createController({
      cycleIntervalMs: CYCLE_INTERVAL,
      onFanSpeed: (speed) => {
        if (useFanStore.getState().mode === 'auto') {
          useFanStore.setState({ targetSpeed: speed, speed });
        }
      },
      onSoundChange: (noiseType, volume) => {
        if (useAudioStore.getState().adaptiveMode) {
          useAudioStore.setState({
            noiseType: noiseType as 'white' | 'pink' | 'brown',
            volume,
          });
        }
      },
      onInsight: (message, category) => {
        setInsights((prev) => [
          ...prev.slice(-19),
          { message, category, timestamp: Date.now() },
        ]);
      },
      onWakeSequence: () => {
        // Trigger morning mode -- gradual volume decrease, fan increase
        useFanStore.setState({ mode: 'auto' });
      },
    });

    controllerRef.current = controller;

    // Subscribe to blackboard changes for UI
    const unsub = blackboard.subscribe(() => {
      setSnapshot(blackboard.getSnapshot());
      setCycleCount(controller.getCycleCount());
    });

    return () => {
      controller.stop();
      unsub();
    };
  }, []);

  // Sync sleep store -> blackboard context
  useEffect(() => {
    blackboard.updateContext({
      currentPosture: sleepStore.currentPosture,
      currentSleepStage: sleepStore.currentSleepStage,
      sessionDurationMinutes: sleepStore.sessionDuration / 60,
    });
  }, [
    sleepStore.currentPosture,
    sleepStore.currentSleepStage,
    sleepStore.sessionDuration,
  ]);

  const startAgents = useCallback(() => {
    blackboard.reset();
    controllerRef.current?.start();
  }, []);

  const stopAgents = useCallback(() => {
    controllerRef.current?.stop();
    setCycleCount(0);
  }, []);

  const setPreSleepContext = useCallback((ctx: PreSleepContext) => {
    blackboard.updateContext({ preSleepContext: ctx });
  }, []);

  const setWeatherData = useCallback((data: WeatherData) => {
    blackboard.updateContext({ weatherData: data });
  }, []);

  const setSleepDebt = useCallback((hours: number) => {
    blackboard.updateContext({ sleepDebt: hours });
  }, []);

  return {
    snapshot,
    insights,
    startAgents,
    stopAgents,
    setPreSleepContext,
    setWeatherData,
    setSleepDebt,
    cycleCount,
  };
}
