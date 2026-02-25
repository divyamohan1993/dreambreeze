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
  Wind,
  Mic,
  Zap,
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
        movement in 30-second epochs (standard PSG scoring convention),
        computing the magnitude delta between consecutive readings to measure
        movement intensity.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Movement Calculation
        </p>
        <Formula>{`// Movement magnitude from consecutive accelerometer readings:
delta = sqrt(dx^2 + dy^2 + dz^2)

// Average movement per 30-second epoch:
avgMovement = sum(deltas) / count`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Classification Thresholds (RMS Acceleration)
        </p>
        <ThresholdTable
          headers={['Stage', 'Threshold', 'Confidence', 'Duration Rule']}
          rows={[
            ['Awake', '> 0.5g', 'min(1, 0.7 + (avg - 0.5))', 'Any epoch'],
            ['Light (N1/N2)', '0.1 - 0.5g', '0.7', 'Default classification'],
            ['Deep (N3/SWS)', '< 0.03g', 'min(1, 0.8 + (0.03 - avg) * 10)', '10-epoch context buffer'],
            ['REM', '0.03 - 0.1g + bursts', '0.65', 'Burst pattern detection'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          REM Detection Logic
        </p>
        <Formula>{`// REM is distinguished from Deep sleep by burst patterns
// A "burst" = brief movement spike (> 0.04g) within quiet epoch
// Bursts must occur 20-90 seconds apart (phasic twitches)

if (avgMovement >= 0.03 && avgMovement <= 0.1) {
  if (burstDetected) {
    stage = 'REM';   // Confidence: 0.65
  } else {
    stage = 'Deep';  // Below 0.03g threshold not met
  }
}

// Within light range (0.1-0.5g), bursts also trigger REM:
if (avgMovement >= 0.1 && avgMovement <= 0.5 && burstDetected) {
  stage = 'REM';  // Confidence: 0.6
}`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Context Smoothing Rules
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed mb-2">
          To prevent physiologically impossible transitions, we apply context
          smoothing using a 10-epoch rolling buffer:
        </p>
        <ThresholdTable
          headers={['Transition', 'Rule', 'Override']}
          rows={[
            ['Awake -> Deep', 'Blocked (must pass through Light)', 'Forced to Light, confidence * 0.8'],
            ['Deep -> Awake', 'Blocked if movement < 0.8g', 'Forced to Light, confidence * 0.7'],
            ['REM after Awake', 'Suppressed if 2+ of last 3 epochs were Awake', 'Forced to Light, confidence * 0.6'],
          ]}
        />
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
        gravity vector. By decomposing the raw acceleration into pitch and roll
        angles (after normalizing by total magnitude), we classify your body
        orientation into six positions: supine, prone, left-side, right-side,
        fetal, and unknown.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Angle Calculation
        </p>
        <Formula>{`// Normalize by total acceleration magnitude:
magnitude = sqrt(ax^2 + ay^2 + az^2)
nx = ax / magnitude
ny = ay / magnitude
nz = az / magnitude

// Tilt angles:
pitch = atan2(ny, sqrt(nx^2 + nz^2)) * (180 / PI)
roll  = atan2(-nx, nz) * (180 / PI)`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Classification Rules (Priority Order)
        </p>
        <ThresholdTable
          headers={['Posture', 'Condition', 'Confidence']}
          rows={[
            ['Prone', 'nz < -0.3', 'min(1, |nz| * 1.2)'],
            ['Fetal', '|roll| > 20 deg AND variance > 0.15', 'min(1, 0.5 + variance * 2)'],
            ['Left Side', 'roll > +20 deg', 'min(1, (|roll| - 20) / 40 + 0.5)'],
            ['Right Side', 'roll < -20 deg', 'min(1, (|roll| - 20) / 40 + 0.5)'],
            ['Supine', '|roll| <= 20 AND |pitch| <= 20', 'min(1, 0.6 + flatness * 0.4)'],
            ['Unknown', 'Fallback', '0.3'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          Fetal detection uses acceleration variance (a measure of how curled
          the body is). The flatness metric for supine is computed as
          1 - (|roll| + |pitch|) / 40. Rules are checked in priority
          order; the first match wins.
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Hysteresis Filter
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          To prevent rapid oscillation between postures (e.g., when you are near
          the 20-degree boundary), we apply a 10-second hysteresis window. A new
          posture classification must persist for 10 consecutive seconds before
          it replaces the current posture. We also use a rolling window of 50
          accelerometer samples for noise smoothing.
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
        using five weighted components. Each component uses range-based scoring
        with optimal zones -- not simple linear scales -- reflecting the fact
        that both too little and too much of certain metrics can indicate
        poor sleep.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          1. Deep Sleep Percentage (0-25 points)
        </p>
        <Formula>{`// Optimal range: 15-20% of total sleep time
if (deepPct >= 15 && deepPct <= 20) score = 25  // Full marks
if (deepPct >= 10 && deepPct <  15) score = 15 + ((deepPct - 10) / 5) * 10
if (deepPct >  20 && deepPct <= 30) score = 25 - ((deepPct - 20) / 10) * 5
if (deepPct <  10)                  score = (deepPct / 10) * 15
if (deepPct >  30)                  score = 15  // Capped penalty`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          2. REM Sleep Percentage (0-25 points)
        </p>
        <Formula>{`// Optimal range: 20-25% of total sleep time
if (remPct >= 20 && remPct <= 25) score = 25  // Full marks
if (remPct >= 15 && remPct <  20) score = 15 + ((remPct - 15) / 5) * 10
if (remPct >  25 && remPct <= 35) score = 25 - ((remPct - 25) / 10) * 5
if (remPct <  15)                 score = (remPct / 15) * 15
if (remPct >  35)                 score = 15  // Capped penalty`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          3. Awakenings (0-20 points)
        </p>
        <ThresholdTable
          headers={['Awakenings', 'Score', 'Interpretation']}
          rows={[
            ['0-1', '20', 'Excellent continuity'],
            ['2-3', '15', 'Normal, minor disruptions'],
            ['4-5', '10', 'Moderate fragmentation'],
            ['6-8', '5', 'Significant fragmentation'],
            ['> 8', '0', 'Severely disrupted sleep'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          An awakening is counted when sleep stage transitions back to
          &quot;Awake&quot; after any sleeping stage (light, deep, or REM).
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          4. Posture Transitions (0-15 points)
        </p>
        <ThresholdTable
          headers={['Transitions', 'Score', 'Interpretation']}
          rows={[
            ['10-40', '15', 'Normal repositioning'],
            ['< 10', '10 + (changes / 10) * 5', 'Unusually still (may indicate rigid posture)'],
            ['40-60', '15 - ((changes - 40) / 20) * 10', 'Restless'],
            ['> 60', '2', 'Excessive tossing and turning'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          Note: 10-40 position changes per night is considered healthy. Fewer
          than 10 may indicate the body is locked in a suboptimal position.
          More than 60 suggests significant restlessness.
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          5. Sleep Onset Latency (0-15 points)
        </p>
        <Formula>{`// Time from session start to first non-Awake epoch
if (onset <= 15 min)  score = 15    // Healthy onset
if (15 < onset <= 30) score = 15 - ((onset - 15) / 15) * 8
if (30 < onset <= 60) score = 7 - ((onset - 30) / 30) * 5
if (onset > 60 min)   score = 0     // Severe onset delay`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Composite Formula
        </p>
        <Formula>{`quality = deepSleepScore      // 0-25 pts
        + remSleepScore       // 0-25 pts
        + awakeningScore      // 0-20 pts
        + postureScore        // 0-15 pts
        + onsetScore          // 0-15 pts

// Clamped to [0, 100]
// Grades: >= 85 Excellent, >= 70 Good, >= 50 Fair, < 50 Poor`}</Formula>
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
        quality-adjusted weighting, meaning poor-quality sleep contributes
        additional effective deficit even if the duration looks adequate.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Deficit Formula
        </p>
        <Formula>{`// Target: 8 hours per night (IDEAL_SLEEP_HOURS)
// For each of the last 14 nights:

deficit = 8 - hoursSlept

qualityFactor = sleepQuality / 100

// Quality penalty: poor quality adds 20% of hours as extra deficit
effectiveDeficit = deficit + (1 - qualityFactor) * hoursSlept * 0.2

// Example: 7h sleep at 60% quality =>
//   deficit = 8 - 7 = 1h
//   qualityPenalty = (1 - 0.6) * 7 * 0.2 = 0.56h
//   effectiveDeficit = 1.56h

// Total debt = sum of all 14 nights (no exponential decay)
sleepDebt = SUM(effectiveDeficit[i]) for i in 0..13

// Recovery: MAX_RECOVERY_PER_NIGHT = 2 hours
// Estimated recovery time = ceil(totalDebt / 2) nights`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Impairment Mapping (Van Dongen)
        </p>
        <ThresholdTable
          headers={['Debt (hours)', 'Impairment Level', 'Equivalent']}
          rows={[
            ['0-5h', 'Mild', 'Focus and memory effects'],
            ['5-12h', 'Moderate', 'Similar to BAC ~0.05%'],
            ['12-20h', 'Severe', 'Similar to BAC ~0.10%'],
            ['> 20h', 'Critical', 'Comparable to extended sleep deprivation'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Trend Detection
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          DreamBreeze compares your weekly debt total against the previous
          week. If the weekly sum decreased by more than 2 hours, your trend
          is &quot;improving.&quot; If it increased by more than 2 hours,
          your trend is &quot;worsening.&quot; Otherwise, &quot;stable.&quot;
        </p>
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

function CognitiveReadinessContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        Cognitive readiness predicts your mental performance capacity for the
        day ahead. Unlike the simple energy forecast, this score integrates
        sleep architecture quality, continuity, and contextual factors like
        caffeine intake and exercise into a single actionable number.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Component 1: Duration (0-25 points)
        </p>
        <ThresholdTable
          headers={['Hours Slept', 'Score', 'Rationale']}
          rows={[
            ['>= 8h', '25', 'Full recommended duration'],
            ['>= 7h', '22', 'Adequate for most adults'],
            ['>= 6h', '16', 'Mild restriction'],
            ['>= 5h', '10', 'Moderate restriction'],
            ['< 5h', 'hours * 2', 'Severe restriction'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Component 2: Architecture (0-25 points)
        </p>
        <Formula>{`// Deep sleep and REM contribute equally (12.5 pts each)
deepScore = min(12.5, (deepPct / 20) * 12.5)
remScore  = min(12.5, (remPct / 25) * 12.5)

architectureScore = deepScore + remScore

// Example: 18% deep, 22% REM =>
//   deep = min(12.5, (18/20) * 12.5) = 11.25
//   rem  = min(12.5, (22/25) * 12.5) = 11.0
//   total = 22.25 / 25`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Component 3: Continuity (0-25 points)
        </p>
        <Formula>{`// Starts at 25, penalized by disruptions
score = 25

// Awakening penalty: -3 per awakening, max -15
score -= min(15, awakenings * 3)

// Onset penalty:
if (onsetMinutes > 30) score -= 5
else if (onsetMinutes > 20) score -= 2`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Component 4: Context (0-25 points)
        </p>
        <Formula>{`// Starts at 25, modified by pre-sleep and lifestyle factors
score = 25

// Sleep debt penalties:
if (debtHours > 10) score -= 12
else if (debtHours > 5) score -= 7
else if (debtHours > 2) score -= 3

// Caffeine penalties (consumed before bed):
if (caffeineMg > 200) score -= 5
else if (caffeineMg > 100) score -= 2

// Alcohol penalties:
if (drinks >= 3) score -= 8
else if (drinks >= 1) score -= 3

// Exercise effects:
if (exerciseIntensity === 'moderate') score += 2
if (exerciseIntensity === 'intense')  score -= 1

// Schedule consistency bonus (0-3 pts):
score += (consistencyScore / 100) * 3`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Grade Scale
        </p>
        <ThresholdTable
          headers={['Score', 'Grade', 'Label', 'Peak Hours']}
          rows={[
            ['>= 90', 'A+', 'Peak Performance', '9:00 AM - 12:00 PM'],
            ['>= 80', 'A', 'Excellent', '9:00 AM - 12:00 PM'],
            ['>= 70', 'B+', 'Ready', '9:00 AM - 12:00 PM'],
            ['>= 60', 'B', 'Good Enough', '9:00 AM - 12:00 PM'],
            ['>= 45', 'C', 'Getting By', '10:00 AM - 11:00 AM'],
            ['>= 30', 'D', 'Impaired', '10:00 AM - 11:00 AM'],
            ['< 30', 'F', 'Recovery Needed', '10:00 AM - 11:00 AM'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          Peak hours narrow when the score is below 60, reflecting reduced
          sustained attention capacity.
        </p>
      </div>
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
        most and least alert across an 18-hour window.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Process S (Homeostatic Sleep Pressure)
        </p>
        <Formula>{`// Sleep pressure starts high and dissipates during sleep
baselinePressure = min(100, 40 + sleepDebt * 5)

// Dissipation during sleep (tau = 4.2 hours):
processS = baselinePressure * exp(-hoursSlept / 4.2)

// Rebuilds during wakefulness (tau = 18.2 hours):
processS_wake = 20 + (80 - processS) * (1 - exp(-hoursAwake / 18.2))

// Example: 2h debt, 7h sleep =>
//   baseline = min(100, 40 + 10) = 50
//   after sleep = 50 * exp(-7/4.2) = 9.5
//   after 8h awake = 20 + 70.5 * (1 - exp(-8/18.2)) = 48.3`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Process C (Circadian Rhythm)
        </p>
        <Formula>{`// Primary oscillation + secondary harmonic (post-lunch dip)
primary   = 50 + 40 * sin(((hour - 9) / 24) * 2 * PI)
secondary = 10 * sin(((hour - 15) / 12) * 2 * PI)

processC = clamp(primary + secondary, 0, 100)

// Peak alertness: ~3:00 PM (hour 15)
// Minimum alertness: ~3:00 AM (hour 3)
// Secondary dip: ~1:00-2:00 PM (post-lunch)`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Combined Alertness Forecast
        </p>
        <Formula>{`// Alertness = circadian drive minus sleep pressure
alertness = clamp(processC - processS * 0.3 + 30, 0, 100)

// Quality bonus:
if (hoursSlept >= 7.5) qualityBonus = +10
else if (hoursSlept >= 6) qualityBonus = 0
else qualityBonus = -15

cognitiveReadiness = clamp(alertness + qualityBonus, 0, 100)

// Labels:
// >= 80: "Peak Performance"
// >= 60: "Good Focus"
// >= 40: "Moderate"
// >= 20: "Low Energy"
// <  20: "Rest Recommended"`}</Formula>
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
        DreamBreeze offers six sound types: three synthesized noise colors
        (white, pink, brown) and three sample-based nature sounds (rain, ocean,
        forest). Synthesized sounds are generated in real-time using Web Audio
        API. Nature sounds use pre-recorded 30-second MP3 loops with seamless
        crossfade looping.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Synthesized Noise Generation
        </p>
        <ThresholdTable
          headers={['Color', 'Spectrum', 'Method']}
          rows={[
            ['White', 'Flat (equal power all frequencies)', 'Random samples [-1, +1], 2-second buffer, looped'],
            ['Pink', '-3dB/octave rolloff', 'Paul Kellet 6-filter IIR cascade (see below)'],
            ['Brown', '-6dB/octave rolloff', 'Leaky integrator: out = (out + 0.02 * white) / 1.02, * 3.5'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Pink Noise Filter (Paul Kellet Method)
        </p>
        <Formula>{`// 6 feedback filters applied to white noise:
b0 = 0.99886 * b0 + white * 0.0555179
b1 = 0.99332 * b1 + white * 0.0750759
b2 = 0.96900 * b2 + white * 0.1538520
b3 = 0.86650 * b3 + white * 0.3104856
b4 = 0.55000 * b4 + white * 0.5329522
b5 = -0.7616 * b5 - white * 0.0168980

pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
b6 = white * 0.115926`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Nature Sound Playback
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          Rain, ocean, and forest use 30-second MP3 audio loops loaded on first
          use and cached via Service Worker. Loops use seamless crossfade points
          (loopStart: 0.5s, loopEnd: duration - 0.5s) to prevent audible clicks
          at the loop boundary. If sample loading fails, the engine falls back
          to synthesized noise: rain uses pink, ocean uses brown, forest uses
          pink.
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Sleep-Stage Adaptive Mix (Soundscape Engine)
        </p>
        <ThresholdTable
          headers={['Stage', 'Primary Sound', 'Volume (of base)', 'Filter', 'Notes']}
          rows={[
            ['Awake', 'User preference', '100%', 'None', 'Full volume to aid sleep onset'],
            ['Light', 'Pink noise', '80%', 'None', 'Gentle reduction'],
            ['Deep (SWS)', 'Brown noise', '60%', 'Lowpass 200 Hz', 'Low frequencies only, minimal stimulation'],
            ['REM', 'Pink + White secondary', '110%', 'None', 'Slight boost protects dream sleep from noise intrusion'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          The REM stage is the only one that increases volume above the user&apos;s
          base setting (by 10%). During REM, a secondary white noise layer is
          mixed at 30% gain to broaden the masking spectrum.
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Sound Agent Recommendations
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed mb-2">
          Independently from the soundscape engine, the Sound Agent posts
          recommendations to the Blackboard based on sleep stage and pre-sleep
          context:
        </p>
        <ThresholdTable
          headers={['Stage', 'Recommended Sound', 'Volume (0-1)', 'Notes']}
          rows={[
            ['Awake', 'White noise', '0.40', 'Brown if stress level > 3'],
            ['Light', 'Pink noise', '0.35', ''],
            ['Deep', 'Pink noise', '0.25', ''],
            ['REM', 'Brown noise', '0.30', ''],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          Additional modifiers: volume reduced by 0.15 (min 0.10) during
          pre-wake phase. Caffeine intake above 100mg while awake adds +0.10
          volume (max 0.60).
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Crossfade Timing
        </p>
        <Formula>{`// When transitioning between sound mixes:
crossfadeDuration = 10 seconds (default)

// Old layers fade out in first 40% of duration (4s)
// New layers fade in during last 60% of duration (6s)
// Overlap prevents silence gaps`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Adaptive Volume from Microphone
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          When microphone permission is granted, the app measures ambient noise
          and targets a soundscape level approximately 8 dB above the ambient
          noise floor. Volume is clamped between 10% (always audible) and 80%
          (hearing protection). See the Ambient Noise Analysis section for
          measurement details.
        </p>
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
        DreamBreeze integrates real-time weather data and circadian body
        temperature rhythms to calculate optimal fan speed throughout the
        night. The thermal agent uses a lookup-table-based circadian model
        (not a continuous function) for physiological accuracy.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Circadian Body Temperature Offsets (Lookup Table)
        </p>
        <ThresholdTable
          headers={['Hour', 'Offset (deg C)', 'Phase']}
          rows={[
            ['8:00 PM', '+0.3', 'Evening warmth'],
            ['9:00 PM', '+0.1', 'Beginning to cool'],
            ['10:00 PM', '-0.1', 'Cooling'],
            ['11:00 PM', '-0.3', 'Cooling'],
            ['12:00 AM', '-0.5', 'Night cooling'],
            ['1:00 AM', '-0.7', 'Deep night'],
            ['2:00 AM', '-0.9', 'Approaching nadir'],
            ['3:00 AM', '-1.0', 'Near nadir'],
            ['4:00 AM', '-1.1', 'Nadir (coldest)'],
            ['5:00 AM', '-1.0', 'Beginning to warm'],
            ['6:00 AM', '-0.7', 'Morning warming'],
            ['7:00 AM', '-0.3', 'Warming'],
            ['8:00 AM', '0.0', 'Baseline'],
            ['9:00 AM', '+0.2', 'Morning peak'],
          ]}
        />
        <Formula>{`// Fan speed adjustment from circadian offset:
fanAdjust = round(circadianOffset * 10)

// Example at 4:00 AM (nadir): round(-1.1 * 10) = -11%
// Example at 8:00 PM: round(0.3 * 10) = +3%`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Weather-Based Fan Speed
        </p>
        <ThresholdTable
          headers={['Feels Like (deg C)', 'Base Fan Speed', 'Priority']}
          rows={[
            ['> 32', '80%', 'Critical'],
            ['> 28', '60%', 'Medium'],
            ['> 24', '40%', 'Medium'],
            ['> 20', '20%', 'Medium'],
            ['<= 20', '5%', 'Medium'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          Humidity modifier: +10% if humidity exceeds 75%. Weather data is
          fetched from Open-Meteo every 30 minutes using GPS coordinates
          (with IP-geolocation fallback).
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Weather Fan Recommendation Adjustments
        </p>
        <Formula>{`// Adjustment range: -20 to +20 (added to base fan speed)
if (feelsLike > 35)       adjustment = +20
else if (feelsLike > 30)  adjustment = +15
else if (feelsLike > 26)  adjustment = +8
else if (feelsLike < 18)  adjustment = -15
else if (feelsLike < 22)  adjustment = -5

// Humidity boost:
if (humidity > 80%) adjustment += 10
else if (humidity > 65%) adjustment += 5`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Temperature Profiles
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed mb-2">
          DreamBreeze includes five named temperature profiles, each defining
          fan speed targets across eight night phases:
        </p>
        <ThresholdTable
          headers={['Profile', 'Onset', 'Light', 'Deep', 'REM', 'Mid', 'Pre-Wake']}
          rows={[
            ['Optimal', '55%', '45%', '35%', '50%', '40%', '60%'],
            ['Hot Sleeper', '70%', '60%', '50%', '65%', '55%', '70%'],
            ['Cold Sleeper', '30%', '20%', '15%', '25%', '20%', '35%'],
            ['Tropical', '80%', '70%', '60%', '75%', '65%', '80%'],
            ['Energy Wake', '50%', '40%', '30%', '45%', '35%', '85%'],
          ]}
        />
        <p className="text-xs text-db-text-dim leading-relaxed mt-2">
          Each profile also specifies hot-weather boost and cold-weather
          reduction factors (10-25%). The fan speed is interpolated based on
          sleep session progress (0-1) through the eight phases.
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

function FanSpeedControlContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        Fan speed is determined by a multi-agent blackboard architecture.
        Four specialized agents (Posture, Thermal, Sound, Energy) independently
        analyze sensor data and post speed recommendations. A central
        controller resolves conflicts using priority-weighted averaging.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Posture-Based Fan Speed (Posture Agent)
        </p>
        <ThresholdTable
          headers={['Posture', 'Base Speed', 'Rationale']}
          rows={[
            ['Supine (back)', '55%', 'Most airflow needed -- full torso exposed'],
            ['Left Side', '40%', 'Reduced surface area, moderate airflow'],
            ['Right Side', '40%', 'Reduced surface area, moderate airflow'],
            ['Prone (stomach)', '25%', 'Minimal -- face down, airflow uncomfortable'],
            ['Fetal', '30%', 'Curled position, low surface area'],
            ['Unknown', '35%', 'Conservative default'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Sleep Stage Modifiers (Applied to Posture Base)
        </p>
        <ThresholdTable
          headers={['Stage', 'Modifier', 'Rationale']}
          rows={[
            ['Awake', '+0%', 'Baseline user preference'],
            ['Light', '-5%', 'Beginning to relax, slight reduction'],
            ['Deep (SWS)', '-10%', 'Thermoregulation intact, cooler core temp preferred'],
            ['REM', '+10%', 'Thermoregulatory atonia -- body cannot self-regulate'],
          ]}
        />
        <Formula>{`// Posture Agent formula:
speed = clamp(baseSpeed[posture] + stageMod[stage], 0, 100)

// Example: Supine + REM = 55 + 10 = 65%
// Example: Prone + Deep = 25 + (-10) = 15%
// Confidence: 0.85 (known posture), 0.3 (unknown)
// Priority: High. TTL: 60 seconds.`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Standalone Fan Controller Mapping
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed mb-2">
          A secondary mapping in the fan controller provides stage-specific
          speeds for each posture (used in auto mode):
        </p>
        <ThresholdTable
          headers={['Posture', 'Light', 'Deep', 'REM', 'Awake']}
          rows={[
            ['Supine', '50%', '35%', '65%', '60%'],
            ['Left Side', '40%', '30%', '55%', '60%'],
            ['Right Side', '40%', '30%', '55%', '60%'],
            ['Prone', '25%', '25%', '25%', '60%'],
            ['Fetal', '20%', '20%', '20%', '60%'],
            ['Unknown', '40%', '40%', '40%', '60%'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Blackboard Conflict Resolution
        </p>
        <Formula>{`// Agent priority weights:
critical = 4, high = 3, medium = 2, low = 1

// Fan speed = weighted average of all agent proposals:
finalSpeed = SUM(speed_i * confidence_i * weight_i)
           / SUM(confidence_i * weight_i)

// Delta hypotheses (adjustments) applied additively
// Smoothing: max 5% change per 30-second cycle
// Final speed clamped to [0, 100]

// For sound: highest (weight * confidence) wins
// For insights: all passed through
// For wake sequence: highest confidence wins`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Fan Speed Smoothing
        </p>
        <Formula>{`// Prevents jarring speed changes during sleep
// smoothSpeed(current, target, maxChangePerStep = 2)

if (target > current) {
  speed = min(current + 2, target)
} else {
  speed = max(current - 2, target)
}

// Ramp interval: 200ms per step
// Full 0-100 ramp takes ~10 seconds`}</Formula>
      </div>
    </div>
  );
}

function AmbientNoiseContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-db-text-dim leading-relaxed">
        When microphone permission is granted, DreamBreeze measures ambient
        noise levels in real-time using the Web Audio AnalyserNode. No audio
        is recorded or stored -- the microphone stream is analyzed frame-by-frame
        and immediately discarded.
      </p>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Measurement Method
        </p>
        <Formula>{`// Web Audio API: FFT size 2048, sampled every 500ms
// Calculate RMS (root mean square) from frequency data:
rms = sqrt(mean(sample^2))

// Convert to decibels (full-scale):
dBFS = 20 * log10(rms)

// Approximate SPL (sound pressure level):
dBSPL = clamp(dBFS + 94, 0, 120)

// The +94 dB reference converts from dBFS to approximate
// dB SPL (1 Pa reference at typical smartphone mic sensitivity)`}</Formula>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Noise Classification
        </p>
        <ThresholdTable
          headers={['dB SPL', 'Classification', 'Example Environment']}
          rows={[
            ['< 30 dB', 'Quiet', 'Silent bedroom, rural night'],
            ['30-50 dB', 'Moderate', 'Soft fan, quiet conversation'],
            ['50-70 dB', 'Noisy', 'Traffic, loud conversation'],
            ['> 70 dB', 'Loud', 'Construction, loud music'],
          ]}
        />
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Noise Floor Tracking
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          The analyzer maintains a rolling buffer of 600 samples (approximately
          5 minutes at 500ms intervals). The noise floor is the minimum dB
          reading in this buffer, representing the quietest ambient level.
          This floor is used by the adaptive volume system to set soundscape
          levels approximately 8 dB above the ambient baseline.
        </p>
      </div>

      <div>
        <p className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 font-medium">
          Privacy Guarantee
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          The microphone stream feeds directly into an AnalyserNode. No
          MediaRecorder is used. No audio buffers are stored. Only the
          computed dB level and frequency classification are retained. The
          stream is destroyed when the sleep session ends.
        </p>
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
            'Detect fetal posture with high accuracy (relies on acceleration variance heuristic)',
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
          Ambient Noise Measurement Accuracy
        </p>
        <p className="text-xs text-db-text-dim leading-relaxed">
          The +94 dB reference used to approximate SPL from dBFS is a rough
          estimate. Actual microphone sensitivity varies by device
          manufacturer, model, and hardware generation. DreamBreeze dB
          readings are useful for relative comparisons within a session but
          should not be treated as calibrated measurements. For accurate dB
          SPL readings, use a dedicated sound level meter.
        </p>
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
    summary: 'Accelerometer pitch/roll angles with hysteresis filtering (6 postures)',
    content: <PostureDetectionContent />,
  },
  {
    id: 'sleep-quality',
    title: 'How We Calculate Sleep Quality',
    icon: Brain,
    color: '#f0a060',
    summary: '5-component range-based score from 0 to 100 points',
    content: <SleepQualityContent />,
  },
  {
    id: 'sleep-debt',
    title: 'How We Calculate Sleep Debt',
    icon: Moon,
    color: '#e94560',
    summary: '14-day rolling deficit with quality-adjusted penalties',
    content: <SleepDebtContent />,
  },
  {
    id: 'cognitive',
    title: 'How We Score Cognitive Readiness',
    icon: Zap,
    color: '#f0a060',
    summary: '4-component model: duration, architecture, continuity, context',
    content: <CognitiveReadinessContent />,
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
    summary: 'Synthesis + nature samples with sleep-stage-adaptive volume',
    content: <SoundscapeContent />,
  },
  {
    id: 'thermal',
    title: 'How Thermal Comfort Works',
    icon: Thermometer,
    color: '#f0a060',
    summary: 'Weather data + circadian temperature lookup + temperature profiles',
    content: <ThermalComfortContent />,
  },
  {
    id: 'fan-speed',
    title: 'How Fan Speed Is Controlled',
    icon: Wind,
    color: '#4ecdc4',
    summary: 'Multi-agent blackboard with priority-weighted conflict resolution',
    content: <FanSpeedControlContent />,
  },
  {
    id: 'ambient-noise',
    title: 'How We Measure Ambient Noise',
    icon: Mic,
    color: '#6e5ea8',
    summary: 'Real-time dB SPL estimation from microphone with privacy guarantee',
    content: <AmbientNoiseContent />,
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
          scientific references. These formulas match the actual code running
          on your device.
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
