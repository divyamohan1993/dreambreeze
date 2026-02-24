'use client';

import { motion } from 'motion/react';
import { Brain, Clock, Layers, Shield, Zap } from 'lucide-react';

interface Props {
  score: number;
  grade: string;
  label: string;
  breakdown: {
    duration: number;
    architecture: number;
    continuity: number;
    context: number;
  };
  peakHours: { start: number; end: number };
  advice: string;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#4ecdc4',
  A: '#4ecdc4',
  'B+': '#68d4a0',
  B: '#f0a060',
  C: '#f0a060',
  D: '#e94560',
  F: '#e94560',
};

const BREAKDOWN_CONFIG = [
  { key: 'duration' as const, label: 'Duration', icon: Clock, max: 25 },
  { key: 'architecture' as const, label: 'Architecture', icon: Layers, max: 25 },
  { key: 'continuity' as const, label: 'Continuity', icon: Shield, max: 25 },
  { key: 'context' as const, label: 'Context', icon: Zap, max: 25 },
];

function getScoreColor(score: number): string {
  if (score >= 80) return '#4ecdc4';
  if (score >= 60) return '#68d4a0';
  if (score >= 45) return '#f0a060';
  return '#e94560';
}

function getBarColor(value: number, max: number): string {
  const pct = value / max;
  if (pct >= 0.8) return '#4ecdc4';
  if (pct >= 0.6) return '#68d4a0';
  if (pct >= 0.4) return '#f0a060';
  return '#e94560';
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export default function CognitiveReadinessCard({
  score,
  grade,
  label,
  breakdown,
  peakHours,
  advice,
}: Props) {
  const scoreColor = getScoreColor(score);
  const gradeColor = GRADE_COLORS[grade] || '#f0a060';

  // SVG circular ring values
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      className="glass relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        boxShadow: `0 0 28px ${scoreColor}11, 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Gradient border */}
      <div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{
          border: `1px solid ${scoreColor}33`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMaskComposite: 'xor',
          padding: 1,
        }}
      />

      {/* Top sheen */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${scoreColor}22, transparent)`,
        }}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <motion.div
          className="flex items-center gap-2 mb-5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Brain size={18} style={{ color: scoreColor }} />
          <h3 className="text-sm font-semibold text-db-text tracking-wide">
            Cognitive Readiness
          </h3>
        </motion.div>

        {/* Score ring + grade */}
        <div className="flex items-center gap-6 mb-6">
          <motion.div
            className="relative flex-shrink-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)`,
                transform: 'scale(1.3)',
              }}
            />

            <svg width={128} height={128} className="relative">
              {/* Background ring track */}
              <circle
                cx={64}
                cy={64}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={8}
              />
              {/* Score ring */}
              <motion.circle
                cx={64}
                cy={64}
                r={radius}
                fill="none"
                stroke={scoreColor}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
                transform="rotate(-90 64 64)"
                style={{
                  filter: `drop-shadow(0 0 6px ${scoreColor}66)`,
                }}
              />
              {/* Score text */}
              <text
                x={64}
                y={58}
                textAnchor="middle"
                fill="#e0e0ee"
                fontSize={28}
                fontWeight={700}
                fontFamily="var(--font-geist-sans, system-ui)"
              >
                {score}
              </text>
              <text
                x={64}
                y={76}
                textAnchor="middle"
                fill="#8888aa"
                fontSize={11}
                fontFamily="var(--font-geist-sans, system-ui)"
              >
                / 100
              </text>
            </svg>
          </motion.div>

          {/* Grade + label */}
          <div className="flex-1 min-w-0">
            <motion.div
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <span
                className="text-3xl font-bold"
                style={{
                  color: gradeColor,
                  textShadow: `0 0 20px ${gradeColor}55`,
                }}
              >
                {grade}
              </span>
            </motion.div>
            <motion.p
              className="text-sm font-medium text-db-text mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {label}
            </motion.p>

            {/* Peak hours badge */}
            <motion.div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(78,205,196,0.1)',
                border: '1px solid rgba(78,205,196,0.2)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <Clock size={12} style={{ color: '#4ecdc4' }} />
              <span className="text-[11px] font-medium" style={{ color: '#4ecdc4' }}>
                Peak: {formatHour(peakHours.start)} - {formatHour(peakHours.end)}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-3 mb-5">
          {BREAKDOWN_CONFIG.map((cfg, index) => {
            const value = breakdown[cfg.key];
            const pct = (value / cfg.max) * 100;
            const barColor = getBarColor(value, cfg.max);
            const Icon = cfg.icon;

            return (
              <motion.div
                key={cfg.key}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08, duration: 0.35 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: barColor }} />
                    <span className="text-xs text-db-text-dim">{cfg.label}</span>
                  </div>
                  <span className="text-xs font-medium text-db-text tabular-nums">
                    {value}/{cfg.max}
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                      boxShadow: `0 0 8px ${barColor}44`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      delay: 0.6 + index * 0.08,
                      duration: 0.8,
                      ease: 'easeOut',
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Advice */}
        <motion.div
          className="p-3 rounded-xl"
          style={{
            background: 'rgba(110,94,168,0.08)',
            border: '1px solid rgba(110,94,168,0.15)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <div className="flex items-start gap-2">
            <Zap
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: '#6e5ea8' }}
            />
            <p className="text-xs text-db-text-dim leading-relaxed">{advice}</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
