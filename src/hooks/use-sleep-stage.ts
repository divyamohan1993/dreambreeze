'use client';

/**
 * React hook wrapping the SleepStageEstimator.
 *
 * Feeds accelerometer readings into the estimator and updates
 * the sleep store when a new epoch completes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { SleepStageEstimator, type EpochResult } from '@/lib/ai/sleep-stage-estimator';
import { useSensorStore } from '@/stores/sensor-store';
import { useSleepStore, type SleepStage } from '@/stores/sleep-store';

export interface UseSleepStageReturn {
  currentStage: SleepStage;
  lastEpoch: EpochResult | null;
  epochIndex: number;
  resetEstimator: () => void;
}

export function useSleepStage(): UseSleepStageReturn {
  const estimatorRef = useRef(new SleepStageEstimator());
  const lastEpochRef = useRef<EpochResult | null>(null);
  const [lastEpoch, setLastEpoch] = useState<EpochResult | null>(null);
  const [epochIndex, setEpochIndex] = useState(0);

  const currentStage = useSleepStore((s) => s.currentSleepStage);
  const updateSleepStage = useSleepStore((s) => s.updateSleepStage);
  const isTracking = useSleepStore((s) => s.isTracking);

  // Subscribe to accelerometer changes
  useEffect(() => {
    const unsubscribe = useSensorStore.subscribe(
      (state) => state.accelerometer,
      (accel) => {
        if (!isTracking) return;

        const result = estimatorRef.current.addReading(
          accel.x,
          accel.y,
          accel.z,
          Date.now(),
        );

        // Epoch completed -- update store
        if (result) {
          lastEpochRef.current = result;
          setLastEpoch(result);
          setEpochIndex(estimatorRef.current.getEpochIndex());
          updateSleepStage(result.stage, result.confidence, result.epochIndex);
        }
      },
    );

    return unsubscribe;
  }, [isTracking, updateSleepStage]);

  const resetEstimator = useCallback(() => {
    estimatorRef.current.reset();
    lastEpochRef.current = null;
    setLastEpoch(null);
    setEpochIndex(0);
  }, []);

  return {
    currentStage,
    lastEpoch,
    epochIndex,
    resetEstimator,
  };
}
