'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Wind, Volume2, StopCircle, Loader2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Posture = 'supine' | 'prone' | 'left-lateral' | 'right-lateral' | 'fetal';
type SleepStage = 'awake' | 'light' | 'deep' | 'rem';
type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'ocean' | 'forest';

type SessionPhase = 'idle' | 'calibrating' | 'active';

// ── Constants ──────────────────────────────────────────────────────────────────

const POSTURES: Posture[] = ['supine', 'prone', 'left-lateral', 'right-lateral', 'fetal'];
const STAGES: SleepStage[] = ['awake', 'light', 'deep', 'rem'];
const NOISE_TYPES: NoiseType[] = ['white', 'pink', 'brown', 'rain', 'ocean', 'forest'];

const POSTURE_ICONS: Record<Posture, string> = {
  supine: '\u{1F6CC}',
  prone: '\u{1F9D8}',
  'left-lateral': '\u{2B05}',
  'right-lateral': '\u{27A1}',
  fetal: '\u{1F476}',
};

const POSTURE_LABELS: Record<Posture, string> = {
  supine: 'Back',
  prone: 'Stomach',
  'left-lateral': 'Left Side',
  'right-lateral': 'Right Side',
  fetal: 'Fetal',
};

const NOISE_ICONS: Record<NoiseType, string> = {
  white: 'W',
  pink: 'P',
  brown: 'B',
  rain: 'R',
  ocean: 'O',
  forest: 'F',
};

// ── Posture Icon (SVG) ─────────────────────────────────────────────────────────

function PostureIcon({ posture }: { posture: Posture }) {
  const svgPaths: Record<Posture, string> = {
    supine: 'M12 4a3 3 0 100 6 3 3 0 000-6zm-4 8h8v1H8zm-1 2h10l-1.5 9h-7z',
    prone: 'M12 4a3 3 0 100 6 3 3 0 000-6zm-4 8h8v2H8zm-1 3h10l-.5 7h-9z',
    'left-lateral': 'M13 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-2 6c0-.8 1.5-1.5 3-1.5s2 .7 2 1.5l.5 6H10.5zm-1 7l2 8h-3z',
    'right-lateral': 'M11 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-1 6c0-.8 1.5-1.5 3-1.5s2 .7 2 1.5l.5 6H9.5zm6 7l-2 8h3z',
    fetal: 'M13 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-3 7c0-.8 2-1.5 3.5-1l3 3.5c.5.7 0 2-.7 2l-4.5 1.5c-.8 0-1.5-.3-2-.8z',
  };

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-db-teal/40" fill="currentColor">
      <path d={svgPaths[posture]} />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SleepPage() {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Simulated live data
  const [posture, setPosture] = useState<Posture>('supine');
  const [stage, setStage] = useState<SleepStage>('awake');
  const [speedLevel, setSpeedLevel] = useState(2);
  const [noiseType, setNoiseType] = useState<NoiseType>('rain');

  // Long-press state for stop button
  const [stopProgress, setStopProgress] = useState(0);
  const stopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockSupported, setWakeLockSupported] = useState(true);

  // ── Clock tick ───────────────────────────────────────────────────────────
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // ── Elapsed timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active' || !sessionStart) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, sessionStart]);

  // ── Simulated data cycling (every 15 seconds) ───────────────────────────
  useEffect(() => {
    if (phase !== 'active') return;
    const interval = setInterval(() => {
      setPosture(POSTURES[Math.floor(Math.random() * POSTURES.length)]);
      setStage(STAGES[Math.floor(Math.random() * STAGES.length)]);
      setSpeedLevel(Math.floor(Math.random() * 5));
      setNoiseType(NOISE_TYPES[Math.floor(Math.random() * NOISE_TYPES.length)]);
    }, 15000);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Wake Lock ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active') return;

    async function acquireWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        } else {
          setWakeLockSupported(false);
        }
      } catch {
        setWakeLockSupported(false);
      }
    }

    acquireWakeLock();

    // Re-acquire on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && phase === 'active') {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [phase]);

  // ── Start session ────────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    setPhase('calibrating');
    // Show calibration for 4 seconds, then go active
    setTimeout(() => {
      setSessionStart(Date.now());
      setElapsed(0);
      setPhase('active');
    }, 4000);
  }, []);

  // ── Stop session long-press handlers ─────────────────────────────────────
  const startStopHold = useCallback(() => {
    setStopProgress(0);
    let progress = 0;
    stopTimerRef.current = setInterval(() => {
      progress += 100 / 30; // 3 seconds = 30 ticks at 100ms
      setStopProgress(Math.min(progress, 100));
      if (progress >= 100) {
        if (stopTimerRef.current) clearInterval(stopTimerRef.current);
        setPhase('idle');
        setSessionStart(null);
        setElapsed(0);
        setStopProgress(0);
      }
    }, 100);
  }, []);

  const cancelStopHold = useCallback(() => {
    if (stopTimerRef.current) clearInterval(stopTimerRef.current);
    setStopProgress(0);
  }, []);

  // ── Formatting ───────────────────────────────────────────────────────────
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  // ── Idle state — Start button ────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-6">
        <Moon size={48} className="text-db-teal/30 mb-6" />
        <h1 className="text-2xl font-bold text-db-text mb-2">Ready to Sleep</h1>
        <p className="text-sm text-db-text-dim text-center mb-8 max-w-xs">
          Place your phone on the bed, then tap to begin tracking your sleep posture and
          controlling your fan.
        </p>
        <motion.button
          onClick={startSession}
          className="relative px-8 py-4 rounded-2xl bg-db-teal text-db-navy font-bold text-lg skeu-raised"
          whileTap={{ scale: 0.97 }}
          style={{
            boxShadow:
              '0 0 20px rgba(78, 205, 196, 0.3), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          Start Sleep Tracking
        </motion.button>
      </div>
    );
  }

  // ── Calibrating state ────────────────────────────────────────────────────
  if (phase === 'calibrating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={56} className="text-db-teal" />
          </motion.div>
          <h2 className="text-xl font-bold text-db-text mt-6 mb-2">Calibrating...</h2>
          <p className="text-sm text-db-text-dim text-center max-w-xs">
            Place phone flat on your bed. We are calibrating the sensors to detect your sleep
            posture.
          </p>

          {/* Progress dots */}
          <div className="flex gap-2 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-db-teal"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active session — Bedside display ─────────────────────────────────────
  return (
    <div
      className="flex flex-col items-center justify-between min-h-[calc(100vh-6rem)] px-6 py-8"
      style={{ opacity: 0.85 }}
    >
      {/* Wake lock warning */}
      {!wakeLockSupported && (
        <div className="absolute top-4 left-4 right-4 glass rounded-lg px-3 py-2 text-[10px] text-db-amber text-center">
          Screen may turn off. Your browser does not support Wake Lock.
        </div>
      )}

      {/* Session Active breathing pulse */}
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-db-teal"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-[11px] text-db-text-muted uppercase tracking-widest font-medium">
          Session Active
        </span>
      </div>

      {/* ── Large clock ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <p
            className="text-7xl font-light tracking-wider text-db-text/50 font-mono tabular-nums"
            style={{ textShadow: '0 0 30px rgba(78, 205, 196, 0.08)' }}
          >
            {formatTime(currentTime)}
          </p>
        </motion.div>

        {/* Elapsed */}
        <div className="text-center">
          <p className="text-xs text-db-text-muted uppercase tracking-wider mb-1">Elapsed</p>
          <p className="text-lg font-mono text-db-text/40 tabular-nums">
            {formatElapsed(elapsed)}
          </p>
        </div>

        {/* ── Posture (dim) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={posture}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
          >
            <PostureIcon posture={posture} />
            <span className="text-[10px] text-db-text-muted">{POSTURE_LABELS[posture]}</span>
          </motion.div>
        </AnimatePresence>

        {/* ── Fan speed dots ── */}
        <div className="flex items-center gap-3">
          <Wind size={12} className="text-db-text-muted/40" />
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-700"
                style={{
                  background: i < speedLevel ? '#4ecdc4' : '#151a35',
                  boxShadow: i < speedLevel ? '0 0 4px rgba(78,205,196,0.5)' : 'none',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Sound type ── */}
        <div className="flex items-center gap-2 opacity-40">
          <Volume2 size={12} className="text-db-lavender" />
          <motion.span
            key={noiseType}
            className="text-[10px] text-db-text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {NOISE_ICONS[noiseType]} {noiseType}
          </motion.span>
        </div>
      </div>

      {/* ── Stop Tracking (long-press 3s) ── */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="relative">
          <motion.button
            onPointerDown={startStopHold}
            onPointerUp={cancelStopHold}
            onPointerLeave={cancelStopHold}
            onPointerCancel={cancelStopHold}
            className="relative flex items-center gap-2 px-6 py-3 rounded-2xl text-db-rose/60 text-sm font-medium overflow-hidden"
            style={{
              background: 'rgba(233, 69, 96, 0.08)',
              border: '1px solid rgba(233, 69, 96, 0.15)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-0 bg-db-rose/20 transition-none"
              style={{ width: `${stopProgress}%` }}
            />
            <StopCircle size={16} className="relative z-10" />
            <span className="relative z-10">
              {stopProgress > 0 ? 'Hold to stop...' : 'Stop Tracking'}
            </span>
          </motion.button>
        </div>
        <p className="text-[10px] text-db-text-muted">Long-press 3 seconds to stop</p>
      </div>

      {/* Auto-dim suggestion */}
      <p className="text-[9px] text-db-text-muted/40 mt-4 text-center">
        Tip: Lower your screen brightness for a better sleep environment
      </p>
    </div>
  );
}
