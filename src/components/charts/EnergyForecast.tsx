'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface EnergyForecastProps {
  data: Array<{
    hour: number;
    energyLevel: number;
    cognitiveReadiness: number;
    label: string;
  }>;
  peakStart?: number;
  peakEnd?: number;
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getEnergyColor(level: number): string {
  if (level >= 70) return '#4ecdc4'; // teal -- peak
  if (level >= 45) return '#f0a060'; // amber -- moderate
  return '#e94560'; // rose -- low
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      hour: number;
      energyLevel: number;
      cognitiveReadiness: number;
      label: string;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = getEnergyColor(d.energyLevel);

  return (
    <div
      className="px-3 py-2.5 text-xs"
      style={{
        background: 'rgba(21, 26, 53, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <p className="text-db-text font-semibold text-sm mb-1">
        {formatHour(d.hour)}
      </p>
      <div className="flex items-center gap-1.5 mb-0.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span style={{ color }} className="font-medium">
          Energy: {d.energyLevel}%
        </span>
      </div>
      <p className="text-db-text-dim mt-1">Readiness: {d.cognitiveReadiness}%</p>
      {d.label && (
        <p className="text-db-text-dim mt-0.5 italic">{d.label}</p>
      )}
    </div>
  );
}

export default function EnergyForecast({
  data,
  peakStart = 9,
  peakEnd = 12,
}: EnergyForecastProps) {
  const currentHour = useMemo(() => new Date().getHours(), []);

  // Build gradient stops from data for dynamic coloring
  const gradientStops = useMemo(() => {
    if (data.length < 2) return [];
    const minHour = data[0].hour;
    const maxHour = data[data.length - 1].hour;
    const range = maxHour - minHour || 1;

    return data.map((d) => ({
      offset: `${((d.hour - minHour) / range) * 100}%`,
      color: getEnergyColor(d.energyLevel),
    }));
  }, [data]);

  // Determine tick values -- show every 3 hours
  const ticks = useMemo(() => {
    if (data.length === 0) return [];
    const minH = data[0].hour;
    const maxH = data[data.length - 1].hour;
    const result: number[] = [];
    for (let h = Math.ceil(minH / 3) * 3; h <= maxH; h += 3) {
      result.push(h);
    }
    return result;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="glass relative overflow-hidden">
        <div className="p-5 text-center text-db-text-dim text-sm">
          No energy forecast data available.
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass relative overflow-hidden"
      style={{
        boxShadow:
          '0 0 24px rgba(78,205,196,0.06), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Subtle gradient border */}
      <div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{
          border: '1px solid rgba(78,205,196,0.15)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMaskComposite: 'xor',
          padding: 1,
        }}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: '#4ecdc4',
                boxShadow: '0 0 8px rgba(78,205,196,0.5)',
              }}
            />
            <h3 className="text-sm font-semibold text-db-text tracking-wide">
              Energy Forecast
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-db-text-dim">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ecdc4' }} />
              Peak
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f0a060' }} />
              Moderate
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e94560' }} />
              Low
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
          >
            <defs>
              {/* Dynamic gradient that maps energy colors to the curve */}
              <linearGradient id="energyLineGrad" x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((stop, i) => (
                  <stop
                    key={i}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity={1}
                  />
                ))}
              </linearGradient>
              {/* Fill gradient -- top follows line color, fades to transparent */}
              <linearGradient id="energyFillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.2} />
                <stop offset="50%" stopColor="#6e5ea8" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#0a0e27" stopOpacity={0} />
              </linearGradient>
              {/* Peak window highlight */}
              <linearGradient id="peakWindowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#4ecdc4" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="hour"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={ticks}
              tickFormatter={formatHour}
              tick={{ fill: '#8888aa', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            />

            <YAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: '#8888aa', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
              width={36}
              tickFormatter={(v: number) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Peak window background highlight */}
            <ReferenceArea
              x1={peakStart}
              x2={peakEnd}
              y1={0}
              y2={100}
              fill="url(#peakWindowGrad)"
              stroke="rgba(78,205,196,0.15)"
              strokeDasharray="4 4"
            />

            {/* Current time indicator */}
            {currentHour >= (data[0]?.hour ?? 0) &&
              currentHour <= (data[data.length - 1]?.hour ?? 24) && (
                <ReferenceLine
                  x={currentHour}
                  stroke="#e0e0ee"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: 'Now',
                    position: 'top',
                    fill: '#e0e0ee',
                    fontSize: 10,
                    fontWeight: 600,
                    offset: 6,
                  }}
                />
              )}

            {/* Energy area fill */}
            <Area
              type="monotone"
              dataKey="energyLevel"
              stroke="url(#energyLineGrad)"
              strokeWidth={2.5}
              fill="url(#energyFillGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#e0e0ee',
                stroke: '#4ecdc4',
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Peak window label */}
        <div className="flex items-center justify-center mt-2">
          <div
            className="px-3 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: 'rgba(78,205,196,0.1)',
              border: '1px solid rgba(78,205,196,0.2)',
              color: '#4ecdc4',
            }}
          >
            Peak window: {formatHour(peakStart)} - {formatHour(peakEnd)}
          </div>
        </div>
      </div>
    </div>
  );
}
