/**
 * MQTT fan controller for DreamBreeze.
 *
 * Publishes fan speed commands to an MQTT broker topic and subscribes
 * to a status topic for connection feedback.
 */

import mqtt, { type MqttClient, type IClientOptions } from 'mqtt';
import type { FanController } from './fan-controller';

// -- Types ----------------------------------------------------------------------

export interface MQTTConfig {
  brokerUrl: string; // e.g. "wss://broker.example.com:8084/mqtt"
  topic: string; // e.g. "dreambreeze/fan/command"
  statusTopic?: string; // e.g. "dreambreeze/fan/status" -- subscribe for feedback
  username?: string;
  password?: string;
  clientId?: string;
}

export interface MQTTFanPayload {
  speed: number;
  timestamp: string; // ISO 8601
}

export interface MQTTStatusPayload {
  connected: boolean;
  currentSpeed: number;
  timestamp: string;
}

type StatusCallback = (payload: MQTTStatusPayload) => void;

// -- MQTT Fan Controller --------------------------------------------------------

export class MQTTFanController implements FanController {
  private _config: MQTTConfig;
  private _client: MqttClient | null = null;
  private _speed = 0;
  private _connected = false;
  private _onStatusUpdate: StatusCallback | null = null;

  constructor(config: MQTTConfig, onStatusUpdate?: StatusCallback) {
    this._config = config;
    this._onStatusUpdate = onStatusUpdate ?? null;
  }

  // -- FanController interface -----------------------------------------------

  async setSpeed(speed: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(speed)));
    this._speed = clamped;

    if (!this._client || !this._connected) {
      throw new Error('MQTT client not connected');
    }

    const payload: MQTTFanPayload = {
      speed: clamped,
      timestamp: new Date().toISOString(),
    };

    return new Promise<void>((resolve, reject) => {
      this._client!.publish(
        this._config.topic,
        JSON.stringify(payload),
        { qos: 1, retain: true },
        (err) => {
          if (err) reject(new Error(`MQTT publish failed: ${err.message}`));
          else resolve();
        },
      );
    });
  }

  getSpeed(): number {
    return this._speed;
  }

  async connect(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const options: IClientOptions = {
        clientId: this._config.clientId ?? `dreambreeze-${Date.now()}`,
        clean: true,
        connectTimeout: 10_000,
        reconnectPeriod: 5_000,
      };

      if (this._config.username) {
        options.username = this._config.username;
      }
      if (this._config.password) {
        options.password = this._config.password;
      }

      try {
        this._client = mqtt.connect(this._config.brokerUrl, options);

        this._client.on('connect', () => {
          this._connected = true;

          // Subscribe to status topic if configured
          if (this._config.statusTopic && this._client) {
            this._client.subscribe(this._config.statusTopic, { qos: 1 });
          }

          resolve(true);
        });

        this._client.on('error', (err) => {
          console.error('[DreamBreeze MQTT] Connection error:', err.message);
          this._connected = false;
          resolve(false);
        });

        this._client.on('close', () => {
          this._connected = false;
        });

        this._client.on('reconnect', () => {
          // Reconnecting silently
        });

        this._client.on('message', (_topic: string, message: Buffer) => {
          this._handleStatusMessage(message);
        });
      } catch (err) {
        console.error('[DreamBreeze MQTT] Failed to create client:', err);
        resolve(false);
      }
    });
  }

  async disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this._client) {
        this._client.end(false, {}, () => {
          this._connected = false;
          this._client = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  isConnected(): boolean {
    return this._connected;
  }

  // -- Private ---------------------------------------------------------------

  private _handleStatusMessage(message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString()) as MQTTStatusPayload;
      if (typeof payload.currentSpeed === 'number') {
        this._speed = payload.currentSpeed;
      }
      this._onStatusUpdate?.(payload);
    } catch {
      // Ignore malformed messages
    }
  }
}
