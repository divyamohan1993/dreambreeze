import type { Posture } from '@/types/sleep';

/** Human-readable labels for each sleep posture. */
export const POSTURE_LABELS: Record<Posture, string> = {
  supine: 'On Back',
  prone: 'Face Down',
  'left-lateral': 'Left Side',
  'right-lateral': 'Right Side',
  fetal: 'Fetal',
  unknown: 'Detecting...',
};
