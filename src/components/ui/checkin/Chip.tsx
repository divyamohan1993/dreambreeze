'use client';

import { motion } from 'motion/react';

// -- Selectable Chip Component ------------------------------------------------

export interface ChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function Chip({ label, isActive, onClick, icon, accentColor = '#4ecdc4' }: ChipProps) {
  const glowRgba = accentColor === '#4ecdc4'
    ? 'rgba(78, 205, 196, VAR)'
    : accentColor === '#6e5ea8'
      ? 'rgba(110, 94, 168, VAR)'
      : accentColor === '#f0a060'
        ? 'rgba(240, 160, 96, VAR)'
        : 'rgba(78, 205, 196, VAR)';

  return (
    <motion.button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium overflow-hidden"
      style={{
        background: isActive
          ? `${accentColor}18`
          : 'rgba(255, 255, 255, 0.04)',
        border: `1.5px solid ${isActive ? `${accentColor}50` : 'rgba(255, 255, 255, 0.06)'}`,
        color: isActive ? accentColor : '#8888aa',
        boxShadow: isActive
          ? `0 0 16px ${glowRgba.replace('VAR', '0.15')}, 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)`
          : '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Selected indicator glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accentColor}15 0%, transparent 70%)`,
          }}
        />
      )}
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}
