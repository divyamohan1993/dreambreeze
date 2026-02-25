'use client';

import { motion } from 'motion/react';

// -- Progress Dots ------------------------------------------------------------

export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          animate={{
            width: i === current ? 24 : 8,
            height: 8,
            backgroundColor: i === current ? '#4ecdc4' : i < current ? 'rgba(78, 205, 196, 0.4)' : 'rgba(255, 255, 255, 0.08)',
          }}
          style={{
            boxShadow: i === current ? '0 0 8px rgba(78, 205, 196, 0.4)' : 'none',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      ))}
    </div>
  );
}
