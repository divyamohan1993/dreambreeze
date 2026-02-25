// Canonical shared types for the DreamBreeze application.
// Import these instead of redefining locally.

export type Posture =
  | 'supine'
  | 'prone'
  | 'left-lateral'
  | 'right-lateral'
  | 'fetal'
  | 'unknown';

export type SleepStage = 'awake' | 'light' | 'deep' | 'rem';

export type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'ocean' | 'forest';
