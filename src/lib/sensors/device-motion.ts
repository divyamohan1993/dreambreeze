/**
 * DeviceMotion API wrapper for DreamBreeze.
 *
 * Handles:
 * - iOS 13+ permission flow (DeviceMotionEvent.requestPermission)
 * - 50 Hz sampling rate
 * - Calibration (store baseline when phone is placed flat on mattress)
 */

// -- Types ----------------------------------------------------------------------

export interface AccelerometerReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface GyroscopeReading {
  alpha: number;
  beta: number;
  gamma: number;
  timestamp: number;
}

export interface SensorReading {
  accelerometer: AccelerometerReading;
  gyroscope: GyroscopeReading;
}

export type SensorCallback = (reading: SensorReading) => void;

// -- Permission helpers (typed for iOS 13+) -------------------------------------

interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

function hasPermissionAPI(): boolean {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as DeviceMotionEventWithPermission).requestPermission ===
      'function'
  );
}

// -- Class ----------------------------------------------------------------------

export class DeviceMotionSensor {
  private _isRunning = false;
  private _callback: SensorCallback | null = null;
  private _sampleRate: number; // target Hz
  private _intervalMs: number;
  private _lastEmit = 0;

  /** Calibration baseline -- subtracted from raw readings. */
  private _baseline: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private _isCalibrated = false;

  /** Bound handler so we can remove the listener later. */
  private _boundHandler: ((e: DeviceMotionEvent) => void) | null = null;

  constructor(sampleRate = 50) {
    this._sampleRate = sampleRate;
    this._intervalMs = 1000 / sampleRate;
  }

  // -- Public getters --------------------------------------------------------

  get isRunning(): boolean {
    return this._isRunning;
  }

  get isCalibrated(): boolean {
    return this._isCalibrated;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  // -- Permission ------------------------------------------------------------

  /**
   * Request sensor permission. On iOS 13+ this triggers a system dialog.
   * On other platforms it resolves immediately.
   */
  async requestPermission(): Promise<boolean> {
    if (!hasPermissionAPI()) {
      // Permission not required on this platform
      return typeof DeviceMotionEvent !== 'undefined';
    }

    try {
      const result = await (
        DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
      ).requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }

  // -- Lifecycle -------------------------------------------------------------

  /**
   * Set the callback that receives sensor readings.
   */
  onReading(callback: SensorCallback): void {
    this._callback = callback;
  }

  /**
   * Start listening to DeviceMotion events.
   */
  start(): void {
    if (this._isRunning) return;
    if (typeof window === 'undefined') return;

    this._boundHandler = this._handleMotion.bind(this);
    window.addEventListener('devicemotion', this._boundHandler, true);
    this._isRunning = true;
    this._lastEmit = 0;
  }

  /**
   * Stop listening.
   */
  stop(): void {
    if (!this._isRunning) return;
    if (this._boundHandler) {
      window.removeEventListener('devicemotion', this._boundHandler, true);
      this._boundHandler = null;
    }
    this._isRunning = false;
  }

  // -- Calibration -----------------------------------------------------------

  /**
   * Store the current accelerometer reading as the zero baseline.
   * Call this when the phone is placed flat on the mattress in the desired
   * reference orientation.
   */
  calibrate(currentReading: { x: number; y: number; z: number }): void {
    this._baseline = { ...currentReading };
    this._isCalibrated = true;
  }

  /**
   * Reset calibration to zero.
   */
  resetCalibration(): void {
    this._baseline = { x: 0, y: 0, z: 0 };
    this._isCalibrated = false;
  }

  // -- Private ---------------------------------------------------------------

  private _handleMotion(event: DeviceMotionEvent): void {
    const now = performance.now();

    // Throttle to target sample rate
    if (now - this._lastEmit < this._intervalMs) return;
    this._lastEmit = now;

    if (!this._callback) return;

    const accel = event.accelerationIncludingGravity;
    const rotation = event.rotationRate;

    const rawX = accel?.x ?? 0;
    const rawY = accel?.y ?? 0;
    const rawZ = accel?.z ?? 0;

    const reading: SensorReading = {
      accelerometer: {
        x: rawX - this._baseline.x,
        y: rawY - this._baseline.y,
        z: rawZ - this._baseline.z,
        timestamp: Date.now(),
      },
      gyroscope: {
        alpha: rotation?.alpha ?? 0,
        beta: rotation?.beta ?? 0,
        gamma: rotation?.gamma ?? 0,
        timestamp: Date.now(),
      },
    };

    this._callback(reading);
  }
}
