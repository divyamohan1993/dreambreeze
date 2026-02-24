'use client';

/**
 * React hook wrapping DeviceMotionSensor.
 *
 * Provides:
 * - Permission request flow
 * - Start/stop sensor
 * - Real-time accelerometer and gyroscope data pushed to sensor store
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceMotionSensor, type SensorReading } from '@/lib/sensors/device-motion';
import { useSensorStore } from '@/stores/sensor-store';

export interface UseDeviceMotionReturn {
  isRunning: boolean;
  hasPermission: boolean;
  isCalibrated: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  calibrate: () => void;
  requestPermission: () => Promise<boolean>;
}

export function useDeviceMotion(sampleRate = 50): UseDeviceMotionReturn {
  const sensorRef = useRef<DeviceMotionSensor | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    hasPermission,
    isCalibrated,
    updateAccelerometer,
    updateGyroscope,
    setPermission,
    calibrate: storeCalibrate,
    setSampleRate,
  } = useSensorStore();

  // Ensure a single sensor instance
  useEffect(() => {
    sensorRef.current = new DeviceMotionSensor(sampleRate);
    setSampleRate(sampleRate);

    return () => {
      sensorRef.current?.stop();
      sensorRef.current = null;
    };
  }, [sampleRate, setSampleRate]);

  // Handle readings
  const handleReading = useCallback(
    (reading: SensorReading) => {
      updateAccelerometer({
        x: reading.accelerometer.x,
        y: reading.accelerometer.y,
        z: reading.accelerometer.z,
      });
      updateGyroscope({
        alpha: reading.gyroscope.alpha,
        beta: reading.gyroscope.beta,
        gamma: reading.gyroscope.gamma,
      });
    },
    [updateAccelerometer, updateGyroscope],
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!sensorRef.current) return false;
    try {
      const granted = await sensorRef.current.requestPermission();
      setPermission(granted);
      if (!granted) {
        setError('Motion sensor permission denied.');
      }
      return granted;
    } catch (err) {
      setError('Failed to request sensor permission.');
      return false;
    }
  }, [setPermission]);

  const start = useCallback(async () => {
    if (!sensorRef.current) {
      setError('Sensor not available.');
      return;
    }

    // Check for DeviceMotion API
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      setError('DeviceMotion API not supported on this device.');
      return;
    }

    // Request permission if needed
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    sensorRef.current.onReading(handleReading);
    sensorRef.current.start();
    setIsRunning(true);
    setError(null);
  }, [hasPermission, requestPermission, handleReading]);

  const stop = useCallback(() => {
    sensorRef.current?.stop();
    setIsRunning(false);
  }, []);

  const calibrate = useCallback(() => {
    const sensor = sensorRef.current;
    const { accelerometer } = useSensorStore.getState();
    if (sensor) {
      sensor.calibrate(accelerometer);
    }
    storeCalibrate();
  }, [storeCalibrate]);

  return {
    isRunning,
    hasPermission,
    isCalibrated,
    error,
    start,
    stop,
    calibrate,
    requestPermission,
  };
}
