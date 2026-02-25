'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AmbientNoiseAnalyzer,
  type AmbientNoiseReading,
} from '@/lib/sensors/ambient-noise';

interface UseAmbientNoiseReturn {
  isRunning: boolean;
  reading: AmbientNoiseReading | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * React hook for real-time ambient noise measurement.
 *
 * Usage:
 * ```tsx
 * const { isRunning, reading, start, stop } = useAmbientNoise();
 * ```
 *
 * - `start()` requests microphone permission and begins sampling.
 * - `stop()` releases the microphone and clears readings.
 * - `reading` updates every 500 ms with dB level, noise floor, and classification.
 */
export function useAmbientNoise(): UseAmbientNoiseReturn {
  const analyzerRef = useRef<AmbientNoiseAnalyzer | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [reading, setReading] = useState<AmbientNoiseReading | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      analyzerRef.current?.stop();
    };
  }, []);

  const start = useCallback(async () => {
    if (!analyzerRef.current) {
      analyzerRef.current = new AmbientNoiseAnalyzer();
    }
    analyzerRef.current.onReading(setReading);
    await analyzerRef.current.start();
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    analyzerRef.current?.stop();
    setIsRunning(false);
    setReading(null);
  }, []);

  return { isRunning, reading, start, stop };
}
