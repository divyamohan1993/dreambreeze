'use client';

import { motion } from 'motion/react';

/** Glassmorphism metric wrapper used in the dashboard 2x2 grid. */
export default function MetricCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="glass skeu-raised p-4 rounded-2xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-db-text-muted" />
        <span className="text-[11px] font-medium text-db-text-muted uppercase tracking-wider">
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );
}
