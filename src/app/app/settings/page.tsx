'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Wifi,
  WifiOff,
  Globe,
  Link2,
  Volume2,
  CloudRain,
  Waves,
  TreePine,
  Wind,
  Zap,
  Sun,
  Thermometer,
  BedDouble,
  AlarmClock,
  Music,
  Gauge,
  Info,
  Github,
  Shield,
  Mail,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type ConnectionType = 'demo' | 'mqtt' | 'webhook';
type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'ocean' | 'forest';
type TempPreference = 'cool' | 'neutral' | 'warm';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface MQTTConfig {
  brokerUrl: string;
  topic: string;
  username: string;
  password: string;
}

interface WebhookConfig {
  url: string;
  headers: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const NOISE_OPTIONS: { type: NoiseType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { type: 'white', label: 'White', icon: Wind },
  { type: 'pink', label: 'Pink', icon: Zap },
  { type: 'brown', label: 'Brown', icon: Sun },
  { type: 'rain', label: 'Rain', icon: CloudRain },
  { type: 'ocean', label: 'Ocean', icon: Waves },
  { type: 'forest', label: 'Forest', icon: TreePine },
];

const WAKE_SOUNDS = ['Gentle Chimes', 'Sunrise', 'Birds', 'Ocean Waves', 'Soft Piano', 'None'];

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-db-text-dim uppercase tracking-wider">
        {title}
      </h2>
      <div className="glass skeu-raised rounded-2xl p-4 space-y-4">{children}</div>
    </section>
  );
}

// ── Glass Input ────────────────────────────────────────────────────────────────

function GlassInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-db-text-muted mb-1 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-sm text-db-text bg-db-surface border border-white/[0.06] focus:border-db-teal/40 focus:outline-none transition-colors placeholder:text-db-text-muted/50"
      />
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({
  label,
  enabled,
  onToggle,
  description,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm text-db-text">{label}</p>
        {description && (
          <p className="text-[10px] text-db-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${
          enabled ? 'bg-db-teal' : 'bg-db-surface'
        }`}
        style={{
          boxShadow: enabled
            ? '0 0 8px rgba(78, 205, 196, 0.3), inset 0 1px 2px rgba(0,0,0,0.2)'
            : 'inset 0 1px 4px rgba(0,0,0,0.3)',
        }}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
          animate={{ left: enabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>
    </div>
  );
}

// ── Slider ─────────────────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = '%',
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm text-db-text">{label}</p>
          {description && (
            <p className="text-[10px] text-db-text-muted">{description}</p>
          )}
        </div>
        <span className="text-sm font-mono text-db-teal">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-db-surface overflow-hidden">
          <div
            className="h-full bg-db-teal rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-db-teal border-2 border-db-navy pointer-events-none"
          style={{
            left: `calc(${percent}% - 8px)`,
            boxShadow: '0 0 6px rgba(78, 205, 196, 0.4)',
          }}
        />
      </div>
    </div>
  );
}

// ── Connection Status LED ──────────────────────────────────────────────────────

function StatusLED({ status }: { status: ConnectionStatus }) {
  const config: Record<ConnectionStatus, { color: string; label: string }> = {
    disconnected: { color: '#555577', label: 'Disconnected' },
    connecting: { color: '#f0a060', label: 'Connecting...' },
    connected: { color: '#4ecdc4', label: 'Connected' },
    error: { color: '#e94560', label: 'Error' },
  };
  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}, 0 0 12px ${color}40`,
          animation: status === 'connecting' ? 'led-pulse 1.5s ease infinite' : undefined,
        }}
      />
      <span className="text-xs text-db-text-dim">{label}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // Fan Integration
  const [connectionType, setConnectionType] = useState<ConnectionType>('demo');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [mqttConfig, setMqttConfig] = useState<MQTTConfig>({
    brokerUrl: '',
    topic: 'dreambreeze/fan',
    username: '',
    password: '',
  });
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    url: '',
    headers: '{"Authorization": "Bearer ..."}',
  });
  const [testingConnection, setTestingConnection] = useState(false);

  // Sound Preferences
  const [defaultNoise, setDefaultNoise] = useState<NoiseType>('rain');
  const [defaultVolume, setDefaultVolume] = useState(50);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [wakeSound, setWakeSound] = useState('Gentle Chimes');

  // Sleep Preferences
  const [sensitivity, setSensitivity] = useState(60);
  const [tempPreference, setTempPreference] = useState<TempPreference>('cool');
  const [targetBedtime, setTargetBedtime] = useState('22:30');
  const [targetWakeTime, setTargetWakeTime] = useState('06:30');

  // ── Test connection handler ──────────────────────────────────────────────
  const testConnection = useCallback(() => {
    setTestingConnection(true);
    setConnectionStatus('connecting');
    // Simulate connection test
    setTimeout(() => {
      if (connectionType === 'demo') {
        setConnectionStatus('connected');
      } else {
        // Random success/fail for demo purposes
        setConnectionStatus(Math.random() > 0.3 ? 'connected' : 'error');
      }
      setTestingConnection(false);
    }, 2000);
  }, [connectionType]);

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-db-text">Settings</h1>
        <p className="text-xs text-db-text-dim mt-0.5">Configure your DreamBreeze experience</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Fan Integration
          ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Fan Integration">
        {/* Connection type selector */}
        <div>
          <p className="text-[11px] text-db-text-muted mb-2 uppercase tracking-wider">
            Connection Type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { type: 'demo' as ConnectionType, label: 'Demo', icon: Gauge },
                { type: 'mqtt' as ConnectionType, label: 'MQTT', icon: Globe },
                { type: 'webhook' as ConnectionType, label: 'Webhook', icon: Link2 },
              ] as const
            ).map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => {
                  setConnectionType(type);
                  setConnectionStatus('disconnected');
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                  connectionType === type
                    ? 'bg-db-teal/15 border border-db-teal/30'
                    : 'bg-db-surface border border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                <Icon
                  size={18}
                  className={connectionType === type ? 'text-db-teal' : 'text-db-text-muted'}
                />
                <span
                  className={`text-xs font-medium ${
                    connectionType === type ? 'text-db-teal' : 'text-db-text-dim'
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* MQTT Config */}
        {connectionType === 'mqtt' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <GlassInput
              label="Broker URL"
              value={mqttConfig.brokerUrl}
              onChange={(v) => setMqttConfig((p) => ({ ...p, brokerUrl: v }))}
              placeholder="mqtt://broker.hivemq.com:1883"
            />
            <GlassInput
              label="Topic"
              value={mqttConfig.topic}
              onChange={(v) => setMqttConfig((p) => ({ ...p, topic: v }))}
              placeholder="dreambreeze/fan"
            />
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Username"
                value={mqttConfig.username}
                onChange={(v) => setMqttConfig((p) => ({ ...p, username: v }))}
                placeholder="optional"
              />
              <GlassInput
                label="Password"
                value={mqttConfig.password}
                onChange={(v) => setMqttConfig((p) => ({ ...p, password: v }))}
                type="password"
                placeholder="optional"
              />
            </div>
          </motion.div>
        )}

        {/* Webhook Config */}
        {connectionType === 'webhook' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <GlassInput
              label="Webhook URL"
              value={webhookConfig.url}
              onChange={(v) => setWebhookConfig((p) => ({ ...p, url: v }))}
              placeholder="https://api.example.com/fan"
            />
            <GlassInput
              label="Headers (JSON)"
              value={webhookConfig.headers}
              onChange={(v) => setWebhookConfig((p) => ({ ...p, headers: v }))}
              placeholder='{"Authorization": "Bearer ..."}'
            />
          </motion.div>
        )}

        {/* Test connection */}
        <div className="flex items-center justify-between">
          <StatusLED status={connectionStatus} />
          <button
            onClick={testConnection}
            disabled={testingConnection}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-db-teal/15 text-db-teal border border-db-teal/20 hover:bg-db-teal/25 transition-colors disabled:opacity-50"
          >
            {testingConnection ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Testing...
              </>
            ) : connectionStatus === 'connected' ? (
              <>
                <CheckCircle2 size={14} />
                Connected
              </>
            ) : connectionStatus === 'error' ? (
              <>
                <XCircle size={14} className="text-db-rose" />
                Retry
              </>
            ) : (
              <>
                <Wifi size={14} />
                Test Connection
              </>
            )}
          </button>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          Sound Preferences
          ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Sound Preferences">
        {/* Default noise type */}
        <div>
          <p className="text-[11px] text-db-text-muted mb-2 uppercase tracking-wider">
            Default Noise Type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {NOISE_OPTIONS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setDefaultNoise(type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                  defaultNoise === type
                    ? 'bg-db-lavender/15 border border-db-lavender/30'
                    : 'bg-db-surface border border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                <Icon
                  size={18}
                  className={defaultNoise === type ? 'text-db-lavender' : 'text-db-text-muted'}
                />
                <span
                  className={`text-[11px] font-medium ${
                    defaultNoise === type ? 'text-db-lavender' : 'text-db-text-dim'
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Slider
          label="Default Volume"
          value={defaultVolume}
          onChange={setDefaultVolume}
          unit="%"
        />

        <Toggle
          label="Adaptive Mode"
          description="Automatically adjust sound based on sleep stage"
          enabled={adaptiveMode}
          onToggle={() => setAdaptiveMode(!adaptiveMode)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-db-text-muted mb-1 uppercase tracking-wider">
              Morning Alarm
            </label>
            <div className="flex items-center gap-2">
              <AlarmClock size={14} className="text-db-text-muted" />
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm text-db-text bg-db-surface border border-white/[0.06] focus:border-db-teal/40 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-db-text-muted mb-1 uppercase tracking-wider">
              Wake-up Sound
            </label>
            <div className="flex items-center gap-2">
              <Music size={14} className="text-db-text-muted" />
              <select
                value={wakeSound}
                onChange={(e) => setWakeSound(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm text-db-text bg-db-surface border border-white/[0.06] focus:border-db-teal/40 focus:outline-none appearance-none"
              >
                {WAKE_SOUNDS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          Sleep Preferences
          ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Sleep Preferences">
        <Slider
          label="Fan Sensitivity"
          description="How quickly fan responds to posture changes"
          value={sensitivity}
          onChange={setSensitivity}
          unit="%"
        />

        {/* Temperature preference */}
        <div>
          <p className="text-[11px] text-db-text-muted mb-2 uppercase tracking-wider">
            Temperature Preference
          </p>
          <div className="flex gap-2">
            {(
              [
                { value: 'cool' as TempPreference, label: 'Cool', desc: 'Higher base fan' },
                { value: 'neutral' as TempPreference, label: 'Neutral', desc: 'Balanced' },
                { value: 'warm' as TempPreference, label: 'Warm', desc: 'Lower base fan' },
              ] as const
            ).map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setTempPreference(value)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                  tempPreference === value
                    ? 'bg-db-amber/15 border border-db-amber/30'
                    : 'bg-db-surface border border-white/[0.04]'
                }`}
              >
                <Thermometer
                  size={18}
                  className={
                    tempPreference === value ? 'text-db-amber' : 'text-db-text-muted'
                  }
                />
                <span
                  className={`text-xs font-medium ${
                    tempPreference === value ? 'text-db-amber' : 'text-db-text-dim'
                  }`}
                >
                  {label}
                </span>
                <span className="text-[9px] text-db-text-muted">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bedtime / Wake time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-db-text-muted mb-1 uppercase tracking-wider">
              Target Bedtime
            </label>
            <div className="flex items-center gap-2">
              <BedDouble size={14} className="text-db-text-muted" />
              <input
                type="time"
                value={targetBedtime}
                onChange={(e) => setTargetBedtime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm text-db-text bg-db-surface border border-white/[0.06] focus:border-db-teal/40 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-db-text-muted mb-1 uppercase tracking-wider">
              Target Wake Time
            </label>
            <div className="flex items-center gap-2">
              <Sun size={14} className="text-db-text-muted" />
              <input
                type="time"
                value={targetWakeTime}
                onChange={(e) => setTargetWakeTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm text-db-text bg-db-surface border border-white/[0.06] focus:border-db-teal/40 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          About
          ══════════════════════════════════════════════════════════════════════ */}
      <Section title="About">
        <div className="text-center space-y-3">
          <div>
            <p className="text-sm font-semibold text-db-text">DreamBreeze</p>
            <p className="text-xs text-db-text-dim">Version 0.1.0 (Beta)</p>
          </div>
          <p className="text-xs text-db-text-muted italic">
            Built with love for better sleep
          </p>

          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-1.5 text-xs text-db-teal hover:text-db-teal/80 transition-colors"
            >
              <Github size={14} />
              GitHub
            </a>
            <a
              href="/app/privacy"
              className="flex items-center gap-1.5 text-xs text-db-teal hover:text-db-teal/80 transition-colors"
            >
              <Shield size={14} />
              Privacy
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-xs text-db-teal hover:text-db-teal/80 transition-colors"
            >
              <Mail size={14} />
              Contact
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-db-text-muted pt-2 border-t border-white/[0.04]">
            <Database size={10} />
            <span>7 sessions stored, 42 KB total</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
