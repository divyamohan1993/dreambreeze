/**
 * Sleep analysis modules -- barrel export.
 *
 * Each responsibility of the former SleepAgent class lives in its own focused
 * module under this directory:
 *
 *   helpers.ts          -- pure utility functions and shared types
 *   night-analyzer.ts   -- analyzeNight()
 *   sleep-scorer.ts     -- calculateSleepScore()
 *   morning-briefing.ts -- generateMorningBriefing()
 *   tips-generator.ts   -- generateTips()
 */

// Functions
export { analyzeNight } from './night-analyzer';
export { calculateSleepScore } from './sleep-scorer';
export { generateMorningBriefing } from './morning-briefing';
export { generateTips } from './tips-generator';
export {
  computeStageDurations,
  countPostureChanges,
  countAwakenings,
  estimateSleepOnsetMs,
  msToMinutes,
  clamp,
} from './helpers';

// Types
export type { SleepInsight } from './night-analyzer';
export type { SleepScoreBreakdown } from './sleep-scorer';
export type { SleepStageDurations, HistoricalSession } from './helpers';
