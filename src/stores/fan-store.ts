import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// -- Types ----------------------------------------------------------------------

export type FanMode = 'auto' | 'manual' | 'off';
export type ConnectionType = 'mqtt' | 'webhook' | 'demo';
export type SpeedLevel = 'off' | 'breeze' | 'gentle' | 'strong' | 'turbo';

// -- Helpers --------------------------------------------------------------------

/**
 * Derive a human-readable speed level from the numeric speed.
 */
function deriveSpeedLevel(speed: number): SpeedLevel {
  if (speed === 0) return 'off';
  if (speed <= 25) return 'breeze';
  if (speed <= 50) return 'gentle';
  if (speed <= 75) return 'strong';
  return 'turbo';
}

// -- State Shape ----------------------------------------------------------------

export interface FanState {
  /* current values */
  speed: number; // 0-100
  mode: FanMode;
  isConnected: boolean;
  connectionType: ConnectionType;
  targetSpeed: number; // 0-100: the desired speed (auto may ramp toward this)
  speedLevel: SpeedLevel;

  /* timestamps */
  lastSpeedChange: number | null;

  /* actions */
  setSpeed: (speed: number) => void;
  setMode: (mode: FanMode) => void;
  setTargetSpeed: (target: number) => void;
  connect: (type: ConnectionType) => void;
  disconnect: () => void;
}

// -- Store ----------------------------------------------------------------------

export const useFanStore = create<FanState>()(
  subscribeWithSelector((set) => ({
    speed: 0,
    mode: 'off',
    isConnected: false,
    connectionType: 'demo',
    targetSpeed: 0,
    speedLevel: 'off',
    lastSpeedChange: null,

    setSpeed: (speed: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(speed)));
      set({
        speed: clamped,
        speedLevel: deriveSpeedLevel(clamped),
        lastSpeedChange: Date.now(),
      });
    },

    setMode: (mode: FanMode) => {
      set({ mode });
      if (mode === 'off') {
        set({ speed: 0, targetSpeed: 0, speedLevel: 'off' });
      }
    },

    setTargetSpeed: (target: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(target)));
      set({ targetSpeed: clamped });
    },

    connect: (type: ConnectionType) => {
      set({ isConnected: true, connectionType: type });
    },

    disconnect: () => {
      set({ isConnected: false });
    },
  })),
);
