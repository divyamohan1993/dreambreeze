'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee,
  Wine,
  Dumbbell,
  Utensils,
  Monitor,
  Moon,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Wind,
  Volume2,
  ThermometerSun,
  Brain,
  Timer,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PreSleepData {
  stressLevel: number; // 1-5
  caffeineMg: number;
  caffeineLastIntakeHoursAgo: number;
  alcoholDrinks: number;
  exerciseIntensity: 'none' | 'light' | 'moderate' | 'intense';
  exerciseHoursAgo: number;
  mealHoursAgo: number;
  screenTimeMinutes: number;
}

interface Props {
  onComplete: (data: PreSleepData) => void;
  onSkip: () => void;
}

// ── Stress Face SVG Icons ────────────────────────────────────────────────────
// Custom styled faces instead of emoji to maintain skeuomorphic aesthetic

function StressFace({ level, isActive }: { level: number; isActive: boolean }) {
  const activeColor = isActive ? '#4ecdc4' : '#555577';
  const bgOpacity = isActive ? 0.15 : 0.04;
  const glowShadow = isActive
    ? '0 0 16px rgba(78, 205, 196, 0.3), 0 0 4px rgba(78, 205, 196, 0.2)'
    : 'none';

  // Different mouth paths for each stress level
  const getMouthPath = () => {
    switch (level) {
      case 1: // Very calm - big smile
        return 'M9 14 Q12 18 15 14';
      case 2: // Relaxed - gentle smile
        return 'M9.5 14.5 Q12 16.5 14.5 14.5';
      case 3: // Neutral - straight line
        return 'M9.5 15 L14.5 15';
      case 4: // Tense - slight frown
        return 'M9.5 16 Q12 14 14.5 16';
      case 5: // Stressed - wavy frown
        return 'M9 16.5 Q10.5 14.5 12 16 Q13.5 14.5 15 16.5';
      default:
        return 'M9.5 15 L14.5 15';
    }
  };

  // Different eye shapes for stress levels
  const getEyes = () => {
    switch (level) {
      case 1: // Calm - happy closed eyes
        return (
          <>
            <path d="M8 11 Q9 9.5 10 11" stroke={activeColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M14 11 Q15 9.5 16 11" stroke={activeColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        );
      case 2: // Relaxed - soft eyes
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1" fill={activeColor} />
          </>
        );
      case 3: // Neutral
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.2" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.2" fill={activeColor} />
          </>
        );
      case 4: // Tense - slightly wide eyes
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.4" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.4" fill={activeColor} />
            {/* Eyebrows angled */}
            <path d="M8 8.5 L11 8" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16 8.5 L13 8" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
          </>
        );
      case 5: // Stressed - wide eyes, raised eyebrows
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.6" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.6" fill={activeColor} />
            {/* Droplet for sweat */}
            <path d="M17 8 Q17.5 9.5 17 10 Q16.5 9.5 17 8Z" fill={activeColor} opacity={0.6} />
            {/* Worried eyebrows */}
            <path d="M7.5 8 L10.5 7.5" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16.5 8 L13.5 7.5" stroke={activeColor} strokeWidth="1" strokeLinecap="round" fill="none" />
          </>
        );
      default:
        return (
          <>
            <circle cx="9.5" cy="10.5" r="1.2" fill={activeColor} />
            <circle cx="14.5" cy="10.5" r="1.2" fill={activeColor} />
          </>
        );
    }
  };

  const stressLabels = ['', 'Calm', 'Relaxed', 'Neutral', 'Tense', 'Stressed'];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          width: 56,
          height: 56,
          background: `rgba(78, 205, 196, ${bgOpacity})`,
          border: `1.5px solid ${isActive ? 'rgba(78, 205, 196, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
          boxShadow: isActive
            ? `${glowShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.08)`
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <svg viewBox="0 0 24 24" width={32} height={32}>
          {/* Face outline */}
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke={activeColor}
            strokeWidth="1.2"
            opacity={0.4}
          />
          {/* Eyes */}
          {getEyes()}
          {/* Mouth */}
          <path
            d={getMouthPath()}
            stroke={activeColor}
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </motion.div>
      <span
        className="text-[10px] font-medium transition-colors duration-200"
        style={{ color: isActive ? '#4ecdc4' : '#555577' }}
      >
        {stressLabels[level]}
      </span>
    </div>
  );
}

// ── Selectable Chip Component ────────────────────────────────────────────────

interface ChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  accentColor?: string;
}

function Chip({ label, isActive, onClick, icon, accentColor = '#4ecdc4' }: ChipProps) {
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

// ── Section Header ───────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: typeof Coffee; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-db-text-muted" />
      <span className="text-xs font-medium text-db-text-dim uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
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

// ── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({
  icon: Icon,
  text,
  color,
  index,
}: {
  icon: typeof Wind;
  text: string;
  color: string;
  index: number;
}) {
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

// ── Main Component ───────────────────────────────────────────────────────────

export default function PreSleepCheckin({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [data, setData] = useState<PreSleepData>({
    stressLevel: 3,
    caffeineMg: 0,
    caffeineLastIntakeHoursAgo: 6,
    alcoholDrinks: 0,
    exerciseIntensity: 'none',
    exerciseHoursAgo: 4,
    mealHoursAgo: 3,
    screenTimeMinutes: 180,
  });

  const totalSteps = 4; // Feeling, Intake, Activity, Summary

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  // ── Insight Generation ─────────────────────────────────────────────────────

  const generateInsights = useCallback(
    (d: PreSleepData): { text: string; icon: typeof Wind; color: string }[] => {
      const insights: { text: string; icon: typeof Wind; color: string }[] = [];

      // Caffeine half-life is ~5-6 hours
      const effectiveCaffeine =
        d.caffeineMg * Math.pow(0.5, d.caffeineLastIntakeHoursAgo / 5.7);
      if (effectiveCaffeine > 50) {
        insights.push({
          text: `Active caffeine in your system (~${Math.round(effectiveCaffeine)}mg). I'll boost sound masking and keep the room cooler to help you drift off.`,
          icon: Coffee,
          color: '#f0a060',
        });
      }

      if (d.alcoholDrinks > 0) {
        insights.push({
          text: `Alcohol disrupts REM sleep. I'll optimize fan patterns for the second half of your night when effects wear off.`,
          icon: Wine,
          color: '#6e5ea8',
        });
      }

      if (d.exerciseIntensity === 'intense' && d.exerciseHoursAgo < 3) {
        insights.push({
          text: `Recent intense exercise raises core temperature. Starting with higher airflow and gradually reducing as you cool down.`,
          icon: ThermometerSun,
          color: '#e94560',
        });
      } else if (d.exerciseIntensity === 'moderate') {
        insights.push({
          text: `Good exercise today! Your body temperature cycling should help deep sleep. Optimizing fan to support natural cooling.`,
          icon: Dumbbell,
          color: '#4ecdc4',
        });
      }

      if (d.stressLevel >= 4) {
        insights.push({
          text: `Elevated stress detected. Switching to brown noise for deeper masking, and using a gentler fan ramp-up pattern.`,
          icon: Brain,
          color: '#6e5ea8',
        });
      }

      if (d.mealHoursAgo < 2) {
        insights.push({
          text: `Recent meal may cause slight temperature rise during digestion. Adjusting fan to compensate.`,
          icon: Utensils,
          color: '#f0a060',
        });
      }

      if (d.screenTimeMinutes > 360) {
        insights.push({
          text: `Extended screen time today. Blue light may have shifted your circadian rhythm. I'll extend the sleep onset optimization period.`,
          icon: Monitor,
          color: '#e94560',
        });
      }

      if (insights.length === 0) {
        insights.push({
          text: `Everything looks great for a good night's sleep! Running standard optimization for your comfort.`,
          icon: Moon,
          color: '#4ecdc4',
        });
      }

      return insights;
    },
    []
  );

  const insights = useMemo(() => generateInsights(data), [data, generateInsights]);

  // ── Step Labels ────────────────────────────────────────────────────────────

  const stepTitles = ['How are you feeling?', "Today's intake", 'Activity', 'Your sleep plan'];

  // ── Step transition variants ───────────────────────────────────────────────

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  // ── Render Steps ───────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Stress Level ───────────────────────────────────────────────
      case 0:
        return (
          <div className="flex flex-col items-center gap-8">
            <p className="text-sm text-db-text-dim text-center max-w-xs">
              Tap the face that best describes your current state of mind.
            </p>
            <div className="flex items-end gap-3">
              {[1, 2, 3, 4, 5].map((level) => (
                <motion.button
                  key={level}
                  onClick={() =>
                    setData((prev) => ({ ...prev, stressLevel: level }))
                  }
                  className="focus:outline-none"
                  whileHover={{ y: -4 }}
                >
                  <StressFace level={level} isActive={data.stressLevel === level} />
                </motion.button>
              ))}
            </div>
          </div>
        );

      // ── Step 1: Intake ─────────────────────────────────────────────────────
      case 1:
        return (
          <div className="flex flex-col gap-6 w-full">
            {/* Caffeine */}
            <div>
              <SectionLabel icon={Coffee} label="Caffeine" />
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'None', mg: 0 },
                  { label: '1 cup', mg: 95 },
                  { label: '2-3 cups', mg: 237 },
                  { label: '4+ cups', mg: 380 },
                ].map(({ label, mg }) => (
                  <Chip
                    key={mg}
                    label={label}
                    isActive={data.caffeineMg === mg}
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        caffeineMg: mg,
                        // Reset last intake if none
                        caffeineLastIntakeHoursAgo: mg === 0 ? 6 : prev.caffeineLastIntakeHoursAgo,
                      }))
                    }
                    accentColor="#f0a060"
                  />
                ))}
              </div>
            </div>

            {/* Last caffeine (conditional) */}
            <AnimatePresence>
              {data.caffeineMg > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <SectionLabel icon={Timer} label="Last caffeine" />
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '1h ago', hours: 1 },
                      { label: '3h ago', hours: 3 },
                      { label: '6h+ ago', hours: 6 },
                    ].map(({ label, hours }) => (
                      <Chip
                        key={hours}
                        label={label}
                        isActive={data.caffeineLastIntakeHoursAgo === hours}
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            caffeineLastIntakeHoursAgo: hours,
                          }))
                        }
                        accentColor="#f0a060"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alcohol */}
            <div>
              <SectionLabel icon={Wine} label="Alcohol" />
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'None', drinks: 0 },
                  { label: '1 drink', drinks: 1 },
                  { label: '2-3 drinks', drinks: 2 },
                ].map(({ label, drinks }) => (
                  <Chip
                    key={drinks}
                    label={label}
                    isActive={data.alcoholDrinks === drinks}
                    onClick={() =>
                      setData((prev) => ({ ...prev, alcoholDrinks: drinks }))
                    }
                    accentColor="#6e5ea8"
                  />
                ))}
              </div>
            </div>
          </div>
        );

      // ── Step 2: Activity ───────────────────────────────────────────────────
      case 2:
        return (
          <div className="flex flex-col gap-6 w-full">
            {/* Exercise */}
            <div>
              <SectionLabel icon={Dumbbell} label="Exercise" />
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { label: 'None', intensity: 'none' as const },
                    { label: 'Light walk', intensity: 'light' as const },
                    { label: 'Moderate', intensity: 'moderate' as const },
                    { label: 'Intense', intensity: 'intense' as const },
                  ] as const
                ).map(({ label, intensity }) => (
                  <Chip
                    key={intensity}
                    label={label}
                    isActive={data.exerciseIntensity === intensity}
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        exerciseIntensity: intensity,
                      }))
                    }
                    icon={
                      <Dumbbell
                        size={14}
                        style={{
                          opacity:
                            intensity === 'none'
                              ? 0.3
                              : intensity === 'light'
                                ? 0.5
                                : intensity === 'moderate'
                                  ? 0.75
                                  : 1,
                        }}
                      />
                    }
                  />
                ))}
              </div>
            </div>

            {/* Last meal */}
            <div>
              <SectionLabel icon={Utensils} label="Last meal" />
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '1h ago', hours: 1 },
                  { label: '2-3h ago', hours: 3 },
                  { label: '4h+ ago', hours: 4 },
                ].map(({ label, hours }) => (
                  <Chip
                    key={hours}
                    label={label}
                    isActive={data.mealHoursAgo === hours}
                    onClick={() =>
                      setData((prev) => ({ ...prev, mealHoursAgo: hours }))
                    }
                    accentColor="#f0a060"
                  />
                ))}
              </div>
            </div>

            {/* Screen time */}
            <div>
              <SectionLabel icon={Monitor} label="Screen time today" />
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '< 1h', minutes: 30 },
                  { label: '1-3h', minutes: 120 },
                  { label: '3-6h', minutes: 270 },
                  { label: '6h+', minutes: 420 },
                ].map(({ label, minutes }) => (
                  <Chip
                    key={minutes}
                    label={label}
                    isActive={data.screenTimeMinutes === minutes}
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        screenTimeMinutes: minutes,
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        );

      // ── Step 3: Summary ────────────────────────────────────────────────────
      case 3:
        return (
          <div className="flex flex-col gap-5 w-full">
            {/* AI avatar header */}
            <motion.div
              className="flex items-center gap-3 mb-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(110, 94, 168, 0.2))',
                  border: '1.5px solid rgba(78, 205, 196, 0.25)',
                  boxShadow: '0 0 16px rgba(78, 205, 196, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                }}
              >
                <Sparkles size={18} className="text-db-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-db-text">DreamBreeze AI</p>
                <p className="text-[10px] text-db-text-muted">Personalized sleep optimization</p>
              </div>
            </motion.div>

            {/* Insights */}
            <div className="flex flex-col gap-3">
              {insights.map((insight, i) => (
                <InsightCard
                  key={i}
                  icon={insight.icon}
                  text={insight.text}
                  color={insight.color}
                  index={i}
                />
              ))}
            </div>

            {/* Summary stats */}
            <motion.div
              className="grid grid-cols-3 gap-2 mt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {[
                { icon: Wind, label: 'Fan', value: data.exerciseIntensity === 'intense' ? 'Higher' : data.stressLevel >= 4 ? 'Gentle' : 'Normal' },
                { icon: Volume2, label: 'Sound', value: data.stressLevel >= 4 ? 'Brown' : data.caffeineMg > 95 ? 'Deep' : 'Auto' },
                { icon: ThermometerSun, label: 'Temp', value: data.exerciseIntensity === 'intense' ? 'Cool' : data.mealHoursAgo < 2 ? 'Cool' : 'Balanced' },
              ].map(({ icon: StatIcon, label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <StatIcon size={14} className="text-db-teal/60" />
                  <span className="text-xs font-medium text-db-text">{value}</span>
                  <span className="text-[10px] text-db-text-muted">{label}</span>
                </div>
              ))}
            </motion.div>

            {/* Start Sleep button */}
            <motion.button
              onClick={() => onComplete(data)}
              className="relative w-full py-4 rounded-2xl bg-db-teal text-db-navy font-bold text-base mt-2 overflow-hidden"
              style={{
                boxShadow:
                  '0 0 24px rgba(78, 205, 196, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4, type: 'spring', stiffness: 200 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.2) 50%, transparent 60%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              />
              <div className="relative flex items-center justify-center gap-2">
                <Moon size={18} />
                <span>Start Sleep</span>
              </div>
            </motion.button>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Outer glass card */}
      <div
        className="glass relative overflow-hidden"
        style={{
          boxShadow:
            '0 0 40px rgba(78, 205, 196, 0.06), 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Decorative top gradient line */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(78, 205, 196, 0.3), rgba(110, 94, 168, 0.3), transparent)',
          }}
        />

        {/* Content container */}
        <div className="relative z-10 p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(78, 205, 196, 0.1)',
                  border: '1px solid rgba(78, 205, 196, 0.2)',
                }}
              >
                <Moon size={14} className="text-db-teal" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-db-text">
                  Pre-Sleep Check-in
                </h2>
                <p className="text-[10px] text-db-text-muted">
                  Step {step + 1} of {totalSteps}
                </p>
              </div>
            </div>

            {/* Skip button */}
            <motion.button
              onClick={onSkip}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-db-text-muted text-xs hover:text-db-text-dim transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <X size={12} />
              <span>Skip</span>
            </motion.button>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center mb-6">
            <ProgressDots current={step} total={totalSteps} />
          </div>

          {/* Step title */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h3
              key={`title-${step}`}
              className="text-lg font-bold text-db-text text-center mb-6"
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -10 : 10 }}
              transition={{ duration: 0.25 }}
            >
              {stepTitles[step]}
            </motion.h3>
          </AnimatePresence>

          {/* Step content with AnimatePresence */}
          <div className="min-h-[280px] flex items-start">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                className="w-full"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons (hidden on summary step) */}
          {step < totalSteps - 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.04]">
              {/* Back */}
              <motion.button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: step > 0 ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                  border: step > 0 ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid transparent',
                  color: step > 0 ? '#8888aa' : 'transparent',
                  cursor: step > 0 ? 'pointer' : 'default',
                  boxShadow: step > 0 ? 'inset 0 1px 0 rgba(255, 255, 255, 0.03)' : 'none',
                }}
                whileHover={step > 0 ? { scale: 1.03 } : {}}
                whileTap={step > 0 ? { scale: 0.97 } : {}}
                disabled={step === 0}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </motion.button>

              {/* Next */}
              <motion.button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'rgba(78, 205, 196, 0.12)',
                  border: '1.5px solid rgba(78, 205, 196, 0.3)',
                  color: '#4ecdc4',
                  boxShadow:
                    '0 0 12px rgba(78, 205, 196, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                }}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>{step === totalSteps - 2 ? 'See Plan' : 'Next'}</span>
                <ChevronRight size={16} />
              </motion.button>
            </div>
          )}

          {/* Back button on summary page */}
          {step === totalSteps - 1 && (
            <div className="flex items-center justify-start mt-4 pt-4 border-t border-white/[0.04]">
              <motion.button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#8888aa',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <ChevronLeft size={16} />
                <span>Adjust answers</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
