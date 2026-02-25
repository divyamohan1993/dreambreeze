'use client';

import { motion } from 'motion/react';
import type { Insight } from './types';

// -- Insight Card -------------------------------------------------------------

export function InsightCard({
  insight,
  index,
}: {
  insight: Insight;
  index: number;
}) {
  const { icon: Icon, text, color } = insight;

  return (
    <motion.div
      className="flex gap-3 p-3.5 rounded-xl"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.04)`,
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.5, ease: 'easeOut' }}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{
          background: `${color}15`,
          boxShadow: `0 0 8px ${color}15`,
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-sm text-db-text-dim leading-relaxed">{text}</p>
    </motion.div>
  );
}
