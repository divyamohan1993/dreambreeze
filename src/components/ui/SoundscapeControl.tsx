'use client';

import { useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CloudRain,
  Waves,
  TreePine,
  Wind,
  Radio,
  AudioLines,
  Play,
  Pause,
  Zap,
} from 'lucide-react';
import type { NoiseType } from '@/types/sleep';

interface SoundscapeControlProps {
  noiseType: NoiseType;
  volume: number; // 0-100
  isAdaptive: boolean;
  isPlaying: boolean;
  onTypeChange: (type: NoiseType) => void;
  onVolumeChange: (volume: number) => void;
  onAdaptiveToggle: () => void;
  onPlayToggle: () => void;
}

const NOISE_TYPES: {
  type: NoiseType;
  label: string;
  icon: typeof Wind;
  color: string;
}[] = [
  { type: 'white', label: 'White', icon: Radio, color: '#e0e0ee' },
  { type: 'pink', label: 'Pink', icon: AudioLines, color: '#e88ca5' },
  { type: 'brown', label: 'Brown', icon: Wind, color: '#c4956a' },
  { type: 'rain', label: 'Rain', icon: CloudRain, color: '#4ecdc4' },
  { type: 'ocean', label: 'Ocean', icon: Waves, color: '#6e9ed4' },
  { type: 'forest', label: 'Forest', icon: TreePine, color: '#6eb87a' },
];

function WaveformAnimation({ isPlaying }: { isPlaying: boolean }) {
  const bars = [3, 5, 2, 6, 4, 3, 5, 2, 4, 6, 3, 5];
  return (
    <div className="flex items-end gap-[2px] h-4">
      {bars.map((maxH, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-db-teal"
          animate={
            isPlaying
              ? {
                  height: [2, maxH * 2.5, 2],
                  opacity: [0.4, 0.9, 0.4],
                }
              : { height: 2, opacity: 0.2 }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.6 + Math.random() * 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.05,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export default function SoundscapeControl({
  noiseType,
  volume,
  isAdaptive,
  isPlaying,
  onTypeChange,
  onVolumeChange,
  onAdaptiveToggle,
  onPlayToggle,
}: SoundscapeControlProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(Number(e.target.value));
    },
    [onVolumeChange]
  );

  const activeNoise = NOISE_TYPES.find((n) => n.type === noiseType);

  return (
    <div className="w-full space-y-5">
      {/* Noise type selector */}
      <div>
        <p className="text-xs text-db-text-dim mb-3 font-medium uppercase tracking-wider">
          Soundscape
        </p>
        <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Soundscape type">
          {NOISE_TYPES.map(({ type, label, icon: Icon, color }) => {
            const isActive = type === noiseType;
            return (
              <motion.button
                key={type}
                role="radio"
                aria-checked={isActive}
                aria-label={`${label} noise`}
                onClick={() => onTypeChange(type)}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-colors"
                style={{
                  background: isActive
                    ? `${color}15`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: isActive
                    ? `0 0 12px ${color}20, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: isActive
                      ? `radial-gradient(circle, ${color}30 0%, transparent 70%)`
                      : 'transparent',
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      color: isActive ? color : '#555577',
                      transition: 'color 0.2s',
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? color : '#555577',
                    transition: 'color 0.2s',
                  }}
                >
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Volume fader */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-db-text-dim font-medium uppercase tracking-wider">
            Volume
          </p>
          <span className="text-xs text-db-text tabular-nums font-mono">
            {volume}%
          </span>
        </div>

        <div className="relative h-10 flex items-center">
          {/* Track background */}
          <div
            className="absolute inset-x-0 h-2 rounded-full"
            style={{
              background: 'rgba(10, 14, 39, 0.6)',
              boxShadow:
                'inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Filled portion */}
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${volume}%`,
                background:
                  'linear-gradient(90deg, #4ecdc4, #6e5ea8)',
                boxShadow:
                  '0 0 8px rgba(78, 205, 196, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
              initial={false}
              animate={{ width: `${volume}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Custom range input overlay */}
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            aria-label="Volume"
            onChange={handleSliderChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />

          {/* Custom knob */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: `calc(${volume}% - 10px)`,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background:
                'conic-gradient(from 0deg, #6a7088, #8a94a8, #6a7088, #5a6078, #6a7088)',
              boxShadow:
                '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)',
            }}
            initial={false}
            animate={{ left: `calc(${volume}% - 10px)` }}
            transition={{ duration: 0.1 }}
          >
            {/* Knob indicator line */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-[3px]"
              style={{
                width: 2,
                height: 5,
                borderRadius: 1,
                background: '#4ecdc4',
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom controls row */}
      <div className="flex items-center justify-between">
        {/* Play/Pause */}
        <motion.button
          onClick={onPlayToggle}
          aria-label={isPlaying ? 'Pause soundscape' : 'Play soundscape'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: isPlaying
              ? 'rgba(78, 205, 196, 0.12)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isPlaying ? 'rgba(78, 205, 196, 0.25)' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: isPlaying
              ? '0 0 12px rgba(78, 205, 196, 0.1)'
              : 'none',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isPlaying ? (
            <Pause size={14} className="text-db-teal" />
          ) : (
            <Play size={14} className="text-db-text-dim" />
          )}
          <span
            className="text-xs font-medium"
            style={{ color: isPlaying ? '#4ecdc4' : '#8888aa' }}
          >
            {isPlaying ? 'Playing' : 'Paused'}
          </span>

          {/* Waveform */}
          <WaveformAnimation isPlaying={isPlaying} />
        </motion.button>

        {/* Adaptive toggle */}
        <motion.button
          onClick={onAdaptiveToggle}
          role="switch"
          aria-checked={isAdaptive}
          aria-label="Adaptive sound mode"
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: isAdaptive
              ? 'rgba(110, 94, 168, 0.15)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isAdaptive ? 'rgba(110, 94, 168, 0.3)' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: isAdaptive
              ? '0 0 12px rgba(110, 94, 168, 0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
              : 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Zap
            size={13}
            style={{
              color: isAdaptive ? '#6e5ea8' : '#555577',
              transition: 'color 0.2s',
            }}
          />
          <span
            className="text-xs font-medium"
            style={{
              color: isAdaptive ? '#6e5ea8' : '#555577',
              transition: 'color 0.2s',
            }}
          >
            Adaptive
          </span>

          {/* Pill indicator */}
          <div
            className="relative w-7 h-4 rounded-full"
            style={{
              background: isAdaptive
                ? 'rgba(110, 94, 168, 0.4)'
                : 'rgba(255,255,255,0.06)',
              transition: 'background 0.2s',
            }}
          >
            <motion.div
              className="absolute top-0.5 w-3 h-3 rounded-full"
              style={{
                background: isAdaptive
                  ? '#6e5ea8'
                  : '#555577',
                boxShadow: isAdaptive
                  ? '0 0 4px rgba(110, 94, 168, 0.5)'
                  : 'none',
              }}
              animate={{
                left: isAdaptive ? 14 : 2,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </div>
        </motion.button>
      </div>

      {/* Currently playing info */}
      {isPlaying && activeNoise && (
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: activeNoise.color,
              boxShadow: `0 0 4px ${activeNoise.color}`,
              animation: 'led-pulse 2s ease-in-out infinite',
            }}
          />
          <span className="text-[11px] text-db-text-dim">
            Now playing:{' '}
            <span style={{ color: activeNoise.color }} className="font-medium">
              {activeNoise.label} Noise
            </span>
            {isAdaptive && (
              <span className="text-db-text-muted ml-1">(adaptive)</span>
            )}
          </span>
        </motion.div>
      )}
    </div>
  );
}
