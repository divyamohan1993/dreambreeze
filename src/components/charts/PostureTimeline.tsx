'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';

interface PostureData {
  posture: string;
  percentage: number;
  duration: string;
}

interface PostureTimelineProps {
  data: PostureData[];
  className?: string;
}

const POSTURE_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  supine: {
    bg: '#4ecdc4',
    text: '#4ecdc4',
    glow: 'rgba(78, 205, 196, 0.3)',
  },
  prone: {
    bg: '#e94560',
    text: '#e94560',
    glow: 'rgba(233, 69, 96, 0.3)',
  },
  'left-lateral': {
    bg: '#6e5ea8',
    text: '#6e5ea8',
    glow: 'rgba(110, 94, 168, 0.3)',
  },
  'right-lateral': {
    bg: '#f0a060',
    text: '#f0a060',
    glow: 'rgba(240, 160, 96, 0.3)',
  },
  fetal: {
    bg: '#a855f7',
    text: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.3)',
  },
};

const POSTURE_LABELS: Record<string, string> = {
  supine: 'On Back',
  prone: 'Face Down',
  'left-lateral': 'Left Side',
  'right-lateral': 'Right Side',
  fetal: 'Fetal',
};

export default function PostureTimeline({
  data,
  className = '',
}: PostureTimelineProps) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.percentage - a.percentage),
    [data]
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Stacked horizontal bar */}
      <div
        className="flex w-full h-8 rounded-full overflow-hidden"
        style={{
          background: 'rgba(10, 14, 39, 0.5)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {data.map((d, i) => {
          const colors = POSTURE_COLORS[d.posture] || POSTURE_COLORS.supine;
          return (
            <motion.div
              key={d.posture}
              className="relative h-full flex items-center justify-center overflow-hidden"
              style={{ background: colors.bg }}
              initial={{ width: 0 }}
              animate={{ width: `${d.percentage}%` }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            >
              {/* Inner gradient for depth */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.15) 100%)',
                }}
              />
              {/* Label inside bar if wide enough */}
              {d.percentage >= 12 && (
                <span className="relative z-10 text-[10px] font-bold text-white/90 drop-shadow-sm">
                  {Math.round(d.percentage)}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend below */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {sorted.map((d) => {
          const colors = POSTURE_COLORS[d.posture] || POSTURE_COLORS.supine;
          return (
            <div key={d.posture} className="flex items-center gap-2">
              {/* Color swatch */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: colors.bg,
                  boxShadow: `0 0 6px ${colors.glow}`,
                }}
              />

              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-db-text">
                  {POSTURE_LABELS[d.posture] || d.posture}
                </span>
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: colors.text }}
                >
                  {Math.round(d.percentage)}%
                </span>
                <span className="text-[10px] text-db-text-dim">
                  ({d.duration})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
