/**
 * Sleep Debt Calculator for DreamBreeze.
 *
 * Tracks accumulated sleep debt over a rolling 14-day window.
 * Based on research: adults need 7-9h (we use 8h as baseline).
 * Sleep debt impacts cognitive performance non-linearly --
 * 2h debt per night ~ legal intoxication after ~4 days (Van Dongen et al., 2003).
 */

export interface NightRecord {
  date: string; // YYYY-MM-DD
  hoursSlept: number;
  sleepQuality: number; // 0-100
  deepSleepPercent: number;
  remSleepPercent: number;
}

export interface SleepDebtResult {
  totalDebtHours: number;
  weeklyDebtHours: number;
  trend: 'improving' | 'stable' | 'worsening';
  recoveryNightsNeeded: number;
  impairmentLevel: 'none' | 'mild' | 'moderate' | 'severe';
  impairmentEquivalent: string; // e.g. "equivalent to 0.05 BAC"
  recommendations: string[];
}

const IDEAL_SLEEP_HOURS = 8;
const MAX_RECOVERY_PER_NIGHT = 2; // Can only recover ~2h debt per night

export function calculateSleepDebt(nights: NightRecord[]): SleepDebtResult {
  if (nights.length === 0) {
    return {
      totalDebtHours: 0,
      weeklyDebtHours: 0,
      trend: 'stable',
      recoveryNightsNeeded: 0,
      impairmentLevel: 'none',
      impairmentEquivalent: 'Fully rested',
      recommendations: ['Start tracking your sleep to get personalized insights.'],
    };
  }

  // Sort by date descending
  const sorted = [...nights].sort((a, b) => b.date.localeCompare(a.date));
  const last14 = sorted.slice(0, 14);
  const last7 = sorted.slice(0, 7);
  const prev7 = sorted.slice(7, 14);

  // Calculate total debt (14 days)
  const totalDebt = last14.reduce((sum, n) => {
    const deficit = IDEAL_SLEEP_HOURS - n.hoursSlept;
    // Quality-adjusted: poor quality sleep doesn't count as full
    const qualityFactor = n.sleepQuality / 100;
    const effectiveDeficit = deficit + (1 - qualityFactor) * n.hoursSlept * 0.2;
    return sum + Math.max(0, effectiveDeficit);
  }, 0);

  // Weekly debt
  const weeklyDebt = last7.reduce(
    (sum, n) => sum + Math.max(0, IDEAL_SLEEP_HOURS - n.hoursSlept),
    0,
  );
  const prevWeekDebt = prev7.reduce(
    (sum, n) => sum + Math.max(0, IDEAL_SLEEP_HOURS - n.hoursSlept),
    0,
  );

  // Trend
  let trend: SleepDebtResult['trend'] = 'stable';
  if (prev7.length >= 3) {
    if (weeklyDebt < prevWeekDebt - 2) trend = 'improving';
    else if (weeklyDebt > prevWeekDebt + 2) trend = 'worsening';
  }

  // Recovery nights needed
  const recoveryNights = Math.ceil(totalDebt / MAX_RECOVERY_PER_NIGHT);

  // Impairment level (Van Dongen et al., 2003)
  let impairmentLevel: SleepDebtResult['impairmentLevel'] = 'none';
  let impairmentEquivalent = 'Fully rested';
  if (totalDebt > 20) {
    impairmentLevel = 'severe';
    impairmentEquivalent = 'Equivalent to ~0.10 BAC -- significant cognitive impairment';
  } else if (totalDebt > 12) {
    impairmentLevel = 'moderate';
    impairmentEquivalent = 'Equivalent to ~0.05 BAC -- noticeable reaction time decrease';
  } else if (totalDebt > 5) {
    impairmentLevel = 'mild';
    impairmentEquivalent = 'Subtle focus and memory effects';
  }

  // Recommendations
  const recommendations: string[] = [];
  if (totalDebt > 12) {
    recommendations.push('Consider going to bed 1 hour earlier for the next week.');
    recommendations.push('Avoid caffeine after 2 PM to maximize sleep quality.');
  }
  if (totalDebt > 5) {
    recommendations.push('A 20-minute nap between 1-3 PM can help reduce sleep debt.');
  }
  if (trend === 'worsening') {
    recommendations.push('Your sleep debt is growing. Prioritize consistent bedtimes.');
  }
  if (trend === 'improving') {
    recommendations.push('Great progress! Keep up the consistent sleep schedule.');
  }
  const avgDeep =
    last7.reduce((s, n) => s + n.deepSleepPercent, 0) / Math.max(1, last7.length);
  if (avgDeep < 15) {
    recommendations.push(
      'Your deep sleep is low. Cooler room temperature and avoiding alcohol can help.',
    );
  }

  return {
    totalDebtHours: Math.round(totalDebt * 10) / 10,
    weeklyDebtHours: Math.round(weeklyDebt * 10) / 10,
    trend,
    recoveryNightsNeeded: recoveryNights,
    impairmentLevel,
    impairmentEquivalent,
    recommendations,
  };
}
