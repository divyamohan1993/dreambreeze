'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Wind,
  Brain,
  Activity,
  Volume2,
  User,
  Zap,
  Bot,
  Sparkles,
  ThermometerSun,
  BatteryCharging,
  Moon,
  ChevronDown,
  ChevronUp,
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
import PostureSilhouette from '@/components/ui/dashboard/PostureSilhouette';
import LEDStrip from '@/components/ui/dashboard/LEDStrip';
import MetricCard from '@/components/ui/dashboard/MetricCard';
import WeatherCard from '@/components/ui/WeatherCard';
import CognitiveReadinessCard from '@/components/ui/CognitiveReadinessCard';
import SleepDebtCard from '@/components/ui/SleepDebtCard';
import EnergyForecast from '@/components/charts/EnergyForecast';
import TemperatureProfileSelector from '@/components/ui/TemperatureProfileSelector';
import { useWeather } from '@/hooks/use-weather';
import { calculateCognitiveReadiness } from '@/lib/ai/cognitive-readiness';
import { calculateSleepDebt } from '@/lib/ai/sleep-debt';
import { generateEnergyForecast } from '@/lib/ai/agents/energy-agent';
import type { Posture, SleepStage, NoiseType } from '@/types/sleep';
import { POSTURE_LABELS } from '@/lib/constants/posture';

// -- Types ----------------------------------------------------------------------

type SpeedLevel = 0 | 1 | 2 | 3 | 4;
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

// -- Demo Timeline (issue #20) --------------------------------------------------
// A realistic scripted sleep progression instead of random data.
// Each entry represents ~20-40 min of simulated sleep compressed into 5s ticks.

interface DemoEntry {
  posture: Posture;
  stage: SleepStage;
  movement: number;
  fanSpeed: number;
  noise: NoiseType;
  volume: number;
  confidence: number;
  stageMinutes: number;
}

const DEMO_TIMELINE: DemoEntry[] = [
  { posture: 'supine', stage: 'awake', movement: 0.1, fanSpeed: 30, noise: 'rain', volume: 0.55, confidence: 0.94, stageMinutes: 5 },
  { posture: 'supine', stage: 'light', movement: 0.05, fanSpeed: 35, noise: 'rain', volume: 0.50, confidence: 0.91, stageMinutes: 12 },
  { posture: 'right-lateral', stage: 'deep', movement: 0.02, fanSpeed: 25, noise: 'rain', volume: 0.45, confidence: 0.88, stageMinutes: 28 },
  { posture: 'right-lateral', stage: 'deep', movement: 0.01, fanSpeed: 20, noise: 'brown', volume: 0.40, confidence: 0.93, stageMinutes: 42 },
  { posture: 'left-lateral', stage: 'rem', movement: 0.08, fanSpeed: 45, noise: 'brown', volume: 0.42, confidence: 0.86, stageMinutes: 18 },
  { posture: 'fetal', stage: 'light', movement: 0.04, fanSpeed: 30, noise: 'ocean', volume: 0.48, confidence: 0.90, stageMinutes: 15 },
  { posture: 'supine', stage: 'deep', movement: 0.02, fanSpeed: 22, noise: 'ocean', volume: 0.38, confidence: 0.95, stageMinutes: 35 },
  { posture: 'supine', stage: 'rem', movement: 0.06, fanSpeed: 40, noise: 'rain', volume: 0.44, confidence: 0.89, stageMinutes: 22 },
  { posture: 'left-lateral', stage: 'light', movement: 0.03, fanSpeed: 28, noise: 'rain', volume: 0.46, confidence: 0.92, stageMinutes: 10 },
  { posture: 'right-lateral', stage: 'deep', movement: 0.01, fanSpeed: 18, noise: 'pink', volume: 0.36, confidence: 0.96, stageMinutes: 38 },
  { posture: 'supine', stage: 'rem', movement: 0.07, fanSpeed: 42, noise: 'pink', volume: 0.43, confidence: 0.87, stageMinutes: 25 },
  { posture: 'supine', stage: 'light', movement: 0.04, fanSpeed: 32, noise: 'rain', volume: 0.50, confidence: 0.91, stageMinutes: 8 },
];

// -- Constants ------------------------------------------------------------------

const SPEED_LABELS = ['Off', 'Breeze', 'Gentle', 'Strong', 'Turbo'] as const;
const SPEED_PERCENTS = [0, 20, 45, 70, 100] as const;

const STAGE_MAP: Record<SleepStage, { label: string; color: string; value: number }> = {
  awake: { label: 'Awake', color: '#f0a060', value: 3 },
  rem: { label: 'REM', color: '#6e5ea8', value: 2 },
  light: { label: 'Light', color: '#4ecdc4', value: 1 },
  deep: { label: 'Deep', color: '#1a6b66', value: 0 },
};

const NOISE_LABELS: Record<NoiseType, string> = {
  white: 'White Noise',
  pink: 'Pink Noise',
  brown: 'Brown Noise',
  rain: 'Rain',
  ocean: 'Ocean',
  forest: 'Forest',
};

// -- Timeline data generator ----------------------------------------------------

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

// -- Custom Tooltip -------------------------------------------------------------

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

// -- Main Dashboard -------------------------------------------------------------

export default function DashboardPage() {
  const [speedLevel, setSpeedLevel] = useState<SpeedLevel>(2);
  const [fanMode, setFanMode] = useState<FanMode>('auto');
  const [metrics, setMetrics] = useState<LiveMetrics>({
    posture: 'supine',
    postureConfidence: 0.94,
    sleepStage: 'awake',
    stageMinutes: 5,
    fanSpeed: 30,
    fanMode: 'auto',
    noiseType: 'rain',
    volume: 0.55,
    adaptive: true,
  });
  const [timeline] = useState<TimelinePoint[]>(() => generateTimeline());
  const [showDetails, setShowDetails] = useState(false);

  // Demo timeline index -- cycles through the scripted scenario
  const demoIndexRef = useRef(0);

  // -- Weather hook --------------------------------------------------------
  const { weather, loading: weatherLoading, error: weatherError, recommendation: weatherRecommendation, refresh: weatherRefresh } = useWeather();

  // -- Temperature profile state ------------------------------------------
  const [selectedProfileId, setSelectedProfileId] = useState('optimal');

  // -- Agent status animation ---------------------------------------------
  const [latestInsight, setLatestInsight] = useState('Monitoring sleep patterns...');
  useEffect(() => {
    const insights = [
      'Monitoring sleep patterns...',
      'Circadian rhythm aligned',
      'Deep sleep phase optimized',
      'Temperature adjusted for REM',
      'Posture change detected',
      'Sound profile adapted',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % insights.length;
      setLatestInsight(insights[idx]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // -- Cognitive readiness (demo data) ------------------------------------
  const cognitiveReadiness = useMemo(
    () =>
      calculateCognitiveReadiness({
        hoursSlept: 7.5,
        deepSleepPercent: 18,
        remSleepPercent: 22,
        awakenings: 2,
        sleepDebtHours: 3.5,
        sleepOnsetMinutes: 12,
        preSleepCaffeineMg: 80,
        preSleepAlcohol: 0,
        preSleepExercise: 'light',
        consistency: 72,
      }),
    [],
  );

  // -- Sleep debt (demo data) ---------------------------------------------
  const sleepDebt = useMemo(
    () =>
      calculateSleepDebt([
        { date: '2026-02-24', hoursSlept: 7.5, sleepQuality: 78, deepSleepPercent: 18, remSleepPercent: 22 },
        { date: '2026-02-23', hoursSlept: 6.5, sleepQuality: 65, deepSleepPercent: 15, remSleepPercent: 20 },
        { date: '2026-02-22', hoursSlept: 7.0, sleepQuality: 72, deepSleepPercent: 17, remSleepPercent: 21 },
        { date: '2026-02-21', hoursSlept: 6.0, sleepQuality: 60, deepSleepPercent: 14, remSleepPercent: 18 },
        { date: '2026-02-20', hoursSlept: 7.8, sleepQuality: 82, deepSleepPercent: 20, remSleepPercent: 24 },
        { date: '2026-02-19', hoursSlept: 6.2, sleepQuality: 58, deepSleepPercent: 13, remSleepPercent: 19 },
        { date: '2026-02-18', hoursSlept: 7.0, sleepQuality: 70, deepSleepPercent: 16, remSleepPercent: 20 },
        { date: '2026-02-17', hoursSlept: 7.5, sleepQuality: 75, deepSleepPercent: 18, remSleepPercent: 22 },
        { date: '2026-02-16', hoursSlept: 6.8, sleepQuality: 68, deepSleepPercent: 15, remSleepPercent: 21 },
        { date: '2026-02-15', hoursSlept: 7.2, sleepQuality: 74, deepSleepPercent: 17, remSleepPercent: 23 },
        { date: '2026-02-14', hoursSlept: 5.5, sleepQuality: 50, deepSleepPercent: 12, remSleepPercent: 16 },
        { date: '2026-02-13', hoursSlept: 7.0, sleepQuality: 71, deepSleepPercent: 16, remSleepPercent: 20 },
        { date: '2026-02-12', hoursSlept: 6.5, sleepQuality: 64, deepSleepPercent: 14, remSleepPercent: 19 },
        { date: '2026-02-11', hoursSlept: 7.3, sleepQuality: 76, deepSleepPercent: 18, remSleepPercent: 22 },
      ]),
    [],
  );

  // -- Energy forecast (demo: 7.5h slept, 3.5h debt) ---------------------
  const energyForecastData = useMemo(() => generateEnergyForecast(7.5, 3.5), []);

  // -- Scripted demo updates every 5 seconds (issue #20) --------------------
  // Cycles through DEMO_TIMELINE instead of generating random values.
  useEffect(() => {
    const interval = setInterval(() => {
      const entry = DEMO_TIMELINE[demoIndexRef.current];
      demoIndexRef.current = (demoIndexRef.current + 1) % DEMO_TIMELINE.length;

      setMetrics((prev) => ({
        posture: entry.posture,
        postureConfidence: entry.confidence,
        sleepStage: entry.stage,
        stageMinutes: entry.stageMinutes,
        fanSpeed: fanMode === 'manual' ? SPEED_PERCENTS[speedLevel] : entry.fanSpeed,
        fanMode,
        noiseType: entry.noise,
        volume: entry.volume,
        adaptive: prev.adaptive,
      }));
    }, 5000);

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
      {/* -- Header -- */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-db-text">DreamBreeze</h1>
        <p className="text-xs text-db-text-dim mt-0.5">AI Sleep Comfort Control</p>
      </div>

      {/* ======================================================================
          TOP SECTION -- Fan Control
          ====================================================================== */}
      <section className="flex flex-col items-center gap-4">
        {/* Fan visualization */}
        <div className="relative">
          <FanVisualization speed={fanSpeedPercent} size={280} />
          {/* Speed readout overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-live="polite" aria-atomic="true">
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
          role="radiogroup"
          aria-label="Fan mode"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {(['auto', 'manual'] as FanMode[]).map((mode) => (
            <button
              key={mode}
              role="radio"
              aria-checked={fanMode === mode}
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

      {/* ======================================================================
          MIDDLE SECTION -- Live Metrics 2x2 Grid
          ====================================================================== */}
      <section className="grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="false">
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

      {/* ======================================================================
          COLLAPSIBLE DETAIL SECTIONS (issue #10)
          Sections 3-5 are behind a toggle to reduce mobile scroll depth.
          ====================================================================== */}
      <AnimatePresence initial={false}>
        {showDetails && (
          <motion.div
            key="detail-sections"
            className="space-y-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {/* ==============================================================
                SECTION 3 -- AI: Timeline + Agent insights
                ============================================================== */}
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

            {/* AI Agents Status Badge */}
            <motion.div
              className="glass skeu-raised rounded-2xl px-4 py-3 flex items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative flex-shrink-0">
                <Bot size={18} className="text-db-lavender" />
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{ background: '#4ecdc4', boxShadow: '0 0 6px #4ecdc4' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="flex-1 min-w-0" aria-live="polite" aria-atomic="true">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-db-text">AI Agents</span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      background: 'rgba(78,205,196,0.12)',
                      color: '#4ecdc4',
                      border: '1px solid rgba(78,205,196,0.2)',
                    }}
                  >
                    <Sparkles size={9} />
                    4 agents active
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={latestInsight}
                    className="text-[10px] text-db-text-dim mt-0.5 truncate"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                  >
                    {latestInsight}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ==============================================================
                SECTION 4 -- Context: Weather + Readiness
                ============================================================== */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ThermometerSun size={14} className="text-db-text-muted" />
                <span className="text-[11px] font-medium text-db-text-muted uppercase tracking-wider">
                  Local Weather
                </span>
              </div>
              <WeatherCard
                weather={weather}
                loading={weatherLoading}
                error={weatherError}
                recommendation={weatherRecommendation}
                onRefresh={weatherRefresh}
              />
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} className="text-db-text-muted" />
                <span className="text-[11px] font-medium text-db-text-muted uppercase tracking-wider">
                  Today&apos;s Readiness
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <CognitiveReadinessCard
                  score={cognitiveReadiness.score}
                  grade={cognitiveReadiness.grade}
                  label={cognitiveReadiness.label}
                  breakdown={cognitiveReadiness.breakdown}
                  peakHours={cognitiveReadiness.peakHours}
                  advice={cognitiveReadiness.advice}
                />
                <SleepDebtCard
                  totalDebtHours={sleepDebt.totalDebtHours}
                  weeklyDebtHours={sleepDebt.weeklyDebtHours}
                  trend={sleepDebt.trend}
                  recoveryNightsNeeded={sleepDebt.recoveryNightsNeeded}
                  impairmentLevel={sleepDebt.impairmentLevel}
                  impairmentEquivalent={sleepDebt.impairmentEquivalent}
                  recommendations={sleepDebt.recommendations}
                />
              </div>
            </section>

            {/* ==============================================================
                SECTION 5 -- Forecast: Energy + Temperature
                ============================================================== */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BatteryCharging size={14} className="text-db-text-muted" />
                <span className="text-[11px] font-medium text-db-text-muted uppercase tracking-wider">
                  Energy Forecast
                </span>
              </div>
              <EnergyForecast
                data={energyForecastData}
                peakStart={cognitiveReadiness.peakHours.start}
                peakEnd={cognitiveReadiness.peakHours.end}
              />
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Moon size={14} className="text-db-text-muted" />
                <span className="text-[11px] font-medium text-db-text-muted uppercase tracking-wider">
                  Tonight&apos;s Temperature Profile
                </span>
              </div>
              <div className="glass skeu-raised p-4 rounded-2xl">
                <TemperatureProfileSelector
                  selectedId={selectedProfileId}
                  onSelect={setSelectedProfileId}
                />
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -- Show more / Show less toggle (issue #10) -- */}
      <button
        onClick={() => setShowDetails((prev) => !prev)}
        aria-expanded={showDetails}
        aria-label={showDetails ? 'Show less details' : 'Show more details'}
        className="w-full glass skeu-raised rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium text-db-text-dim hover:text-db-text transition-colors duration-300"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {showDetails ? (
          <>
            <ChevronUp size={16} />
            Show less
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            More details
          </>
        )}
      </button>
    </div>
  );
}
