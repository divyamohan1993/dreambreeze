/**
 * Temperature cycling profiles for DreamBreeze.
 *
 * Research shows body temperature drops 1-2 degF during sleep.
 * Optimal: cool at sleep onset, coldest during deep sleep,
 * warm up before waking (Harding et al., 2019).
 *
 * Each profile defines fan speed at each phase of the night.
 */

export interface TemperatureProfile {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  /** Fan speed (0-100) at each phase */
  phases: {
    onset: number; // First 20min -- falling asleep
    light1: number; // Light sleep, early night
    deep1: number; // First deep sleep cycle
    rem1: number; // First REM
    mid: number; // Mid-night average
    deep2: number; // Late deep sleep
    rem2: number; // Late REM
    preWake: number; // Last 30min before alarm
  };
  /** Weather adjustments */
  hotWeatherBoost: number; // Extra % in hot weather
  coldWeatherReduce: number; // Reduce % in cold weather
}

export const TEMPERATURE_PROFILES: TemperatureProfile[] = [
  {
    id: 'optimal',
    name: 'Optimal Sleeper',
    description:
      'Science-backed curve. Cool at onset, coldest in deep sleep, warm wake-up.',
    icon: 'Sparkles',
    phases: {
      onset: 55,
      light1: 45,
      deep1: 35,
      rem1: 50,
      mid: 40,
      deep2: 30,
      rem2: 45,
      preWake: 60,
    },
    hotWeatherBoost: 15,
    coldWeatherReduce: 20,
  },
  {
    id: 'hot-sleeper',
    name: 'Hot Sleeper',
    description:
      'For those who always feel warm. Higher baseline with aggressive deep-sleep cooling.',
    icon: 'Flame',
    phases: {
      onset: 70,
      light1: 60,
      deep1: 50,
      rem1: 65,
      mid: 55,
      deep2: 45,
      rem2: 60,
      preWake: 70,
    },
    hotWeatherBoost: 20,
    coldWeatherReduce: 10,
  },
  {
    id: 'cold-sleeper',
    name: 'Cold Sleeper',
    description:
      'Minimal airflow. Just enough for air circulation without chill.',
    icon: 'Snowflake',
    phases: {
      onset: 30,
      light1: 20,
      deep1: 15,
      rem1: 25,
      mid: 20,
      deep2: 10,
      rem2: 20,
      preWake: 35,
    },
    hotWeatherBoost: 25,
    coldWeatherReduce: 15,
  },
  {
    id: 'tropical',
    name: 'Tropical Night',
    description:
      'For hot, humid climates. Maximum airflow for evaporative cooling.',
    icon: 'Sun',
    phases: {
      onset: 80,
      light1: 70,
      deep1: 60,
      rem1: 75,
      mid: 65,
      deep2: 55,
      rem2: 70,
      preWake: 80,
    },
    hotWeatherBoost: 10,
    coldWeatherReduce: 30,
  },
  {
    id: 'energy-wake',
    name: 'Energy Wake-Up',
    description:
      'Focused on morning energy. Aggressive fan ramp-up 30min before alarm.',
    icon: 'Zap',
    phases: {
      onset: 50,
      light1: 40,
      deep1: 30,
      rem1: 45,
      mid: 35,
      deep2: 30,
      rem2: 40,
      preWake: 85,
    },
    hotWeatherBoost: 15,
    coldWeatherReduce: 15,
  },
];

export function getProfileById(id: string): TemperatureProfile | undefined {
  return TEMPERATURE_PROFILES.find((p) => p.id === id);
}

/** Get interpolated fan speed for a given profile and sleep progress (0-1) */
export function getProfileSpeed(
  profile: TemperatureProfile,
  progress: number,
  weatherBoost: number = 0,
): number {
  const p = profile.phases;
  let speed: number;

  if (progress < 0.05) speed = p.onset;
  else if (progress < 0.15) speed = p.light1;
  else if (progress < 0.25) speed = p.deep1;
  else if (progress < 0.35) speed = p.rem1;
  else if (progress < 0.55) speed = p.mid;
  else if (progress < 0.7) speed = p.deep2;
  else if (progress < 0.85) speed = p.rem2;
  else speed = p.preWake;

  // Apply weather adjustment
  if (weatherBoost > 0) {
    speed = Math.min(
      100,
      speed + (profile.hotWeatherBoost * weatherBoost) / 20,
    );
  } else if (weatherBoost < 0) {
    speed = Math.max(
      0,
      speed - (profile.coldWeatherReduce * Math.abs(weatherBoost)) / 20,
    );
  }

  return Math.round(Math.max(0, Math.min(100, speed)));
}
