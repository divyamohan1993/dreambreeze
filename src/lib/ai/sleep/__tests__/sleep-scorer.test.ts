import { describe, it, expect } from 'vitest';
import { calculateSleepScore } from '../sleep-scorer';
import type { SleepSessionData } from '@/stores/sleep-store';
import type { StageRecord, PostureRecord } from '@/stores/sleep-store';

// -- Test Helpers -------------------------------------------------------------

const HOUR = 3_600_000;
const MINUTE = 60_000;
const BASE_TIME = 1_700_000_000_000; // arbitrary epoch timestamp

/**
 * Build a SleepSessionData with controllable stage percentages and parameters.
 *
 * deepPct / remPct / lightPct are expressed as 0-100.  The remainder is awake.
 * onsetMinutes controls how long the initial awake period is.
 * awakeningCount adds mid-sleep awake intervals.
 * postureChangeCount controls how many distinct posture transitions occur.
 */
function buildSession(opts: {
  totalHours: number;
  deepPct: number;
  remPct: number;
  lightPct?: number;
  onsetMinutes?: number;
  awakeningCount?: number;
  postureChangeCount?: number;
}): SleepSessionData {
  const totalMs = opts.totalHours * HOUR;
  const onset = (opts.onsetMinutes ?? 0) * MINUTE;
  const deepMs = totalMs * (opts.deepPct / 100);
  const remMs = totalMs * (opts.remPct / 100);
  const lightPct = opts.lightPct ?? Math.max(0, 100 - opts.deepPct - opts.remPct);
  const lightMs = totalMs * (lightPct / 100);

  const stageHistory: StageRecord[] = [];
  let cursor = BASE_TIME;

  // Initial awake period (sleep onset)
  if (onset > 0) {
    stageHistory.push({ stage: 'awake', timestamp: cursor, confidence: 0.9, epochIndex: 0 });
    cursor += onset;
  }

  // Light sleep block
  if (lightMs > 0) {
    stageHistory.push({ stage: 'light', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += lightMs;
  }

  // Deep sleep block
  if (deepMs > 0) {
    stageHistory.push({ stage: 'deep', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += deepMs;
  }

  // REM sleep block
  if (remMs > 0) {
    stageHistory.push({ stage: 'rem', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += remMs;
  }

  // Awakenings (inject small awake-then-light intervals)
  const awakeningCount = opts.awakeningCount ?? 0;
  for (let i = 0; i < awakeningCount; i++) {
    stageHistory.push({ stage: 'awake', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += 1 * MINUTE;
    stageHistory.push({ stage: 'light', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += 1 * MINUTE;
  }

  // Build posture history with the requested number of changes
  const postureChangeCount = opts.postureChangeCount ?? 15;
  const postures: Array<'supine' | 'left-lateral' | 'right-lateral'> = ['supine', 'left-lateral', 'right-lateral'];
  const postureHistory: PostureRecord[] = [];
  for (let i = 0; i <= postureChangeCount; i++) {
    postureHistory.push({
      posture: postures[i % postures.length],
      timestamp: BASE_TIME + (totalMs / (postureChangeCount + 1)) * i,
      confidence: 0.9,
    });
  }

  return {
    startTime: BASE_TIME,
    endTime: BASE_TIME + totalMs,
    stageHistory,
    postureHistory,
    events: [],
    sleepScore: 0,
  };
}

// -- Tests --------------------------------------------------------------------

describe('calculateSleepScore', () => {
  it('returns a near-perfect score for an ideal night', () => {
    // 8h, 20% deep, 25% REM, 0 awakenings, 15 posture changes, fast onset
    const session = buildSession({
      totalHours: 8,
      deepPct: 20,
      remPct: 25,
      onsetMinutes: 5,
      awakeningCount: 0,
      postureChangeCount: 15,
    });

    const result = calculateSleepScore(session);

    // Deep: 25, REM: 25, Awakenings: 20, Posture: 15, Onset: 15 = 100
    expect(result.total).toBeGreaterThanOrEqual(95);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.deepSleepScore).toBe(25);
    expect(result.remSleepScore).toBe(25);
    expect(result.awakeningsScore).toBe(20);
    expect(result.postureScore).toBe(15);
    expect(result.sleepOnsetScore).toBe(15);
  });

  it('returns a low score for a poor night', () => {
    // 4h, 5% deep, 10% REM, 6 awakenings, 70 posture changes, slow onset
    const session = buildSession({
      totalHours: 4,
      deepPct: 5,
      remPct: 10,
      onsetMinutes: 45,
      awakeningCount: 6,
      postureChangeCount: 70,
    });

    const result = calculateSleepScore(session);

    expect(result.total).toBeLessThan(40);
    expect(result.deepSleepScore).toBeLessThan(15);
    expect(result.remSleepScore).toBeLessThan(15);
    expect(result.awakeningsScore).toBeLessThanOrEqual(5);
  });

  it('awards maximum deep sleep points for 15-20% deep sleep', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 17,
      remPct: 22,
      postureChangeCount: 20,
    });
    const result = calculateSleepScore(session);
    expect(result.deepSleepScore).toBe(25);
  });

  it('awards maximum REM points for 20-25% REM sleep', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 17,
      remPct: 22,
      postureChangeCount: 20,
    });
    const result = calculateSleepScore(session);
    expect(result.remSleepScore).toBe(25);
  });

  it('awards maximum awakening points for 0-1 awakenings', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 17,
      remPct: 22,
      awakeningCount: 1,
      postureChangeCount: 20,
    });
    const result = calculateSleepScore(session);
    expect(result.awakeningsScore).toBe(20);
  });

  it('awards maximum posture points for 10-40 posture changes', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 17,
      remPct: 22,
      postureChangeCount: 25,
    });
    const result = calculateSleepScore(session);
    expect(result.postureScore).toBe(15);
  });

  it('awards maximum onset points for <= 15 min onset', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 17,
      remPct: 22,
      onsetMinutes: 10,
      postureChangeCount: 20,
    });
    const result = calculateSleepScore(session);
    expect(result.sleepOnsetScore).toBe(15);
  });

  it('clamps total score between 0 and 100', () => {
    // Best possible scenario should not exceed 100
    const bestSession = buildSession({
      totalHours: 8,
      deepPct: 17,
      remPct: 22,
      onsetMinutes: 5,
      awakeningCount: 0,
      postureChangeCount: 20,
    });
    const best = calculateSleepScore(bestSession);
    expect(best.total).toBeLessThanOrEqual(100);
    expect(best.total).toBeGreaterThanOrEqual(0);

    // Worst possible scenario should not go below 0
    const worstSession = buildSession({
      totalHours: 1,
      deepPct: 0,
      remPct: 0,
      onsetMinutes: 90,
      awakeningCount: 10,
      postureChangeCount: 0,
    });
    const worst = calculateSleepScore(worstSession);
    expect(worst.total).toBeGreaterThanOrEqual(0);
    expect(worst.total).toBeLessThanOrEqual(100);
  });
});
