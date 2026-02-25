/**
 * Sleep Agent -- facade for sleep analysis, scoring, and insights.
 *
 * Each responsibility is now in its own focused module under ./sleep/:
 *
 *   helpers.ts          -- pure utility functions and shared types
 *   night-analyzer.ts   -- analyzeNight()
 *   sleep-scorer.ts     -- calculateSleepScore()
 *   morning-briefing.ts -- generateMorningBriefing()
 *   tips-generator.ts   -- generateTips()
 *
 * This file remains as a backward-compatible facade. Prefer importing from
 * the individual modules or from './sleep/index' for new code.
 */

import type { SleepSessionData } from '@/stores/sleep-store';

// Re-export standalone functions for consumers that prefer bare functions.
export { analyzeNight, type SleepInsight } from './sleep/night-analyzer';
export { calculateSleepScore, type SleepScoreBreakdown } from './sleep/sleep-scorer';
export { generateMorningBriefing } from './sleep/morning-briefing';
export { generateTips } from './sleep/tips-generator';
export { type SleepStageDurations, type HistoricalSession } from './sleep/helpers';

// -- Legacy class facade (delegates to the standalone functions) ---------------

import { analyzeNight as _analyzeNight } from './sleep/night-analyzer';
import { calculateSleepScore as _calculateSleepScore } from './sleep/sleep-scorer';
import { generateMorningBriefing as _generateMorningBriefing } from './sleep/morning-briefing';
import { generateTips as _generateTips } from './sleep/tips-generator';
import type { SleepInsight } from './sleep/night-analyzer';
import type { SleepScoreBreakdown } from './sleep/sleep-scorer';
import type { HistoricalSession } from './sleep/helpers';

/**
 * @deprecated Prefer the standalone function exports instead of instantiating
 * this class. Kept for backward compatibility.
 */
export class SleepAgent {
  analyzeNight(sessionData: SleepSessionData): SleepInsight[] {
    return _analyzeNight(sessionData);
  }

  generateMorningBriefing(sessionData: SleepSessionData): string {
    return _generateMorningBriefing(sessionData);
  }

  calculateSleepScore(sessionData: SleepSessionData): SleepScoreBreakdown {
    return _calculateSleepScore(sessionData);
  }

  generateTips(historicalSessions: HistoricalSession[]): string[] {
    return _generateTips(historicalSessions);
  }
}
