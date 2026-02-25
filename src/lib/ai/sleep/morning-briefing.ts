/**
 * Morning Briefing -- creates a formatted text summary of a sleep session.
 */

import type { SleepSessionData } from '@/stores/sleep-store';
import {
  computeStageDurations,
  countPostureChanges,
  countAwakenings,
  msToMinutes,
} from './helpers';
import { calculateSleepScore } from './sleep-scorer';
import { analyzeNight } from './night-analyzer';

// -- Private ------------------------------------------------------------------

function getGreeting(score: number): string {
  if (score >= 85) return 'Good morning! You had an excellent night of sleep.';
  if (score >= 70) return 'Good morning! You had a solid night of sleep.';
  if (score >= 50) return 'Good morning. Your sleep was fair -- there is room for improvement.';
  return 'Good morning. Your sleep could use some attention -- see the tips below.';
}

// -- Main Function ------------------------------------------------------------

/**
 * Generate a morning briefing text summary.
 */
export function generateMorningBriefing(sessionData: SleepSessionData): string {
  const totalMs = (sessionData.endTime ?? Date.now()) - sessionData.startTime;
  const durations = computeStageDurations(sessionData.stageHistory, totalMs);
  const score = calculateSleepScore(sessionData);
  const awakenings = countAwakenings(sessionData.stageHistory);
  const postureChanges = countPostureChanges(sessionData.postureHistory);
  const totalHours = (totalMs / 3_600_000).toFixed(1);
  const deepMin = msToMinutes(durations.deep);
  const remMin = msToMinutes(durations.rem);
  const lightMin = msToMinutes(durations.light);

  const greeting = getGreeting(score.total);
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

  const insights = analyzeNight(sessionData);
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
