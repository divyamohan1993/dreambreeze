/**
 * Energy Agent — manages morning wake-up sequence and next-day energy forecast.
 *
 * Uses the Two-Process Model (Borbely):
 * - Process S (homeostatic sleep pressure) — builds during wake, dissipates during sleep
 * - Process C (circadian alertness) — 24hr oscillation peaking ~10AM and ~9PM
 *
 * Combines these to predict cognitive readiness and trigger optimal wake sequence.
 */
import { blackboard, type Hypothesis } from '../blackboard';

export interface EnergyForecast {
  hour: number;
  energyLevel: number; // 0-100
  cognitiveReadiness: number; // 0-100
  label: string;
}

/** Two-Process Model calculation */
function calculateProcessS(hoursSlept: number, sleepDebt: number): number {
  // Sleep pressure dissipates exponentially during sleep
  // tau_s ~ 4.2 hours (time constant for sleep pressure decay)
  const tau = 4.2;
  const baselinePressure = Math.min(100, 40 + sleepDebt * 5);
  return baselinePressure * Math.exp(-hoursSlept / tau);
}

function calculateProcessC(hour: number): number {
  // Circadian alertness: sinusoidal with peak at ~15:00 (3 PM) and trough at ~04:00
  // Second smaller peak at ~21:00 (wake maintenance zone)
  const primary = 50 + 40 * Math.sin(((hour - 9) / 24) * 2 * Math.PI);
  const secondary = 10 * Math.sin(((hour - 15) / 12) * 2 * Math.PI);
  return Math.max(0, Math.min(100, primary + secondary));
}

export function generateEnergyForecast(
  hoursSlept: number,
  sleepDebt: number,
): EnergyForecast[] {
  const forecast: EnergyForecast[] = [];
  const wakeHour = new Date().getHours();

  for (let h = 0; h < 18; h++) {
    const hour = (wakeHour + h) % 24;
    const hoursAwake = h;

    // Process S builds during wakefulness (tau_w ~ 18.2 hours)
    const processS =
      20 +
      (80 - calculateProcessS(hoursSlept, sleepDebt)) *
        (1 - Math.exp(-hoursAwake / 18.2));
    const processC = calculateProcessC(hour);

    // Alertness = Process C - Process S (higher = more alert)
    const alertness = Math.max(
      0,
      Math.min(100, processC - processS * 0.3 + 30),
    );

    // Cognitive readiness factors in sleep quality
    const qualityBonus =
      hoursSlept >= 7.5 ? 10 : hoursSlept >= 6 ? 0 : -15;
    const cognitiveReadiness = Math.max(
      0,
      Math.min(100, alertness + qualityBonus),
    );

    let label = '';
    if (cognitiveReadiness >= 80) label = 'Peak Performance';
    else if (cognitiveReadiness >= 60) label = 'Good Focus';
    else if (cognitiveReadiness >= 40) label = 'Moderate';
    else if (cognitiveReadiness >= 20) label = 'Low Energy';
    else label = 'Rest Recommended';

    forecast.push({
      hour,
      energyLevel: Math.round(alertness),
      cognitiveReadiness: Math.round(cognitiveReadiness),
      label,
    });
  }

  return forecast;
}

export function runEnergyAgent(): void {
  const ctx = blackboard.getContext();
  const hoursSlept = ctx.sessionDurationMinutes / 60;

  // Check if it's time to start wake-up sequence
  // In a real app, this would check alarm time from user settings
  if (ctx.timeOfNight === 'pre-wake' && hoursSlept >= 6) {
    const hypothesis: Hypothesis = {
      agentId: 'energy-agent',
      timestamp: Date.now(),
      confidence: 0.8,
      action: {
        type: 'TRIGGER_WAKE_SEQUENCE',
        minutesUntilAlarm: 30,
      },
      reasoning: `${hoursSlept.toFixed(1)}h slept, pre-wake window — starting gradual wake sequence`,
      priority: 'high',
      expiresAt: Date.now() + 300_000,
    };
    blackboard.postHypothesis(hypothesis);

    // Also increase fan slightly for alertness
    const fanHypothesis: Hypothesis = {
      agentId: 'energy-agent',
      timestamp: Date.now(),
      confidence: 0.7,
      action: { type: 'ADJUST_FAN_DELTA', delta: +15 },
      reasoning:
        'Morning energy mode — gradually increasing airflow for alertness',
      priority: 'medium',
      expiresAt: Date.now() + 300_000,
    };
    blackboard.postHypothesis(fanHypothesis);
  }

  // Log sleep debt insight
  if (ctx.sleepDebt > 2) {
    const debtHypothesis: Hypothesis = {
      agentId: 'energy-agent',
      timestamp: Date.now(),
      confidence: 0.9,
      action: {
        type: 'LOG_INSIGHT',
        message: `Sleep debt: ${ctx.sleepDebt.toFixed(1)}h. Consider sleeping 30min earlier tonight.`,
        category: 'sleep-debt',
      },
      reasoning: `Accumulated sleep debt of ${ctx.sleepDebt.toFixed(1)} hours impacts cognitive performance`,
      priority: ctx.sleepDebt > 5 ? 'critical' : 'medium',
      expiresAt: Date.now() + 3_600_000,
    };
    blackboard.postHypothesis(debtHypothesis);
  }
}
