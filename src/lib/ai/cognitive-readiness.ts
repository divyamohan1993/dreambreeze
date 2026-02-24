/**
 * Cognitive Readiness Score for DreamBreeze.
 *
 * Combines sleep data, circadian rhythm, and pre-sleep context
 * to predict next-day cognitive performance on a 0-100 scale.
 *
 * Inspired by WHOOP's "peak/perform/get by" framework but with
 * more scientific granularity.
 */

export interface CognitiveReadinessInput {
  hoursSlept: number;
  deepSleepPercent: number;
  remSleepPercent: number;
  awakenings: number;
  sleepDebtHours: number;
  sleepOnsetMinutes: number; // how long to fall asleep
  preSleepCaffeineMg: number;
  preSleepAlcohol: number;
  preSleepExercise: 'none' | 'light' | 'moderate' | 'intense';
  consistency: number; // 0-100, how consistent is bedtime over last 7 days
}

export interface CognitiveReadinessResult {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  label: string; // "Peak Performance", "Ready to Perform", "Getting By", "Impaired"
  breakdown: {
    duration: number; // 0-25
    architecture: number; // 0-25 (deep + REM quality)
    continuity: number; // 0-25 (awakenings, onset)
    context: number; // 0-25 (debt, substances, exercise)
  };
  peakHours: { start: number; end: number }; // predicted best cognitive hours
  advice: string;
}

export function calculateCognitiveReadiness(
  input: CognitiveReadinessInput,
): CognitiveReadinessResult {
  // Duration score (0-25)
  let duration = 0;
  if (input.hoursSlept >= 8) duration = 25;
  else if (input.hoursSlept >= 7) duration = 22;
  else if (input.hoursSlept >= 6) duration = 16;
  else if (input.hoursSlept >= 5) duration = 10;
  else duration = Math.max(0, input.hoursSlept * 2);

  // Architecture score (0-25) -- deep sleep + REM
  const idealDeep = 20; // ~20% is ideal
  const idealREM = 25; // ~25% is ideal
  const deepScore = Math.min(12.5, (input.deepSleepPercent / idealDeep) * 12.5);
  const remScore = Math.min(12.5, (input.remSleepPercent / idealREM) * 12.5);
  const architecture = deepScore + remScore;

  // Continuity score (0-25)
  let continuity = 25;
  continuity -= Math.min(15, input.awakenings * 3); // Each awakening costs 3 pts
  if (input.sleepOnsetMinutes > 30) continuity -= 5;
  else if (input.sleepOnsetMinutes > 20) continuity -= 2;
  continuity = Math.max(0, continuity);

  // Context score (0-25)
  let context = 25;
  // Sleep debt penalty
  if (input.sleepDebtHours > 10) context -= 12;
  else if (input.sleepDebtHours > 5) context -= 7;
  else if (input.sleepDebtHours > 2) context -= 3;
  // Substance penalty
  if (input.preSleepCaffeineMg > 200) context -= 5;
  else if (input.preSleepCaffeineMg > 100) context -= 2;
  if (input.preSleepAlcohol >= 3) context -= 8;
  else if (input.preSleepAlcohol >= 1) context -= 3;
  // Exercise bonus/penalty
  if (input.preSleepExercise === 'moderate') context += 2;
  else if (input.preSleepExercise === 'intense') context -= 1;
  // Consistency bonus
  context += (input.consistency / 100) * 3;
  context = Math.max(0, Math.min(25, context));

  const score = Math.round(duration + architecture + continuity + context);

  // Grade
  let grade: CognitiveReadinessResult['grade'];
  let label: string;
  if (score >= 90) {
    grade = 'A+';
    label = 'Peak Performance';
  } else if (score >= 80) {
    grade = 'A';
    label = 'Excellent Readiness';
  } else if (score >= 70) {
    grade = 'B+';
    label = 'Ready to Perform';
  } else if (score >= 60) {
    grade = 'B';
    label = 'Good Enough';
  } else if (score >= 45) {
    grade = 'C';
    label = 'Getting By';
  } else if (score >= 30) {
    grade = 'D';
    label = 'Impaired';
  } else {
    grade = 'F';
    label = 'Recovery Needed';
  }

  // Predict peak cognitive hours based on sleep timing
  // Circadian peak is typically ~10 AM, with secondary at ~4 PM
  const peakHours =
    score >= 60 ? { start: 9, end: 12 } : { start: 10, end: 11 }; // Narrower window when impaired

  // Generate advice
  let advice = '';
  const weakest = Math.min(duration, architecture, continuity, context);
  if (weakest === duration)
    advice =
      'Your biggest gain would come from sleeping longer. Even 30 more minutes helps.';
  else if (weakest === architecture)
    advice =
      'Your deep/REM sleep ratio needs improvement. Keep the room cool and avoid late alcohol.';
  else if (weakest === continuity)
    advice =
      'You woke up too often. The soundscape engine can help maintain sleep continuity.';
  else
    advice =
      'Managing caffeine and maintaining consistent bedtimes will boost your score.';

  return {
    score,
    grade,
    label,
    breakdown: {
      duration: Math.round(duration),
      architecture: Math.round(architecture),
      continuity: Math.round(continuity),
      context: Math.round(context),
    },
    peakHours,
    advice,
  };
}
