/**
 * Actigraphy-based sleep stage estimator for DreamBreeze.
 *
 * Uses epoch-based scoring (30-second epochs, standard polysomnography window)
 * to estimate sleep stage from accelerometer movement intensity.
 *
 * This is a simplified actigraphy approach -- not a replacement for PSG, but a
 * reasonable heuristic for consumer sleep tracking.
 */

import type { SleepStage } from '@/stores/sleep-store';

// -- Types ----------------------------------------------------------------------

export interface EpochResult {
  stage: SleepStage;
  confidence: number; // 0-1
  epochIndex: number;
  movementIntensity: number; // in g units
  timestamp: number;
}

interface AccelerometerDelta {
  magnitude: number;
  timestamp: number;
}

// -- Constants ------------------------------------------------------------------

const EPOCH_DURATION_MS = 30_000; // 30 seconds per epoch (standard PSG)
const CONTEXT_BUFFER_SIZE = 10; // rolling buffer of 10 epochs for context

/** Movement thresholds (in g -- sum of absolute deltas per epoch) */
const THRESHOLD_AWAKE = 0.5;
const THRESHOLD_LIGHT_UPPER = 0.5;
const THRESHOLD_LIGHT_LOWER = 0.1;
const THRESHOLD_DEEP_UPPER = 0.03;
const THRESHOLD_REM_LOWER = 0.03;
const THRESHOLD_REM_UPPER = 0.1;

/** REM detection: periodic micro-bursts every 20-90 seconds */
const REM_BURST_MIN_INTERVAL_MS = 20_000;
const REM_BURST_MAX_INTERVAL_MS = 90_000;
const REM_BURST_THRESHOLD = 0.04; // minimum spike to count as a micro-burst

// -- Estimator Class ------------------------------------------------------------

export class SleepStageEstimator {
  private _epochIndex = 0;
  private _currentEpochStart = 0;
  private _currentEpochDeltas: AccelerometerDelta[] = [];
  private _contextBuffer: EpochResult[] = [];

  /** Previous accelerometer reading for computing deltas */
  private _prevReading: { x: number; y: number; z: number } | null = null;

  /** Track spikes within epoch for REM burst detection */
  private _burstTimestamps: number[] = [];

  /**
   * Feed a new accelerometer reading. Returns an EpochResult when a 30-second
   * epoch completes, or null between epochs.
   */
  addReading(x: number, y: number, z: number, timestamp: number): EpochResult | null {
    // Initialize epoch start on first reading
    if (this._currentEpochStart === 0) {
      this._currentEpochStart = timestamp;
    }

    // Compute delta from previous reading
    if (this._prevReading) {
      const dx = Math.abs(x - this._prevReading.x);
      const dy = Math.abs(y - this._prevReading.y);
      const dz = Math.abs(z - this._prevReading.z);
      const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

      this._currentEpochDeltas.push({ magnitude, timestamp });

      // Track bursts for REM detection
      if (magnitude > REM_BURST_THRESHOLD) {
        this._burstTimestamps.push(timestamp);
      }
    }

    this._prevReading = { x, y, z };

    // Check if epoch is complete
    if (timestamp - this._currentEpochStart >= EPOCH_DURATION_MS) {
      return this._closeEpoch(timestamp);
    }

    return null;
  }

  /**
   * Get the current context buffer of recent epochs.
   */
  getContextBuffer(): ReadonlyArray<EpochResult> {
    return this._contextBuffer;
  }

  /**
   * Get the current epoch index.
   */
  getEpochIndex(): number {
    return this._epochIndex;
  }

  /**
   * Reset the estimator (e.g. at session start).
   */
  reset(): void {
    this._epochIndex = 0;
    this._currentEpochStart = 0;
    this._currentEpochDeltas = [];
    this._contextBuffer = [];
    this._prevReading = null;
    this._burstTimestamps = [];
  }

  // -- Private ---------------------------------------------------------------

  private _closeEpoch(timestamp: number): EpochResult {
    // Compute total movement intensity for this epoch
    const totalMovement = this._currentEpochDeltas.reduce((sum, d) => sum + d.magnitude, 0);
    const avgMovement =
      this._currentEpochDeltas.length > 0
        ? totalMovement / this._currentEpochDeltas.length
        : 0;

    // Detect REM burst pattern
    const hasREMBursts = this._detectREMBursts();

    // Classify the epoch
    const { stage, confidence } = this._classifyEpoch(avgMovement, hasREMBursts);

    const result: EpochResult = {
      stage,
      confidence,
      epochIndex: this._epochIndex,
      movementIntensity: avgMovement,
      timestamp,
    };

    // Update context buffer
    this._contextBuffer.push(result);
    if (this._contextBuffer.length > CONTEXT_BUFFER_SIZE) {
      this._contextBuffer.shift();
    }

    // Apply context smoothing
    const smoothedResult = this._applyContextSmoothing(result);

    // Reset for next epoch
    this._epochIndex++;
    this._currentEpochStart = timestamp;
    this._currentEpochDeltas = [];
    this._burstTimestamps = [];

    return smoothedResult;
  }

  private _classifyEpoch(
    avgMovement: number,
    hasREMBursts: boolean,
  ): { stage: SleepStage; confidence: number } {
    // High movement -> awake
    if (avgMovement > THRESHOLD_AWAKE) {
      return { stage: 'awake', confidence: Math.min(1, 0.7 + (avgMovement - THRESHOLD_AWAKE)) };
    }

    // Medium-high movement -> light sleep
    if (avgMovement >= THRESHOLD_LIGHT_LOWER && avgMovement <= THRESHOLD_LIGHT_UPPER) {
      // Check for REM pattern within light sleep movement range
      if (hasREMBursts && avgMovement >= THRESHOLD_REM_LOWER && avgMovement <= THRESHOLD_REM_UPPER) {
        return { stage: 'rem', confidence: 0.6 };
      }
      return { stage: 'light', confidence: 0.7 };
    }

    // Very low movement -> deep sleep
    if (avgMovement < THRESHOLD_DEEP_UPPER) {
      return { stage: 'deep', confidence: Math.min(1, 0.8 + (THRESHOLD_DEEP_UPPER - avgMovement) * 10) };
    }

    // Low movement with bursts -> REM
    if (
      avgMovement >= THRESHOLD_REM_LOWER &&
      avgMovement <= THRESHOLD_REM_UPPER &&
      hasREMBursts
    ) {
      return { stage: 'rem', confidence: 0.65 };
    }

    // Low movement without bursts -> likely light or transitional
    if (avgMovement >= THRESHOLD_DEEP_UPPER && avgMovement < THRESHOLD_LIGHT_LOWER) {
      return { stage: 'light', confidence: 0.5 };
    }

    return { stage: 'light', confidence: 0.4 };
  }

  /**
   * Detect periodic micro-bursts characteristic of REM sleep.
   *
   * REM is associated with periodic eye movements and small muscle twitches
   * every 20-90 seconds.
   */
  private _detectREMBursts(): boolean {
    if (this._burstTimestamps.length < 2) return false;

    // Check intervals between consecutive bursts
    let validIntervalCount = 0;
    for (let i = 1; i < this._burstTimestamps.length; i++) {
      const interval = this._burstTimestamps[i] - this._burstTimestamps[i - 1];
      if (interval >= REM_BURST_MIN_INTERVAL_MS && interval <= REM_BURST_MAX_INTERVAL_MS) {
        validIntervalCount++;
      }
    }

    // Need at least one valid burst interval in the epoch
    return validIntervalCount >= 1;
  }

  /**
   * Use context from recent epochs to smooth out unlikely transitions.
   *
   * Sleep stage transitions follow patterns:
   * - awake -> light -> deep -> light -> REM (typical cycle)
   * - Going directly from awake to deep is unlikely
   * - REM typically occurs after a period of light/deep sleep
   */
  private _applyContextSmoothing(result: EpochResult): EpochResult {
    if (this._contextBuffer.length < 2) return result;

    const prevEpoch = this._contextBuffer[this._contextBuffer.length - 2];

    // Prevent jumping from awake directly to deep sleep
    if (prevEpoch.stage === 'awake' && result.stage === 'deep') {
      return { ...result, stage: 'light', confidence: result.confidence * 0.8 };
    }

    // Prevent jumping from deep directly to awake (unless high movement)
    if (prevEpoch.stage === 'deep' && result.stage === 'awake' && result.movementIntensity < 0.8) {
      return { ...result, stage: 'light', confidence: result.confidence * 0.7 };
    }

    // REM usually follows at least 2 epochs of non-awake sleep
    if (result.stage === 'rem') {
      const recentAwakeCount = this._contextBuffer
        .slice(-3)
        .filter((e) => e.stage === 'awake').length;
      if (recentAwakeCount >= 2) {
        return { ...result, stage: 'light', confidence: result.confidence * 0.6 };
      }
    }

    return result;
  }
}

// -- Singleton Export -----------------------------------------------------------

let _estimatorInstance: SleepStageEstimator | null = null;

export function getSleepStageEstimator(): SleepStageEstimator {
  if (!_estimatorInstance) {
    _estimatorInstance = new SleepStageEstimator();
  }
  return _estimatorInstance;
}
