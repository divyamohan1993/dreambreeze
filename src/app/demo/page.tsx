'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  Moon,
  Sun,
  Brain,
  Volume2,
  Smartphone,
  Activity,
  Thermometer,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock,
  BedDouble,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO TIMELINE
   60-second scripted simulation of a full night's sleep
   ═══════════════════════════════════════════════════════════════════════════ */

interface TimelineFrame {
  timeRange: [number, number]; // seconds
  stage: string;
  stageColor: string;
  posture: string;
  fanSpeed: number;
  soundType: string;
  soundVol: number;
  heartRate: number;
  breathRate: number;
  temp: number;
  event: string;
  eventIcon: React.ElementType;
}

const TIMELINE: TimelineFrame[] = [
  {
    timeRange: [0, 10],
    stage: 'Calibrating',
    stageColor: 'text-db-amber',
    posture: 'Detecting...',
    fanSpeed: 0,
    soundType: 'Silent',
    soundVol: 0,
    heartRate: 72,
    breathRate: 16,
    temp: 24.5,
    event: 'Phone placed on bed. Calibrating sensors...',
    eventIcon: Smartphone,
  },
  {
    timeRange: [10, 20],
    stage: 'Light Sleep',
    stageColor: 'text-db-teal',
    posture: 'Supine',
    fanSpeed: 30,
    soundType: 'White Noise',
    soundVol: 40,
    heartRate: 65,
    breathRate: 14,
    temp: 24.0,
    event: 'Transitioning to light sleep. Fan at low, white noise starting.',
    eventIcon: Moon,
  },
  {
    timeRange: [20, 30],
    stage: 'Deep Sleep',
    stageColor: 'text-db-lavender',
    posture: 'Supine',
    fanSpeed: 20,
    soundType: 'Brown Noise',
    soundVol: 50,
    heartRate: 55,
    breathRate: 12,
    temp: 23.5,
    event: 'Entering deep sleep. Fan decreases, noise shifts to brown.',
    eventIcon: Brain,
  },
  {
    timeRange: [30, 40],
    stage: 'REM Sleep',
    stageColor: 'text-db-rose',
    posture: 'Supine',
    fanSpeed: 55,
    soundType: 'Pink Noise',
    soundVol: 35,
    heartRate: 70,
    breathRate: 15,
    temp: 25.0,
    event: 'REM detected! Body can\'t thermoregulate. Fan increases.',
    eventIcon: Activity,
  },
  {
    timeRange: [40, 50],
    stage: 'REM Sleep',
    stageColor: 'text-db-rose',
    posture: 'Lateral (Left)',
    fanSpeed: 45,
    soundType: 'Pink Noise',
    soundVol: 30,
    heartRate: 68,
    breathRate: 14,
    temp: 24.5,
    event: 'Posture change: supine to lateral. Fan adjusts angle.',
    eventIcon: BedDouble,
  },
  {
    timeRange: [50, 55],
    stage: 'Light Sleep',
    stageColor: 'text-db-teal',
    posture: 'Lateral (Left)',
    fanSpeed: 15,
    soundType: 'Gentle Rain',
    soundVol: 20,
    heartRate: 62,
    breathRate: 13,
    temp: 23.8,
    event: 'Approaching wake time. Gentle breeze, sound fading.',
    eventIcon: Sun,
  },
  {
    timeRange: [55, 60],
    stage: 'Awake',
    stageColor: 'text-db-amber',
    posture: 'Supine',
    fanSpeed: 10,
    soundType: 'Birdsong',
    soundVol: 10,
    heartRate: 70,
    breathRate: 16,
    temp: 24.2,
    event: 'Good morning! Your sleep score is ready.',
    eventIcon: Sun,
  },
];

function getFrame(seconds: number): TimelineFrame {
  for (const frame of TIMELINE) {
    if (seconds >= frame.timeRange[0] && seconds < frame.timeRange[1]) {
      return frame;
    }
  }
  return TIMELINE[TIMELINE.length - 1];
}

/* ───────────────────────── Animated fan visual ────────────────────────── */
function DemoFan({ speed }: { speed: number }) {
  const duration = speed > 0 ? Math.max(0.5, 10 / (speed / 10)) : 0;
  return (
    <div className="relative h-28 w-28">
      <div
        className="absolute inset-0"
        style={{
          animation: speed > 0 ? `demo-fan-spin ${duration}s linear infinite` : 'none',
        }}
      >
        {[0, 72, 144, 216, 288].map((angle) => (
          <div
            key={angle}
            className="absolute"
            style={{
              width: 22,
              height: 48,
              left: '50%',
              top: '50%',
              transformOrigin: '50% 0%',
              transform: `translateX(-50%) rotate(${angle}deg)`,
              background: `linear-gradient(180deg, rgba(78,205,196,${0.1 + speed / 200}) 0%, rgba(78,205,196,0.03) 100%)`,
              borderRadius: '50% 50% 40% 40%',
              border: '1px solid rgba(78,205,196,0.15)',
            }}
          />
        ))}
        <div
          className="absolute rounded-full border border-white/10 bg-db-surface"
          style={{
            width: 14,
            height: 14,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        />
      </div>
      {/* Glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: 80,
          height: 80,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, rgba(78,205,196,${speed / 400}) 0%, transparent 70%)`,
          filter: 'blur(10px)',
        }}
      />
      <style>{`
        @keyframes demo-fan-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ───────────────────────── Sound wave viz ─────────────────────────────── */
function SoundWave({ volume, type }: { volume: number; type: string }) {
  return (
    <div className="flex h-8 items-end gap-0.5">
      {Array.from({ length: 16 }).map((_, i) => {
        const base = volume / 100;
        const height = Math.max(
          4,
          base * 32 * (0.3 + 0.7 * Math.sin((i / 16) * Math.PI)) * (0.6 + 0.4 * Math.random()),
        );
        return (
          <div
            key={i}
            className="w-1 rounded-full bg-db-lavender/60 transition-all duration-500"
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}

/* ───────────────────────── Sleep score card ────────────────────────────── */
function SleepScoreCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass skeu-raised mx-auto w-full max-w-sm overflow-hidden"
    >
      <div className="border-b border-white/5 px-5 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-db-teal">
          Morning Briefing
        </p>
      </div>
      <div className="p-6">
        {/* Score ring */}
        <div className="mb-4 flex justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - 0.87) }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4ecdc4" />
                  <stop offset="100%" stopColor="#6e5ea8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-3xl font-extrabold text-db-text"
              >
                87
              </motion.span>
              <p className="text-xs text-db-text-dim">/ 100</p>
            </div>
          </div>
        </div>

        <h3 className="mb-3 text-center text-lg font-bold text-db-text">Great Sleep!</h3>

        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          {[
            { label: 'Deep Sleep', value: '1h 42m', color: 'text-db-lavender' },
            { label: 'REM Sleep', value: '1h 15m', color: 'text-db-rose' },
            { label: 'Fan Adjustments', value: '43', color: 'text-db-teal' },
            { label: 'Posture Changes', value: '12', color: 'text-db-amber' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/5 p-2.5">
              <span className={`block text-lg font-bold ${s.color}`}>{s.value}</span>
              <span className="text-db-text-dim">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DemoPage() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TOTAL = 60;

  const start = useCallback(() => {
    if (finished) {
      setElapsed(0);
      setFinished(false);
    }
    setPlaying(true);
  }, [finished]);

  const pause = useCallback(() => setPlaying(false), []);

  const reset = useCallback(() => {
    setPlaying(false);
    setElapsed(0);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= TOTAL) {
            setPlaying(false);
            setFinished(true);
            return TOTAL;
          }
          return prev + 0.25;
        });
      }, 250);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  const frame = getFrame(elapsed);
  const progress = (elapsed / TOTAL) * 100;
  const showScore = elapsed >= 56;

  // Build the timeline marker positions for visual reference
  const timelineMarkers = TIMELINE.map((f) => ({
    left: (f.timeRange[0] / TOTAL) * 100,
    width: ((f.timeRange[1] - f.timeRange[0]) / TOTAL) * 100,
    stage: f.stage,
    color: f.stageColor,
  }));

  return (
    <div className="min-h-screen bg-db-navy texture-fabric">
      {/* Top banner */}
      <div className="fixed top-0 z-50 w-full border-b border-db-teal/20 bg-db-teal/5 backdrop-blur-xl">
        <div className="mx-auto flex h-10 max-w-5xl items-center justify-center gap-2 px-4 text-xs text-db-teal">
          <Eye size={12} />
          This is a 60-second simulation of a full night&rsquo;s sleep
        </div>
      </div>

      {/* Progress bar */}
      <div className="fixed top-10 z-40 w-full">
        <div className="h-1 w-full bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-db-teal to-db-lavender"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>

      {/* Nav */}
      <div className="fixed top-12 z-30 w-full">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-db-text-dim transition hover:text-db-teal">
            <Wind size={16} className="text-db-teal" />
            DreamBreeze Demo
          </Link>
          <div className="flex items-center gap-2 text-xs text-db-text-dim">
            <Clock size={12} />
            {Math.floor(elapsed)}s / {TOTAL}s
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 pb-32 pt-32">
        {/* Controls */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {!playing ? (
            <button
              onClick={start}
              className="group flex items-center gap-2 rounded-full bg-db-teal px-6 py-3 text-sm font-semibold text-db-navy transition hover:shadow-[0_0_24px_rgba(78,205,196,0.3)]"
            >
              <Play size={16} fill="currentColor" />
              {elapsed > 0 && !finished ? 'Resume' : finished ? 'Replay' : 'Start Simulation'}
            </button>
          ) : (
            <button
              onClick={pause}
              className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-db-text transition hover:bg-white/15"
            >
              <Pause size={16} />
              Pause
            </button>
          )}
          {elapsed > 0 && (
            <button
              onClick={reset}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-db-text-dim transition hover:bg-white/10 hover:text-db-text"
              aria-label="Reset"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        {/* Timeline bar (visual stage markers) */}
        <div className="mb-10 overflow-hidden rounded-full">
          <div className="relative flex h-6">
            {timelineMarkers.map((m, i) => {
              const stageColorMap: Record<string, string> = {
                'text-db-amber': 'bg-db-amber/30',
                'text-db-teal': 'bg-db-teal/30',
                'text-db-lavender': 'bg-db-lavender/30',
                'text-db-rose': 'bg-db-rose/30',
              };
              return (
                <div
                  key={i}
                  className={`relative flex items-center justify-center text-[10px] font-medium text-white/60 ${stageColorMap[m.color] || 'bg-white/5'}`}
                  style={{ width: `${m.width}%` }}
                >
                  <span className="hidden md:inline">{m.stage}</span>
                </div>
              );
            })}
            {/* Playhead */}
            <div
              className="absolute top-0 h-full w-0.5 bg-white/80 transition-all duration-200"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        {/* Event banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={frame.event}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mb-8 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-5 py-3"
          >
            <frame.eventIcon size={18} className={frame.stageColor} />
            <p className="text-sm text-db-text-dim">{frame.event}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dashboard grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Left column — Sleep Stage & Posture */}
          <div className="space-y-4">
            {/* Sleep stage */}
            <div className="glass skeu-raised p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                <Brain size={12} />
                Sleep Stage
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={frame.stage}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`text-2xl font-bold ${frame.stageColor}`}
                >
                  {frame.stage}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Posture */}
            <div className="glass skeu-raised p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                <BedDouble size={12} />
                Posture
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={frame.posture}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-xl font-bold text-db-text"
                >
                  {frame.posture}
                </motion.div>
              </AnimatePresence>
              {/* Body icon placeholder */}
              <div className="mt-3 flex justify-center">
                <div className="relative h-16 w-32 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <span className="text-xs text-db-text-muted">
                    {frame.posture === 'Detecting...'
                      ? '...'
                      : frame.posture.includes('Lateral')
                        ? '[ /\\ ]'
                        : '[ -- ]'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vitals */}
            <div className="glass skeu-raised p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                <Activity size={12} />
                Vitals
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-db-text-dim">Heart Rate</div>
                  <span className="text-lg font-bold text-db-rose">{frame.heartRate}</span>
                  <span className="ml-1 text-xs text-db-text-dim">bpm</span>
                </div>
                <div>
                  <div className="text-xs text-db-text-dim">Breath Rate</div>
                  <span className="text-lg font-bold text-db-teal">{frame.breathRate}</span>
                  <span className="ml-1 text-xs text-db-text-dim">/min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center column — Fan & Sound */}
          <div className="space-y-4">
            {/* Fan */}
            <div className="glass skeu-raised flex flex-col items-center p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                <Wind size={12} />
                Fan Speed
              </div>
              <DemoFan speed={frame.fanSpeed} />
              <div className="mt-3 w-full">
                <div className="mb-1 flex justify-between text-xs text-db-text-dim">
                  <span>0%</span>
                  <span className="font-bold text-db-teal">{frame.fanSpeed}%</span>
                  <span>100%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-db-teal/60 to-db-teal"
                    animate={{ width: `${frame.fanSpeed}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Sound */}
            <div className="glass skeu-raised p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                <Volume2 size={12} />
                Soundscape
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={frame.soundType}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-2 text-lg font-bold text-db-lavender"
                >
                  {frame.soundType}
                </motion.div>
              </AnimatePresence>
              <SoundWave volume={frame.soundVol} type={frame.soundType} />
              <div className="mt-2 flex justify-between text-xs text-db-text-dim">
                <span>Volume</span>
                <span className="font-bold text-db-lavender">{frame.soundVol}%</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="glass skeu-raised p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                <Thermometer size={12} />
                Room Temp
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-db-amber">{frame.temp.toFixed(1)}</span>
                <span className="text-sm text-db-text-dim">&deg;C</span>
              </div>
            </div>
          </div>

          {/* Right column — Event log or Sleep score */}
          <div className="space-y-4">
            {showScore ? (
              <SleepScoreCard />
            ) : (
              <>
                {/* Event log */}
                <div className="glass skeu-raised p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                    <Zap size={12} />
                    AI Activity Log
                  </div>
                  <div className="space-y-2 text-xs">
                    {TIMELINE.filter(
                      (f) => f.timeRange[0] <= elapsed,
                    ).map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2 border-l-2 border-white/10 py-1 pl-3"
                      >
                        <span className="shrink-0 text-db-text-muted">
                          {f.timeRange[0]}s
                        </span>
                        <span className="text-db-text-dim">{f.event}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="glass skeu-raised p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-db-text-dim">
                    <TrendingUp size={12} />
                    Session Stats
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-white/5 p-2">
                      <span className="block text-lg font-bold text-db-teal">
                        {Math.floor(elapsed)}s
                      </span>
                      <span className="text-[10px] text-db-text-dim">Elapsed</span>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2">
                      <span className="block text-lg font-bold text-db-amber">
                        {TIMELINE.filter((f) => f.timeRange[0] <= elapsed).length}
                      </span>
                      <span className="text-[10px] text-db-text-dim">Adjustments</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CTA at end */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <h3 className="mb-3 text-2xl font-bold text-db-text">
                That was one night, compressed into 60 seconds.
              </h3>
              <p className="mb-6 text-db-text-dim">
                Imagine this running every night, learning your patterns, and making you sleep
                better.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/app"
                  className="group inline-flex items-center gap-2 rounded-full bg-db-teal px-8 py-3.5 text-base font-semibold text-db-navy transition-all hover:shadow-[0_0_32px_rgba(78,205,196,0.3)]"
                >
                  Try It For Real
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/pitch"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-3.5 text-base font-semibold text-db-text transition-all hover:border-db-teal/30 hover:bg-white/5"
                >
                  View Pitch Deck
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
