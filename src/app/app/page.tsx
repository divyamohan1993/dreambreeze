'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wind,
  Brain,
  Activity,
  Volume2,
  User,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import FanVisualization from '@/components/fan/FanVisualization';
import SpeedKnob from '@/components/fan/SpeedKnob';

// ── Types ──────────────────────────────────────────────────────────────────────

type Posture = 'supine' | 'prone' | 'left-lateral' | 'right-lateral' | 'fetal';
type SleepStage = 'awake' | 'light' | 'deep' | 'rem';
type SpeedLevel = 0 | 1 | 2 | 3 | 4;
type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'ocean' | 'forest';
type FanMode = 'auto' | 'manual';

interface LiveMetrics {
  posture: Posture;
  postureConfidence: number;
  sleepStage: SleepStage;
  stageMinutes: number;
  fanSpeed: number;
  fanMode: FanMode;
  noiseType: NoiseType;
  volume: number;
  adaptive: boolean;
}

interface TimelinePoint {
  time: string;
  stage: number;
  label: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const POSTURES: Posture[] = ['supine', 'prone', 'left-lateral', 'right-lateral', 'fetal'];
const STAGES: SleepStage[] = ['awake', 'light', 'deep', 'rem'];
const NOISE_TYPES: NoiseType[] = ['white', 'pink', 'brown', 'rain', 'ocean', 'forest'];
const SPEED_LABELS = ['Off', 'Breeze', 'Gentle', 'Strong', 'Turbo'] as const;
const SPEED_PERCENTS = [0, 20, 45, 70, 100] as const;

const STAGE_MAP: Record<SleepStage, { label: string; color: string; value: number }> = {
  awake: { label: 'Awake', color: '#f0a060', value: 3 },
  rem: { label: 'REM', color: '#6e5ea8', value: 2 },
  light: { label: 'Light', color: '#4ecdc4', value: 1 },
  deep: { label: 'Deep', color: '#1a6b66', value: 0 },
};

const POSTURE_LABELS: Record<Posture, string> = {
  supine: 'Back',
  prone: 'Stomach',
  'left-lateral': 'Left Side',
  'right-lateral': 'Right Side',
  fetal: 'Fetal',
};

const NOISE_LABELS: Record<NoiseType, string> = {
  white: 'White Noise',
  pink: 'Pink Noise',
  brown: 'Brown Noise',
  rain: 'Rain',
  ocean: 'Ocean',
  forest: 'Forest',
};

// ── Posture SVG ────────────────────────────────────────────────────────────────

function PostureSilhouette({ posture, className = '' }: { posture: Posture; className?: string }) {
  const paths: Record<Posture, string> = {
    supine:
      'M20 8a4 4 0 108 0 4 4 0 00-8 0zM18 16h12v2H18zM16 20h16l-2 16H18z',
    prone:
      'M20 8a4 4 0 108 0 4 4 0 00-8 0zM16 15h16v3H16zM18 20h12l-1 16H19z',
    'left-lateral':
      'M22 6a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0zM20 13c0-1 2-2 4-2s3 1 3 2l1 8c0 1-1 2-2 2h-5c-1 0-2-1-2-2zM19 25l3 11h-4l-1-11z',
    'right-lateral':
      'M19 6a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0zM17 13c0-1 2-2 4-2s3 1 3 2l1 8c0 1-1 2-2 2h-5c-1 0-2-1-2-2zM28 25l-3 11h4l1-11z',
    fetal:
      'M22 6a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0zM18 12c0-1 3-2 5-1l4 5c1 1 0 3-1 3l-6 2c-1 0-2 0-3-1l-1-6c0-1 1-2 2-2z',
  };

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={paths[posture]} fillRule="evenodd" />
    </svg>
  );
}

// ── Timeline data generator ────────────────────────────────────────────────────

function generateTimeline(): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  const now = new Date();
  const stageSequence: SleepStage[] = [
    'awake', 'light', 'light', 'deep', 'deep', 'deep',
    'light', 'rem', 'rem', 'light', 'deep', 'deep',
    'light', 'rem', 'light', 'light', 'awake', 'light',
    'deep', 'deep', 'rem', 'rem', 'light', 'light',
  ];

  for (let i = 0; i < stageSequence.length; i++) {
    const t = new Date(now.getTime() - (stageSequence.length - i) * 15 * 60 * 1000);
    const stage = stageSequence[i];
    points.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stage: STAGE_MAP[stage].value,
      label: STAGE_MAP[stage].label,
    });
  }
  return points;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function TimelineTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  const stageVal = payload[0].value;
  const stageEntry = Object.values(STAGE_MAP).find((s) => s.value === stageVal);
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="text-db-text-dim">{label}</p>
      <p style={{ color: stageEntry?.color }} className="font-semibold">
        {stageEntry?.label}
      </p>
    </div>
  );
}

// ── LED Strip ──────────────────────────────────────────────────────────────────

function LEDStrip({ level }: { level: SpeedLevel }) {
  const colors = ['#4ecdc4', '#4ecdc4', '#f0a060', '#e94560', '#e94560'];
  return (
    <div className="flex items-center gap-2 justify-center">
      {colors.map((color, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-all duration-500"
          style={{
            background: i < level ? color : '#1a1f3d',
            boxShadow:
              i < level
                ? `0 0 6px ${color}, 0 0 12px ${color}40`
                : 'inset 0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      ))}
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="glass skeu-raised p-4 rounded-2xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-db-text-muted" />
        <span className="text-[11px] font-medium text-db-text-muted uppercase tracking-wider">
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [speedLevel, setSpeedLevel] = useState<SpeedLevel>(2);
  const [fanMode, setFanMode] = useState<FanMode>('auto');
  const [metrics, setMetrics] = useState<LiveMetrics>({
    posture: 'supine',
    postureConfidence: 0.92,
    sleepStage: 'light',
    stageMinutes: 23,
    fanSpeed: 45,
    fanMode: 'auto',
    noiseType: 'rain',
    volume: 0.6,
    adaptive: true,
  });
  const [timeline] = useState<TimelinePoint[]>(() => generateTimeline());

  // ── Simulated live updates every 3 seconds ───────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const newPosture = POSTURES[Math.floor(Math.random() * POSTURES.length)];
        const newStage = STAGES[Math.floor(Math.random() * STAGES.length)];
        const newNoise = NOISE_TYPES[Math.floor(Math.random() * NOISE_TYPES.length)];
        return {
          posture: Math.random() > 0.6 ? newPosture : prev.posture,
          postureConfidence: +(0.75 + Math.random() * 0.24).toFixed(2),
          sleepStage: Math.random() > 0.65 ? newStage : prev.sleepStage,
          stageMinutes: Math.random() > 0.5 ? Math.floor(Math.random() * 45) + 5 : prev.stageMinutes + 1,
          fanSpeed: SPEED_PERCENTS[speedLevel] + Math.floor(Math.random() * 10 - 5),
          fanMode,
          noiseType: Math.random() > 0.85 ? newNoise : prev.noiseType,
          volume: +(0.3 + Math.random() * 0.5).toFixed(2),
          adaptive: prev.adaptive,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [speedLevel, fanMode]);

  const handleSpeedChange = useCallback(
    (level: number) => {
      setSpeedLevel(level as SpeedLevel);
      if (fanMode === 'auto') setFanMode('manual');
    },
    [fanMode]
  );

  const fanSpeedPercent = useMemo(() => SPEED_PERCENTS[speedLevel], [speedLevel]);

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-db-text">DreamBreeze</h1>
        <p className="text-xs text-db-text-dim mt-0.5">AI Sleep Comfort Control</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TOP SECTION — Fan Control
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col items-center gap-4">
        {/* Fan visualization */}
        <div className="relative">
          <FanVisualization speed={fanSpeedPercent} size={280} />
          {/* Speed readout overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center mt-56">
              <AnimatePresence mode="wait">
                <motion.span
                  key={SPEED_LABELS[speedLevel]}
                  className="block text-lg font-bold text-db-teal"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {SPEED_LABELS[speedLevel]}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs text-db-text-dim">{fanSpeedPercent}%</span>
            </div>
          </div>
        </div>

        {/* Speed Knob */}
        <div className="flex flex-col items-center gap-3">
          <SpeedKnob
            value={speedLevel}
            onChange={handleSpeedChange}
            size={180}
            disabled={fanMode === 'auto'}
          />
        </div>

        {/* Mode toggle: Auto | Manual */}
        <div
          className="glass rounded-full p-1 flex items-center gap-0"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {(['auto', 'manual'] as FanMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFanMode(mode)}
              className={`relative px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                fanMode === mode
                  ? 'text-db-navy'
                  : 'text-db-text-muted hover:text-db-text-dim'
              }`}
            >
              {fanMode === mode && (
                <motion.div
                  layoutId="mode-pill"
                  className="absolute inset-0 bg-db-teal rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 capitalize">{mode}</span>
            </button>
          ))}
        </div>

        {/* LED strip */}
        <LEDStrip level={speedLevel} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MIDDLE SECTION — Live Metrics 2x2 Grid
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 gap-3">
        {/* Current Posture */}
        <MetricCard icon={User} title="Posture">
          <div className="flex items-center gap-3">
            <PostureSilhouette
              posture={metrics.posture}
              className="w-10 h-10 text-db-teal"
            />
            <div>
              <p className="text-sm font-semibold text-db-text">
                {POSTURE_LABELS[metrics.posture]}
              </p>
              <p className="text-[10px] text-db-text-dim">
                {Math.round(metrics.postureConfidence * 100)}% confidence
              </p>
            </div>
          </div>
        </MetricCard>

        {/* Sleep Stage */}
        <MetricCard icon={Brain} title="Sleep Stage">
          <div className="flex items-center gap-2">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: STAGE_MAP[metrics.sleepStage].color + '25',
                color: STAGE_MAP[metrics.sleepStage].color,
                border: `1px solid ${STAGE_MAP[metrics.sleepStage].color}40`,
              }}
            >
              {STAGE_MAP[metrics.sleepStage].label}
            </span>
          </div>
          <p className="text-[10px] text-db-text-dim mt-1">
            {metrics.stageMinutes}m in stage
          </p>
        </MetricCard>

        {/* Fan Speed */}
        <MetricCard icon={Wind} title="Fan Speed">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-db-teal">
              {Math.max(0, Math.min(100, metrics.fanSpeed))}
              <span className="text-sm font-normal text-db-text-dim">%</span>
            </span>
          </div>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
            style={{
              backgroundColor: metrics.fanMode === 'auto' ? '#4ecdc420' : '#6e5ea820',
              color: metrics.fanMode === 'auto' ? '#4ecdc4' : '#6e5ea8',
            }}
          >
            {metrics.fanMode}
          </span>
        </MetricCard>

        {/* Sound */}
        <MetricCard icon={Volume2} title="Sound">
          <p className="text-sm font-semibold text-db-text">
            {NOISE_LABELS[metrics.noiseType]}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-db-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-db-lavender rounded-full"
                animate={{ width: `${metrics.volume * 100}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <span className="text-[10px] text-db-text-dim">
              {Math.round(metrics.volume * 100)}%
            </span>
          </div>
          {metrics.adaptive && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-db-amber">
              <Zap size={10} />
              Adaptive
            </span>
          )}
        </MetricCard>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM SECTION — Tonight's Timeline
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="glass skeu-raised p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-db-text-muted" />
          <span className="text-[11px] font-medium text-db-text-muted uppercase tracking-wider">
            Tonight&apos;s Timeline
          </span>
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="stageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#6e5ea8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#0a0e27" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: '#555577', fontSize: 10 }}
                axisLine={{ stroke: '#1a1f3d' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 3]}
                ticks={[0, 1, 2, 3]}
                tickFormatter={(v: number) =>
                  ['Deep', 'Light', 'REM', 'Awake'][v] || ''
                }
                tick={{ fill: '#555577', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip content={<TimelineTooltip />} />
              <Area
                type="stepAfter"
                dataKey="stage"
                stroke="#4ecdc4"
                strokeWidth={2}
                fill="url(#stageGradient)"
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stage legend */}
        <div className="flex items-center justify-center gap-4 mt-2">
          {Object.entries(STAGE_MAP).map(([, { label, color }]) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-db-text-dim">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
