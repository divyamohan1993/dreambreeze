'use client';

type SpeedLevel = 0 | 1 | 2 | 3 | 4;

/** Five-LED speed indicator for the dashboard fan control section. */
export default function LEDStrip({ level }: { level: SpeedLevel }) {
  const colors = ['#4ecdc4', '#4ecdc4', '#f0a060', '#e94560', '#e94560'];
  return (
    <div className="flex items-center gap-2 justify-center" role="img" aria-label={`Fan speed level ${level} of 4`}>
      {colors.map((color, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-all duration-500"
          style={{
            background: i < level ? color : '#1a1f3d',
            boxShadow:
              i < level
                ? `0 0 6px ${color}, 0 0 12px ${color}40`
                : 'inset 0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      ))}
    </div>
  );
}
