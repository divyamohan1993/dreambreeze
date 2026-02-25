// Shared types for the PreSleep Check-in feature.
// Re-exported from the barrel index for convenience.

export interface PreSleepData {
  stressLevel: number; // 1-5
  caffeineMg: number;
  caffeineLastIntakeHoursAgo: number;
  alcoholDrinks: number;
  exerciseIntensity: 'none' | 'light' | 'moderate' | 'intense';
  exerciseHoursAgo: number;
  mealHoursAgo: number;
  screenTimeMinutes: number;
}

export interface Insight {
  text: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  color: string;
}
