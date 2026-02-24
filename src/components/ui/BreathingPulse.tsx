'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';

interface BreathingPulseProps {
  rate?: number; // breaths per minute, default 15
  size?: number;
  className?: string;
}

export default function BreathingPulse({
  rate = 15,
  size = 80,
  className = '',
}: BreathingPulseProps) {
  // Convert BPM to cycle duration in seconds
  const cycleDuration = useMemo(() => 60 / rate, [rate]);

  const rings = [
    { scale: [1, 1.25, 1], opacity: [0.12, 0.2, 0.12], delay: 0 },
    { scale: [1, 1.35, 1], opacity: [0.08, 0.14, 0.08], delay: cycleDuration * 0.12 },
    { scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05], delay: cycleDuration * 0.24 },
  ];

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Concentric rings */}
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size * (0.5 + i * 0.15),
            height: size * (0.5 + i * 0.15),
            border: '1px solid rgba(78, 205, 196, 0.15)',
            background: `radial-gradient(circle, rgba(78, 205, 196, 0.06) 0%, transparent 70%)`,
          }}
          animate={{
            scale: ring.scale,
            opacity: ring.opacity,
          }}
          transition={{
            duration: cycleDuration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: ring.delay,
          }}
        />
      ))}

      {/* Center dot */}
      <motion.div
        className="relative z-10 rounded-full"
        style={{
          width: size * 0.12,
          height: size * 0.12,
          background: 'rgba(78, 205, 196, 0.5)',
          boxShadow: '0 0 8px rgba(78, 205, 196, 0.3)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: cycleDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
