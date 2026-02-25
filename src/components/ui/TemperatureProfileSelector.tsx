'use client';

import { useCallback, useMemo, memo } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Flame,
  Snowflake,
  Sun,
  Zap,
} from 'lucide-react';
import {
  TEMPERATURE_PROFILES,
  type TemperatureProfile,
} from '@/lib/weather/temperature-profiles';

/* -------------------------------------------------------------------------- */
/*  Icon resolver                                                              */
/* -------------------------------------------------------------------------- */

/** Renders a profile icon by name without creating components during render */
function ProfileIconDisplay({ name, size, style }: { name: string; size: number; style?: React.CSSProperties }) {
  switch (name) {
    case 'Flame': return <Flame size={size} style={style} />;
    case 'Snowflake': return <Snowflake size={size} style={style} />;
    case 'Sun': return <Sun size={size} style={style} />;
    case 'Zap': return <Zap size={size} style={style} />;
    default: return <Sparkles size={size} style={style} />;
  }
}

/* -------------------------------------------------------------------------- */
/*  Profile color mapping                                                      */
/* -------------------------------------------------------------------------- */

const PROFILE_COLORS: Record<string, string> = {
  optimal: '#4ecdc4',
  'hot-sleeper': '#e94560',
  'cold-sleeper': '#6e9ed4',
  tropical: '#f0a060',
  'energy-wake': '#a855f7',
};

function getProfileColor(id: string): string {
  return PROFILE_COLORS[id] ?? '#4ecdc4';
}

/* -------------------------------------------------------------------------- */
/*  Mini sparkline SVG for fan speed curve                                     */
/* -------------------------------------------------------------------------- */

function ProfileSparkline({
  profile,
  color,
  isSelected,
}: {
  profile: TemperatureProfile;
  color: string;
  isSelected: boolean;
}) {
  const { linePath, areaPath } = useMemo(() => {
    const phases = [
      profile.phases.onset,
      profile.phases.light1,
      profile.phases.deep1,
      profile.phases.rem1,
      profile.phases.mid,
      profile.phases.deep2,
      profile.phases.rem2,
      profile.phases.preWake,
    ];

    const w = 120;
    const h = 36;
    const padX = 2;
    const padY = 4;

    const points = phases.map((val, i) => {
      const x = padX + (i / (phases.length - 1)) * (w - padX * 2);
      const y = h - padY - (val / 100) * (h - padY * 2);
      return { x, y };
    });

    // Create smooth curve using Catmull-Rom to Bezier conversion
    let line = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const tension = 0.3;
      const cp1x = p1.x + ((p2.x - p0.x) * tension);
      const cp1y = p1.y + ((p2.y - p0.y) * tension);
      const cp2x = p2.x - ((p3.x - p1.x) * tension);
      const cp2y = p2.y - ((p3.y - p1.y) * tension);

      line += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const area =
      `M${points[0].x},${h}` +
      ` L${points[0].x},${points[0].y}` +
      line.slice(line.indexOf(' ')) +
      ` L${points[points.length - 1].x},${h} Z`;

    return { linePath: line, areaPath: area };
  }, [profile]);

  const gradientId = `sparkline-fill-${profile.id}`;

  return (
    <svg
      width="100%"
      height={36}
      viewBox="0 0 120 36"
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={isSelected ? 0.25 : 0.1} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line stroke */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSelected ? 1 : 0.6}
      />

      {/* Phase label markers (subtle dots at bottom) */}
      {['Sleep', '', 'Deep', '', 'Mid', '', 'REM', 'Wake'].map((label, i) => {
        if (!label) return null;
        const x = 2 + (i / 7) * 116;
        return (
          <text
            key={i}
            x={x}
            y={35}
            fill="rgba(136,136,170,0.5)"
            fontSize="4"
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Individual profile card                                                    */
/* -------------------------------------------------------------------------- */

const ProfileCard = memo(function ProfileCard({
  profile,
  isSelected,
  onSelect,
}: {
  profile: TemperatureProfile;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const color = getProfileColor(profile.id);

  return (
    <motion.button
      onClick={onSelect}
      className="relative flex flex-col text-left min-w-[200px] w-full rounded-2xl overflow-hidden"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${color}12, ${color}04)`
          : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${isSelected ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isSelected
          ? `0 0 20px ${color}15, 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`
          : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      whileHover={{
        y: -3,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Selected glow border top */}
      {isSelected && (
        <motion.div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}

      <div className="p-4 pb-2">
        {/* Header: icon + name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: isSelected
                ? `radial-gradient(circle, ${color}30 0%, transparent 70%)`
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSelected ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s ease',
            }}
          >
            <ProfileIconDisplay
              name={profile.icon}
              size={15}
              style={{
                color: isSelected ? color : '#555577',
                transition: 'color 0.3s ease',
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-semibold truncate"
              style={{
                color: isSelected ? color : 'var(--db-text)',
                transition: 'color 0.3s ease',
              }}
            >
              {profile.name}
            </h4>
          </div>

          {/* Selected indicator */}
          {isSelected && (
            <motion.div
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: color,
                boxShadow: `0 0 8px ${color}60`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 5l2.5 2.5L8 3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Description */}
        <p className="text-[10px] text-db-text-dim leading-relaxed line-clamp-2 mb-3">
          {profile.description}
        </p>
      </div>

      {/* Sparkline */}
      <div className="px-3 pb-3">
        <ProfileSparkline
          profile={profile}
          color={color}
          isSelected={isSelected}
        />
      </div>

      {/* Phase stats strip */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: isSelected
            ? `${color}08`
            : 'rgba(255,255,255,0.02)',
          borderTop: `1px solid ${isSelected ? `${color}15` : 'rgba(255,255,255,0.04)'}`,
        }}
      >
        <div className="flex items-center gap-1">
          <div
            className="w-1 h-1 rounded-full"
            style={{
              background: isSelected ? color : '#555577',
              boxShadow: isSelected ? `0 0 3px ${color}` : 'none',
            }}
          />
          <span className="text-[9px] text-db-text-muted tabular-nums">
            Low {Math.min(...Object.values(profile.phases))}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-1 h-1 rounded-full"
            style={{
              background: isSelected ? color : '#555577',
              boxShadow: isSelected ? `0 0 3px ${color}` : 'none',
            }}
          />
          <span className="text-[9px] text-db-text-muted tabular-nums">
            High {Math.max(...Object.values(profile.phases))}%
          </span>
        </div>
      </div>
    </motion.button>
  );
});

/* -------------------------------------------------------------------------- */
/*  Active profile summary                                                     */
/* -------------------------------------------------------------------------- */

function ActiveProfileSummary({ selectedId }: { selectedId: string }) {
  const active = TEMPERATURE_PROFILES.find((p) => p.id === selectedId);

  if (!selectedId || !active) return null;

  const color = getProfileColor(active.id);

  return (
    <motion.div
      className="mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}18`,
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      key={selectedId}
      transition={{ duration: 0.3 }}
    >
      <ProfileIconDisplay name={active.icon} size={14} style={{ color }} />
      <p className="text-[11px] text-db-text-dim leading-tight flex-1">
        <span className="font-medium" style={{ color }}>
          {active.name}
        </span>
        {' '}selected.{' '}
        Hot weather boost: +{active.hotWeatherBoost}%
        {' / '}
        Cold reduce: -{active.coldWeatherReduce}%
      </p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main selector component                                                    */
/* -------------------------------------------------------------------------- */

interface TemperatureProfileSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export default function TemperatureProfileSelector({
  selectedId,
  onSelect,
  className = '',
}: TemperatureProfileSelectorProps) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect],
  );

  return (
    <div className={className}>
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(78,205,196,0.15) 0%, transparent 70%)',
            border: '1px solid rgba(78,205,196,0.15)',
          }}
        >
          <Sparkles size={14} style={{ color: '#4ecdc4' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-db-text tracking-wide">
            Night Temperature Profile
          </h3>
          <p className="text-[10px] text-db-text-muted mt-0.5">
            Choose how the fan adjusts through sleep phases
          </p>
        </div>
      </div>

      {/* Mobile: horizontal scroll / Desktop: grid */}
      <div className="relative">
        {/* Horizontal scroll container on mobile, grid on lg */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-x-visible snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {TEMPERATURE_PROFILES.map((profile) => (
            <div key={profile.id} className="snap-start flex-shrink-0 w-[220px] lg:w-auto">
              <ProfileCard
                profile={profile}
                isSelected={profile.id === selectedId}
                onSelect={() => handleSelect(profile.id)}
              />
            </div>
          ))}
        </div>

        {/* Scroll fade hints on mobile */}
        <div
          className="absolute top-0 right-0 bottom-2 w-8 pointer-events-none lg:hidden"
          style={{
            background:
              'linear-gradient(to right, transparent, var(--db-navy))',
          }}
        />
      </div>

      {/* Active profile summary */}
      <ActiveProfileSummary selectedId={selectedId} />
    </div>
  );
}
