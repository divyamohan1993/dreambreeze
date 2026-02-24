'use client';

import { type ElementType, useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import GlassCard from './GlassCard';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  history: number[];
  icon: ElementType;
  glowColor?: 'teal' | 'lavender' | 'rose';
  className?: string;
}

const TREND_CONFIG = {
  up: { Icon: ArrowUp, color: '#4ecdc4', label: 'Rising' },
  down: { Icon: ArrowDown, color: '#e94560', label: 'Falling' },
  stable: { Icon: Minus, color: '#8888aa', label: 'Stable' },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const points = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80;
    const h = 24;
    const padding = 2;

    return data
      .map((v, i) => {
        const x = padding + (i / (data.length - 1)) * (w - padding * 2);
        const y = h - padding - ((v - min) / range) * (h - padding * 2);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [data]);

  const areaPath = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80;
    const h = 24;
    const padding = 2;

    const linePoints = data.map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2);
      const y = h - padding - ((v - min) / range) * (h - padding * 2);
      return { x, y };
    });

    let path = `M${linePoints[0].x},${h}`;
    linePoints.forEach((p, i) => {
      path += ` ${i === 0 ? 'L' : 'L'}${p.x},${p.y}`;
    });
    path += ` L${linePoints[linePoints.length - 1].x},${h} Z`;
    return path;
  }, [data]);

  if (data.length < 2) return null;

  return (
    <svg width={80} height={24} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#spark-fill-${color.replace('#', '')})`}
      />
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest point dot */}
      {data.length > 0 && (() => {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const lastVal = data[data.length - 1];
        const x = 2 + ((data.length - 1) / (data.length - 1)) * 76;
        const y = 22 - ((lastVal - min) / range) * 20;
        return (
          <circle cx={x} cy={y} r={2} fill={color}>
            <animate
              attributeName="r"
              values="2;3;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        );
      })()}
    </svg>
  );
}

export default function MetricCard({
  label,
  value,
  unit,
  trend,
  history,
  icon,
  glowColor,
  className = '',
}: MetricCardProps) {
  const trendCfg = TREND_CONFIG[trend];
  const TrendIcon = trendCfg.Icon;

  return (
    <GlassCard icon={icon} glowColor={glowColor} className={className}>
      <div className="flex items-end justify-between">
        <div>
          {/* Value */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-db-text tabular-nums tracking-tight">
              {value}
            </span>
            <span className="text-sm text-db-text-dim font-medium">{unit}</span>
          </div>

          {/* Label */}
          <p className="text-xs text-db-text-dim mt-1">{label}</p>

          {/* Trend */}
          <div className="flex items-center gap-1 mt-2">
            <TrendIcon size={12} color={trendCfg.color} />
            <span
              className="text-[10px] font-medium"
              style={{ color: trendCfg.color }}
            >
              {trendCfg.label}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex-shrink-0 mb-1">
          <Sparkline
            data={history}
            color={glowColor === 'rose' ? '#e94560' : glowColor === 'lavender' ? '#6e5ea8' : '#4ecdc4'}
          />
        </div>
      </div>
    </GlassCard>
  );
}
