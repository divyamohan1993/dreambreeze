'use client';

import { motion } from 'motion/react';

type SleepStage = 'awake' | 'light' | 'deep' | 'rem';

interface SleepStageIndicatorProps {
  stage: SleepStage;
  duration: number; // minutes in current stage
  className?: string;
}

const STAGE_CONFIG: Record<
  SleepStage,
  { label: string; color: string; glow: string; pulseSpeed: number }
> = {
  awake: {
    label: 'Awake',
    color: '#e94560',
    glow: 'rgba(233, 69, 96, 0.3)',
    pulseSpeed: 1.2,
  },
  light: {
    label: 'Light Sleep',
    color: '#4ecdc4',
    glow: 'rgba(78, 205, 196, 0.3)',
    pulseSpeed: 2.5,
  },
  deep: {
    label: 'Deep Sleep',
    color: '#6e5ea8',
    glow: 'rgba(110, 94, 168, 0.35)',
    pulseSpeed: 4,
  },
  rem: {
    label: 'REM',
    color: '#f0a060',
    glow: 'rgba(240, 160, 96, 0.3)',
    pulseSpeed: 1.8,
  },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function SleepStageIndicator({
  stage,
  duration,
  className = '',
}: SleepStageIndicatorProps) {
  const config = STAGE_CONFIG[stage];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Circular badge */}
      <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `0 0 0 0px ${config.glow}`,
              `0 0 0 10px transparent`,
            ],
          }}
          transition={{
            duration: config.pulseSpeed,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            border: `2px solid ${config.color}`,
            opacity: 0.5,
          }}
        />

        {/* Second pulse ring (delayed) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `0 0 0 0px ${config.glow}`,
              `0 0 0 16px transparent`,
            ],
          }}
          transition={{
            duration: config.pulseSpeed,
            repeat: Infinity,
            ease: 'easeOut',
            delay: config.pulseSpeed / 2,
          }}
          style={{
            border: `1px solid ${config.color}`,
            opacity: 0.3,
          }}
        />

        {/* Main badge */}
        <motion.div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            background: `radial-gradient(circle at 40% 35%, ${config.color}30, ${config.color}10 60%, transparent)`,
            border: `2px solid ${config.color}`,
            boxShadow: `
              0 0 16px ${config.glow},
              inset 0 0 12px ${config.glow},
              inset 0 1px 2px rgba(255,255,255,0.1)
            `,
          }}
          key={stage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <span
            className="text-sm font-bold tracking-wide"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </motion.div>
      </div>

      {/* Duration below */}
      <div className="text-center">
        <p className="text-xs text-db-text-dim">In stage for</p>
        <p
          className="text-sm font-semibold tabular-nums"
          style={{ color: config.color }}
        >
          {formatDuration(duration)}
        </p>
      </div>
    </div>
  );
}
