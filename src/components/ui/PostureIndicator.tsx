'use client';

import { motion, AnimatePresence } from 'motion/react';

type Posture = 'supine' | 'prone' | 'left-lateral' | 'right-lateral' | 'fetal' | 'unknown';

interface PostureIndicatorProps {
  posture: Posture;
  confidence: number; // 0-1
  className?: string;
}

const POSTURE_LABELS: Record<Posture, string> = {
  supine: 'On Back',
  prone: 'Face Down',
  'left-lateral': 'Left Side',
  'right-lateral': 'Right Side',
  fetal: 'Fetal',
  unknown: 'Detecting...',
};

// SVG path data for each posture silhouette — human figure
// All paths are designed in a 120x200 viewBox
const POSTURE_PATHS: Record<Posture, string> = {
  supine: `
    M60 20 C54 20 49 25 49 31 C49 37 54 42 60 42 C66 42 71 37 71 31 C71 25 66 20 60 20 Z
    M45 48 L35 50 L20 70 L26 73 L40 58 L45 65 L45 130 L35 175 L42 178 L55 135 L60 135
    L65 135 L78 178 L85 175 L75 130 L75 65 L80 58 L94 73 L100 70 L85 50 L75 48 Z
  `,
  prone: `
    M60 22 C54 22 49 27 49 33 C49 39 54 44 60 44 C66 44 71 39 71 33 C71 27 66 22 60 22 Z
    M46 50 L36 55 L22 80 L28 83 L40 63 L46 72 L44 130 L34 176 L41 179 L54 136 L60 136
    L66 136 L79 179 L86 176 L76 130 L74 72 L80 63 L92 83 L98 80 L84 55 L74 50 Z
    M50 33 Q48 30 46 33 Q44 36 47 38 Q50 40 52 38 Q54 36 52 33 Z
  `,
  'left-lateral': `
    M50 22 C44 22 39 27 39 33 C39 39 44 44 50 44 C56 44 61 39 61 33 C61 27 56 22 50 22 Z
    M40 50 L30 52 L18 75 L24 78 L35 62 L40 68 L38 105 L30 115 L28 140 L36 155 L45 165 L55 178
    L62 175 L52 162 L48 150 L55 140 L60 115 L58 105 L56 68 L56 50 Z
    M56 50 L75 55 L82 52 L58 46 Z
  `,
  'right-lateral': `
    M70 22 C64 22 59 27 59 33 C59 39 64 44 70 44 C76 44 81 39 81 33 C81 27 76 22 70 22 Z
    M80 50 L90 52 L102 75 L96 78 L85 62 L80 68 L82 105 L90 115 L92 140 L84 155 L75 165 L65 178
    L58 175 L68 162 L72 150 L65 140 L60 115 L62 105 L64 68 L64 50 Z
    M64 50 L45 55 L38 52 L62 46 Z
  `,
  fetal: `
    M68 28 C62 28 57 33 57 39 C57 45 62 50 68 50 C74 50 79 45 79 39 C79 33 74 28 68 28 Z
    M55 55 L42 60 L30 82 L36 86 L48 68 L50 80 L42 105 L28 130 L20 145 L28 150 L42 135
    L55 118 L58 135 L52 165 L48 180 L56 182 L62 165 L66 140 L68 120 L72 105 L78 80
    L82 68 L90 78 L96 74 L82 58 L70 53 Z
  `,
  unknown: `
    M60 20 C54 20 49 25 49 31 C49 37 54 42 60 42 C66 42 71 37 71 31 C71 25 66 20 60 20 Z
    M45 48 L35 50 L20 70 L26 73 L40 58 L45 65 L45 130 L35 175 L42 178 L55 135 L60 135
    L65 135 L78 178 L85 175 L75 130 L75 65 L80 58 L94 73 L100 70 L85 50 L75 48 Z
    M55 28 L57 34 L55 31 M65 28 L63 34 L65 31
  `,
};

export default function PostureIndicator({
  posture,
  confidence,
  className = '',
}: PostureIndicatorProps) {
  const glowIntensity = confidence * 0.6;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Figure container */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 120, height: 160 }}
      >
        {/* Background glow based on confidence */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at center, rgba(78, 205, 196, ${glowIntensity}) 0%, transparent 70%)`,
            filter: 'blur(16px)',
            transition: 'all 0.8s ease',
          }}
        />

        {/* SVG human silhouette */}
        <AnimatePresence mode="wait">
          <motion.svg
            key={posture}
            viewBox="0 0 120 200"
            width={100}
            height={140}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <defs>
              <linearGradient id="figure-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6e5ea8" stopOpacity={0.7} />
              </linearGradient>
              <filter id="figure-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <motion.path
              d={POSTURE_PATHS[posture]}
              fill="url(#figure-gradient)"
              filter="url(#figure-glow)"
              stroke="rgba(78, 205, 196, 0.3)"
              strokeWidth={0.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </motion.svg>
        </AnimatePresence>
      </div>

      {/* Label and confidence */}
      <div className="text-center">
        <motion.p
          key={posture}
          className="text-sm font-semibold text-db-text"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {POSTURE_LABELS[posture]}
        </motion.p>
        <p className="text-xs text-db-text-dim mt-0.5">
          {Math.round(confidence * 100)}% confidence
        </p>
      </div>
    </div>
  );
}
