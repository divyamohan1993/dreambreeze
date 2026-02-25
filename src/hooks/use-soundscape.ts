'use client';

/**
 * React hook wrapping the SoundscapeEngine.
 *
 * Manages the AudioContext lifecycle, provides play/stop/volume controls,
 * and optionally adapts the mix to sleep stage changes.
 */

import { useCallback, useEffect, useRef } from 'react';
import { SoundscapeEngine } from '@/lib/audio/soundscape-engine';
import { useAudioStore, type NoiseType } from '@/stores/audio-store';
import { useSleepStore } from '@/stores/sleep-store';

export interface UseSoundscapeReturn {
  isPlaying: boolean;
  noiseType: NoiseType;
  volume: number;
  adaptiveMode: boolean;
  play: (type?: NoiseType, vol?: number) => Promise<void>;
  stop: () => void;
  setVolume: (vol: number) => void;
  setNoiseType: (type: NoiseType) => void;
  toggleAdaptive: () => void;
}

export function useSoundscape(): UseSoundscapeReturn {
  const engineRef = useRef<SoundscapeEngine | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const {
    isPlaying,
    noiseType,
    volume,
    adaptiveMode,
    play: storePlay,
    stop: storeStop,
    setNoiseType: storeSetNoiseType,
    setVolume: storeSetVolume,
    toggleAdaptive,
  } = useAudioStore();

  const currentSleepStage = useSleepStore((s) => s.currentSleepStage);

  // Initialize engine on mount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
      if (ctxRef.current?.state !== 'closed') {
        ctxRef.current?.close();
      }
      ctxRef.current = null;
    };
  }, []);

  // Ensure AudioContext and engine are ready
  const ensureEngine = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (!engineRef.current) {
      engineRef.current = new SoundscapeEngine();
      engineRef.current.init(ctxRef.current);
    }
    return engineRef.current;
  }, []);

  // Adapt to sleep stage changes when adaptive mode is on
  useEffect(() => {
    if (!adaptiveMode || !isPlaying || !engineRef.current) return;
    engineRef.current.adaptToSleepStage(currentSleepStage);
  }, [currentSleepStage, adaptiveMode, isPlaying]);

  const play = useCallback(
    async (type?: NoiseType, vol?: number) => {
      const engine = ensureEngine();
      const playType = type ?? noiseType;
      const playVol = vol ?? volume;

      if (type) storeSetNoiseType(type);
      if (vol !== undefined) storeSetVolume(vol);

      // Ensure AudioContext is resumed before playing (browser autoplay policy)
      if (engine.audioContext?.state === 'suspended') {
        await engine.audioContext.resume();
      }

      await engine.play(playType, playVol);
      storePlay();
    },
    [ensureEngine, noiseType, volume, storePlay, storeSetNoiseType, storeSetVolume],
  );

  const stop = useCallback(() => {
    engineRef.current?.stop();
    storeStop();
  }, [storeStop]);

  const setVolume = useCallback(
    (vol: number) => {
      storeSetVolume(vol);
      engineRef.current?.setVolume(vol);
    },
    [storeSetVolume],
  );

  const setNoiseType = useCallback(
    (type: NoiseType) => {
      storeSetNoiseType(type);
      if (isPlaying && engineRef.current) {
        // Restart with new type (fire-and-forget -- errors handled inside engine)
        const engine = ensureEngine();
        void engine.play(type, volume);
      }
    },
    [isPlaying, volume, storeSetNoiseType, ensureEngine],
  );

  return {
    isPlaying,
    noiseType,
    volume,
    adaptiveMode,
    play,
    stop,
    setVolume,
    setNoiseType,
    toggleAdaptive,
  };
}
