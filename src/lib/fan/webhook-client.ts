/**
 * Generic webhook fan controller for DreamBreeze.
 *
 * Sends fan speed commands as HTTP POST requests to a user-configured URL.
 * Compatible with Home Assistant webhooks, IFTTT, Zapier, n8n, and other
 * automation platforms.
 */

import type { FanController } from './fan-controller';
import type { Posture, SleepStage } from '@/stores/sleep-store';
import { CircuitBreaker } from '../resilience/circuit-breaker';

const webhookCircuit = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  onStateChange: (from, to) => {
    console.warn(`[webhook] Circuit breaker: ${from} -> ${to}`);
  },
});

// -- Types ----------------------------------------------------------------------

export interface WebhookConfig {
  url: string; // The webhook endpoint URL
  headers?: Record<string, string>; // Optional custom headers (e.g. API keys)
  method?: 'POST' | 'PUT'; // HTTP method, default POST
  retryCount?: number; // Number of retries on failure, default 2
  timeoutMs?: number; // Request timeout, default 5000
}

export interface WebhookPayload {
  speed: number;
  posture: Posture | null;
  sleepStage: SleepStage | null;
  timestamp: string;
  source: 'dreambreeze';
}

// -- Webhook Fan Controller -----------------------------------------------------

export class WebhookFanController implements FanController {
  private _config: WebhookConfig;
  private _speed = 0;
  private _connected = false;
  private _currentPosture: Posture | null = null;
  private _currentStage: SleepStage | null = null;
  private _lastError: string | null = null;

  constructor(config: WebhookConfig) {
    this._config = {
      method: 'POST',
      retryCount: 2,
      timeoutMs: 5000,
      ...config,
    };
  }

  // -- FanController interface -----------------------------------------------

  async setSpeed(speed: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(speed)));
    this._speed = clamped;

    const payload: WebhookPayload = {
      speed: clamped,
      posture: this._currentPosture,
      sleepStage: this._currentStage,
      timestamp: new Date().toISOString(),
      source: 'dreambreeze',
    };

    await this._sendWithRetry(payload);
  }

  getSpeed(): number {
    return this._speed;
  }

  /**
   * Test the webhook connection by sending a test payload.
   * Returns true if the webhook responds with a 2xx status.
   */
  async connect(): Promise<boolean> {
    // Warn if webhook URL does not use HTTPS
    if (this._config.url.startsWith('http://')) {
      console.warn(
        '[DreamBreeze Webhook] WARNING: Webhook URL uses unencrypted http:// protocol. ' +
        'Consider using https:// for a secure connection.',
      );
    }

    try {
      const testPayload: WebhookPayload = {
        speed: 0,
        posture: null,
        sleepStage: null,
        timestamp: new Date().toISOString(),
        source: 'dreambreeze',
      };

      await this._send(testPayload);
      this._connected = true;
      this._lastError = null;
      return true;
    } catch (err) {
      this._connected = false;
      this._lastError = err instanceof Error ? err.message : 'Connection failed';
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  isConnected(): boolean {
    return this._connected;
  }

  // -- Additional methods ----------------------------------------------------

  /**
   * Update the current posture (included in webhook payloads).
   */
  setCurrentPosture(posture: Posture): void {
    this._currentPosture = posture;
  }

  /**
   * Update the current sleep stage (included in webhook payloads).
   */
  setCurrentStage(stage: SleepStage): void {
    this._currentStage = stage;
  }

  /**
   * Get the last error message, if any.
   */
  getLastError(): string | null {
    return this._lastError;
  }

  // -- Private ---------------------------------------------------------------

  private async _send(payload: WebhookPayload): Promise<void> {
    await webhookCircuit.execute(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this._config.timeoutMs);

      try {
        const response = await fetch(this._config.url, {
          method: this._config.method ?? 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this._config.headers ?? {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private async _sendWithRetry(payload: WebhookPayload): Promise<void> {
    const maxRetries = this._config.retryCount ?? 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this._send(payload);
        this._lastError = null;
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        }
      }
    }

    this._lastError = lastError?.message ?? 'Webhook request failed';
    throw lastError;
  }
}
