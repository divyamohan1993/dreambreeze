/**
 * Procedural noise generation using Web Audio API.
 *
 * Provides white, pink, and brown noise generators that return AudioNodes
 * which can be connected into a Web Audio graph.
 *
 * Pink noise uses Paul Kellet's refined method (6 first-order filters).
 * Brown noise uses integrated white noise with -6dB/octave rolloff.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

const BUFFER_SIZE = 4096;
const NOISE_BUFFER_DURATION = 2; // seconds of pre-generated noise

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NoiseNode {
  node: AudioNode;
  start: () => void;
  stop: () => void;
}

// ── White Noise ────────────────────────────────────────────────────────────────

/**
 * Generate white noise: flat power spectrum, each sample is random.
 * Returns an AudioBufferSourceNode set to loop.
 */
export function generateWhiteNoise(ctx: AudioContext): NoiseNode {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * NOISE_BUFFER_DURATION;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  return {
    node: source,
    start: () => source.start(0),
    stop: () => {
      try {
        source.stop(0);
      } catch {
        // Already stopped
      }
    },
  };
}

// ── Pink Noise ─────────────────────────────────────────────────────────────────

/**
 * Generate pink noise: -3dB/octave power spectrum.
 *
 * Uses Paul Kellet's refined algorithm with six first-order IIR filters
 * applied to white noise to approximate a -3dB/octave rolloff.
 *
 * Reference: http://www.firstpr.com.au/dsp/pink-noise/
 */
export function generatePinkNoise(ctx: AudioContext): NoiseNode {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * NOISE_BUFFER_DURATION;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Paul Kellet's filter state variables
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;

    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;

    // Normalize to prevent clipping (peak is around 5.0)
    data[i] = pink * 0.11;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  return {
    node: source,
    start: () => source.start(0),
    stop: () => {
      try {
        source.stop(0);
      } catch {
        // Already stopped
      }
    },
  };
}

// ── Brown Noise ────────────────────────────────────────────────────────────────

/**
 * Generate brown (Brownian/red) noise: -6dB/octave power spectrum.
 *
 * Produced by integrating white noise. Each sample is the running sum of
 * random increments, then clamped and scaled.
 */
export function generateBrownNoise(ctx: AudioContext): NoiseNode {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * NOISE_BUFFER_DURATION;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    // Leaky integrator: drift toward zero to prevent DC wander
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5; // Amplify (peak is low)
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  return {
    node: source,
    start: () => source.start(0),
    stop: () => {
      try {
        source.stop(0);
      } catch {
        // Already stopped
      }
    },
  };
}

// ── Utility: Create filtered noise ─────────────────────────────────────────────

/**
 * Create a low-pass filtered version of any noise node.
 * Useful for creating deep-sleep-optimized brown noise with extra LF emphasis.
 */
export function createLowPassFilter(
  ctx: AudioContext,
  cutoffHz: number,
  Q = 1,
): BiquadFilterNode {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoffHz, ctx.currentTime);
  filter.Q.setValueAtTime(Q, ctx.currentTime);
  return filter;
}

/**
 * Create a gain node for volume control.
 */
export function createGainNode(ctx: AudioContext, initialGain = 1): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(initialGain, ctx.currentTime);
  return gain;
}
