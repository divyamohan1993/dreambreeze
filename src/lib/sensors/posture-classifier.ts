/**
 * Rule-based posture classifier for DreamBreeze.
 *
 * Phone is assumed to be placed flat on the mattress near the pillow.
 * Posture is derived from accelerometer tilt angles using a rolling window
 * with hysteresis to prevent rapid oscillation.
 */

import type { Posture } from '@/stores/sleep-store';

// -- Types ----------------------------------------------------------------------

export interface PostureResult {
  posture: Posture;
  confidence: number; // 0-1
  rawAngles: {
    pitch: number; // degrees, forward/back tilt
    roll: number; // degrees, left/right tilt
    yaw: number; // degrees (approximated, unreliable without magnetometer)
  };
}

export interface AccelerometerSample {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// -- Constants ------------------------------------------------------------------

const WINDOW_SIZE = 50; // rolling window of samples
const HYSTERESIS_MS = 10_000; // hold posture for 10 seconds before changing
const LATERAL_THRESHOLD_DEG = 20; // degrees of roll for lateral detection
const PRONE_Z_THRESHOLD = -0.3; // normalized z threshold for face-down
const FETAL_CURL_THRESHOLD = 0.15; // additional acceleration variance for fetal

// -- Helpers --------------------------------------------------------------------

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Compute pitch and roll from accelerometer readings.
 *
 * pitch = rotation about x-axis (forward/back tilt)
 * roll  = rotation about y-axis (left/right tilt)
 */
function computeAngles(ax: number, ay: number, az: number) {
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
  const nx = ax / magnitude;
  const ny = ay / magnitude;
  const nz = az / magnitude;

  const pitch = toDegrees(Math.atan2(ny, Math.sqrt(nx * nx + nz * nz)));
  const roll = toDegrees(Math.atan2(-nx, nz));
  const yaw = toDegrees(Math.atan2(ny, nx)); // rough, no magnetometer

  return { pitch, roll, yaw, nz };
}

/**
 * Compute standard deviation of an array of numbers.
 */
function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// -- Classifier Class -----------------------------------------------------------

export class PostureClassifier {
  private _window: AccelerometerSample[] = [];
  private _currentPosture: Posture = 'unknown';
  private _lastChangeTime = 0;
  private _pendingPosture: Posture | null = null;
  private _pendingStartTime = 0;

  /**
   * Add a new accelerometer sample and get the current posture classification.
   */
  classify(sample: AccelerometerSample): PostureResult {
    // Maintain rolling window
    this._window.push(sample);
    if (this._window.length > WINDOW_SIZE) {
      this._window.shift();
    }

    // Need at least a few samples
    if (this._window.length < 5) {
      return {
        posture: 'unknown',
        confidence: 0,
        rawAngles: { pitch: 0, roll: 0, yaw: 0 },
      };
    }

    // Average the window for stability
    const avgX = this._window.reduce((s, w) => s + w.x, 0) / this._window.length;
    const avgY = this._window.reduce((s, w) => s + w.y, 0) / this._window.length;
    const avgZ = this._window.reduce((s, w) => s + w.z, 0) / this._window.length;

    const { pitch, roll, yaw, nz } = computeAngles(avgX, avgY, avgZ);

    // Compute variability for fetal detection
    const xVariance = stddev(this._window.map((s) => s.x));
    const yVariance = stddev(this._window.map((s) => s.y));
    const combinedVariance = (xVariance + yVariance) / 2;

    // Classify raw posture
    const { posture: rawPosture, confidence } = this._classifyRaw(
      pitch,
      roll,
      nz,
      combinedVariance,
    );

    // Apply hysteresis
    const now = sample.timestamp;
    const finalPosture = this._applyHysteresis(rawPosture, now);

    return {
      posture: finalPosture,
      confidence,
      rawAngles: { pitch, roll, yaw },
    };
  }

  /**
   * Reset the classifier state (e.g. at session start).
   */
  reset(): void {
    this._window = [];
    this._currentPosture = 'unknown';
    this._lastChangeTime = 0;
    this._pendingPosture = null;
    this._pendingStartTime = 0;
  }

  // -- Private ---------------------------------------------------------------

  private _classifyRaw(
    pitch: number,
    roll: number,
    nz: number,
    variance: number,
  ): { posture: Posture; confidence: number } {
    // 1. Prone detection: phone/mattress z-axis is flipped
    if (nz < PRONE_Z_THRESHOLD) {
      return { posture: 'prone', confidence: Math.min(1, Math.abs(nz) * 1.2) };
    }

    const absRoll = Math.abs(roll);
    const absPitch = Math.abs(pitch);

    // 2. Fetal position: significant lateral tilt + curl pattern (higher variance)
    if (absRoll > LATERAL_THRESHOLD_DEG && variance > FETAL_CURL_THRESHOLD) {
      return {
        posture: 'fetal',
        confidence: Math.min(1, 0.5 + variance * 2),
      };
    }

    // 3. Left lateral
    if (roll > LATERAL_THRESHOLD_DEG) {
      const confidence = Math.min(1, (absRoll - LATERAL_THRESHOLD_DEG) / 40 + 0.5);
      return { posture: 'left-lateral', confidence };
    }

    // 4. Right lateral
    if (roll < -LATERAL_THRESHOLD_DEG) {
      const confidence = Math.min(1, (absRoll - LATERAL_THRESHOLD_DEG) / 40 + 0.5);
      return { posture: 'right-lateral', confidence };
    }

    // 5. Supine: relatively flat
    if (absRoll <= LATERAL_THRESHOLD_DEG && absPitch <= LATERAL_THRESHOLD_DEG) {
      const flatness = 1 - (absRoll + absPitch) / (2 * LATERAL_THRESHOLD_DEG);
      return { posture: 'supine', confidence: Math.min(1, 0.6 + flatness * 0.4) };
    }

    // Fallback
    return { posture: 'unknown', confidence: 0.3 };
  }

  private _applyHysteresis(rawPosture: Posture, timestamp: number): Posture {
    // First reading -- accept immediately
    if (this._currentPosture === 'unknown') {
      this._currentPosture = rawPosture;
      this._lastChangeTime = timestamp;
      return rawPosture;
    }

    // Same as current -- no change, clear pending
    if (rawPosture === this._currentPosture) {
      this._pendingPosture = null;
      this._pendingStartTime = 0;
      return this._currentPosture;
    }

    // Different -- start or continue pending
    if (this._pendingPosture !== rawPosture) {
      // New pending posture
      this._pendingPosture = rawPosture;
      this._pendingStartTime = timestamp;
    }

    // Check if pending has been stable for HYSTERESIS_MS
    if (
      this._pendingPosture === rawPosture &&
      timestamp - this._pendingStartTime >= HYSTERESIS_MS
    ) {
      this._currentPosture = rawPosture;
      this._lastChangeTime = timestamp;
      this._pendingPosture = null;
      this._pendingStartTime = 0;
      return rawPosture;
    }

    // Not stable yet -- keep current
    return this._currentPosture;
  }
}

// -- Singleton Export -----------------------------------------------------------

let _classifierInstance: PostureClassifier | null = null;

export function getPostureClassifier(): PostureClassifier {
  if (!_classifierInstance) {
    _classifierInstance = new PostureClassifier();
  }
  return _classifierInstance;
}
