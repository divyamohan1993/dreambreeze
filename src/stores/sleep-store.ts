import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Posture =
  | 'supine'
  | 'prone'
  | 'left-lateral'
  | 'right-lateral'
  | 'fetal'
  | 'unknown';

export type SleepStage = 'awake' | 'light' | 'deep' | 'rem';

export interface PostureRecord {
  posture: Posture;
  timestamp: number;
  confidence: number;
}

export interface StageRecord {
  stage: SleepStage;
  timestamp: number;
  confidence: number;
  epochIndex: number;
}

export interface SleepEvent {
  id: string;
  timestamp: number;
  type: 'posture_change' | 'stage_change' | 'fan_adjustment' | 'sound_change' | 'user_action';
  data: Record<string, unknown>;
}

export interface SleepSessionData {
  startTime: number;
  endTime: number | null;
  postureHistory: PostureRecord[];
  stageHistory: StageRecord[];
  events: SleepEvent[];
  sleepScore: number;
}

// ── State Shape ────────────────────────────────────────────────────────────────

export interface SleepState {
  /* session tracking */
  isTracking: boolean;
  startTime: number | null;
  endTime: number | null;

  /* real-time posture & stage */
  currentPosture: Posture;
  currentSleepStage: SleepStage;

  /* history arrays */
  postureHistory: PostureRecord[];
  stageHistory: StageRecord[];
  events: SleepEvent[];

  /* computed metrics */
  sleepScore: number;
  sessionDuration: number; // in seconds

  /* actions */
  startSession: () => void;
  stopSession: () => void;
  updatePosture: (posture: Posture, confidence: number) => void;
  updateSleepStage: (stage: SleepStage, confidence: number, epochIndex: number) => void;
  addEvent: (event: Omit<SleepEvent, 'id'>) => void;
  getSessionData: () => SleepSessionData | null;
  resetSession: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useSleepStore = create<SleepState>()(
  subscribeWithSelector((set, get) => ({
    /* initial state */
    isTracking: false,
    startTime: null,
    endTime: null,
    currentPosture: 'unknown',
    currentSleepStage: 'awake',
    postureHistory: [],
    stageHistory: [],
    events: [],
    sleepScore: 0,
    sessionDuration: 0,

    /* actions */
    startSession: () => {
      const now = Date.now();
      set({
        isTracking: true,
        startTime: now,
        endTime: null,
        currentPosture: 'unknown',
        currentSleepStage: 'awake',
        postureHistory: [],
        stageHistory: [],
        events: [],
        sleepScore: 0,
        sessionDuration: 0,
      });
    },

    stopSession: () => {
      const now = Date.now();
      const { startTime } = get();
      const duration = startTime ? Math.floor((now - startTime) / 1000) : 0;
      set({
        isTracking: false,
        endTime: now,
        sessionDuration: duration,
      });
    },

    updatePosture: (posture: Posture, confidence: number) => {
      const state = get();
      if (!state.isTracking) return;

      const now = Date.now();
      const record: PostureRecord = { posture, timestamp: now, confidence };
      const previousPosture = state.currentPosture;

      set((s) => ({
        currentPosture: posture,
        postureHistory: [...s.postureHistory, record],
        sessionDuration: s.startTime ? Math.floor((now - s.startTime) / 1000) : 0,
      }));

      // Auto-add event on posture change
      if (previousPosture !== posture && previousPosture !== 'unknown') {
        get().addEvent({
          timestamp: now,
          type: 'posture_change',
          data: { from: previousPosture, to: posture, confidence },
        });
      }
    },

    updateSleepStage: (stage: SleepStage, confidence: number, epochIndex: number) => {
      const state = get();
      if (!state.isTracking) return;

      const now = Date.now();
      const record: StageRecord = { stage, timestamp: now, confidence, epochIndex };
      const previousStage = state.currentSleepStage;

      set((s) => ({
        currentSleepStage: stage,
        stageHistory: [...s.stageHistory, record],
        sessionDuration: s.startTime ? Math.floor((now - s.startTime) / 1000) : 0,
      }));

      // Auto-add event on stage change
      if (previousStage !== stage) {
        get().addEvent({
          timestamp: now,
          type: 'stage_change',
          data: { from: previousStage, to: stage, confidence, epochIndex },
        });
      }
    },

    addEvent: (event: Omit<SleepEvent, 'id'>) => {
      const fullEvent: SleepEvent = { ...event, id: generateId() };
      set((s) => ({
        events: [...s.events, fullEvent],
      }));
    },

    getSessionData: (): SleepSessionData | null => {
      const state = get();
      if (!state.startTime) return null;
      return {
        startTime: state.startTime,
        endTime: state.endTime,
        postureHistory: state.postureHistory,
        stageHistory: state.stageHistory,
        events: state.events,
        sleepScore: state.sleepScore,
      };
    },

    resetSession: () => {
      set({
        isTracking: false,
        startTime: null,
        endTime: null,
        currentPosture: 'unknown',
        currentSleepStage: 'awake',
        postureHistory: [],
        stageHistory: [],
        events: [],
        sleepScore: 0,
        sessionDuration: 0,
      });
    },
  })),
);
