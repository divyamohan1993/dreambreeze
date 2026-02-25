import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { NoiseType } from '@/types/sleep';

// Re-export so existing consumers that import from this module still work.
export type { NoiseType } from '@/types/sleep';

// -- Types ----------------------------------------------------------------------

export interface AudioMix {
  primary: NoiseType;
  primaryGain: number; // 0-1
  secondary: NoiseType | null;
  secondaryGain: number; // 0-1
  masterVolume: number; // 0-1
}

// -- State Shape ----------------------------------------------------------------

export interface AudioState {
  isPlaying: boolean;
  noiseType: NoiseType;
  volume: number; // 0-1
  adaptiveMode: boolean;
  currentMix: AudioMix;

  /* actions */
  play: () => void;
  stop: () => void;
  setNoiseType: (type: NoiseType) => void;
  setVolume: (volume: number) => void;
  toggleAdaptive: () => void;
  updateMix: (mix: Partial<AudioMix>) => void;
}

// -- Store ----------------------------------------------------------------------

const defaultMix: AudioMix = {
  primary: 'white',
  primaryGain: 1.0,
  secondary: null,
  secondaryGain: 0,
  masterVolume: 0.5,
};

export const useAudioStore = create<AudioState>()(
  subscribeWithSelector((set, get) => ({
    isPlaying: false,
    noiseType: 'white',
    volume: 0.5,
    adaptiveMode: false,
    currentMix: { ...defaultMix },

    play: () => {
      const { noiseType, volume } = get();
      set({
        isPlaying: true,
        currentMix: {
          primary: noiseType,
          primaryGain: 1.0,
          secondary: null,
          secondaryGain: 0,
          masterVolume: volume,
        },
      });
    },

    stop: () => {
      set({ isPlaying: false });
    },

    setNoiseType: (type: NoiseType) => {
      set((s) => ({
        noiseType: type,
        currentMix: {
          ...s.currentMix,
          primary: type,
        },
      }));
    },

    setVolume: (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      set((s) => ({
        volume: clamped,
        currentMix: {
          ...s.currentMix,
          masterVolume: clamped,
        },
      }));
    },

    toggleAdaptive: () => {
      set((s) => ({ adaptiveMode: !s.adaptiveMode }));
    },

    updateMix: (mix: Partial<AudioMix>) => {
      set((s) => ({
        currentMix: { ...s.currentMix, ...mix },
      }));
    },
  })),
);
