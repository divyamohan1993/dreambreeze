/**
 * Multi-night pattern detection for DreamBreeze.
 *
 * Analyzes historical sleep sessions to detect:
 * - Posture preferences correlated with better sleep
 * - Temperature/comfort patterns (hot/cold signals)
 * - Optimal fan settings per sleep stage
 */

import type { Posture, SleepStage, PostureRecord, StageRecord, SleepSessionData, SleepEvent } from '@/stores/sleep-store';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SessionRecord {
  sessionData: SleepSessionData;
  score: number;
  avgFanSpeed?: number;
  date: string;
}

export interface PosturePreference {
  posture: Posture;
  avgScoreWhenDominant: number;
  avgDeepSleepPctWhenDominant: number;
  frequency: number; // how many nights it was dominant
  recommendation: string;
}

export interface TemperaturePattern {
  timeSlot: 'early-night' | 'mid-night' | 'late-night';
  tendsHot: boolean;
  tendsCold: boolean;
  avgFanSpeedUsed: number;
  suggestedFanSpeed: number;
  description: string;
}

export interface OptimalFanSetting {
  sleepStage: SleepStage;
  posture: Posture;
  optimalSpeed: number;
  confidence: number; // 0-1
  sampleCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDominantPosture(postureHistory: PostureRecord[]): Posture {
  const counts = new Map<Posture, number>();
  for (let i = 0; i < postureHistory.length; i++) {
    const p = postureHistory[i].posture;
    const duration =
      i < postureHistory.length - 1
        ? postureHistory[i + 1].timestamp - postureHistory[i].timestamp
        : 30_000; // assume 30s for last record
    counts.set(p, (counts.get(p) ?? 0) + duration);
  }

  let dominant: Posture = 'unknown';
  let maxDuration = 0;
  for (const [posture, duration] of counts) {
    if (duration > maxDuration) {
      maxDuration = duration;
      dominant = posture;
    }
  }
  return dominant;
}

function computeStagePctMap(
  stageHistory: StageRecord[],
  totalMs: number,
): Map<SleepStage, number> {
  const durations = new Map<SleepStage, number>();

  for (let i = 0; i < stageHistory.length; i++) {
    const stage = stageHistory[i].stage;
    const start = stageHistory[i].timestamp;
    const end =
      i < stageHistory.length - 1
        ? stageHistory[i + 1].timestamp
        : start + (totalMs > 0 ? totalMs - (start - stageHistory[0].timestamp) : 30_000);
    const dur = Math.max(0, end - start);
    durations.set(stage, (durations.get(stage) ?? 0) + dur);
  }

  const pctMap = new Map<SleepStage, number>();
  for (const [stage, dur] of durations) {
    pctMap.set(stage, totalMs > 0 ? (dur / totalMs) * 100 : 0);
  }
  return pctMap;
}

function categorizeTimeSlot(timestamp: number, sessionStart: number, sessionEnd: number): 'early-night' | 'mid-night' | 'late-night' {
  const totalDuration = sessionEnd - sessionStart;
  if (totalDuration <= 0) return 'mid-night';

  const elapsed = timestamp - sessionStart;
  const fraction = elapsed / totalDuration;

  if (fraction < 0.33) return 'early-night';
  if (fraction < 0.66) return 'mid-night';
  return 'late-night';
}

// ── Pattern Analyzer ───────────────────────────────────────────────────────────

export class PatternAnalyzer {
  /**
   * Detect which postures correlate with better sleep quality.
   */
  detectPosturePreferences(sessions: SessionRecord[]): PosturePreference[] {
    if (sessions.length === 0) return [];

    // Group sessions by dominant posture
    const byPosture = new Map<Posture, { scores: number[]; deepPcts: number[] }>();

    for (const session of sessions) {
      const { sessionData, score } = session;
      const dominant = getDominantPosture(sessionData.postureHistory);
      if (dominant === 'unknown') continue;

      const totalMs =
        (sessionData.endTime ?? sessionData.startTime + 28_800_000) - sessionData.startTime;
      const stagePcts = computeStagePctMap(sessionData.stageHistory, totalMs);
      const deepPct = stagePcts.get('deep') ?? 0;

      if (!byPosture.has(dominant)) {
        byPosture.set(dominant, { scores: [], deepPcts: [] });
      }
      byPosture.get(dominant)!.scores.push(score);
      byPosture.get(dominant)!.deepPcts.push(deepPct);
    }

    // Build preferences
    const preferences: PosturePreference[] = [];
    for (const [posture, data] of byPosture) {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      const avgDeep = data.deepPcts.reduce((a, b) => a + b, 0) / data.deepPcts.length;

      let recommendation: string;
      if (avgScore >= 75) {
        recommendation = `Sleeping ${postureLabel(posture)} works well for you. This position consistently correlates with good sleep quality.`;
      } else if (avgScore >= 55) {
        recommendation = `Sleeping ${postureLabel(posture)} gives you average results. Consider experimenting with other positions.`;
      } else {
        recommendation = `Sleeping ${postureLabel(posture)} may not be ideal for you. Your scores tend to be lower in this position.`;
      }

      preferences.push({
        posture,
        avgScoreWhenDominant: Math.round(avgScore),
        avgDeepSleepPctWhenDominant: Math.round(avgDeep * 10) / 10,
        frequency: data.scores.length,
        recommendation,
      });
    }

    return preferences.sort((a, b) => b.avgScoreWhenDominant - a.avgScoreWhenDominant);
  }

  /**
   * Detect when the user tends to get hot or cold during the night.
   *
   * Inference: if the user increases fan speed or shifts position frequently
   * in a time window, they may be hot. If fan speed decreases or they curl
   * into fetal position, they may be cold.
   */
  detectTemperaturePatterns(sessions: SessionRecord[]): TemperaturePattern[] {
    if (sessions.length < 3) {
      return [
        {
          timeSlot: 'early-night',
          tendsHot: false,
          tendsCold: false,
          avgFanSpeedUsed: 0,
          suggestedFanSpeed: 40,
          description: 'Not enough data yet. Track at least 3 nights for temperature pattern analysis.',
        },
      ];
    }

    const slotData = new Map<
      'early-night' | 'mid-night' | 'late-night',
      { fanSpeeds: number[]; fetalCount: number; highFanCount: number; totalSamples: number }
    >();

    for (const slot of ['early-night', 'mid-night', 'late-night'] as const) {
      slotData.set(slot, { fanSpeeds: [], fetalCount: 0, highFanCount: 0, totalSamples: 0 });
    }

    for (const session of sessions) {
      const { sessionData } = session;
      const sessionStart = sessionData.startTime;
      const sessionEnd = sessionData.endTime ?? sessionData.startTime + 28_800_000;

      // Analyze fan adjustment events
      for (const event of sessionData.events) {
        if (event.type === 'fan_adjustment') {
          const slot = categorizeTimeSlot(event.timestamp, sessionStart, sessionEnd);
          const data = slotData.get(slot)!;
          const speed = (event.data as { speed?: number }).speed ?? 0;
          data.fanSpeeds.push(speed);
          if (speed > 60) data.highFanCount++;
          data.totalSamples++;
        }
      }

      // Analyze posture for cold signals (fetal)
      for (const record of sessionData.postureHistory) {
        const slot = categorizeTimeSlot(record.timestamp, sessionStart, sessionEnd);
        const data = slotData.get(slot)!;
        if (record.posture === 'fetal') data.fetalCount++;
        data.totalSamples++;
      }
    }

    const patterns: TemperaturePattern[] = [];

    for (const [slot, data] of slotData) {
      const avgFan =
        data.fanSpeeds.length > 0
          ? data.fanSpeeds.reduce((a, b) => a + b, 0) / data.fanSpeeds.length
          : 0;

      const hotRatio = data.totalSamples > 0 ? data.highFanCount / data.totalSamples : 0;
      const coldRatio = data.totalSamples > 0 ? data.fetalCount / data.totalSamples : 0;

      const tendsHot = hotRatio > 0.3;
      const tendsCold = coldRatio > 0.4;

      let suggestedFanSpeed = avgFan;
      let description: string;

      if (tendsHot) {
        suggestedFanSpeed = Math.min(100, avgFan + 15);
        description = `During ${slot}, you tend to be warmer. DreamBreeze will proactively increase airflow.`;
      } else if (tendsCold) {
        suggestedFanSpeed = Math.max(0, avgFan - 15);
        description = `During ${slot}, you tend to curl up, suggesting you feel cold. DreamBreeze will reduce fan speed.`;
      } else {
        description = `Your comfort level during ${slot} appears stable.`;
      }

      patterns.push({
        timeSlot: slot,
        tendsHot,
        tendsCold,
        avgFanSpeedUsed: Math.round(avgFan),
        suggestedFanSpeed: Math.round(suggestedFanSpeed),
        description,
      });
    }

    return patterns;
  }

  /**
   * Determine optimal fan speed for each sleep stage + posture combination.
   */
  detectOptimalFanSettings(sessions: SessionRecord[]): OptimalFanSetting[] {
    if (sessions.length === 0) return [];

    // Build a map of (stage, posture) → fan speed samples paired with quality
    const combos = new Map<
      string,
      { speeds: number[]; scores: number[] }
    >();

    for (const session of sessions) {
      const { sessionData, score, avgFanSpeed } = session;
      if (avgFanSpeed === undefined) continue;

      // For each stage/posture segment, record the fan speed used
      const stageIndex = new Map<number, SleepStage>();
      for (const stageRecord of sessionData.stageHistory) {
        stageIndex.set(stageRecord.timestamp, stageRecord.stage);
      }

      const postureIndex = new Map<number, Posture>();
      for (const postureRecord of sessionData.postureHistory) {
        postureIndex.set(postureRecord.timestamp, postureRecord.posture);
      }

      // Sample at regular intervals
      const sessionStart = sessionData.startTime;
      const sessionEnd = sessionData.endTime ?? sessionData.startTime + 28_800_000;
      const step = 60_000; // 1 minute steps

      let currentStage: SleepStage = 'awake';
      let currentPosture: Posture = 'unknown';

      for (let t = sessionStart; t < sessionEnd; t += step) {
        // Update from closest previous records
        for (const [ts, stage] of stageIndex) {
          if (ts <= t) currentStage = stage;
        }
        for (const [ts, posture] of postureIndex) {
          if (ts <= t) currentPosture = posture;
        }

        if (currentPosture === 'unknown') continue;

        const key = `${currentStage}:${currentPosture}`;
        if (!combos.has(key)) {
          combos.set(key, { speeds: [], scores: [] });
        }
        combos.get(key)!.speeds.push(avgFanSpeed);
        combos.get(key)!.scores.push(score);
      }
    }

    // For each combo, find the speed range that correlates with highest scores
    const settings: OptimalFanSetting[] = [];

    for (const [key, data] of combos) {
      const [stage, posture] = key.split(':') as [SleepStage, Posture];

      // Weight speeds by quality score
      let weightedSpeedSum = 0;
      let weightSum = 0;
      for (let i = 0; i < data.speeds.length; i++) {
        const weight = data.scores[i] / 100;
        weightedSpeedSum += data.speeds[i] * weight;
        weightSum += weight;
      }

      const optimalSpeed = weightSum > 0 ? Math.round(weightedSpeedSum / weightSum) : 40;

      // Confidence based on sample count
      const confidence = Math.min(1, data.speeds.length / 100);

      settings.push({
        sleepStage: stage,
        posture,
        optimalSpeed,
        confidence: Math.round(confidence * 100) / 100,
        sampleCount: data.speeds.length,
      });
    }

    return settings.sort((a, b) => b.confidence - a.confidence);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function postureLabel(posture: Posture): string {
  const labels: Record<Posture, string> = {
    supine: 'on your back',
    prone: 'on your stomach',
    'left-lateral': 'on your left side',
    'right-lateral': 'on your right side',
    fetal: 'in a curled-up fetal position',
    unknown: 'in an undetected position',
  };
  return labels[posture];
}
