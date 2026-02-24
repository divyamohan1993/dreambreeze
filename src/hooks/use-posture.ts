'use client';

/**
 * React hook that combines the sensor store with the posture classifier.
 *
 * Subscribes to accelerometer updates and runs the posture classifier
 * to produce a stable, hysteresis-smoothed posture estimate.
 */

import { useCallback, useEffect, useRef } from 'react';
import { PostureClassifier } from '@/lib/sensors/posture-classifier';
import { useSensorStore } from '@/stores/sensor-store';
import { useSleepStore, type Posture } from '@/stores/sleep-store';

export interface UsePostureReturn {
  currentPosture: Posture;
  confidence: number;
  rawAngles: { pitch: number; roll: number; yaw: number };
  resetClassifier: () => void;
}

export function usePosture(): UsePostureReturn {
  const classifierRef = useRef(new PostureClassifier());
  const resultRef = useRef<{
    posture: Posture;
    confidence: number;
    rawAngles: { pitch: number; roll: number; yaw: number };
  }>({
    posture: 'unknown',
    confidence: 0,
    rawAngles: { pitch: 0, roll: 0, yaw: 0 },
  });

  const currentPosture = useSleepStore((s) => s.currentPosture);
  const updatePosture = useSleepStore((s) => s.updatePosture);
  const isTracking = useSleepStore((s) => s.isTracking);

  // Subscribe to accelerometer changes in sensor store
  useEffect(() => {
    const unsubscribe = useSensorStore.subscribe(
      (state) => state.accelerometer,
      (accel) => {
        if (!isTracking) return;

        const result = classifierRef.current.classify({
          x: accel.x,
          y: accel.y,
          z: accel.z,
          timestamp: Date.now(),
        });

        resultRef.current = result;

        // Update sleep store if posture changed
        if (result.posture !== currentPosture) {
          updatePosture(result.posture, result.confidence);
        }
      },
    );

    return unsubscribe;
  }, [isTracking, currentPosture, updatePosture]);

  const resetClassifier = useCallback(() => {
    classifierRef.current.reset();
  }, []);

  return {
    currentPosture: resultRef.current.posture,
    confidence: resultRef.current.confidence,
    rawAngles: resultRef.current.rawAngles,
    resetClassifier,
  };
}
