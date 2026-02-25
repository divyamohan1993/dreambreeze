import { describe, it, expect } from 'vitest';
import { classifyNoise, rmsToDb } from '../ambient-noise';

describe('rmsToDb', () => {
  it('returns -Infinity for zero RMS', () => {
    expect(rmsToDb(0)).toBe(-Infinity);
  });

  it('returns 0 dB for RMS of 1', () => {
    expect(rmsToDb(1)).toBeCloseTo(0, 1);
  });

  it('returns ~-6 dB for RMS of 0.5', () => {
    expect(rmsToDb(0.5)).toBeCloseTo(-6.02, 0);
  });
});

describe('classifyNoise', () => {
  it('classifies < 30 dB as quiet', () => {
    expect(classifyNoise(25)).toBe('quiet');
  });

  it('classifies 30-50 dB as moderate', () => {
    expect(classifyNoise(40)).toBe('moderate');
  });

  it('classifies 50-70 dB as noisy', () => {
    expect(classifyNoise(60)).toBe('noisy');
  });

  it('classifies > 70 dB as loud', () => {
    expect(classifyNoise(80)).toBe('loud');
  });
});
