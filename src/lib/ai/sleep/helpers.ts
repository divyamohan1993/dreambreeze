/**
 * Shared helper functions and types for the sleep analysis modules.
 *
 * All functions here are pure utilities with no side effects.
 */

import type { StageRecord, PostureRecord, SleepSessionData } from '@/stores/sleep-store';

// -- Shared Types -------------------------------------------------------------

export interface SleepStageDurations {
  awake: number;
  light: number;
  deep: number;
  rem: number;
  total: number;
}

export interface HistoricalSession {
  date: string;
  sessionData: SleepSessionData;
  score: number;
}

// -- Helper Functions ---------------------------------------------------------

export function computeStageDurations(stageHistory: StageRecord[], totalDurationMs: number): SleepStageDurations {
  if (stageHistory.length === 0) {
    return { awake: totalDurationMs, light: 0, deep: 0, rem: 0, total: totalDurationMs };
  }

  const durations: SleepStageDurations = { awake: 0, light: 0, deep: 0, rem: 0, total: totalDurationMs };

  for (let i = 0; i < stageHistory.length; i++) {
    const start = stageHistory[i].timestamp;
    const end = i < stageHistory.length - 1
      ? stageHistory[i + 1].timestamp
      : start + (totalDurationMs - (start - stageHistory[0].timestamp));
    const duration = Math.max(0, end - start);
    durations[stageHistory[i].stage] += duration;
  }

  return durations;
}

export function countPostureChanges(postureHistory: PostureRecord[]): number {
  let changes = 0;
  for (let i = 1; i < postureHistory.length; i++) {
    if (postureHistory[i].posture !== postureHistory[i - 1].posture) {
      changes++;
    }
  }
  return changes;
}

export function countAwakenings(stageHistory: StageRecord[]): number {
  let awakenings = 0;
  let wasAsleep = false;
  for (const record of stageHistory) {
    if (record.stage !== 'awake') {
      wasAsleep = true;
    } else if (wasAsleep) {
      awakenings++;
      wasAsleep = false;
    }
  }
  return awakenings;
}

export function estimateSleepOnsetMs(stageHistory: StageRecord[]): number {
  if (stageHistory.length < 2) return 0;
  const sessionStart = stageHistory[0].timestamp;
  for (const record of stageHistory) {
    if (record.stage !== 'awake') {
      return record.timestamp - sessionStart;
    }
  }
  return 0;
}

export function msToMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
