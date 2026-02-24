'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';

interface SpeedKnobProps {
  value: number; // 0-4 for 5 positions
  onChange: (level: number) => void;
  size?: number;
  disabled?: boolean;
}

const DETENTS = [
  { label: 'Off', angle: -135 },
  { label: 'Breeze', angle: -67.5 },
  { label: 'Gentle', angle: 0 },
  { label: 'Strong', angle: 67.5 },
  { label: 'Turbo', angle: 135 },
];

function angleToDetent(angle: number): number {
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < DETENTS.length; i++) {
    const dist = Math.abs(angle - DETENTS[i].angle);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

export default function SpeedKnob({
  value,
  onChange,
  size = 200,
  disabled = false,
}: SpeedKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startAngleRef = useRef(0);
  const currentRotation = useMotionValue(DETENTS[value].angle);
  const [activeDetent, setActiveDetent] = useState(value);

  // Update rotation when value prop changes externally
  useEffect(() => {
    if (!isDragging.current) {
      currentRotation.set(DETENTS[value].angle);
      setActiveDetent(value);
    }
  }, [value, currentRotation]);

  // Indicator glow based on rotation
  const glowOpacity = useTransform(currentRotation, [-135, 135], [0, 1]);
  const glowColor = useTransform(
    currentRotation,
    [-135, -67.5, 0, 67.5, 135],
    [
      'rgba(78, 205, 196, 0)',
      'rgba(78, 205, 196, 0.6)',
      'rgba(78, 205, 196, 0.8)',
      'rgba(240, 160, 96, 0.8)',
      'rgba(233, 69, 96, 0.9)',
    ]
  );

  const getAngleFromEvent = useCallback(
    (clientX: number, clientY: number): number => {
      if (!knobRef.current) return 0;
      const rect = knobRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    },
    []
  );

  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      isDragging.current = true;
      startAngleRef.current =
        getAngleFromEvent(clientX, clientY) - currentRotation.get();
    },
    [disabled, getAngleFromEvent, currentRotation]
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current || disabled) return;
      const eventAngle = getAngleFromEvent(clientX, clientY);
      let newAngle = eventAngle - startAngleRef.current;

      // Clamp to range
      newAngle = Math.max(-135, Math.min(135, newAngle));
      currentRotation.set(newAngle);

      // Check for detent snap
      const detent = angleToDetent(newAngle);
      if (detent !== activeDetent) {
        setActiveDetent(detent);
        // Haptic feedback at detent positions
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(5);
        }
      }
    },
    [disabled, getAngleFromEvent, currentRotation, activeDetent]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Snap to nearest detent
    const current = currentRotation.get();
    const detent = angleToDetent(current);
    currentRotation.set(DETENTS[detent].angle);
    setActiveDetent(detent);
    onChange(detent);
  }, [currentRotation, onChange]);

  // Pointer events
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleDragStart(e.clientX, e.clientY);
    },
    [handleDragStart]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      handleDragMove(e.clientX, e.clientY);
    },
    [handleDragMove]
  );

  const onPointerUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const outerRingSize = size;
  const knobSize = size * 0.7;
  const tickRadius = size * 0.44;

  return (
    <div
      className="relative select-none"
      style={{ width: outerRingSize, height: outerRingSize }}
    >
      {/* Outer ring with tick marks and labels */}
      <div className="absolute inset-0 rounded-full">
        {/* Outer ring groove */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, transparent 42%, #0d1128 43%, #1a1f3d 44%, #0d1128 48%, transparent 49%)',
          }}
        />

        {/* Tick marks */}
        {DETENTS.map((detent, i) => {
          const a = ((detent.angle - 90) * Math.PI) / 180;
          const isActive = i <= activeDetent;
          return (
            <div key={i}>
              {/* Tick mark */}
              <div
                className="absolute"
                style={{
                  width: 3,
                  height: i === activeDetent ? 12 : 8,
                  left: outerRingSize / 2 + Math.cos(a) * tickRadius - 1.5,
                  top: outerRingSize / 2 + Math.sin(a) * tickRadius - 4,
                  transform: `rotate(${detent.angle}deg)`,
                  background: isActive
                    ? i >= 3
                      ? '#e94560'
                      : '#4ecdc4'
                    : '#333355',
                  borderRadius: 2,
                  boxShadow: isActive
                    ? `0 0 6px ${i >= 3 ? 'rgba(233,69,96,0.5)' : 'rgba(78,205,196,0.5)'}`
                    : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              {/* Label */}
              <div
                className="absolute text-[10px] font-medium whitespace-nowrap"
                style={{
                  left:
                    outerRingSize / 2 +
                    Math.cos(a) * (tickRadius + 18) -
                    20,
                  top:
                    outerRingSize / 2 +
                    Math.sin(a) * (tickRadius + 18) -
                    7,
                  width: 40,
                  textAlign: 'center',
                  color: isActive
                    ? i >= 3
                      ? '#e94560'
                      : '#4ecdc4'
                    : '#555577',
                  transition: 'color 0.3s ease',
                }}
              >
                {detent.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* The knob itself */}
      <motion.div
        ref={knobRef}
        className="absolute rounded-full cursor-grab active:cursor-grabbing"
        style={{
          width: knobSize,
          height: knobSize,
          left: (outerRingSize - knobSize) / 2,
          top: (outerRingSize - knobSize) / 2,
          rotate: currentRotation,
          // Multi-layer conic gradient for brushed metal
          background: `
            conic-gradient(
              from 0deg,
              #4a5068 0deg,
              #6a7088 30deg,
              #4a5068 60deg,
              #5a6078 90deg,
              #3a4058 120deg,
              #6a7088 150deg,
              #4a5068 180deg,
              #5a6078 210deg,
              #3a4058 240deg,
              #6a7088 270deg,
              #4a5068 300deg,
              #5a6078 330deg,
              #4a5068 360deg
            )
          `,
          // Multi-layer shadows for depth
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.5),
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 2px 4px rgba(255, 255, 255, 0.12),
            inset 0 -2px 6px rgba(0, 0, 0, 0.3)
          `,
          opacity: disabled ? 0.5 : 1,
          transition: 'opacity 0.3s',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* 3D convexity overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        {/* Brushed metal texture */}
        <div className="absolute inset-0 rounded-full texture-metal opacity-60" />

        {/* Knurled edge */}
        <div
          className="absolute inset-[3px] rounded-full"
          style={{
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />

        {/* Indicator notch at top */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: knobSize * 0.08,
            width: 4,
            height: knobSize * 0.14,
            borderRadius: 3,
            background: '#e94560',
            boxShadow: `
              0 0 4px rgba(233, 69, 96, 0.8),
              0 0 12px rgba(233, 69, 96, 0.4),
              0 0 24px rgba(233, 69, 96, 0.2)
            `,
          }}
        />

        {/* Center cap */}
        <div
          className="absolute rounded-full"
          style={{
            width: knobSize * 0.3,
            height: knobSize * 0.3,
            left: knobSize * 0.35,
            top: knobSize * 0.35,
            background:
              'radial-gradient(ellipse at 40% 35%, #6a7088 0%, #3a4258 60%, #2a3048 100%)',
            boxShadow:
              'inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </motion.div>

      {/* Active glow ring */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: knobSize + 8,
          height: knobSize + 8,
          left: (outerRingSize - knobSize - 8) / 2,
          top: (outerRingSize - knobSize - 8) / 2,
          border: '1px solid',
          borderColor: glowColor,
          opacity: glowOpacity,
          boxShadow: `0 0 15px var(--glow)`,
        }}
      />
    </div>
  );
}
