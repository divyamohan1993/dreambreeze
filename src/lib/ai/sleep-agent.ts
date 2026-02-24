/**
 * Agentic sleep coach for DreamBreeze.
 *
 * Analyzes sleep session data to produce:
 * - Night insights
 * - Morning briefing summary
 * - Composite sleep score (0-100)
 * - Personalized tips
 */

import type { SleepStage, Posture, PostureRecord, StageRecord, SleepEvent, SleepSessionData } from '@/stores/sleep-store';

// -- Types ----------------------------------------------------------------------

export interface SleepInsight {
  category: 'posture' | 'duration' | 'quality' | 'stages' | 'environment' | 'general';
  severity: 'info' | 'suggestion' | 'warning';
  title: string;
  description: string;
}

export interface SleepScoreBreakdown {
  total: number;
  deepSleepScore: number;
  remSleepScore: number;
  awakeningsScore: number;
  postureScore: number;
  sleepOnsetScore: number;
}

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

// -- Helpers --------------------------------------------------------------------

function computeStageDurations(stageHistory: StageRecord[], totalDurationMs: number): SleepStageDurations {
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

function countPostureChanges(postureHistory: PostureRecord[]): number {
  let changes = 0;
  for (let i = 1; i < postureHistory.length; i++) {
    if (postureHistory[i].posture !== postureHistory[i - 1].posture) {
      changes++;
    }
  }
  return changes;
}

function countAwakenings(stageHistory: StageRecord[]): number {
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

function estimateSleepOnsetMs(stageHistory: StageRecord[]): number {
  if (stageHistory.length < 2) return 0;
  const sessionStart = stageHistory[0].timestamp;
  for (const record of stageHistory) {
    if (record.stage !== 'awake') {
      return record.timestamp - sessionStart;
    }
  }
  return 0;
}

function msToMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// -- Sleep Agent Class ----------------------------------------------------------

export class SleepAgent {
  /**
   * Analyze a night's sleep data and return actionable insights.
   */
  analyzeNight(sessionData: SleepSessionData): SleepInsight[] {
    const insights: SleepInsight[] = [];
    const totalMs = (sessionData.endTime ?? Date.now()) - sessionData.startTime;
    const durations = computeStageDurations(sessionData.stageHistory, totalMs);
    const postureChanges = countPostureChanges(sessionData.postureHistory);
    const awakenings = countAwakenings(sessionData.stageHistory);
    const sleepOnsetMs = estimateSleepOnsetMs(sessionData.stageHistory);
    const totalMinutes = msToMinutes(totalMs);

    // Duration analysis
    if (totalMinutes < 360) {
      insights.push({
        category: 'duration',
        severity: 'warning',
        title: 'Short Sleep Duration',
        description: `You slept for ${totalMinutes} minutes. Adults need 7-9 hours (420-540 minutes) for optimal health.`,
      });
    } else if (totalMinutes > 600) {
      insights.push({
        category: 'duration',
        severity: 'suggestion',
        title: 'Long Sleep Duration',
        description: `You slept for ${totalMinutes} minutes. While occasionally fine, regularly sleeping over 10 hours may indicate underlying issues.`,
      });
    } else {
      insights.push({
        category: 'duration',
        severity: 'info',
        title: 'Good Sleep Duration',
        description: `${totalMinutes} minutes of sleep is within the recommended range. Well done!`,
      });
    }

    // Deep sleep analysis
    const deepPct = totalMs > 0 ? (durations.deep / totalMs) * 100 : 0;
    if (deepPct < 10) {
      insights.push({
        category: 'stages',
        severity: 'warning',
        title: 'Low Deep Sleep',
        description: `Only ${deepPct.toFixed(1)}% deep sleep (target: 15-20%). Try avoiding alcohol and heavy meals before bed.`,
      });
    } else if (deepPct >= 15 && deepPct <= 25) {
      insights.push({
        category: 'stages',
        severity: 'info',
        title: 'Healthy Deep Sleep',
        description: `${deepPct.toFixed(1)}% deep sleep is excellent for physical recovery.`,
      });
    }

    // REM analysis
    const remPct = totalMs > 0 ? (durations.rem / totalMs) * 100 : 0;
    if (remPct < 15) {
      insights.push({
        category: 'stages',
        severity: 'suggestion',
        title: 'Low REM Sleep',
        description: `${remPct.toFixed(1)}% REM sleep (target: 20-25%). REM is critical for memory consolidation and emotional regulation.`,
      });
    } else if (remPct >= 20 && remPct <= 30) {
      insights.push({
        category: 'stages',
        severity: 'info',
        title: 'Good REM Sleep',
        description: `${remPct.toFixed(1)}% REM sleep supports healthy cognitive function.`,
      });
    }

    // Awakenings
    if (awakenings > 5) {
      insights.push({
        category: 'quality',
        severity: 'warning',
        title: 'Frequent Awakenings',
        description: `You woke up ${awakenings} times. Consider reducing noise, light, or temperature disruptions.`,
      });
    } else if (awakenings <= 2) {
      insights.push({
        category: 'quality',
        severity: 'info',
        title: 'Minimal Disruptions',
        description: `Only ${awakenings} awakening(s) -- your sleep environment seems well-optimized.`,
      });
    }

    // Posture changes
    if (postureChanges > 50) {
      insights.push({
        category: 'posture',
        severity: 'suggestion',
        title: 'Excessive Tossing',
        description: `${postureChanges} posture changes detected. This may indicate discomfort -- check mattress firmness and pillow height.`,
      });
    } else if (postureChanges < 5 && totalMinutes > 120) {
      insights.push({
        category: 'posture',
        severity: 'suggestion',
        title: 'Very Few Position Changes',
        description: `Only ${postureChanges} posture changes. Some movement is healthy to prevent pressure buildup.`,
      });
    }

    // Sleep onset
    const onsetMinutes = msToMinutes(sleepOnsetMs);
    if (onsetMinutes > 30) {
      insights.push({
        category: 'quality',
        severity: 'suggestion',
        title: 'Slow Sleep Onset',
        description: `It took about ${onsetMinutes} minutes to fall asleep. Try a consistent bedtime routine and dimming screens 1 hour before bed.`,
      });
    }

    // Dominant posture
    const postureCounts = new Map<Posture, number>();
    for (const record of sessionData.postureHistory) {
      postureCounts.set(record.posture, (postureCounts.get(record.posture) ?? 0) + 1);
    }
    const dominant = [...postureCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (dominant) {
      const postureNames: Record<string, string> = {
        supine: 'on your back',
        prone: 'on your stomach',
        'left-lateral': 'on your left side',
        'right-lateral': 'on your right side',
        fetal: 'in a fetal position',
        unknown: 'an unknown position',
      };
      insights.push({
        category: 'posture',
        severity: 'info',
        title: 'Preferred Position',
        description: `You spent most of the night sleeping ${postureNames[dominant[0]] ?? dominant[0]}.`,
      });
    }

    return insights;
  }

  /**
   * Generate a morning briefing text summary.
   */
  generateMorningBriefing(sessionData: SleepSessionData): string {
    const totalMs = (sessionData.endTime ?? Date.now()) - sessionData.startTime;
    const durations = computeStageDurations(sessionData.stageHistory, totalMs);
    const score = this.calculateSleepScore(sessionData);
    const awakenings = countAwakenings(sessionData.stageHistory);
    const postureChanges = countPostureChanges(sessionData.postureHistory);
    const totalHours = (totalMs / 3_600_000).toFixed(1);
    const deepMin = msToMinutes(durations.deep);
    const remMin = msToMinutes(durations.rem);
    const lightMin = msToMinutes(durations.light);

    const greeting = this._getGreeting(score.total);
    const scoreEmoji = score.total >= 80 ? 'Excellent' : score.total >= 60 ? 'Good' : score.total >= 40 ? 'Fair' : 'Needs Improvement';

    const lines = [
      greeting,
      '',
      `Sleep Score: ${score.total}/100 (${scoreEmoji})`,
      `Total Time: ${totalHours} hours`,
      '',
      'Sleep Stages:',
      `  Deep sleep: ${deepMin} min`,
      `  REM sleep: ${remMin} min`,
      `  Light sleep: ${lightMin} min`,
      '',
      `Awakenings: ${awakenings}`,
      `Position changes: ${postureChanges}`,
    ];

    const insights = this.analyzeNight(sessionData);
    const suggestions = insights.filter((i) => i.severity === 'suggestion' || i.severity === 'warning');
    if (suggestions.length > 0) {
      lines.push('');
      lines.push('Tips for tonight:');
      for (const s of suggestions.slice(0, 3)) {
        lines.push(`  - ${s.title}: ${s.description}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Calculate a composite sleep score (0-100).
   */
  calculateSleepScore(sessionData: SleepSessionData): SleepScoreBreakdown {
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

  /**
   * Generate personalized tips based on historical sleep sessions.
   */
  generateTips(historicalSessions: HistoricalSession[]): string[] {
    const tips: string[] = [];

    if (historicalSessions.length === 0) {
      return [
        'Start tracking your sleep tonight to receive personalized recommendations.',
        'Place your phone flat on the mattress near your pillow for best posture detection.',
        'Keep your room between 18-22 degC (65-72 degF) for optimal sleep.',
      ];
    }

    // Analyze trends
    const recentScores = historicalSessions.slice(-7).map((s) => s.score);
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const trend = recentScores.length >= 3
      ? recentScores[recentScores.length - 1] - recentScores[0]
      : 0;

    if (trend > 10) {
      tips.push('Your sleep quality is trending upward. Keep doing what you are doing!');
    } else if (trend < -10) {
      tips.push('Your sleep quality has been declining recently. Consider reviewing your bedtime habits.');
    }

    // Aggregate stage analysis
    const allDeepPcts: number[] = [];
    const allRemPcts: number[] = [];
    const allOnsetMinutes: number[] = [];

    for (const session of historicalSessions.slice(-14)) {
      const totalMs = (session.sessionData.endTime ?? session.sessionData.startTime + 28_800_000) - session.sessionData.startTime;
      const durations = computeStageDurations(session.sessionData.stageHistory, totalMs);
      if (totalMs > 0) {
        allDeepPcts.push((durations.deep / totalMs) * 100);
        allRemPcts.push((durations.rem / totalMs) * 100);
      }
      allOnsetMinutes.push(estimateSleepOnsetMs(session.sessionData.stageHistory) / 60_000);
    }

    const avgDeep = allDeepPcts.reduce((a, b) => a + b, 0) / (allDeepPcts.length || 1);
    const avgRem = allRemPcts.reduce((a, b) => a + b, 0) / (allRemPcts.length || 1);
    const avgOnset = allOnsetMinutes.reduce((a, b) => a + b, 0) / (allOnsetMinutes.length || 1);

    if (avgDeep < 12) {
      tips.push('Your deep sleep has been consistently low. Regular exercise (but not within 3 hours of bedtime) can improve deep sleep.');
    }

    if (avgRem < 18) {
      tips.push('You could benefit from more REM sleep. Maintain a consistent sleep schedule, even on weekends.');
    }

    if (avgOnset > 20) {
      tips.push('You tend to take a while to fall asleep. Try a relaxation routine: deep breathing or progressive muscle relaxation.');
    }

    if (avgScore < 50) {
      tips.push('Your average sleep score is below 50. Consider consulting a healthcare professional if this persists.');
    }

    // Posture-specific tips
    const postureCounts = new Map<Posture, number>();
    for (const session of historicalSessions.slice(-7)) {
      for (const record of session.sessionData.postureHistory) {
        postureCounts.set(record.posture, (postureCounts.get(record.posture) ?? 0) + 1);
      }
    }
    const dominantPosture = [...postureCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (dominantPosture) {
      switch (dominantPosture[0]) {
        case 'prone':
          tips.push('You sleep on your stomach frequently. This can strain your neck. Consider a thin pillow or trying side sleeping.');
          break;
        case 'supine':
          tips.push('Sleeping on your back is generally good for spinal alignment. If you snore, try elevating your head slightly.');
          break;
        case 'fetal':
          tips.push('Sleeping curled up can restrict breathing. Try stretching before bed to relax your body into a more open position.');
          break;
      }
    }

    // Always include at least one general tip
    if (tips.length === 0) {
      tips.push('Your sleep patterns look healthy. Maintain your consistent routine for continued good sleep.');
    }

    return tips;
  }

  // -- Private ---------------------------------------------------------------

  private _getGreeting(score: number): string {
    if (score >= 85) return 'Good morning! You had an excellent night of sleep.';
    if (score >= 70) return 'Good morning! You had a solid night of sleep.';
    if (score >= 50) return 'Good morning. Your sleep was fair -- there is room for improvement.';
    return 'Good morning. Your sleep could use some attention -- see the tips below.';
  }
}
