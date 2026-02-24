/**
 * Thermal Agent — adjusts fan based on weather and time-of-night thermal patterns.
 *
 * Uses weather data + circadian body temperature curve to predict comfort needs.
 * Body temp drops ~1-2 degrees F during sleep, lowest at 4-5 AM.
 */
import { blackboard, type Hypothesis } from '../blackboard';

/** Circadian body temp offset (relative to baseline) by hour */
function getCircadianTempOffset(hour: number): number {
  // Body temp nadir at ~4-5 AM, peak at ~6-7 PM
  const offsets: Record<number, number> = {
    20: 0.3,
    21: 0.1,
    22: -0.1,
    23: -0.3,
    0: -0.5,
    1: -0.7,
    2: -0.9,
    3: -1.0,
    4: -1.1,
    5: -1.0,
    6: -0.7,
    7: -0.3,
    8: 0,
    9: 0.2,
  };
  return offsets[hour] ?? 0;
}

export function runThermalAgent(): void {
  const ctx = blackboard.getContext();
  const hour = new Date().getHours();
  const circadianOffset = getCircadianTempOffset(hour);

  let speed = 40; // default
  let confidence = 0.5;
  let reasoning = '';

  if (ctx.weatherData) {
    const humidity = ctx.weatherData.humidity;
    const feelsLike = ctx.weatherData.feelsLike;

    // Heat index: higher temp/humidity = more fan
    if (feelsLike > 32) {
      speed = 80;
      reasoning = `Hot weather (feels like ${feelsLike}°C)`;
    } else if (feelsLike > 28) {
      speed = 60;
      reasoning = `Warm weather (feels like ${feelsLike}°C)`;
    } else if (feelsLike > 24) {
      speed = 40;
      reasoning = `Comfortable weather (feels like ${feelsLike}°C)`;
    } else if (feelsLike > 20) {
      speed = 20;
      reasoning = `Cool weather (feels like ${feelsLike}°C)`;
    } else {
      speed = 5;
      reasoning = `Cold weather (feels like ${feelsLike}°C)`;
    }

    // Humidity adjustment — high humidity needs more airflow for evaporative cooling
    if (humidity > 75) {
      speed = Math.min(100, speed + 10);
      reasoning += `, high humidity (${humidity}%)`;
    }

    confidence = 0.75;
  } else {
    reasoning = 'No weather data — using circadian estimate only';
  }

  // Circadian adjustment: as body temp drops, reduce fan
  const circadianAdj = Math.round(circadianOffset * 10);
  speed = Math.max(0, Math.min(100, speed + circadianAdj));
  reasoning += ` | Circadian offset ${circadianOffset > 0 ? '+' : ''}${circadianOffset.toFixed(1)}°C`;

  // Time-of-night classification
  const timeOfNight =
    hour >= 20 || hour < 1
      ? 'early'
      : hour < 3
        ? 'mid'
        : hour < 5
          ? 'late'
          : 'pre-wake';
  blackboard.updateContext({ timeOfNight });

  const hypothesis: Hypothesis = {
    agentId: 'thermal-agent',
    timestamp: Date.now(),
    confidence,
    action: { type: 'SET_FAN_SPEED', speed },
    reasoning,
    priority:
      ctx.weatherData && ctx.weatherData.feelsLike > 32 ? 'critical' : 'medium',
    expiresAt: Date.now() + 300_000, // 5min TTL (weather changes slowly)
  };

  blackboard.postHypothesis(hypothesis);
}
