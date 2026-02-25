/**
 * Night Analyzer -- analyzes a completed sleep session and generates insights.
 */

import type { Posture, SleepSessionData } from '@/stores/sleep-store';
import {
  computeStageDurations,
  countPostureChanges,
  countAwakenings,
  estimateSleepOnsetMs,
  msToMinutes,
} from './helpers';

// -- Types --------------------------------------------------------------------

export interface SleepInsight {
  category: 'posture' | 'duration' | 'quality' | 'stages' | 'environment' | 'general';
  severity: 'info' | 'suggestion' | 'warning';
  title: string;
  description: string;
}

// -- Main Function ------------------------------------------------------------

/**
 * Analyze a night's sleep data and return actionable insights.
 */
export function analyzeNight(sessionData: SleepSessionData): SleepInsight[] {
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
