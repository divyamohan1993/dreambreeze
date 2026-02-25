/**
 * Sleep Scorer -- computes a composite 0-100 sleep quality score.
 */

import type { SleepSessionData } from '@/stores/sleep-store';
import {
  computeStageDurations,
  countPostureChanges,
  countAwakenings,
  estimateSleepOnsetMs,
  clamp,
} from './helpers';

// -- Types --------------------------------------------------------------------

export interface SleepScoreBreakdown {
  total: number;
  deepSleepScore: number;
  remSleepScore: number;
  awakeningsScore: number;
  postureScore: number;
  sleepOnsetScore: number;
}

// -- Main Function ------------------------------------------------------------

/**
 * Calculate a composite sleep score (0-100).
 */
export function calculateSleepScore(sessionData: SleepSessionData): SleepScoreBreakdown {
  const totalMs = (sessionData.endTime ?? Date.now()) - sessionData.startTime;
  const durations = computeStageDurations(sessionData.stageHistory, totalMs);
  const postureChanges = countPostureChanges(sessionData.postureHistory);
  const awakenings = countAwakenings(sessionData.stageHistory);
  const sleepOnsetMs = estimateSleepOnsetMs(sessionData.stageHistory);

  // 1. Deep sleep score (25 points)
  // Target: 15-20% of total sleep
  const deepPct = totalMs > 0 ? (durations.deep / totalMs) * 100 : 0;
  let deepSleepScore: number;
  if (deepPct >= 15 && deepPct <= 20) {
    deepSleepScore = 25;
  } else if (deepPct >= 10 && deepPct < 15) {
    deepSleepScore = 15 + ((deepPct - 10) / 5) * 10;
  } else if (deepPct > 20 && deepPct <= 30) {
    deepSleepScore = 25 - ((deepPct - 20) / 10) * 5;
  } else if (deepPct < 10) {
    deepSleepScore = (deepPct / 10) * 15;
  } else {
    deepSleepScore = 15;
  }

  // 2. REM score (25 points)
  // Target: 20-25% of total sleep
  const remPct = totalMs > 0 ? (durations.rem / totalMs) * 100 : 0;
  let remSleepScore: number;
  if (remPct >= 20 && remPct <= 25) {
    remSleepScore = 25;
  } else if (remPct >= 15 && remPct < 20) {
    remSleepScore = 15 + ((remPct - 15) / 5) * 10;
  } else if (remPct > 25 && remPct <= 35) {
    remSleepScore = 25 - ((remPct - 25) / 10) * 5;
  } else if (remPct < 15) {
    remSleepScore = (remPct / 15) * 15;
  } else {
    remSleepScore = 15;
  }

  // 3. Awakenings score (20 points)
  // 0-1 awakenings = perfect, degrades with more
  let awakeningsScore: number;
  if (awakenings <= 1) {
    awakeningsScore = 20;
  } else if (awakenings <= 3) {
    awakeningsScore = 15;
  } else if (awakenings <= 5) {
    awakeningsScore = 10;
  } else if (awakenings <= 8) {
    awakeningsScore = 5;
  } else {
    awakeningsScore = 0;
  }

  // 4. Posture changes score (15 points)
  // 10-40 per night is normal
  let postureScore: number;
  if (postureChanges >= 10 && postureChanges <= 40) {
    postureScore = 15;
  } else if (postureChanges < 10) {
    postureScore = 10 + (postureChanges / 10) * 5;
  } else if (postureChanges <= 60) {
    postureScore = 15 - ((postureChanges - 40) / 20) * 10;
  } else {
    postureScore = 2;
  }

  // 5. Sleep onset score (15 points)
  // < 15 min is ideal
  const onsetMin = sleepOnsetMs / 60_000;
  let sleepOnsetScore: number;
  if (onsetMin <= 15) {
    sleepOnsetScore = 15;
  } else if (onsetMin <= 30) {
    sleepOnsetScore = 15 - ((onsetMin - 15) / 15) * 8;
  } else if (onsetMin <= 60) {
    sleepOnsetScore = 7 - ((onsetMin - 30) / 30) * 5;
  } else {
    sleepOnsetScore = 0;
  }

  const total = clamp(
    Math.round(deepSleepScore + remSleepScore + awakeningsScore + postureScore + sleepOnsetScore),
    0,
    100,
  );

  return {
    total,
    deepSleepScore: Math.round(deepSleepScore),
    remSleepScore: Math.round(remSleepScore),
    awakeningsScore: Math.round(awakeningsScore),
    postureScore: Math.round(postureScore),
    sleepOnsetScore: Math.round(sleepOnsetScore),
  };
}
