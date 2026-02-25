import {
  Coffee,
  Wine,
  ThermometerSun,
  Dumbbell,
  Brain,
  Utensils,
  Monitor,
  Moon,
} from 'lucide-react';
import type { PreSleepData, Insight } from './types';

// -- Insight Generation -------------------------------------------------------
// Pure function -- easy to test independently.

export function generateInsights(d: PreSleepData): Insight[] {
  const insights: Insight[] = [];

  // Caffeine half-life is ~5-6 hours
  const effectiveCaffeine =
    d.caffeineMg * Math.pow(0.5, d.caffeineLastIntakeHoursAgo / 5.7);
  if (effectiveCaffeine > 50) {
    insights.push({
      text: `Active caffeine in your system (~${Math.round(effectiveCaffeine)}mg). I'll boost sound masking and keep the room cooler to help you drift off.`,
      icon: Coffee,
      color: '#f0a060',
    });
  }

  if (d.alcoholDrinks > 0) {
    insights.push({
      text: `Alcohol disrupts REM sleep. I'll optimize fan patterns for the second half of your night when effects wear off.`,
      icon: Wine,
      color: '#6e5ea8',
    });
  }

  if (d.exerciseIntensity === 'intense' && d.exerciseHoursAgo < 3) {
    insights.push({
      text: `Recent intense exercise raises core temperature. Starting with higher airflow and gradually reducing as you cool down.`,
      icon: ThermometerSun,
      color: '#e94560',
    });
  } else if (d.exerciseIntensity === 'moderate') {
    insights.push({
      text: `Good exercise today! Your body temperature cycling should help deep sleep. Optimizing fan to support natural cooling.`,
      icon: Dumbbell,
      color: '#4ecdc4',
    });
  }

  if (d.stressLevel >= 4) {
    insights.push({
      text: `Elevated stress detected. Switching to brown noise for deeper masking, and using a gentler fan ramp-up pattern.`,
      icon: Brain,
      color: '#6e5ea8',
    });
  }

  if (d.mealHoursAgo < 2) {
    insights.push({
      text: `Recent meal may cause slight temperature rise during digestion. Adjusting fan to compensate.`,
      icon: Utensils,
      color: '#f0a060',
    });
  }

  if (d.screenTimeMinutes > 360) {
    insights.push({
      text: `Extended screen time today. Blue light may have shifted your circadian rhythm. I'll extend the sleep onset optimization period.`,
      icon: Monitor,
      color: '#e94560',
    });
  }

  if (insights.length === 0) {
    insights.push({
      text: `Everything looks great for a good night's sleep! Running standard optimization for your comfort.`,
      icon: Moon,
      color: '#4ecdc4',
    });
  }

  return insights;
}
