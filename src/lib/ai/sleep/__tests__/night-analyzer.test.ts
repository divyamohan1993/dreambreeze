import { describe, it, expect } from 'vitest';
import { analyzeNight } from '../night-analyzer';
import type { SleepSessionData, StageRecord, PostureRecord } from '@/stores/sleep-store';

// -- Test Helpers -------------------------------------------------------------

const HOUR = 3_600_000;
const MINUTE = 60_000;
const BASE_TIME = 1_700_000_000_000;

function buildSession(opts: {
  totalHours: number;
  deepPct: number;
  remPct: number;
  lightPct?: number;
  onsetMinutes?: number;
  awakeningCount?: number;
  postureChangeCount?: number;
  dominantPosture?: 'supine' | 'prone' | 'left-lateral' | 'right-lateral' | 'fetal';
}): SleepSessionData {
  const totalMs = opts.totalHours * HOUR;
  const onset = (opts.onsetMinutes ?? 0) * MINUTE;
  const deepMs = totalMs * (opts.deepPct / 100);
  const remMs = totalMs * (opts.remPct / 100);
  const lightPct = opts.lightPct ?? Math.max(0, 100 - opts.deepPct - opts.remPct);
  const lightMs = totalMs * (lightPct / 100);

  const stageHistory: StageRecord[] = [];
  let cursor = BASE_TIME;

  if (onset > 0) {
    stageHistory.push({ stage: 'awake', timestamp: cursor, confidence: 0.9, epochIndex: 0 });
    cursor += onset;
  }

  if (lightMs > 0) {
    stageHistory.push({ stage: 'light', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += lightMs;
  }

  if (deepMs > 0) {
    stageHistory.push({ stage: 'deep', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += deepMs;
  }

  if (remMs > 0) {
    stageHistory.push({ stage: 'rem', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += remMs;
  }

  const awakeningCount = opts.awakeningCount ?? 0;
  for (let i = 0; i < awakeningCount; i++) {
    stageHistory.push({ stage: 'awake', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += 1 * MINUTE;
    stageHistory.push({ stage: 'light', timestamp: cursor, confidence: 0.9, epochIndex: stageHistory.length });
    cursor += 1 * MINUTE;
  }

  const postureChangeCount = opts.postureChangeCount ?? 15;
  const dominant = opts.dominantPosture ?? 'supine';
  const postures: Array<'supine' | 'left-lateral' | 'right-lateral'> = ['supine', 'left-lateral', 'right-lateral'];
  const postureHistory: PostureRecord[] = [];

  // First entry is always the dominant posture
  postureHistory.push({
    posture: dominant,
    timestamp: BASE_TIME,
    confidence: 0.9,
  });

  for (let i = 1; i <= postureChangeCount; i++) {
    postureHistory.push({
      posture: postures[i % postures.length],
      timestamp: BASE_TIME + (totalMs / (postureChangeCount + 1)) * i,
      confidence: 0.9,
    });
  }

  // Add extra dominant posture entries to ensure it is the most frequent
  for (let i = 0; i < postureChangeCount + 5; i++) {
    postureHistory.push({
      posture: dominant,
      timestamp: BASE_TIME + totalMs - (i + 1) * 1000,
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

describe('analyzeNight', () => {
  it('generates a duration warning for short sleep (<6h)', () => {
    const session = buildSession({
      totalHours: 4,
      deepPct: 20,
      remPct: 25,
    });

    const insights = analyzeNight(session);
    const durationInsight = insights.find((i) => i.title === 'Short Sleep Duration');

    expect(durationInsight).toBeDefined();
    expect(durationInsight!.severity).toBe('warning');
    expect(durationInsight!.category).toBe('duration');
  });

  it('generates a positive duration insight for good sleep (7-10h)', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 20,
      remPct: 25,
    });

    const insights = analyzeNight(session);
    const durationInsight = insights.find((i) => i.title === 'Good Sleep Duration');

    expect(durationInsight).toBeDefined();
    expect(durationInsight!.severity).toBe('info');
  });

  it('generates a deep sleep warning for low deep sleep (<10%)', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 5,
      remPct: 25,
    });

    const insights = analyzeNight(session);
    const deepInsight = insights.find((i) => i.title === 'Low Deep Sleep');

    expect(deepInsight).toBeDefined();
    expect(deepInsight!.severity).toBe('warning');
    expect(deepInsight!.category).toBe('stages');
  });

  it('generates a healthy deep sleep insight for 15-25% deep sleep', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 18,
      remPct: 22,
    });

    const insights = analyzeNight(session);
    const deepInsight = insights.find((i) => i.title === 'Healthy Deep Sleep');

    expect(deepInsight).toBeDefined();
    expect(deepInsight!.severity).toBe('info');
  });

  it('generates an awakening warning for many awakenings (>5)', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 18,
      remPct: 22,
      awakeningCount: 7,
    });

    const insights = analyzeNight(session);
    const awakeningInsight = insights.find((i) => i.title === 'Frequent Awakenings');

    expect(awakeningInsight).toBeDefined();
    expect(awakeningInsight!.severity).toBe('warning');
    expect(awakeningInsight!.category).toBe('quality');
  });

  it('generates a minimal disruptions insight for few awakenings (<=2)', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 18,
      remPct: 22,
      awakeningCount: 0,
    });

    const insights = analyzeNight(session);
    const awakeningInsight = insights.find((i) => i.title === 'Minimal Disruptions');

    expect(awakeningInsight).toBeDefined();
    expect(awakeningInsight!.severity).toBe('info');
  });

  it('generates a posture insight showing the dominant position', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 18,
      remPct: 22,
      dominantPosture: 'supine',
    });

    const insights = analyzeNight(session);
    const postureInsight = insights.find((i) => i.title === 'Preferred Position');

    expect(postureInsight).toBeDefined();
    expect(postureInsight!.description).toContain('on your back');
  });

  it('generates a low REM suggestion for <15% REM', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 18,
      remPct: 8,
    });

    const insights = analyzeNight(session);
    const remInsight = insights.find((i) => i.title === 'Low REM Sleep');

    expect(remInsight).toBeDefined();
    expect(remInsight!.severity).toBe('suggestion');
  });

  it('generates an excessive tossing suggestion for >50 posture changes', () => {
    const session = buildSession({
      totalHours: 8,
      deepPct: 18,
      remPct: 22,
      postureChangeCount: 55,
    });

    const insights = analyzeNight(session);
    const tossingInsight = insights.find((i) => i.title === 'Excessive Tossing');

    expect(tossingInsight).toBeDefined();
    expect(tossingInsight!.severity).toBe('suggestion');
    expect(tossingInsight!.category).toBe('posture');
  });
});
