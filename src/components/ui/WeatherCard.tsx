'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Droplets, Wind, ThermometerSun, Fan } from 'lucide-react';
import GlassCard from './GlassCard';
import type { WeatherData } from '@/lib/weather/weather-service';

/* -------------------------------------------------------------------------- */
/*  Weather icon SVGs (CSS/SVG, no emoji)                                      */
/* -------------------------------------------------------------------------- */

function SunIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <motion.line
          key={deg}
          x1="16"
          y1="3"
          x2="16"
          y2="6"
          stroke="#f0a060"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${deg} 16 16)`}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: deg / 360,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Core */}
      <circle cx="16" cy="16" r="6" fill="#f0a060" opacity="0.9" />
      <circle cx="16" cy="16" r="6" fill="url(#sunGrad)" />
      <defs>
        <radialGradient id="sunGrad" cx="0.4" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#ffe4a0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f0a060" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function MoonIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M22 16c0 5-4.5 9-9.5 8.5a8 8 0 1 0 9-13.5c.3 1.5.5 3.2.5 5z"
        fill="#6e5ea8"
        opacity="0.8"
      />
      <circle cx="20" cy="9" r="0.7" fill="rgba(255,255,255,0.3)" />
      <circle cx="25" cy="13" r="0.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="23" cy="7" r="0.4" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}

function CloudIcon({ size = 32, rain = false }: { size?: number; rain?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 22a4 4 0 0 1-.5-7.97A6 6 0 0 1 19 11a5 5 0 0 1 4.9 6H24a3 3 0 0 1 0 6H8z"
        fill="rgba(200,210,230,0.5)"
        stroke="rgba(200,210,230,0.3)"
        strokeWidth="0.5"
      />
      {rain && (
        <>
          {[12, 17, 22].map((x, i) => (
            <motion.line
              key={i}
              x1={x}
              y1="24"
              x2={x - 1}
              y2="28"
              stroke="#4ecdc4"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.7"
              animate={{ y: [0, 3, 0], opacity: [0.7, 0.3, 0.7] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </>
      )}
    </svg>
  );
}

function FogIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {[11, 16, 21].map((y, i) => (
        <motion.line
          key={i}
          x1="6"
          y1={y}
          x2="26"
          y2={y}
          stroke="rgba(200,210,230,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ x: [-2, 2, -2], opacity: [0.3, 0.6, 0.3] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  );
}

function SnowIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 19 8a5 5 0 0 1 4.9 6H24a3 3 0 0 1 0 6H8z"
        fill="rgba(200,210,230,0.4)"
        stroke="rgba(200,210,230,0.2)"
        strokeWidth="0.5"
      />
      {[11, 16, 21].map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={26}
          r="1.2"
          fill="rgba(230,240,255,0.6)"
          animate={{ y: [0, 4, 0], opacity: [0.8, 0.3, 0.8] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  );
}

function ThunderIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 19 8a5 5 0 0 1 4.9 6H24a3 3 0 0 1 0 6H8z"
        fill="rgba(180,190,210,0.5)"
        stroke="rgba(180,190,210,0.3)"
        strokeWidth="0.5"
      />
      <motion.path
        d="M17 19l-2 5 3-1-2 5"
        stroke="#f0a060"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/** Select weather icon based on description */
function WeatherIcon({
  description,
  isNight,
  size = 32,
}: {
  description: string;
  isNight: boolean;
  size?: number;
}) {
  const desc = description.toLowerCase();

  if (desc.includes('thunder')) return <ThunderIcon size={size} />;
  if (desc.includes('snow')) return <SnowIcon size={size} />;
  if (desc.includes('fog') || desc.includes('rime')) return <FogIcon size={size} />;
  if (
    desc.includes('rain') ||
    desc.includes('drizzle') ||
    desc.includes('shower')
  )
    return <CloudIcon size={size} rain />;
  if (desc.includes('cloud') || desc.includes('overcast'))
    return <CloudIcon size={size} />;
  if (desc.includes('clear') || desc.includes('mainly clear'))
    return isNight ? <MoonIcon size={size} /> : <SunIcon size={size} />;

  return isNight ? <MoonIcon size={size} /> : <SunIcon size={size} />;
}

/* -------------------------------------------------------------------------- */
/*  Skeuomorphic Thermometer                                                   */
/* -------------------------------------------------------------------------- */

function Thermometer({ temperature }: { temperature: number }) {
  // Map temperature range (-10..45) to fill percentage (5..95)
  const fillPct = useMemo(() => {
    const clamped = Math.max(-10, Math.min(45, temperature));
    return 5 + ((clamped + 10) / 55) * 90;
  }, [temperature]);

  // Temperature color gradient: blue -> teal -> amber -> rose
  const mercuryColor = useMemo(() => {
    if (temperature < 10) return '#6e9ed4'; // cool blue
    if (temperature < 20) return '#4ecdc4'; // teal
    if (temperature < 28) return '#f0a060'; // amber
    return '#e94560'; // rose / hot
  }, [temperature]);

  return (
    <div className="relative flex flex-col items-center" style={{ width: 28, height: 90 }}>
      {/* Tube - outer glass */}
      <div
        className="relative w-3 flex-1 rounded-t-full overflow-hidden"
        style={{
          background: 'rgba(10, 14, 39, 0.7)',
          boxShadow:
            'inset 2px 0 4px rgba(0,0,0,0.5), inset -1px 0 2px rgba(255,255,255,0.05), 0 0 6px rgba(0,0,0,0.3)',
        }}
      >
        {/* Mercury fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-t-full"
          style={{
            background: `linear-gradient(to top, ${mercuryColor}, ${mercuryColor}dd)`,
            boxShadow: `inset 0 0 3px rgba(255,255,255,0.2), 0 0 6px ${mercuryColor}60`,
          }}
          initial={{ height: '5%' }}
          animate={{ height: `${fillPct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Glass highlight */}
        <div
          className="absolute top-0 left-[2px] w-[2px] h-full rounded-full"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.02))',
          }}
        />
      </div>

      {/* Bulb */}
      <div
        className="relative rounded-full"
        style={{
          width: 18,
          height: 18,
          marginTop: -2,
          background: `radial-gradient(circle at 40% 35%, ${mercuryColor}cc, ${mercuryColor})`,
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3), 0 0 8px ${mercuryColor}40`,
        }}
      >
        {/* Bulb highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: 3,
            left: 4,
            width: 5,
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />
      </div>

      {/* Scale marks */}
      {[0, 25, 50, 75, 100].map((pct) => (
        <div
          key={pct}
          className="absolute"
          style={{
            right: 0,
            bottom: `${8 + pct * 0.62}%`,
            width: 4,
            height: 1,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Animated weather background                                                */
/* -------------------------------------------------------------------------- */

function WeatherBackground({
  description,
  isNight,
}: {
  description: string;
  isNight: boolean;
}) {
  const desc = description.toLowerCase();

  const bgGradient = useMemo(() => {
    if (isNight) {
      return 'radial-gradient(ellipse at 70% 20%, rgba(110,94,168,0.08) 0%, transparent 60%)';
    }
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      return 'radial-gradient(ellipse at 30% 80%, rgba(78,205,196,0.06) 0%, transparent 60%)';
    }
    if (desc.includes('clear') || desc.includes('sunny')) {
      return 'radial-gradient(ellipse at 80% 20%, rgba(240,160,96,0.08) 0%, transparent 60%)';
    }
    return 'radial-gradient(ellipse at 50% 50%, rgba(78,205,196,0.04) 0%, transparent 60%)';
  }, [desc, isNight]);

  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{ background: bgGradient }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Subtle floating particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 2,
            height: 2,
            background: isNight
              ? 'rgba(110,94,168,0.2)'
              : 'rgba(78,205,196,0.15)',
            left: `${20 + i * 18}%`,
            top: `${30 + (i % 3) * 15}%`,
          }}
          animate={{
            y: [-8, 8, -8],
            x: [-4, 4, -4],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + i * 0.8,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main WeatherCard                                                           */
/* -------------------------------------------------------------------------- */

interface WeatherCardProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  recommendation: { speedAdjustment: number; reasoning: string } | null;
  onRefresh: () => void;
  className?: string;
}

export default function WeatherCard({
  weather,
  loading,
  error,
  recommendation,
  onRefresh,
  className = '',
}: WeatherCardProps) {
  // Loading state
  if (loading && !weather) {
    return (
      <GlassCard title="Weather" icon={ThermometerSun} glowColor="teal" className={className}>
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw size={20} className="text-db-text-dim" />
          </motion.div>
          <span className="ml-3 text-sm text-db-text-dim">Fetching weather...</span>
        </div>
      </GlassCard>
    );
  }

  // Error state
  if (error && !weather) {
    return (
      <GlassCard title="Weather" icon={ThermometerSun} glowColor="teal" className={className}>
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-xs text-db-text-dim text-center">{error}</p>
          <p className="text-[10px] text-db-text-muted text-center">
            Enable location access to see local weather
          </p>
          <motion.button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-db-teal"
            style={{
              background: 'rgba(78, 205, 196, 0.1)',
              border: '1px solid rgba(78, 205, 196, 0.2)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={12} />
            Retry
          </motion.button>
        </div>
      </GlassCard>
    );
  }

  if (!weather) return null;

  const adjustSign = recommendation && recommendation.speedAdjustment > 0 ? '+' : '';
  const adjustColor =
    recommendation && recommendation.speedAdjustment > 0
      ? '#f0a060'
      : recommendation && recommendation.speedAdjustment < 0
        ? '#4ecdc4'
        : '#8888aa';

  return (
    <GlassCard className={`relative overflow-hidden ${className}`}>
      {/* Animated background effect */}
      <WeatherBackground description={weather.description} isNight={weather.isNight} />

      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <ThermometerSun
              size={18}
              style={{ color: '#4ecdc4' }}
            />
            <h3 className="text-sm font-semibold text-db-text tracking-wide">
              Weather
            </h3>
          </div>
          <motion.button
            onClick={onRefresh}
            className="p-1.5 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.9 }}
            title="Refresh weather"
          >
            <motion.div
              animate={loading ? { rotate: 360 } : {}}
              transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <RefreshCw size={13} className="text-db-text-dim" />
            </motion.div>
          </motion.button>
        </div>

        {/* Main content: thermometer + temperature + weather icon */}
        <div className="flex items-center gap-5 mb-4">
          {/* Skeuomorphic thermometer */}
          <Thermometer temperature={weather.temperatureCelsius} />

          {/* Temperature display */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div>
                <motion.div
                  className="flex items-baseline gap-1"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-4xl font-bold text-db-text tabular-nums tracking-tight">
                    {Math.round(weather.temperatureCelsius)}
                  </span>
                  <span className="text-lg text-db-text-dim font-light">°C</span>
                </motion.div>

                <p className="text-xs text-db-text-dim mt-0.5">{weather.description}</p>
              </div>

              {/* Weather icon */}
              <div className="ml-auto">
                <WeatherIcon
                  description={weather.description}
                  isNight={weather.isNight}
                  size={40}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Feels like */}
          <div
            className="flex flex-col items-center gap-1 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <ThermometerSun size={13} style={{ color: '#f0a060' }} />
            <span className="text-xs text-db-text tabular-nums font-medium">
              {weather.feelsLike.toFixed(0)}°
            </span>
            <span className="text-[9px] text-db-text-muted uppercase tracking-wider">
              Feels like
            </span>
          </div>

          {/* Humidity */}
          <div
            className="flex flex-col items-center gap-1 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Droplets size={13} style={{ color: '#4ecdc4' }} />
            <span className="text-xs text-db-text tabular-nums font-medium">
              {weather.humidity}%
            </span>
            <span className="text-[9px] text-db-text-muted uppercase tracking-wider">
              Humidity
            </span>
          </div>

          {/* Wind */}
          <div
            className="flex flex-col items-center gap-1 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Wind size={13} style={{ color: '#6e5ea8' }} />
            <span className="text-xs text-db-text tabular-nums font-medium">
              {weather.windSpeed.toFixed(0)}
            </span>
            <span className="text-[9px] text-db-text-muted uppercase tracking-wider">
              km/h
            </span>
          </div>
        </div>

        {/* Fan recommendation */}
        {recommendation && (
          <motion.div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{
              background:
                recommendation.speedAdjustment !== 0
                  ? `${adjustColor}08`
                  : 'rgba(255,255,255,0.03)',
              border: `1px solid ${
                recommendation.speedAdjustment !== 0
                  ? `${adjustColor}20`
                  : 'rgba(255,255,255,0.05)'
              }`,
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${adjustColor}25 0%, transparent 70%)`,
              }}
            >
              <Fan size={14} style={{ color: adjustColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-db-text-dim leading-tight">
                {recommendation.reasoning}
                {recommendation.speedAdjustment !== 0 && (
                  <span className="font-semibold ml-1" style={{ color: adjustColor }}>
                    {adjustSign}
                    {recommendation.speedAdjustment}% airflow
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Last updated */}
        <p className="text-[9px] text-db-text-muted text-right mt-3">
          Updated {new Date(weather.fetchedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </GlassCard>
  );
}
