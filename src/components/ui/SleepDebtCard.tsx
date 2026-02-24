'use client';

import { motion } from 'motion/react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Moon,
  Clock,
  Lightbulb,
} from 'lucide-react';

interface Props {
  totalDebtHours: number;
  weeklyDebtHours: number;
  trend: 'improving' | 'stable' | 'worsening';
  recoveryNightsNeeded: number;
  impairmentLevel: 'none' | 'mild' | 'moderate' | 'severe';
  impairmentEquivalent: string;
  recommendations: string[];
}

const TREND_CONFIG = {
  improving: {
    Icon: TrendingDown,
    color: '#4ecdc4',
    label: 'Improving',
    bgColor: 'rgba(78,205,196,0.1)',
    borderColor: 'rgba(78,205,196,0.2)',
  },
  stable: {
    Icon: Minus,
    color: '#f0a060',
    label: 'Stable',
    bgColor: 'rgba(240,160,96,0.1)',
    borderColor: 'rgba(240,160,96,0.2)',
  },
  worsening: {
    Icon: TrendingUp,
    color: '#e94560',
    label: 'Worsening',
    bgColor: 'rgba(233,69,96,0.1)',
    borderColor: 'rgba(233,69,96,0.2)',
  },
};

const IMPAIRMENT_CONFIG = {
  none: {
    color: '#4ecdc4',
    bg: 'rgba(78,205,196,0.1)',
    border: 'rgba(78,205,196,0.2)',
    label: 'None',
  },
  mild: {
    color: '#f0a060',
    bg: 'rgba(240,160,96,0.1)',
    border: 'rgba(240,160,96,0.2)',
    label: 'Mild',
  },
  moderate: {
    color: '#e94560',
    bg: 'rgba(233,69,96,0.1)',
    border: 'rgba(233,69,96,0.2)',
    label: 'Moderate',
  },
  severe: {
    color: '#e94560',
    bg: 'rgba(233,69,96,0.15)',
    border: 'rgba(233,69,96,0.3)',
    label: 'Severe',
  },
};

/**
 * Computes the water-tank fill percentage from debt hours.
 * 0 debt = empty tank (good), >20h = full tank (bad).
 * The tank fills up as debt increases.
 */
function debtToFillPercent(debt: number): number {
  return Math.min(100, Math.max(0, (debt / 24) * 100));
}

function getTankColor(debt: number): string {
  if (debt <= 5) return '#4ecdc4';
  if (debt <= 12) return '#f0a060';
  return '#e94560';
}

export default function SleepDebtCard({
  totalDebtHours,
  weeklyDebtHours,
  trend,
  recoveryNightsNeeded,
  impairmentLevel,
  impairmentEquivalent,
  recommendations,
}: Props) {
  const trendCfg = TREND_CONFIG[trend];
  const TrendIcon = trendCfg.Icon;
  const impairmentCfg = IMPAIRMENT_CONFIG[impairmentLevel];

  const fillPercent = debtToFillPercent(totalDebtHours);
  const tankColor = getTankColor(totalDebtHours);

  return (
    <motion.div
      className="glass relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        boxShadow: `0 0 24px ${tankColor}11, 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Gradient border */}
      <div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{
          border: `1px solid ${tankColor}33`,
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
          background: `linear-gradient(90deg, transparent, ${tankColor}22, transparent)`,
        }}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <Moon size={18} style={{ color: '#6e5ea8' }} />
            <h3 className="text-sm font-semibold text-db-text tracking-wide">
              Sleep Debt
            </h3>
          </div>
          {/* Trend badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: trendCfg.bgColor,
              border: `1px solid ${trendCfg.borderColor}`,
            }}
          >
            <TrendIcon size={12} style={{ color: trendCfg.color }} />
            <span
              className="text-[11px] font-medium"
              style={{ color: trendCfg.color }}
            >
              {trendCfg.label}
            </span>
          </div>
        </motion.div>

        {/* Tank visualization + debt value */}
        <div className="flex items-center gap-5 mb-5">
          {/* Water tank gauge */}
          <motion.div
            className="relative flex-shrink-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          >
            <svg width={80} height={120} viewBox="0 0 80 120">
              {/* Tank body outline */}
              <rect
                x={10}
                y={10}
                width={60}
                height={100}
                rx={8}
                ry={8}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2}
              />

              {/* Glass reflections on tank */}
              <rect
                x={14}
                y={14}
                width={2}
                height={92}
                rx={1}
                fill="rgba(255,255,255,0.04)"
              />

              {/* Fill level (animated) */}
              <defs>
                <clipPath id="tankClip">
                  <rect x={12} y={12} width={56} height={96} rx={6} />
                </clipPath>
                <linearGradient id="tankFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tankColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={tankColor} stopOpacity={0.25} />
                </linearGradient>
              </defs>

              <g clipPath="url(#tankClip)">
                {/* Fill rectangle -- grows upward from bottom */}
                <motion.rect
                  x={12}
                  width={56}
                  rx={0}
                  fill="url(#tankFillGrad)"
                  initial={{ y: 108, height: 0 }}
                  animate={{
                    y: 108 - (fillPercent / 100) * 96,
                    height: (fillPercent / 100) * 96,
                  }}
                  transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
                />

                {/* Animated wave at top of fill */}
                <motion.path
                  d="M12,0 Q26,-4 40,0 T68,0 V4 H12 Z"
                  fill={tankColor}
                  opacity={0.3}
                  initial={{ y: 108 }}
                  animate={{
                    y: 108 - (fillPercent / 100) * 96 - 2,
                    d: [
                      'M12,0 Q26,-3 40,0 T68,0 V4 H12 Z',
                      'M12,0 Q26,3 40,0 T68,0 V4 H12 Z',
                      'M12,0 Q26,-3 40,0 T68,0 V4 H12 Z',
                    ],
                  }}
                  transition={{
                    y: { delay: 0.4, duration: 1, ease: 'easeOut' },
                    d: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                  }}
                />
              </g>

              {/* Graduation marks */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const yPos = 108 - (pct / 100) * 96;
                return (
                  <line
                    key={pct}
                    x1={64}
                    y1={yPos}
                    x2={70}
                    y2={yPos}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Tank cap */}
              <rect
                x={24}
                y={4}
                width={32}
                height={8}
                rx={4}
                fill="rgba(255,255,255,0.08)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            </svg>
          </motion.div>

          {/* Debt numbers */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span
                  className="text-4xl font-bold tabular-nums tracking-tight"
                  style={{ color: tankColor }}
                >
                  {totalDebtHours}
                </span>
                <span className="text-sm text-db-text-dim font-medium">hours</span>
              </div>
              <p className="text-xs text-db-text-dim mb-3">
                Total debt (14-day window)
              </p>
            </motion.div>

            {/* Weekly + recovery stats */}
            <motion.div
              className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <div
                className="p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <p className="text-[10px] text-db-text-muted uppercase tracking-wider mb-0.5">
                  This week
                </p>
                <p className="text-sm font-semibold text-db-text tabular-nums">
                  {weeklyDebtHours}h
                </p>
              </div>
              <div
                className="p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-db-text-muted" />
                  <p className="text-[10px] text-db-text-muted uppercase tracking-wider">
                    Recovery
                  </p>
                </div>
                <p className="text-sm font-semibold text-db-text tabular-nums mt-0.5">
                  {recoveryNightsNeeded} {recoveryNightsNeeded === 1 ? 'night' : 'nights'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Impairment level */}
        <motion.div
          className="p-3 rounded-xl mb-4"
          style={{
            background: impairmentCfg.bg,
            border: `1px solid ${impairmentCfg.border}`,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: impairmentCfg.color }}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: impairmentCfg.color }}
                >
                  {impairmentCfg.label} Impairment
                </span>
              </div>
              <p className="text-[11px] text-db-text-dim leading-relaxed">
                {impairmentEquivalent}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.4 }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={12} style={{ color: '#f0a060' }} />
              <span className="text-[11px] font-semibold text-db-text-dim uppercase tracking-wider">
                Recommendations
              </span>
            </div>
            <div className="space-y-1.5">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-2 pl-1"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.06, duration: 0.3 }}
                >
                  <div
                    className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: '#f0a060' }}
                  />
                  <p className="text-[11px] text-db-text-dim leading-relaxed">
                    {rec}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
