'use client';

import { motion } from 'motion/react';

interface LEDStripProps {
  activeCount: number; // 0-5
  className?: string;
}

const LED_COLORS = [
  { active: '#00cc00', glow: 'rgba(0, 204, 0,', dark: 'rgba(0, 80, 0, 0.4)' },
  { active: '#e6c619', glow: 'rgba(230, 198, 25,', dark: 'rgba(90, 78, 10, 0.4)' },
  { active: '#e68a19', glow: 'rgba(230, 138, 25,', dark: 'rgba(90, 54, 10, 0.4)' },
  { active: '#e63919', glow: 'rgba(230, 57, 25,', dark: 'rgba(90, 22, 10, 0.4)' },
  { active: '#a855f7', glow: 'rgba(168, 85, 247,', dark: 'rgba(66, 33, 97, 0.4)' },
];

const LED_LABELS = ['1', '2', '3', '4', '5'];

export default function LEDStrip({
  activeCount,
  className = '',
}: LEDStripProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {LED_COLORS.map((led, i) => {
        const isActive = i < activeCount;
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            {/* LED housing */}
            <div
              className="relative rounded-full"
              style={{
                width: 20,
                height: 20,
                background: '#0d1128',
                boxShadow:
                  'inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)',
                padding: 3,
              }}
            >
              {/* LED element */}
              <motion.div
                className="relative w-full h-full rounded-full overflow-hidden"
                animate={
                  isActive
                    ? {
                        boxShadow: [
                          `0 0 3px ${led.glow}0.9), 0 0 8px ${led.glow}0.5), 0 0 20px ${led.glow}0.25)`,
                          `0 0 4px ${led.glow}1), 0 0 12px ${led.glow}0.6), 0 0 28px ${led.glow}0.35)`,
                          `0 0 3px ${led.glow}0.9), 0 0 8px ${led.glow}0.5), 0 0 20px ${led.glow}0.25)`,
                        ],
                      }
                    : {
                        boxShadow: `0 0 0px transparent`,
                      }
                }
                transition={
                  isActive
                    ? {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : { duration: 0.3 }
                }
                style={{
                  background: isActive ? led.active : led.dark,
                  transition: 'background 0.3s ease',
                }}
              >
                {/* Specular highlight */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 6,
                    height: 4,
                    top: 2,
                    left: 3,
                    background: isActive
                      ? 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 100%)'
                      : 'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 100%)',
                    transition: 'all 0.3s ease',
                  }}
                />
              </motion.div>
            </div>

            {/* Label */}
            <span
              className="text-[9px] font-mono"
              style={{
                color: isActive ? led.active : '#444466',
                transition: 'color 0.3s ease',
              }}
            >
              {LED_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
