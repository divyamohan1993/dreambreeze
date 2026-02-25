/**
 * Tips Generator -- generates personalized tips from historical sleep data.
 */

import type { Posture } from '@/stores/sleep-store';
import {
  computeStageDurations,
  estimateSleepOnsetMs,
  type HistoricalSession,
} from './helpers';

// -- Main Function ------------------------------------------------------------

/**
 * Generate personalized tips based on historical sleep sessions.
 */
export function generateTips(historicalSessions: HistoricalSession[]): string[] {
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
