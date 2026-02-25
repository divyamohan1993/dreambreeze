/**
 * Ambient Noise Analyzer for DreamBreeze.
 *
 * Uses the Web Audio API to measure real-time ambient noise levels (dB SPL)
 * from the device microphone. Provides continuous readings with noise-floor
 * tracking and human-readable classification.
 */

// -- Types ----------------------------------------------------------------------

export type NoiseClassification = 'quiet' | 'moderate' | 'noisy' | 'loud';

export interface AmbientNoiseReading {
  dbLevel: number;
  noiseFloor: number;
  classification: NoiseClassification;
  timestamp: number;
}

// -- Pure helpers ---------------------------------------------------------------

/**
 * Convert an RMS amplitude value to decibels (dBFS).
 * Returns -Infinity for zero or negative input.
 */
export function rmsToDb(rms: number): number {
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

/**
 * Classify a dB SPL reading into a human-readable noise level.
 *
 * Thresholds (approximate indoor levels):
 *   < 30 dB  -- quiet  (sleeping room)
 *  30-50 dB  -- moderate (quiet office)
 *  50-70 dB  -- noisy  (conversation)
 *   > 70 dB  -- loud   (vacuum cleaner)
 */
export function classifyNoise(db: number): NoiseClassification {
  if (db < 30) return 'quiet';
  if (db < 50) return 'moderate';
  if (db < 70) return 'noisy';
  return 'loud';
}

// -- Callback type --------------------------------------------------------------

type NoiseCallback = (reading: AmbientNoiseReading) => void;

// -- Class ----------------------------------------------------------------------

export class AmbientNoiseAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: NoiseCallback | null = null;
  private noiseFloorBuffer: number[] = [];

  /** Number of samples to keep for noise-floor calculation (~5 min at 500 ms). */
  private readonly NOISE_FLOOR_WINDOW = 600;

  /** Milliseconds between dB samples. */
  private readonly SAMPLE_INTERVAL_MS = 500;

  private _isRunning = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Register a callback that fires on every new noise reading.
   */
  onReading(cb: NoiseCallback): void {
    this.callback = cb;
  }

  /**
   * Request microphone access and begin sampling ambient noise levels.
   * Resolves once the audio pipeline is established or silently stops on error.
   */
  async start(): Promise<void> {
    if (this._isRunning) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      this._isRunning = true;
      this.intervalId = setInterval(() => this.sample(), this.SAMPLE_INTERVAL_MS);
    } catch {
      this.stop();
    }
  }

  /**
   * Tear down the audio pipeline and release the microphone.
   */
  stop(): void {
    this._isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.noiseFloorBuffer = [];
  }

  // -- Private ------------------------------------------------------------------

  /**
   * Read the current audio buffer, compute RMS, convert to dB SPL,
   * update the rolling noise floor, and fire the callback.
   */
  private sample(): void {
    if (!this.analyser || !this.callback) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    // Compute RMS of the time-domain signal
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    // Convert dBFS to approximate dB SPL (+94 dB reference for 1 Pa at mic)
    const rawDb = rmsToDb(rms);
    const dbSpl = Math.max(0, Math.min(120, rawDb + 94));

    // Rolling noise-floor tracking
    this.noiseFloorBuffer.push(dbSpl);
    if (this.noiseFloorBuffer.length > this.NOISE_FLOOR_WINDOW) {
      this.noiseFloorBuffer.shift();
    }
    const noiseFloor = Math.min(...this.noiseFloorBuffer);

    this.callback({
      dbLevel: Math.round(dbSpl * 10) / 10,
      noiseFloor: Math.round(noiseFloor * 10) / 10,
      classification: classifyNoise(dbSpl),
      timestamp: Date.now(),
    });
  }
}
