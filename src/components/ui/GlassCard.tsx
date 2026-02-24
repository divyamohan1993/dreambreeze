'use client';

import { type ReactNode, type ElementType } from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  title?: string;
  icon?: ElementType;
  glowColor?: 'teal' | 'lavender' | 'rose';
  className?: string;
  children: ReactNode;
}

const GLOW_MAP = {
  teal: {
    border: 'rgba(78, 205, 196, 0.2)',
    shadow: 'rgba(78, 205, 196, 0.08)',
    gradient: 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(78,205,196,0.02))',
    iconColor: '#4ecdc4',
  },
  lavender: {
    border: 'rgba(110, 94, 168, 0.25)',
    shadow: 'rgba(110, 94, 168, 0.1)',
    gradient: 'linear-gradient(135deg, rgba(110,94,168,0.15), rgba(110,94,168,0.02))',
    iconColor: '#6e5ea8',
  },
  rose: {
    border: 'rgba(233, 69, 96, 0.2)',
    shadow: 'rgba(233, 69, 96, 0.08)',
    gradient: 'linear-gradient(135deg, rgba(233,69,96,0.15), rgba(233,69,96,0.02))',
    iconColor: '#e94560',
  },
};

export default function GlassCard({
  title,
  icon: Icon,
  glowColor,
  className = '',
  children,
}: GlassCardProps) {
  const glow = glowColor ? GLOW_MAP[glowColor] : null;

  return (
    <motion.div
      className={`glass relative overflow-hidden ${className}`}
      whileHover={{
        backgroundColor: 'rgba(255, 255, 255, 0.09)',
        y: -2,
        transition: { duration: 0.25 },
      }}
      style={{
        boxShadow: glow
          ? `0 0 24px ${glow.shadow}, 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`
          : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Gradient border overlay via pseudo-element technique */}
      {glow && (
        <div
          className="absolute inset-0 rounded-[16px] pointer-events-none"
          style={{
            border: `1px solid ${glow.border}`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMaskComposite: 'xor',
            padding: 1,
          }}
        />
      )}

      {/* Subtle top gradient sheen */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: glow
            ? glow.gradient
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-5">
        {(title || Icon) && (
          <div className="flex items-center gap-2.5 mb-3">
            {Icon && (
              <Icon
                size={18}
                style={{ color: glow?.iconColor || '#8888aa' }}
              />
            )}
            {title && (
              <h3 className="text-sm font-semibold text-db-text tracking-wide">
                {title}
              </h3>
            )}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
