'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ------------------------------------------------------------------ */
/*  Particle config                                                    */
/* ------------------------------------------------------------------ */

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  animateY: number;
  animateX: number;
}

function useParticles(count: number): Particle[] {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.3,
      animateY: -30 - Math.random() * 40,
      animateX: (Math.random() - 0.5) * 20,
    })),
  );
  return particles;
}

/* ------------------------------------------------------------------ */
/*  Fan blade SVG (inline for the spinner)                             */
/* ------------------------------------------------------------------ */

function FanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="loadBlade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#5eded6' }} />
          <stop offset="100%" style={{ stopColor: '#3abdb5' }} />
        </linearGradient>
      </defs>

      {/* Center hub */}
      <circle cx="50" cy="50" r="7" fill="#4ecdc4" opacity={0.95} />
      <circle cx="50" cy="50" r="4" fill="#0a0e27" opacity={0.4} />

      {/* Three blades */}
      <g fill="url(#loadBlade)" opacity={0.85}>
        <path d="M 50,42 C 56,34 60,14 54,6 C 50,2 46,6 44,12 C 40,24 42,36 50,42 Z" />
        <path d="M 57,54 C 64,58 82,66 88,58 C 92,52 86,48 78,46 C 66,42 58,46 57,54 Z" />
        <path d="M 43,54 C 36,58 18,66 12,58 C 8,52 14,48 22,46 C 34,42 42,46 43,54 Z" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [ready, setReady] = useState(false);
  const particles = useParticles(20);

  /* Wait for the document to be interactive, then fade out */
  useEffect(() => {
    // Mark ready after a minimum splash duration so it doesn't flash
    const minTimer = setTimeout(() => setReady(true), 400);

    const handleLoad = () => {
      // If minimum time already passed, dismiss immediately
      setReady((prev) => {
        if (prev) setShow(false);
        return true;
      });
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearTimeout(minTimer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  /* Once ready flag is true and we haven't dismissed yet, dismiss */
  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
          style={{ background: '#0a0e27' }}
        >
          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background:
                    p.id % 3 === 0
                      ? 'rgba(78,205,196,0.6)'
                      : p.id % 3 === 1
                        ? 'rgba(110,94,168,0.5)'
                        : 'rgba(224,224,238,0.3)',
                }}
                animate={{
                  y: [0, p.animateY, 0],
                  x: [0, p.animateX, 0],
                  opacity: [p.opacity, p.opacity * 1.8, p.opacity],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Radial glow behind fan */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 240,
              height: 240,
              background:
                'radial-gradient(circle, rgba(78,205,196,0.08) 0%, rgba(78,205,196,0) 70%)',
            }}
          />

          {/* Spinning fan */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="w-24 h-24 relative z-10"
          >
            <FanIcon className="w-full h-full" />
          </motion.div>

          {/* Brand text */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className="mt-8 text-2xl font-bold tracking-wide relative z-10"
            style={{
              background: 'linear-gradient(135deg, #4ecdc4, #6e5ea8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            DreamBreeze
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-2 text-xs text-db-text-dim tracking-widest uppercase relative z-10"
          >
            AI Sleep Comfort
          </motion.p>

          {/* Loading bar */}
          <motion.div
            className="mt-8 h-[2px] rounded-full overflow-hidden relative z-10"
            style={{ width: 120, background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, #4ecdc4, #6e5ea8, #4ecdc4)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}