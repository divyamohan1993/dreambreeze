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
  Timer,
} from 'lucide-react';

import { StressFace } from './checkin/StressFace';
import { Chip } from './checkin/Chip';
import { ProgressDots } from './checkin/ProgressDots';
import { InsightCard } from './checkin/InsightCard';
import { SectionLabel } from './checkin/SectionLabel';
import { generateInsights } from './checkin/generate-insights';
import type { PreSleepData } from './checkin/types';

// Re-export so existing consumers don't break.
export type { PreSleepData } from './checkin/types';

// -- Props --------------------------------------------------------------------

interface Props {
  onComplete: (data: PreSleepData) => void;
  onSkip: () => void;
}

// -- Main Component -----------------------------------------------------------

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

  // -- Navigation -------------------------------------------------------------

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

  // -- Insights ---------------------------------------------------------------

  const insights = useMemo(() => generateInsights(data), [data]);

  // -- Step Labels ------------------------------------------------------------

  const stepTitles = ['How are you feeling?', "Today's intake", 'Activity', 'Your sleep plan'];

  // -- Step transition variants -----------------------------------------------

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

  // -- Render Steps -----------------------------------------------------------

  const renderStep = () => {
    switch (step) {
      // -- Step 0: Stress Level -----------------------------------------------
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

      // -- Step 1: Intake -----------------------------------------------------
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

      // -- Step 2: Activity ---------------------------------------------------
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

      // -- Step 3: Summary ----------------------------------------------------
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
                  insight={insight}
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

  // -- Main Render ------------------------------------------------------------

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
