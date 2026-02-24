/**
 * Fan controller abstraction for DreamBreeze.
 *
 * Defines the FanController interface and provides:
 * - DemoFanController (local-only, no hardware)
 * - mapPostureToSpeed() -- posture + stage -> target speed
 * - smoothSpeed() -- gradual speed transitions
 */

import type { Posture, SleepStage } from '@/stores/sleep-store';

// -- Interface ------------------------------------------------------------------

export interface FanController {
  /** Set fan speed (0-100). */
  setSpeed(speed: number): Promise<void>;

  /** Get current fan speed. */
  getSpeed(): number;

  /** Connect to the fan hardware/service. */
  connect(): Promise<boolean>;

  /** Disconnect from the fan. */
  disconnect(): Promise<void>;

  /** Whether the controller is currently connected. */
  isConnected(): boolean;
}

// -- Demo Fan Controller --------------------------------------------------------

/**
 * A demo fan controller that stores speed locally.
 * Used for testing and when no real fan hardware is connected.
 */
export class DemoFanController implements FanController {
  private _speed = 0;
  private _connected = false;
  private _onSpeedChange: ((speed: number) => void) | null = null;

  constructor(onSpeedChange?: (speed: number) => void) {
    this._onSpeedChange = onSpeedChange ?? null;
  }

  async setSpeed(speed: number): Promise<void> {
    this._speed = Math.max(0, Math.min(100, Math.round(speed)));
    this._onSpeedChange?.(this._speed);
  }

  getSpeed(): number {
    return this._speed;
  }

  async connect(): Promise<boolean> {
    this._connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  isConnected(): boolean {
    return this._connected;
  }
}

// -- Posture -> Speed Mapping ----------------------------------------------------

/**
 * Map a posture + sleep stage combination to a target fan speed (0-100).
 *
 * Logic:
 * - Prone -> minimal airflow (face down, avoid blowing on face)
 * - Fetal -> low (cold signal, user likely feeling chilly)
 * - Supine + deep -> moderate-low (comfortable, body temp drops)
 * - Supine + REM -> higher (REM thermoregulation is impaired)
 * - Lateral + REM -> moderate-high
 * - Awake -> comfortable default (user might be adjusting)
 */
export function mapPostureToSpeed(posture: Posture, sleepStage: SleepStage): number {
  // Awake override: consistent user-comfort speed
  if (sleepStage === 'awake') return 60;

  switch (posture) {
    case 'supine':
      switch (sleepStage) {
        case 'light': return 50;
        case 'deep': return 35;
        case 'rem': return 65;
        default: return 50;
      }

    case 'prone':
      // Face down -- minimal regardless of stage
      return 25;

    case 'left-lateral':
    case 'right-lateral':
      switch (sleepStage) {
        case 'light': return 40;
        case 'deep': return 30;
        case 'rem': return 55;
        default: return 40;
      }

    case 'fetal':
      // Cold signal -- keep fan very low
      return 20;

    case 'unknown':
    default:
      // Fallback to moderate
      return 40;
  }
}

// -- Speed Smoothing ------------------------------------------------------------

/**
 * Smoothly ramp from current speed to target speed, changing at most
 * `maxChangePerStep` units per call. Call this in a loop/interval.
 *
 * @returns The new speed after one step of smoothing.
 */
export function smoothSpeed(
  current: number,
  target: number,
  maxChangePerStep = 2,
): number {
  if (current === target) return target;

  const diff = target - current;
  const step = Math.sign(diff) * Math.min(Math.abs(diff), maxChangePerStep);
  return Math.round(current + step);
}
