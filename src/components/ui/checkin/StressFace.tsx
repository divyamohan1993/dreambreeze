'use client';

import { motion } from 'motion/react';

// -- Stress Face SVG Icons ----------------------------------------------------
// Custom styled faces instead of emoji to maintain skeuomorphic aesthetic

export function StressFace({ level, isActive }: { level: number; isActive: boolean }) {
  const activeColor = isActive ? '#4ecdc4' : '#555577';
  const bgOpacity = isActive ? 0.15 : 0.04;
  const glowShadow = isActive
    ? '0 0 16px rgba(78, 205, 196, 0.3), 0 0 4px rgba(78, 205, 196, 0.2)'
    : 'none';

  // Different mouth paths for each stress level
  const getMouthPath = () => {
    switch (level) {
      case 1: // Very calm - big smile
        return 'M9 14 Q12 18 15 14';
      case 2: // Relaxed - gentle smile
        return 'M9.5 14.5 Q12 16.5 14.5 14.5';
      case 3: // Neutral - straight line
        return 'M9.5 15 L14.5 15';
      case 4: // Tense - slight frown
        return 'M9.5 16 Q12 14 14.5 16';
      case 5: // Stressed - wavy frown
        return 'M9 16.5 Q10.5 14.5 12 16 Q13.5 14.5 15 16.5';
      default:
        return 'M9.5 15 L14.5 15';
    }
  };

  // Different eye shapes for stress levels
  const getEyes = () => {
    switch (level) {
      case 1: // Calm - happy closed eyes
        return (
          <>
            <path d="M8 11 Q9 9.5 10 11" stroke={activeColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M14 11 Q15 9.5 16 11" stroke={activeColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        );
      case 2: // Relaxed - soft eyes
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1" fill={activeColor} />
          </>
        );
      case 3: // Neutral
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.2" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.2" fill={activeColor} />
          </>
        );
      case 4: // Tense - slightly wide eyes
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.4" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.4" fill={activeColor} />
            {/* Eyebrows angled */}
            <path d="M8 8.5 L11 8" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16 8.5 L13 8" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
          </>
        );
      case 5: // Stressed - wide eyes, raised eyebrows
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.6" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.6" fill={activeColor} />
            {/* Droplet for sweat */}
            <path d="M17 8 Q17.5 9.5 17 10 Q16.5 9.5 17 8Z" fill={activeColor} opacity={0.6} />
            {/* Worried eyebrows */}
            <path d="M7.5 8 L10.5 7.5" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16.5 8 L13.5 7.5" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
          </>
        );
      default:
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.2" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.2" fill={activeColor} />
          </>
        );
    }
  };

  const stressLabels = ['', 'Calm', 'Relaxed', 'Neutral', 'Tense', 'Stressed'];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          width: 56,
          height: 56,
          background: `rgba(78, 205, 196, ${bgOpacity})`,
          border: `1.5px solid ${isActive ? 'rgba(78, 205, 196, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
          boxShadow: isActive
            ? `${glowShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.08)`
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <svg viewBox="0 0 24 24" width={32} height={32}>
          {/* Face outline */}
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke={activeColor}
            strokeWidth="1.2"
            opacity={0.4}
          />
          {/* Eyes */}
          {getEyes()}
          {/* Mouth */}
          <path
            d={getMouthPath()}
            stroke={activeColor}
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </motion.div>
      <span
        className="text-[10px] font-medium transition-colors duration-200"
        style={{ color: isActive ? '#4ecdc4' : '#555577' }}
      >
        {stressLabels[level]}
      </span>
    </div>
  );
}
