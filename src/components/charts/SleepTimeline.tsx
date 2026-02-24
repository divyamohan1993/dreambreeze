'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface SleepTimelineData {
  time: number; // hours from start
  stage: string; // 'awake' | 'rem' | 'light' | 'deep'
  posture?: string;
  fanSpeed?: number; // 0-100
}

interface SleepTimelineProps {
  data: SleepTimelineData[];
  className?: string;
}

const STAGE_COLORS: Record<string, string> = {
  awake: '#e94560',
  rem: '#f0a060',
  light: '#4ecdc4',
  deep: '#6e5ea8',
};

const STAGE_ORDER: Record<string, number> = {
  awake: 3,
  rem: 2,
  light: 1,
  deep: 0,
};

const STAGE_LABELS: Record<number, string> = {
  0: 'Deep',
  1: 'Light',
  2: 'REM',
  3: 'Awake',
};

const POSTURE_ICONS: Record<string, string> = {
  supine: '\u25CB',    // circle
  prone: '\u25CF',     // filled circle
  'left-lateral': '\u25C0',  // left triangle
  'right-lateral': '\u25B6', // right triangle
  fetal: '\u25C6',     // diamond
};

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      time: number;
      stageLabel: string;
      stage: string;
      posture?: string;
      fanSpeed?: number;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="glass px-3 py-2 text-xs"
      style={{
        background: 'rgba(21, 26, 53, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
      }}
    >
      <p className="text-db-text-dim mb-1">{formatTime(d.time)}</p>
      <p className="font-semibold" style={{ color: STAGE_COLORS[d.stage] || '#e0e0ee' }}>
        {d.stageLabel}
      </p>
      {d.posture && (
        <p className="text-db-text-dim mt-0.5">Posture: {d.posture}</p>
      )}
      {d.fanSpeed !== undefined && (
        <p className="text-db-text-dim mt-0.5">Fan: {d.fanSpeed}%</p>
      )}
    </div>
  );
}

export default function SleepTimeline({
  data,
  className = '',
}: SleepTimelineProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      stageValue: STAGE_ORDER[d.stage] ?? 1,
      stageLabel: d.stage.charAt(0).toUpperCase() + d.stage.slice(1),
      fanSpeedNorm: d.fanSpeed !== undefined ? (d.fanSpeed / 100) * 3 : undefined,
    }));
  }, [data]);

  // Find posture change points
  const postureMarkers = useMemo(() => {
    const markers: { time: number; posture: string }[] = [];
    let lastPosture = '';
    for (const d of data) {
      if (d.posture && d.posture !== lastPosture) {
        markers.push({ time: d.time, posture: d.posture });
        lastPosture = d.posture;
      }
    }
    return markers;
  }, [data]);

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 8, left: -8, bottom: 4 }}
        >
          <defs>
            <linearGradient id="fanSpeedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#4ecdc4" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="stageLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ecdc4" />
              <stop offset="33%" stopColor="#f0a060" />
              <stop offset="66%" stopColor="#6e5ea8" />
              <stop offset="100%" stopColor="#e94560" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 6"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
            tick={{ fill: '#8888aa', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          />

          <YAxis
            type="number"
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(v: number) => STAGE_LABELS[v] || ''}
            tick={{ fill: '#8888aa', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            width={42}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Fan speed as subtle background area */}
          <Area
            type="monotone"
            dataKey="fanSpeedNorm"
            fill="url(#fanSpeedGrad)"
            stroke="none"
            isAnimationActive={false}
          />

          {/* Sleep stage stepped line */}
          <Line
            type="stepAfter"
            dataKey="stageValue"
            stroke="url(#stageLineGrad)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 4,
              fill: '#e0e0ee',
              stroke: '#4ecdc4',
              strokeWidth: 2,
            }}
            isAnimationActive
            animationDuration={1200}
            animationEasing="ease-in-out"
          />

          {/* Posture change markers */}
          {postureMarkers.map((marker, i) => (
            <ReferenceDot
              key={i}
              x={marker.time}
              y={3}
              r={0}
              label={{
                value: POSTURE_ICONS[marker.posture] || '\u25CB',
                position: 'top',
                fill: '#8888aa',
                fontSize: 10,
                offset: 4,
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
