'use client';

import { useRef, useEffect, useCallback } from 'react';

interface FanVisualizationProps {
  speed: number; // 0-100
  size?: number; // px
  className?: string;
}

export default function FanVisualization({
  speed,
  size = 300,
  className = '',
}: FanVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const currentSpeedRef = useRef(0);
  const angleRef = useRef(0);
  const lastTimeRef = useRef(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, dpr: number, canvasSize: number) => {
      const now = performance.now();
      const delta = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = now;

      // Smooth speed interpolation with damping
      const targetSpeed = speed;
      const damping = 0.03;
      currentSpeedRef.current +=
        (targetSpeed - currentSpeedRef.current) * damping;

      // If fan is nearly stopped
      if (targetSpeed === 0 && currentSpeedRef.current < 0.1) {
        currentSpeedRef.current *= 0.98; // realistic deceleration
      }

      // Rotation: rps proportional to speed (max ~5 rev/s at speed 100)
      const rps = (currentSpeedRef.current / 100) * 5;
      angleRef.current += rps * Math.PI * 2 * delta;

      const w = canvasSize * dpr;
      const h = canvasSize * dpr;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) * 0.88;

      ctx.clearRect(0, 0, w, h);
      ctx.save();

      // -- Outer decorative ring --
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(78, 205, 196, 0.12)';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Tick marks
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const isMajor = i % 12 === 0;
        const innerR = radius * (isMajor ? 0.93 : 0.96);
        const outerR = radius * 1.0;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
        ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
        ctx.strokeStyle = isMajor
          ? 'rgba(78, 205, 196, 0.35)'
          : 'rgba(78, 205, 196, 0.1)';
        ctx.lineWidth = (isMajor ? 2 : 1) * dpr;
        ctx.stroke();
      }
      ctx.restore();

      // -- Draw fan blades with motion blur --
      const ghostFrames = currentSpeedRef.current > 30 ? 3 : currentSpeedRef.current > 10 ? 1 : 0;
      const bladeCount = 5;
      const bladeLength = radius * 0.72;
      const bladeWidth = radius * 0.18;

      for (let ghost = ghostFrames; ghost >= 0; ghost--) {
        const ghostOpacity = ghost === 0 ? 1 : 0.12 / ghost;
        const ghostAngleOffset =
          ghost * (rps * 0.018) * Math.PI * 2; // slight offset per ghost

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRef.current - ghostAngleOffset);
        ctx.globalAlpha = ghostOpacity;

        for (let i = 0; i < bladeCount; i++) {
          const bladeAngle = (i / bladeCount) * Math.PI * 2;
          ctx.save();
          ctx.rotate(bladeAngle);

          // Blade shape - elegant tapered ellipse
          ctx.beginPath();
          ctx.moveTo(radius * 0.12, 0);

          // Right edge curve
          ctx.bezierCurveTo(
            radius * 0.18,
            -bladeWidth * 0.3,
            bladeLength * 0.7,
            -bladeWidth * 0.85,
            bladeLength,
            -bladeWidth * 0.15
          );
          // Tip
          ctx.bezierCurveTo(
            bladeLength * 1.02,
            0,
            bladeLength * 1.02,
            bladeWidth * 0.08,
            bladeLength,
            bladeWidth * 0.15
          );
          // Left edge curve
          ctx.bezierCurveTo(
            bladeLength * 0.7,
            bladeWidth * 0.5,
            radius * 0.18,
            bladeWidth * 0.25,
            radius * 0.12,
            0
          );
          ctx.closePath();

          // Teal-to-lavender gradient per blade
          const bladeGrad = ctx.createLinearGradient(
            radius * 0.12,
            0,
            bladeLength,
            0
          );
          bladeGrad.addColorStop(0, 'rgba(78, 205, 196, 0.85)');
          bladeGrad.addColorStop(0.4, 'rgba(78, 205, 196, 0.6)');
          bladeGrad.addColorStop(0.7, 'rgba(110, 94, 168, 0.55)');
          bladeGrad.addColorStop(1, 'rgba(110, 94, 168, 0.35)');
          ctx.fillStyle = bladeGrad;
          ctx.fill();

          // Blade edge highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1 * dpr;
          ctx.stroke();

          // Central vein line on blade
          ctx.beginPath();
          ctx.moveTo(radius * 0.15, 0);
          ctx.lineTo(bladeLength * 0.95, 0);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1 * dpr;
          ctx.stroke();

          ctx.restore();
        }

        ctx.restore();
      }

      // -- Central hub - brushed aluminum --
      const hubRadius = radius * 0.16;

      // Hub shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx + 2 * dpr, cy + 3 * dpr, hubRadius * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
      ctx.restore();

      // Hub base
      ctx.beginPath();
      ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
      const hubGrad = ctx.createRadialGradient(
        cx - hubRadius * 0.3,
        cy - hubRadius * 0.3,
        hubRadius * 0.1,
        cx,
        cy,
        hubRadius
      );
      hubGrad.addColorStop(0, '#c0c8d8');
      hubGrad.addColorStop(0.3, '#8a94a8');
      hubGrad.addColorStop(0.7, '#5a6478');
      hubGrad.addColorStop(1, '#3a4258');
      ctx.fillStyle = hubGrad;
      ctx.fill();

      // Hub ring
      ctx.beginPath();
      ctx.arc(cx, cy, hubRadius * 0.92, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      // Specular highlight
      ctx.beginPath();
      ctx.ellipse(
        cx - hubRadius * 0.2,
        cy - hubRadius * 0.25,
        hubRadius * 0.35,
        hubRadius * 0.2,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      const specGrad = ctx.createRadialGradient(
        cx - hubRadius * 0.2,
        cy - hubRadius * 0.25,
        0,
        cx - hubRadius * 0.2,
        cy - hubRadius * 0.25,
        hubRadius * 0.35
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specGrad;
      ctx.fill();

      // Center screw
      ctx.beginPath();
      ctx.arc(cx, cy, hubRadius * 0.18, 0, Math.PI * 2);
      const screwGrad = ctx.createRadialGradient(
        cx - hubRadius * 0.05,
        cy - hubRadius * 0.05,
        0,
        cx,
        cy,
        hubRadius * 0.18
      );
      screwGrad.addColorStop(0, '#8a94a8');
      screwGrad.addColorStop(1, '#2a3048');
      ctx.fillStyle = screwGrad;
      ctx.fill();

      // Inner ring glow based on speed
      if (currentSpeedRef.current > 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius * 1.1, 0, Math.PI * 2);
        const glowIntensity = Math.min(currentSpeedRef.current / 100, 1) * 0.4;
        ctx.strokeStyle = `rgba(78, 205, 196, ${glowIntensity})`;
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(() =>
        draw(ctx, dpr, canvasSize)
      );
    },
    [speed]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(() => draw(ctx, dpr, size));

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, draw]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Ambient glow behind fan */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(78, 205, 196, ${Math.min(speed / 200, 0.25)}) 0%, transparent 70%)`,
          filter: 'blur(20px)',
          transition: 'all 2s ease',
        }}
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Fan visualization, current speed ${speed} percent`}
        className="relative z-10"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
