'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Wind, Volume2, StopCircle, Loader2, Cloud, Thermometer, Zap, Mic, Battery } from 'lucide-react';
import PreSleepCheckin, { type PreSleepData } from '@/components/ui/PreSleepCheckin';
import PermissionGate from '@/components/ui/PermissionGate';
import { getPermissionManager } from '@/lib/sensors/permission-manager';
import { useBlackboard } from '@/hooks/use-blackboard';
import { useWeather } from '@/hooks/use-weather';
import { useAmbientNoise } from '@/hooks/use-ambient-noise';
import { useSoundscape } from '@/hooks/use-soundscape';
import { useSleepStore } from '@/stores/sleep-store';
import { useFanStore } from '@/stores/fan-store';
import { useAudioStore } from '@/stores/audio-store';
import type { Posture, SleepStage, NoiseType } from '@/types/sleep';
import { POSTURE_LABELS } from '@/lib/constants/posture';
import { saveSession, type StoredSession } from '@/lib/storage/session-storage';

// -- Types ----------------------------------------------------------------------

type SessionPhase = 'pre-sleep' | 'permissions' | 'idle' | 'calibrating' | 'active';

// -- Constants ------------------------------------------------------------------

const NOISE_ICONS: Record<NoiseType, string> = {
  white: 'W',
  pink: 'P',
  brown: 'B',
  rain: 'R',
  ocean: 'O',
  forest: 'F',
};

// -- Posture Icon (SVG) ---------------------------------------------------------

function PostureIcon({ posture }: { posture: Posture }) {
  const svgPaths: Record<Posture, string> = {
    supine: 'M12 4a3 3 0 100 6 3 3 0 000-6zm-4 8h8v1H8zm-1 2h10l-1.5 9h-7z',
    prone: 'M12 4a3 3 0 100 6 3 3 0 000-6zm-4 8h8v2H8zm-1 3h10l-.5 7h-9z',
    'left-lateral': 'M13 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-2 6c0-.8 1.5-1.5 3-1.5s2 .7 2 1.5l.5 6H10.5zm-1 7l2 8h-3z',
    'right-lateral': 'M11 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-1 6c0-.8 1.5-1.5 3-1.5s2 .7 2 1.5l.5 6H9.5zm6 7l-2 8h3z',
    fetal: 'M13 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-3 7c0-.8 2-1.5 3.5-1l3 3.5c.5.7 0 2-.7 2l-4.5 1.5c-.8 0-1.5-.3-2-.8z',
    unknown: 'M12 4a3 3 0 100 6 3 3 0 000-6zm-4 8h8v1H8zm-1 2h10l-1.5 9h-7z',
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-db-teal/40"
      fill="currentColor"
      role="img"
      aria-label={`${POSTURE_LABELS[posture]} posture`}
    >
      <path d={svgPaths[posture]} />
    </svg>
  );
}

// -- Component ------------------------------------------------------------------

export default function SleepPage() {
  const [phase, setPhase] = useState<SessionPhase>(() => {
    if (typeof window !== 'undefined') {
      const checkinEnabled = localStorage.getItem('db-presleep-checkin');
      if (checkinEnabled === 'false') return 'idle';
    }
    return 'pre-sleep';
  });
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time data from stores (updated by blackboard agent system)
  const posture = useSleepStore((s) => s.currentPosture);
  const stage = useSleepStore((s) => s.currentSleepStage);
  const speedLevel = useFanStore((s) => Math.round(s.speed / 20)); // 0-100 -> 0-5
  const noiseType = useAudioStore((s) => s.noiseType);

  // Soundscape audio engine
  const soundscape = useSoundscape();

  // Session history tracking (accumulated during active session for storage)
  const postureHistoryRef = useRef<Posture[]>([]);
  const stageHistoryRef = useRef<SleepStage[]>([]);
  const fanSpeedHistoryRef = useRef<number[]>([]);

  // Long-press state for stop button
  const [stopProgress, setStopProgress] = useState(0);
  const stopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockSupported, setWakeLockSupported] = useState(true);

  // Blackboard agents
  const {
    insights,
    startAgents,
    stopAgents,
    setPreSleepContext,
    setWeatherData,
    cycleCount,
  } = useBlackboard();

  // Weather
  const { weather } = useWeather();

  // Ambient noise
  const { reading: noiseReading, start: startNoise, stop: stopNoise } = useAmbientNoise();

  // -- Pass weather data to blackboard when available ---------------------
  useEffect(() => {
    if (weather) {
      setWeatherData({
        temperatureCelsius: weather.temperatureCelsius,
        humidity: weather.humidity,
        feelsLike: weather.feelsLike,
        description: weather.description,
        fetchedAt: weather.fetchedAt,
      });
    }
  }, [weather, setWeatherData]);

  // -- Clock tick -----------------------------------------------------------
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // -- Elapsed timer --------------------------------------------------------
  useEffect(() => {
    if (phase !== 'active' || !sessionStart) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, sessionStart]);

  // -- Accumulate real data from stores into session history ------------------
  useEffect(() => {
    if (phase !== 'active') return;
    const interval = setInterval(() => {
      // Accumulate from real store data for session storage
      postureHistoryRef.current.push(posture);
      stageHistoryRef.current.push(stage);
      fanSpeedHistoryRef.current.push(speedLevel * 20); // 0-5 -> 0-100 scale
    }, 15000);
    return () => clearInterval(interval);
  }, [phase, posture, stage, speedLevel]);

  // -- Adaptive volume based on ambient noise ---------------------------------
  useEffect(() => {
    if (!noiseReading || phase !== 'active') return;
    const audioState = useAudioStore.getState();
    if (!audioState.adaptiveMode || !audioState.isPlaying) return;

    // Target: soundscape 8dB above ambient noise floor
    const targetDb = noiseReading.noiseFloor + 8;
    const targetVolume = Math.max(0.1, Math.min(0.8, targetDb / 75));

    if (Math.abs(targetVolume - audioState.volume) > 0.05) {
      audioState.setVolume(targetVolume);
    }
  }, [noiseReading, phase]);

  // -- Wake Lock (robust with auto-reacquire) --------------------------------
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active') return;

    let released = false;

    async function acquireWakeLock() {
      if (!('wakeLock' in navigator)) {
        setWakeLockSupported(false);
        return;
      }
      if (released) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
          // Auto-reacquire if still in active phase
          if (phaseRef.current === 'active' && !released) {
            acquireWakeLock();
          }
        });
      } catch {
        setWakeLockSupported(false);
      }
    }

    acquireWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && phaseRef.current === 'active' && !released) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [phase]);

  // -- Screen dimming (tap-to-peek) ------------------------------------------
  const [dimmed, setDimmed] = useState(true);
  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePeek = useCallback(() => {
    setDimmed(false);
    if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
    peekTimeoutRef.current = setTimeout(() => setDimmed(true), 5000);
  }, []);

  useEffect(() => {
    return () => { if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current); };
  }, []);

  // -- Pre-sleep check-in handlers -----------------------------------------
  const handlePreSleepComplete = useCallback(
    (data: PreSleepData) => {
      setPreSleepContext({
        caffeineMg: data.caffeineMg,
        caffeineLastIntakeHoursAgo: data.caffeineLastIntakeHoursAgo,
        alcoholDrinks: data.alcoholDrinks,
        exerciseIntensity: data.exerciseIntensity,
        exerciseHoursAgo: data.exerciseHoursAgo,
        stressLevel: data.stressLevel,
        screenTimeMinutes: data.screenTimeMinutes,
        mealHoursAgo: data.mealHoursAgo,
      });
      const pm = getPermissionManager();
      setPhase(pm.hasAllRequired() ? 'idle' : 'permissions');
    },
    [setPreSleepContext]
  );

  const handlePreSleepSkip = useCallback(() => {
    const pm = getPermissionManager();
    setPhase(pm.hasAllRequired() ? 'idle' : 'permissions');
  }, []);

  const handlePermissionsComplete = useCallback(() => setPhase('idle'), []);
  const handlePermissionsSkip = useCallback(() => setPhase('idle'), []);

  // -- Start session --------------------------------------------------------
  const startSession = useCallback(() => {
    // Reset history refs for the new session
    postureHistoryRef.current = [];
    stageHistoryRef.current = [];
    fanSpeedHistoryRef.current = [];

    setPhase('calibrating');
    // Show calibration for 4 seconds, then go active
    setTimeout(() => {
      setSessionStart(Date.now());
      setElapsed(0);
      setPhase('active');
      startAgents();

      // Start ambient noise if microphone permission already granted
      const pm = getPermissionManager();
      if (pm.getStatus('microphone') === 'granted') {
        startNoise();
      }

      // Start soundscape playback if a noise type is configured
      const audioState = useAudioStore.getState();
      if (audioState.noiseType) {
        void soundscape.play(audioState.noiseType, audioState.volume);
      }
    }, 4000);
  }, [startAgents, startNoise, soundscape]);

  // -- Save session to localStorage ------------------------------------------
  const persistSession = useCallback(() => {
    if (!sessionStart) return;
    const now = Date.now();
    const durationMinutes = Math.round((now - sessionStart) / 60000);

    // Compute posture distribution from accumulated observations
    const postureObs = postureHistoryRef.current;
    const total = postureObs.length || 1;
    const postureCounts: Record<string, number> = { supine: 0, lateral: 0, prone: 0, fetal: 0 };
    let dominantPosture: Posture = 'supine';
    let dominantCount = 0;
    for (const p of postureObs) {
      if (p === 'supine') postureCounts.supine++;
      else if (p === 'left-lateral' || p === 'right-lateral') postureCounts.lateral++;
      else if (p === 'prone') postureCounts.prone++;
      else if (p === 'fetal') postureCounts.fetal++;
    }
    // Find dominant
    const postureFreq: Record<Posture, number> = {} as Record<Posture, number>;
    for (const p of postureObs) {
      postureFreq[p] = (postureFreq[p] || 0) + 1;
      if (postureFreq[p] > dominantCount) {
        dominantCount = postureFreq[p];
        dominantPosture = p;
      }
    }

    // Compute stage distribution from accumulated observations
    const stageObs = stageHistoryRef.current;
    const stageTotal = stageObs.length || 1;
    const stageCounts = { awake: 0, light: 0, deep: 0, rem: 0 };
    for (const s of stageObs) {
      stageCounts[s]++;
    }

    // Compute average fan speed
    const fanObs = fanSpeedHistoryRef.current;
    const avgFan = fanObs.length > 0
      ? Math.round(fanObs.reduce((a, b) => a + b, 0) / fanObs.length)
      : 40;

    // Compute sleep score (simple heuristic based on deep + rem percentage)
    const deepPct = Math.round((stageCounts.deep / stageTotal) * 100);
    const remPct = Math.round((stageCounts.rem / stageTotal) * 100);
    const awakePct = Math.round((stageCounts.awake / stageTotal) * 100);
    const sleepScore = Math.min(100, Math.max(0,
      Math.round(50 + (deepPct + remPct) * 0.5 - awakePct * 0.3 + Math.min(durationMinutes / 480, 1) * 20)
    ));

    const session: StoredSession = {
      id: `session-${sessionStart}`,
      date: new Date(sessionStart).toISOString().split('T')[0],
      startedAt: new Date(sessionStart).toISOString(),
      endedAt: new Date(now).toISOString(),
      durationMinutes,
      sleepScore,
      stages: {
        awake: Math.round((stageCounts.awake / stageTotal) * 100),
        light: Math.round((stageCounts.light / stageTotal) * 100),
        deep: deepPct,
        rem: remPct,
      },
      postures: {
        supine: Math.round((postureCounts.supine / total) * 100),
        lateral: Math.round((postureCounts.lateral / total) * 100),
        prone: Math.round((postureCounts.prone / total) * 100),
        fetal: Math.round((postureCounts.fetal / total) * 100),
      },
      dominantPosture,
      avgFanSpeed: avgFan,
      insights: durationMinutes >= 30
        ? [
            `Session lasted ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m.`,
            `Deep sleep made up ${deepPct}% of your session.`,
            `Fan averaged ${avgFan}% speed throughout the night.`,
          ]
        : [],
    };

    saveSession(session);
  }, [sessionStart]);

  // -- Stop session long-press handlers -------------------------------------
  const startStopHold = useCallback(() => {
    setStopProgress(0);
    let progress = 0;
    stopTimerRef.current = setInterval(() => {
      progress += 100 / 30; // 3 seconds = 30 ticks at 100ms
      setStopProgress(Math.min(progress, 100));
      if (progress >= 100) {
        if (stopTimerRef.current) clearInterval(stopTimerRef.current);
        soundscape.stop();
        stopNoise();
        persistSession();
        stopAgents();
        setPhase('idle');
        setSessionStart(null);
        setElapsed(0);
        setStopProgress(0);
      }
    }, 100);
  }, [stopAgents, persistSession, stopNoise, soundscape]);

  const cancelStopHold = useCallback(() => {
    if (stopTimerRef.current) clearInterval(stopTimerRef.current);
    setStopProgress(0);
  }, []);

  // -- Formatting -----------------------------------------------------------
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

  // -- Latest insight for the info strip ------------------------------------
  const latestInsight = insights.length > 0 ? insights[insights.length - 1] : null;

  // -- Pre-Sleep Check-in phase ----------------------------------------------
  if (phase === 'pre-sleep') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4 py-8">
        <PreSleepCheckin onComplete={handlePreSleepComplete} onSkip={handlePreSleepSkip} />
      </div>
    );
  }

  // -- Permissions phase ------------------------------------------------------
  if (phase === 'permissions') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4 py-8">
        <PermissionGate onComplete={handlePermissionsComplete} onSkip={handlePermissionsSkip} />
      </div>
    );
  }

  // -- Idle state -- Start button --------------------------------------------
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-6">
        <Moon size={48} className="text-db-teal/30 mb-6" />
        <h1 className="text-2xl font-bold text-db-text mb-2">Ready to Sleep</h1>
        <p className="text-sm text-db-text-dim text-center mb-8 max-w-xs">
          Place your phone on the bed, then tap to begin tracking your sleep posture and
          controlling your fan.
        </p>
        <div className="flex items-center gap-2 text-xs text-amber-400/70 mb-4 px-2">
          <Battery className="w-4 h-4 shrink-0" />
          <span>Plug in your phone. Bedside mode uses ~10-15% battery overnight.</span>
        </div>
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

  // -- Calibrating state ----------------------------------------------------
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

  // -- Active session -- Bedside display -------------------------------------
  return (
    <div
      className="flex flex-col items-center justify-between min-h-[calc(100vh-6rem)] px-6 py-8 transition-all duration-1000"
      style={{ filter: `brightness(${dimmed ? 0.05 : 0.3})` }}
      onClick={handlePeek}
    >
      {/* Wake lock warning */}
      {!wakeLockSupported && (
        <div className="absolute top-4 left-4 right-4 glass rounded-lg px-3 py-2 text-[10px] text-db-amber text-center">
          Screen may turn off. Your browser does not support Wake Lock.
        </div>
      )}

      {/* Weather indicator -- top-right corner */}
      {weather && (
        <motion.div
          className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Cloud size={12} className="text-db-text-muted/60" />
          <span className="text-[10px] text-db-text-muted tabular-nums">
            {Math.round(weather.temperatureCelsius)} degC
          </span>
          <Thermometer size={10} className="text-db-text-muted/40 ml-1" />
          <span className="text-[10px] text-db-text-muted/60 tabular-nums">
            {weather.humidity}%
          </span>
        </motion.div>
      )}

      {/* Ambient noise indicator -- top-left corner */}
      {noiseReading && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs opacity-60">
          <Mic className="w-3 h-3" />
          <span>{noiseReading.dbLevel} dB</span>
          <span className="text-[10px]">({noiseReading.classification})</span>
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
        {/* Agent cycle count -- subtle */}
        {cycleCount > 0 && (
          <span className="text-[9px] text-db-text-muted/30 tabular-nums ml-1">
            C{cycleCount}
          </span>
        )}
      </div>

      {/* -- Large clock -- */}
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

        {/* -- Posture (dim) -- */}
        <div aria-live="polite" aria-atomic="true">
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
        </div>

        {/* -- Fan speed dots -- */}
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

        {/* -- Sound type -- */}
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

        {/* -- Agent insights info strip -- */}
        <AnimatePresence mode="wait">
          {latestInsight && (
            <motion.div
              key={latestInsight.timestamp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl max-w-xs"
              style={{
                background: 'rgba(78, 205, 196, 0.05)',
                border: '1px solid rgba(78, 205, 196, 0.1)',
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5 }}
            >
              <Zap size={10} className="text-db-teal/50 flex-shrink-0" />
              <p className="text-[10px] text-db-text-muted leading-snug line-clamp-2">
                {latestInsight.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* -- Stop Tracking (long-press 3s) -- */}
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

      {/* Dimming hint */}
      <p className="text-[9px] text-db-text-muted/40 mt-4 text-center">
        Tap anywhere to briefly brighten the screen
      </p>
    </div>
  );
}
