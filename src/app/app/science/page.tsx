'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Brain,
  Thermometer,
  Volume2,
  Moon,
  Battery,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  Heart,
} from 'lucide-react';

// -- Types --------------------------------------------------------------------

interface Reference {
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi: string | null;
}

interface ScienceSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  summary: string;
  content: React.ReactNode;
}

// -- Reference Component ------------------------------------------------------

function Citation({ data }: { data: Reference }) {
  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-lg bg-db-surface/50 border border-white/[0.04]">
      <BookOpen size={12} className="text-db-teal flex-shrink-0 mt-1" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-db-text-dim leading-relaxed">
          {data.authors} ({data.year}).{' '}
          <span className="italic">{data.title}</span>.{' '}
          {data.journal}.
        </p>
        {data.doi && (
          <a
            href={`https://doi.org/${data.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-db-teal hover:text-db-teal/80 transition-colors mt-1"
          >
            DOI: {data.doi}
            <ExternalLink size={9} />
          </a>
        )}
      </div>
    </div>
  );
}

// -- Formula Block ------------------------------------------------------------

function Formula({ children }: { children: string }) {
  return (
    <pre className="text-xs font-mono text-db-teal bg-db-navy/80 border border-db-teal/15 rounded-xl p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
      {children}
    </pre>
  );
}

// -- Threshold Table ----------------------------------------------------------

function ThresholdTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-db-surface">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-medium text-db-text-muted uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2 ${j === 0 ? 'font-medium text-db-text' : 'text-db-text-dim'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -- Section Content Builders -------------------------------------------------

function SleepStageContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        DreamBreeze classifies sleep stages using actigraphy -- the measurement
        of body movement via your device&apos;s accelerometer. We analyze
        movement in 30-second epochs, matching standard polysomnography (PSG)
        scoring conventions. This approach trades some accuracy compared to
        clinical EEG for the benefit of zero-contact, at-home monitoring using
        hardware you already own.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Movement Thresholds (RMS Acceleration)
        </p>
        <ThresholdTable
          headers={['Stage', 'Threshold', 'Duration Rule']}
          rows={[
            ['Awake', '> 0.5g RMS', '> 2 consecutive epochs'],
            ['Light (N1/N2)', '0.1 - 0.5g RMS', 'Default classification'],
            ['Deep (N3/SWS)', '< 0.03g RMS', '> 6 consecutive epochs (3 min)'],
            ['REM', '0.03 - 0.1g RMS + bursts', 'Burst pattern detection'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          REM Detection Logic
        </p>
        <Formula>{`// REM is distinguished from Deep sleep by burst patterns
// A "burst" = brief movement spike (> 0.15g) lasting < 2s
// within an otherwise quiet epoch (baseline < 0.1g)

if (epochRMS < 0.1 && burstCount >= 2 && burstCount <= 8) {
  stage = 'REM';  // Tonic stillness + phasic twitches
}`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Limitations
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          Actigraphy systematically overestimates total sleep time and
          underestimates wake-after-sleep-onset (WASO) compared to clinical
          PSG. REM detection via accelerometer alone has approximately 60-70%
          agreement with EEG-based scoring. We cannot detect sleep disorders
          like sleep apnea, periodic limb movement disorder, or parasomnias.
        </p>
      </div>

      <Citation
        data={{
          authors: 'Ancoli-Israel, S., Cole, R., Alessi, C., Chambers, M., Moorcroft, W., & Pollak, C.P.',
          year: 2003,
          title: 'The role of actigraphy in the study of sleep and circadian rhythms',
          journal: 'Sleep, 26(3), 342-392',
          doi: '10.1093/sleep/26.3.342',
        }}
      />
    </div>
  );
}

function PostureDetectionContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        We calculate your sleeping posture from the accelerometer&apos;s
        gravity vector. By decomposing the raw acceleration into pitch (forward
        tilt) and roll (lateral tilt) angles, we classify your body orientation
        into four positions: supine, prone, left-side, and right-side.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Angle Calculation
        </p>
        <Formula>{`pitch = atan2(accelY, sqrt(accelX^2 + accelZ^2)) * (180 / PI)
roll  = atan2(accelX, sqrt(accelY^2 + accelZ^2)) * (180 / PI)

// Classification thresholds:
// |roll| < 20deg  => Supine or Prone (determined by pitch sign)
// roll  > +20deg  => Left side
// roll  < -20deg  => Right side`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Classification Rules
        </p>
        <ThresholdTable
          headers={['Posture', 'Roll', 'Pitch', 'Hysteresis']}
          rows={[
            ['Supine', '|roll| < 20 deg', 'pitch > 0', '10s hold'],
            ['Prone', '|roll| < 20 deg', 'pitch < 0', '10s hold'],
            ['Left Side', 'roll > +20 deg', 'any', '10s hold'],
            ['Right Side', 'roll < -20 deg', 'any', '10s hold'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Hysteresis Filter
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          To prevent rapid oscillation between postures (e.g., when you are near
          the 20-degree boundary), we apply a 10-second hysteresis window. A new
          posture classification must persist for 10 consecutive seconds before
          it replaces the current posture. This prevents false transitions from
          brief movements or sensor noise.
        </p>
      </div>

      <Citation
        data={{
          authors: 'Okamoto-Mizuno, K., & Mizuno, K.',
          year: 2012,
          title: 'Effects of thermal environment on sleep and circadian rhythm',
          journal: 'Journal of Physiological Anthropology, 31(1), 14',
          doi: '10.1186/1880-6805-31-14',
        }}
      />
    </div>
  );
}

function SleepQualityContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        DreamBreeze computes a composite sleep quality score from 0 to 100
        using five weighted components. Each component is scored independently,
        then combined into a single number. The weights reflect the relative
        importance of each factor based on sleep medicine literature.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Scoring Components
        </p>
        <ThresholdTable
          headers={['Component', 'Weight', 'Target', 'Scoring Method']}
          rows={[
            ['Deep Sleep %', '25 pts', '15-20% of TST', 'Linear scale, 0 at 0%, 25 at target'],
            ['REM Sleep %', '25 pts', '20-25% of TST', 'Linear scale, 0 at 0%, 25 at target'],
            ['Awakenings', '20 pts', '0-2 per night', '20 at 0, -4 per extra awakening'],
            ['Posture Stability', '15 pts', '< 8 transitions', '15 at 0, -2 per extra transition'],
            ['Sleep Onset', '15 pts', '< 15 minutes', '15 at 0min, 0 at >= 45min'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Composite Formula
        </p>
        <Formula>{`score = deepSleepScore      // 0-25 pts
      + remSleepScore       // 0-25 pts
      + awakeningScore      // 0-20 pts
      + postureScore        // 0-15 pts
      + onsetScore          // 0-15 pts

// Clamped to [0, 100]
// Grades: 90-100 Excellent, 75-89 Good, 60-74 Fair, < 60 Poor`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Limitations
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          This scoring system is heuristic, not clinically validated. The
          weights and thresholds are derived from published sleep architecture
          norms for healthy adults (ages 18-65). Children, elderly individuals,
          shift workers, and people with sleep disorders may have different
          optimal ranges. The score should be used as a relative trend indicator,
          not an absolute clinical measure.
        </p>
      </div>
    </div>
  );
}

function SleepDebtContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        Sleep debt accumulates when you consistently sleep less than your body
        needs. DreamBreeze tracks a 14-day rolling sleep debt with
        quality-adjusted weighting, meaning poor-quality sleep counts as less
        restorative even if the duration is adequate.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Deficit Formula
        </p>
        <Formula>{`// For each of the last 14 nights:
effectiveSleep[i] = actualHours[i] * (qualityScore[i] / 100)

dailyDeficit[i] = targetHours - effectiveSleep[i]

// Rolling debt with exponential decay (recent nights matter more):
sleepDebt = SUM(dailyDeficit[i] * decayWeight[i])
  where decayWeight[i] = 0.95 ^ (daysAgo)

// Clamped: negative debt (surplus) does not bank beyond 0`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Impairment Mapping (Van Dongen)
        </p>
        <ThresholdTable
          headers={['Debt (hours)', 'Impairment Level', 'Equivalent']}
          rows={[
            ['0-2h', 'Minimal', 'Normal function'],
            ['2-5h', 'Mild', 'Similar to low BAC (0.02-0.04%)'],
            ['5-10h', 'Moderate', 'Similar to BAC 0.05-0.08%'],
            ['10-15h', 'Severe', 'Similar to BAC 0.08-0.10%'],
            ['> 15h', 'Critical', 'Comparable to 24h total sleep deprivation'],
          ]}
        />
      </div>

      <Citation
        data={{
          authors: 'Van Dongen, H.P., Maislin, G., Mullington, J.M., & Dinges, D.F.',
          year: 2003,
          title: 'The cumulative cost of additional wakefulness: dose-response effects on neurobehavioral functions and sleep physiology from chronic sleep restriction and total sleep deprivation',
          journal: 'Sleep, 26(2), 117-126',
          doi: '10.1093/sleep/26.2.117',
        }}
      />
    </div>
  );
}

function EnergyForecastContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        DreamBreeze predicts your daytime energy levels using the Two-Process
        Model of sleep regulation, first described by Alexander Borbely in 1982.
        This model combines a homeostatic sleep drive (Process S) with a
        circadian alertness rhythm (Process C) to forecast when you will feel
        most and least alert.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Process S (Homeostatic Sleep Pressure)
        </p>
        <Formula>{`// Sleep pressure builds exponentially during wakefulness
// and dissipates exponentially during sleep

During wake:
  S(t) = S_upper - (S_upper - S_wake) * exp(-t / tau_w)
  tau_w = 18.2 hours (wake time constant)

During sleep:
  S(t) = S_lower + (S_sleep - S_lower) * exp(-t / tau_s)
  tau_s = 4.2 hours (sleep time constant)`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Process C (Circadian Rhythm)
        </p>
        <Formula>{`// Sinusoidal approximation of the circadian alertness cycle
// Peak alertness: ~3:00 PM (15:00)
// Minimum alertness: ~4:00 AM (04:00)

C(t) = amplitude * sin(2 * PI * (t - phase) / 24)
  amplitude = 0.4 (normalized)
  phase = 7.0 hours (shifts peak to ~15:00)

// Combined energy forecast:
energy(t) = normalize(C(t) - S(t))  // 0-100 scale`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Limitations
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          The two-process model is a simplified approximation. Real circadian
          rhythms are not perfectly sinusoidal and are influenced by light
          exposure, meal timing, exercise, caffeine, and individual chronotype.
          Our implementation uses population-average parameters; individual
          variation can be significant (chronotype shifts of +/- 2 hours are
          common).
        </p>
      </div>

      <Citation
        data={{
          authors: 'Borbely, A.A.',
          year: 1982,
          title: 'A two process model of sleep regulation',
          journal: 'Human Neurobiology, 1(3), 195-204',
          doi: null,
        }}
      />
    </div>
  );
}

function SoundscapeContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        DreamBreeze generates continuous noise using Web Audio API oscillators
        and filters. Different noise colors have distinct spectral
        characteristics that affect sleep differently. The soundscape adapts
        in real-time based on your detected sleep stage.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Noise Generation Methods
        </p>
        <ThresholdTable
          headers={['Color', 'Spectrum', 'Method', 'Sleep Benefit']}
          rows={[
            ['White', 'Flat (equal power)', 'Raw noise buffer', 'Masks sudden sounds'],
            ['Pink', '-3dB/octave rolloff', '1/f filter on white', 'Matches natural sound patterns'],
            ['Brown', '-6dB/octave rolloff', '1/f^2 filter on white', 'Deep, soothing low frequencies'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Sleep-Stage Adaptation
        </p>
        <ThresholdTable
          headers={['Stage', 'Volume', 'Preferred Color', 'Behavior']}
          rows={[
            ['Awake', '100% of user setting', 'User choice', 'Full volume to aid onset'],
            ['Light', '80%', 'Pink', 'Gentle transition down'],
            ['Deep', '40%', 'Brown', 'Minimal, low-frequency only'],
            ['REM', '60%', 'Pink', 'Moderate, protects dream sleep'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Adaptive Volume Logic
        </p>
        <Formula>{`// Volume transitions happen over 30-second crossfades
// to avoid startling the sleeper

targetVolume = baseVolume * stageMultiplier[currentStage]

// Fade rate: 2% per second (30s full transition)
if (currentVolume < targetVolume) {
  currentVolume = min(currentVolume + 0.02, targetVolume)
} else {
  currentVolume = max(currentVolume - 0.02, targetVolume)
}`}</Formula>
      </div>

      <Citation
        data={{
          authors: 'Ngo, H.V., Martinetz, T., Born, J., & Molle, M.',
          year: 2013,
          title: 'Auditory closed-loop stimulation of the sleep slow oscillation enhances memory',
          journal: 'Neuron, 78(3), 545-553',
          doi: '10.1016/j.neuron.2013.03.006',
        }}
      />
    </div>
  );
}

function ThermalComfortContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        DreamBreeze integrates real-time weather data, circadian body
        temperature rhythms, and sleep-stage-specific thermoregulatory
        needs to calculate optimal fan speed throughout the night. The
        thermal agent is one of the four AI agents in our multi-agent
        blackboard architecture.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Circadian Body Temperature Offsets
        </p>
        <Formula>{`// Human core body temperature follows a circadian rhythm
// Nadir (lowest point): ~4:00 AM, approximately -1.1 C from mean
// Peak: ~6:00 PM, approximately +0.4 C from mean

tempOffset(hour) = -1.1 * cos(2 * PI * (hour - 4) / 24)

// Fan speed adjustment based on body temp phase:
// Higher body temp => increase fan speed
// Lower body temp  => decrease fan speed
fanAdjust = round(tempOffset * 8)  // +/- 8% fan speed`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Sleep Stage Thermal Adjustments
        </p>
        <ThresholdTable
          headers={['Stage', 'Fan Modifier', 'Rationale']}
          rows={[
            ['Awake', '+0%', 'Baseline user preference'],
            ['Light', '+0%', 'No adjustment needed'],
            ['Deep (SWS)', '-5%', 'Thermoregulation intact, cooler preferred'],
            ['REM', '+10%', 'Thermoregulatory atonia -- body cannot self-regulate'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          During REM sleep, the body experiences thermoregulatory atonia --
          the hypothalamus temporarily suspends temperature control. This means
          you cannot shiver or sweat effectively. DreamBreeze compensates by
          increasing fan speed by 10% during REM to prevent overheating.
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Weather Integration
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          When enabled, DreamBreeze fetches hourly forecast data from Open-Meteo
          (free, no API key required) and adjusts the base fan speed. The
          adjustment is proportional to the difference between the forecasted
          temperature and the optimal sleep temperature range (18-22 degrees C /
          64-72 degrees F). Humidity above 60% triggers an additional +5% fan
          boost.
        </p>
      </div>

      <div className="space-y-2">
        <Citation
          data={{
            authors: 'Krauchi, K.',
            year: 2007,
            title: 'The thermophysiological cascade leading to sleep initiation in relation to phase of entrainment',
            journal: 'Sleep Medicine Reviews, 11(6), 439-451',
            doi: '10.1016/j.smrv.2007.07.001',
          }}
        />
        <Citation
          data={{
            authors: 'Okamoto-Mizuno, K., & Mizuno, K.',
            year: 2012,
            title: 'Effects of thermal environment on sleep and circadian rhythm',
            journal: 'Journal of Physiological Anthropology, 31(1), 14',
            doi: '10.1186/1880-6805-31-14',
          }}
        />
      </div>
    </div>
  );
}

function LimitationsContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-db-rose/8 border border-db-rose/15">
        <AlertTriangle size={20} className="text-db-rose flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-db-rose mb-1">
            DreamBreeze Is Not a Medical Device
          </p>
          <p className="text-xs text-db-text-dim leading-relaxed">
            DreamBreeze has not been evaluated, cleared, or approved by the FDA,
            CE, or any regulatory body. It is a consumer wellness application
            and must not be used to diagnose, treat, or monitor any medical
            condition.
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          What Actigraphy Cannot Do
        </p>
        <ul className="space-y-2">
          {[
            'Detect sleep apnea (requires airflow and SpO2 monitoring)',
            'Diagnose insomnia (requires clinical sleep diary and evaluation)',
            'Detect parasomnias like sleepwalking or REM behavior disorder',
            'Measure sleep spindles or K-complexes (requires EEG)',
            'Detect periodic limb movement disorder (requires EMG)',
            'Distinguish between quiet wakefulness and light sleep reliably',
            'Account for medications that alter sleep architecture',
          ].map((item) => (
            <li
              key={item}
              className="text-xs text-db-text-dim flex items-start gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-db-rose/60 flex-shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          When to See a Sleep Specialist
        </p>
        <ul className="space-y-2">
          {[
            'You snore loudly or your partner reports you stop breathing during sleep',
            'You wake up gasping or choking',
            'You experience excessive daytime sleepiness despite adequate sleep duration',
            'You have persistent difficulty falling asleep (> 30 min) or staying asleep',
            'You experience unusual behaviors during sleep (walking, talking, acting out dreams)',
            'Your sleep quality score is consistently below 50 despite good sleep habits',
            'You experience restless legs or periodic limb movements',
          ].map((item) => (
            <li
              key={item}
              className="text-xs text-db-text-dim flex items-start gap-2"
            >
              <Heart size={10} className="text-db-rose flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3 rounded-xl bg-db-surface border border-white/[0.06]">
        <p className="text-xs text-db-text-dim leading-relaxed">
          If you experience any of the above, please consult a board-certified
          sleep medicine physician. A clinical polysomnography (PSG) study
          remains the gold standard for sleep disorder diagnosis. DreamBreeze
          data is not a substitute for professional medical evaluation.
        </p>
      </div>
    </div>
  );
}

// -- Sections Data ------------------------------------------------------------

const SCIENCE_SECTIONS: ScienceSection[] = [
  {
    id: 'sleep-stages',
    title: 'How We Detect Sleep Stages',
    icon: Moon,
    color: '#6e5ea8',
    summary: 'Actigraphy-based classification using 30-second movement epochs',
    content: <SleepStageContent />,
  },
  {
    id: 'posture',
    title: 'How We Detect Posture',
    icon: Activity,
    color: '#4ecdc4',
    summary: 'Accelerometer pitch/roll angles with hysteresis filtering',
    content: <PostureDetectionContent />,
  },
  {
    id: 'sleep-quality',
    title: 'How We Calculate Sleep Quality',
    icon: Brain,
    color: '#f0a060',
    summary: '5-component weighted score from 0 to 100 points',
    content: <SleepQualityContent />,
  },
  {
    id: 'sleep-debt',
    title: 'How We Calculate Sleep Debt',
    icon: Moon,
    color: '#e94560',
    summary: '14-day rolling deficit with quality-adjusted weighting',
    content: <SleepDebtContent />,
  },
  {
    id: 'energy',
    title: 'How We Forecast Energy',
    icon: Battery,
    color: '#4ecdc4',
    summary: 'Borbely Two-Process Model: homeostatic drive + circadian rhythm',
    content: <EnergyForecastContent />,
  },
  {
    id: 'soundscapes',
    title: 'How Soundscapes Work',
    icon: Volume2,
    color: '#6e5ea8',
    summary: 'White/pink/brown synthesis with sleep-stage-adaptive volume',
    content: <SoundscapeContent />,
  },
  {
    id: 'thermal',
    title: 'How Thermal Comfort Works',
    icon: Thermometer,
    color: '#f0a060',
    summary: 'Weather + circadian temperature + REM thermoregulatory compensation',
    content: <ThermalComfortContent />,
  },
  {
    id: 'limitations',
    title: 'Limitations & When to See a Doctor',
    icon: AlertTriangle,
    color: '#e94560',
    summary: 'Honest assessment of what this technology cannot do',
    content: <LimitationsContent />,
  },
];

// -- Main Component -----------------------------------------------------------

export default function SciencePage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleSection = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center bg-db-teal/10 border border-db-teal/20"
            style={{ boxShadow: '0 0 24px rgba(78, 205, 196, 0.15)' }}
          >
            <BookOpen size={32} className="text-db-teal" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-db-text">The Science Behind DreamBreeze</h1>
        <p className="text-xs text-db-text-dim max-w-md mx-auto">
          Every algorithm, every threshold, every decision -- documented with
          scientific references. We believe transparency builds trust.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 glass skeu-raised rounded-2xl border border-db-amber/20">
        <AlertTriangle size={20} className="text-db-amber flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-db-amber">Not a Medical Device</p>
          <p className="text-[11px] text-db-text-dim leading-relaxed mt-0.5">
            DreamBreeze is a consumer wellness application. It has not been
            cleared or approved by the FDA, CE, or any regulatory body. Do not
            use it to diagnose, treat, cure, or prevent any disease or medical
            condition. If you have sleep concerns, consult a qualified healthcare
            provider.
          </p>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-2" role="region" aria-label="Science documentation sections">
        {SCIENCE_SECTIONS.map((section) => {
          const isOpen = expanded === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id} className="glass skeu-raised rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                aria-controls={`science-panel-${section.id}`}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `radial-gradient(circle, ${section.color}20 0%, transparent 70%)`,
                    border: `1px solid ${section.color}25`,
                  }}
                >
                  <span style={{ color: section.color }}><Icon size={18} /></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-db-text">{section.title}</p>
                  <p className="text-[10px] text-db-text-muted truncate">{section.summary}</p>
                </div>
                {isOpen ? (
                  <ChevronUp size={16} className="text-db-text-muted flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-db-text-muted flex-shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={`science-panel-${section.id}`}
                    role="region"
                    aria-labelledby={section.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 pt-2">
        <p className="text-[10px] text-db-text-muted">
          Last updated: February 2026. All DOI links open in a new tab.
        </p>
        <p className="text-[10px] text-db-text-muted">
          Found an error? We welcome corrections at{' '}
          <a
            href="https://github.com/divyamohan1993/dreambreeze/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-db-teal hover:text-db-teal/80 transition-colors"
          >
            our GitHub repository
          </a>
          .
        </p>
      </div>
    </div>
  );
}
