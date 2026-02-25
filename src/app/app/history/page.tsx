'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  TrendingUp,
  Star,
  User,
  ChevronDown,
  ChevronUp,
  Moon,
  Brain,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import SleepDebtCard from '@/components/ui/SleepDebtCard';
import CognitiveReadinessCard from '@/components/ui/CognitiveReadinessCard';
import EnergyForecast from '@/components/charts/EnergyForecast';
import { calculateCognitiveReadiness } from '@/lib/ai/cognitive-readiness';
import { generateEnergyForecast } from '@/lib/ai/agents/energy-agent';
import type { Posture, SleepStage } from '@/types/sleep';
import { POSTURE_LABELS } from '@/lib/constants/posture';
import { getSessions as getStoredSessions, type StoredSession } from '@/lib/storage/session-storage';

// -- Types ----------------------------------------------------------------------

interface SleepSession {
  id: string;
  date: string;
  dateShort: string;
  dayLabel: string;
  sleepScore: number;
  duration: number; // minutes
  bedtime: string;
  wakeTime: string;
  dominantPosture: Posture;
  timeline: { time: string; stage: number }[];
  postureDistribution: { name: string; value: number; color: string }[];
  fanSpeedOverTime: { time: string; speed: number }[];
  insights: string[];
}

// -- Constants ------------------------------------------------------------------

const STAGE_COLORS: Record<string, string> = {
  Awake: '#f0a060',
  REM: '#6e5ea8',
  Light: '#4ecdc4',
  Deep: '#1a6b66',
};

// -- Score color helper ---------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 85) return '#4ecdc4';
  if (score >= 70) return '#f0a060';
  if (score >= 50) return '#e6c619';
  return '#e94560';
}

function scoreBg(score: number): string {
  if (score >= 85) return 'rgba(78, 205, 196, 0.15)';
  if (score >= 70) return 'rgba(240, 160, 96, 0.15)';
  if (score >= 50) return 'rgba(230, 198, 25, 0.15)';
  return 'rgba(233, 69, 96, 0.15)';
}

// -- Generate mock sessions -----------------------------------------------------

function generateMockSessions(): SleepSession[] {
  const sessions: SleepSession[] = [];
  const postures: Posture[] = ['supine', 'prone', 'left-lateral', 'right-lateral', 'fetal'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const score = Math.floor(60 + Math.random() * 38);
    const duration = Math.floor(360 + Math.random() * 150); // 6-8.5 hrs
    const bedHour = 22 + Math.floor(Math.random() * 2);
    const bedMin = Math.floor(Math.random() * 60);
    const wakeHour = 6 + Math.floor(Math.random() * 2);
    const wakeMin = Math.floor(Math.random() * 60);
    const dominantPosture = postures[Math.floor(Math.random() * postures.length)];

    // Timeline
    const stageSequence: SleepStage[] = [];
    const numPoints = 24;
    const stageOptions: SleepStage[] = ['awake', 'light', 'deep', 'rem'];
    const stageValues: Record<SleepStage, number> = { awake: 3, rem: 2, light: 1, deep: 0 };

    // Realistic sleep progression
    const pattern: SleepStage[] = [
      'awake', 'light', 'light', 'deep', 'deep', 'deep',
      'light', 'rem', 'rem', 'light', 'deep', 'deep',
      'light', 'rem', 'rem', 'light', 'light', 'deep',
      'light', 'rem', 'light', 'light', 'awake', 'awake',
    ];

    const timeline = pattern.map((stage, j) => {
      const t = new Date(date);
      t.setHours(bedHour, bedMin + j * Math.floor(duration / numPoints), 0);
      return {
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stage: stageValues[stage],
      };
    });

    // Posture distribution
    const postureDistribution = [
      { name: 'Back', value: 20 + Math.floor(Math.random() * 30), color: '#4ecdc4' },
      { name: 'Side L', value: 10 + Math.floor(Math.random() * 25), color: '#6e5ea8' },
      { name: 'Side R', value: 10 + Math.floor(Math.random() * 25), color: '#e94560' },
      { name: 'Fetal', value: 5 + Math.floor(Math.random() * 20), color: '#f0a060' },
      { name: 'Stomach', value: 3 + Math.floor(Math.random() * 10), color: '#e6c619' },
    ];

    // Fan speed over time
    const fanSpeedOverTime = Array.from({ length: 12 }, (_, j) => ({
      time: `${j * 0.5 + 0.5}h`,
      speed: Math.floor(20 + Math.random() * 60),
    }));

    sessions.push({
      id: `session-${i}`,
      date: date.toISOString().split('T')[0],
      dateShort: dateStr,
      dayLabel: dayNames[date.getDay()],
      sleepScore: score,
      duration,
      bedtime: `${bedHour.toString().padStart(2, '0')}:${bedMin.toString().padStart(2, '0')}`,
      wakeTime: `${wakeHour.toString().padStart(2, '0')}:${wakeMin.toString().padStart(2, '0')}`,
      dominantPosture,
      timeline,
      postureDistribution,
      fanSpeedOverTime,
      insights:
        i <= 2
          ? []
          : [
              'Deep sleep was 15% longer than your average.',
              'You changed positions 4 times, which is normal.',
              'Fan adjusted automatically 8 times during the night.',
            ],
    });
  }

  return sessions;
}

// -- Map stored sessions to display format ------------------------------------

function mapStoredToDisplay(stored: StoredSession[]): SleepSession[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const stageValues: Record<string, number> = { awake: 3, rem: 2, light: 1, deep: 0 };

  return stored.map((s) => {
    const startDate = new Date(s.startedAt);
    const endDate = new Date(s.endedAt);
    const dateStr = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Build a realistic-looking timeline from stage percentages
    const totalPoints = 24;
    const timeline: { time: string; stage: number }[] = [];
    const stageEntries: { stage: string; count: number }[] = [
      { stage: 'awake', count: Math.round((s.stages.awake / 100) * totalPoints) },
      { stage: 'light', count: Math.round((s.stages.light / 100) * totalPoints) },
      { stage: 'deep', count: Math.round((s.stages.deep / 100) * totalPoints) },
      { stage: 'rem', count: Math.round((s.stages.rem / 100) * totalPoints) },
    ];

    // Distribute stages in a sleep-like pattern:
    // awake -> light -> deep -> light -> rem -> light -> deep -> rem -> light -> awake
    const pattern: string[] = [];
    const deepCount = stageEntries.find(e => e.stage === 'deep')!.count;
    const remCount = stageEntries.find(e => e.stage === 'rem')!.count;
    const lightCount = stageEntries.find(e => e.stage === 'light')!.count;
    const awakeCount = stageEntries.find(e => e.stage === 'awake')!.count;

    // Simple distribution: awake start, light, deep, light, rem, repeat, awake end
    const halfAwake = Math.max(1, Math.floor(awakeCount / 2));
    for (let i = 0; i < halfAwake; i++) pattern.push('awake');
    for (let i = 0; i < Math.ceil(lightCount / 3); i++) pattern.push('light');
    for (let i = 0; i < Math.ceil(deepCount / 2); i++) pattern.push('deep');
    for (let i = 0; i < Math.ceil(lightCount / 3); i++) pattern.push('light');
    for (let i = 0; i < Math.ceil(remCount / 2); i++) pattern.push('rem');
    for (let i = 0; i < Math.floor(lightCount / 3); i++) pattern.push('light');
    for (let i = 0; i < Math.floor(deepCount / 2); i++) pattern.push('deep');
    for (let i = 0; i < Math.floor(remCount / 2); i++) pattern.push('rem');
    for (let i = 0; i < awakeCount - halfAwake; i++) pattern.push('awake');

    // Trim or pad to totalPoints
    while (pattern.length < totalPoints) pattern.push('light');
    const trimmedPattern = pattern.slice(0, totalPoints);

    const minutesPerPoint = s.durationMinutes / totalPoints;
    for (let j = 0; j < totalPoints; j++) {
      const t = new Date(startDate.getTime() + j * minutesPerPoint * 60000);
      timeline.push({
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stage: stageValues[trimmedPattern[j]] ?? 1,
      });
    }

    // Posture distribution for pie chart
    const postureDistribution = [
      { name: 'Back', value: s.postures.supine, color: '#4ecdc4' },
      { name: 'Side', value: s.postures.lateral, color: '#6e5ea8' },
      { name: 'Fetal', value: s.postures.fetal, color: '#f0a060' },
      { name: 'Stomach', value: s.postures.prone, color: '#e6c619' },
    ].filter(p => p.value > 0);

    // Fan speed over time (synthesized from average)
    const fanSpeedOverTime = Array.from({ length: 12 }, (_, j) => {
      // Vary around the average, clamped to 0-100
      const variation = (Math.sin(j * 0.8) + Math.cos(j * 0.5)) * 10;
      const speed = Math.max(0, Math.min(100, Math.round(s.avgFanSpeed + variation)));
      return { time: `${(j * 0.5 + 0.5).toFixed(1)}h`, speed };
    });

    const bedHour = startDate.getHours();
    const bedMin = startDate.getMinutes();
    const wakeHour = endDate.getHours();
    const wakeMin = endDate.getMinutes();

    return {
      id: s.id,
      date: s.date,
      dateShort: dateStr,
      dayLabel: dayNames[startDate.getDay()],
      sleepScore: s.sleepScore,
      duration: s.durationMinutes,
      bedtime: `${bedHour.toString().padStart(2, '0')}:${bedMin.toString().padStart(2, '0')}`,
      wakeTime: `${wakeHour.toString().padStart(2, '0')}:${wakeMin.toString().padStart(2, '0')}`,
      dominantPosture: s.dominantPosture,
      timeline,
      postureDistribution,
      fanSpeedOverTime,
      insights: s.insights,
    };
  });
}

// -- Mini Timeline Bar ----------------------------------------------------------

function MiniTimelineBar({ timeline }: { timeline: { time: string; stage: number }[] }) {
  const stageColors = ['#1a6b66', '#4ecdc4', '#6e5ea8', '#f0a060'];
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px">
      {timeline.map((point, i) => (
        <div
          key={i}
          className="flex-1 transition-colors"
          style={{ backgroundColor: stageColors[point.stage] }}
        />
      ))}
    </div>
  );
}

// -- Custom Recharts Tooltip ----------------------------------------------------

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const stageVal = payload[0].value;
  const stages = ['Deep', 'Light', 'REM', 'Awake'];
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="text-db-text-dim">{label}</p>
      <p className="font-semibold" style={{ color: STAGE_COLORS[stages[stageVal]] }}>
        {stages[stageVal]}
      </p>
    </div>
  );
}

// -- Main Component -------------------------------------------------------------

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load real sessions from localStorage, falling back to mock data
  useEffect(() => {
    const stored = getStoredSessions();
    if (stored.length > 0) {
      setSessions(mapStoredToDisplay(stored));
      setIsDemo(false);
    } else {
      setSessions(generateMockSessions());
      setIsDemo(true);
    }
  }, []);

  // Summary calculations (guarded for empty initial state)
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.sleepScore, 0) / sessions.length)
    : 0;
  const totalSleep = sessions.reduce((a, s) => a + s.duration, 0);
  const totalSleepHours = Math.floor(totalSleep / 60);
  const totalSleepMins = totalSleep % 60;
  const bestNight = sessions.length > 0
    ? sessions.reduce((best, s) => (s.sleepScore > best.sleepScore ? s : best))
    : null;
  const postureCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    postureCounts[s.dominantPosture] = (postureCounts[s.dominantPosture] || 0) + 1;
  });
  const postureEntries = Object.entries(postureCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonPosture = (postureEntries.length > 0 ? postureEntries[0][0] : 'supine') as Posture;

  // Trend data (7-day scores)
  const trendData = sessions.map((s) => ({
    day: s.dayLabel,
    score: s.sleepScore,
  }));

  const firstScore = sessions[0]?.sleepScore || 0;
  const lastScore = sessions[sessions.length - 1]?.sleepScore || 0;
  const improvement = lastScore - firstScore;

  // -- Cognitive Readiness (last night) ----------------------------------------
  const cognitiveReadiness = useMemo(() => {
    const lastSession = sessions[sessions.length - 1];
    const hoursSlept = lastSession ? lastSession.duration / 60 : 7;
    return calculateCognitiveReadiness({
      hoursSlept,
      deepSleepPercent: 18,
      remSleepPercent: 22,
      awakenings: 2,
      sleepDebtHours: 4.5,
      sleepOnsetMinutes: 12,
      preSleepCaffeineMg: 80,
      preSleepAlcohol: 0,
      preSleepExercise: 'light',
      consistency: 72,
    });
  }, [sessions]);

  // -- Energy Forecast (today) -------------------------------------------------
  const energyForecastData = useMemo(() => {
    const lastSession = sessions[sessions.length - 1];
    const hoursSlept = lastSession ? lastSession.duration / 60 : 7;
    return generateEnergyForecast(hoursSlept, 4.5);
  }, [sessions]);

  // -- 7-Night Cognitive Readiness Trend (demo data) ---------------------------
  const cognitiveScoreTrend = useMemo(() => {
    const demoScores = [58, 62, 55, 71, 68, 74, cognitiveReadiness.score];
    return sessions.map((s, i) => ({
      day: s.dayLabel,
      score: demoScores[i] ?? cognitiveReadiness.score,
    }));
  }, [sessions, cognitiveReadiness.score]);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Don't render until sessions are loaded (prevents flash of empty state)
  if (sessions.length === 0) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-db-text">Sleep History</h1>
        <p className="text-xs text-db-text-dim mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-db-text">Sleep History</h1>
          {isDemo && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/10">
              Demo data
            </span>
          )}
        </div>
        <p className="text-xs text-db-text-dim mt-0.5">
          {isDemo
            ? 'Start a sleep session to see real history'
            : `Last ${sessions.length} night${sessions.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ======================================================================
          Summary Cards (horizontal scroll)
          ====================================================================== */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {/* Avg Score */}
        <div className="glass skeu-raised rounded-2xl p-4 min-w-[140px] flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} className="text-db-text-muted" />
            <span className="text-[10px] text-db-text-muted uppercase tracking-wider">
              Avg Score
            </span>
          </div>
          <p className="text-3xl font-bold" style={{ color: scoreColor(avgScore) }}>
            {avgScore}
          </p>
          <p className="text-[10px] text-db-text-dim">this week</p>
        </div>

        {/* Total Sleep */}
        <div className="glass skeu-raised rounded-2xl p-4 min-w-[140px] flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={12} className="text-db-text-muted" />
            <span className="text-[10px] text-db-text-muted uppercase tracking-wider">
              Total Sleep
            </span>
          </div>
          <p className="text-2xl font-bold text-db-teal">
            {totalSleepHours}
            <span className="text-sm font-normal text-db-text-dim">h </span>
            {totalSleepMins}
            <span className="text-sm font-normal text-db-text-dim">m</span>
          </p>
          <p className="text-[10px] text-db-text-dim">this week</p>
        </div>

        {/* Best Night */}
        <div className="glass skeu-raised rounded-2xl p-4 min-w-[140px] flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Star size={12} className="text-db-text-muted" />
            <span className="text-[10px] text-db-text-muted uppercase tracking-wider">
              Best Night
            </span>
          </div>
          <p className="text-2xl font-bold text-db-amber">{bestNight?.sleepScore ?? '--'}</p>
          <p className="text-[10px] text-db-text-dim">{bestNight?.dateShort ?? '--'}</p>
        </div>

        {/* Most Common Posture */}
        <div className="glass skeu-raised rounded-2xl p-4 min-w-[140px] flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <User size={12} className="text-db-text-muted" />
            <span className="text-[10px] text-db-text-muted uppercase tracking-wider">
              Top Posture
            </span>
          </div>
          <p className="text-lg font-bold text-db-lavender">
            {POSTURE_LABELS[mostCommonPosture]}
          </p>
          <p className="text-[10px] text-db-text-dim">most common</p>
        </div>
      </div>

      {/* ======================================================================
          Row 1: Sleep Debt | Cognitive Readiness (side by side)
          ====================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SleepDebtCard
          totalDebtHours={4.5}
          weeklyDebtHours={2.5}
          trend="improving"
          recoveryNightsNeeded={2}
          impairmentLevel="mild"
          impairmentEquivalent="Similar to 0.03% BAC -- mildly reduced reaction time and working memory."
          recommendations={[
            'Go to bed 30 minutes earlier for the next 3 nights.',
            'Avoid screens 1 hour before bedtime to improve onset latency.',
            'Keep your wake time consistent, even on weekends.',
          ]}
        />
        <CognitiveReadinessCard
          score={cognitiveReadiness.score}
          grade={cognitiveReadiness.grade}
          label={cognitiveReadiness.label}
          breakdown={cognitiveReadiness.breakdown}
          peakHours={cognitiveReadiness.peakHours}
          advice={cognitiveReadiness.advice}
        />
      </div>

      {/* ======================================================================
          Row 2: Energy Forecast (full width)
          ====================================================================== */}
      <EnergyForecast
        data={energyForecastData}
        peakStart={cognitiveReadiness.peakHours.start}
        peakEnd={cognitiveReadiness.peakHours.end}
      />

      {/* ======================================================================
          Row 3: 7-Night Cognitive Readiness Trend
          ====================================================================== */}
      <section className="glass skeu-raised rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-db-text-dim flex items-center gap-2">
            <Activity size={14} />
            Cognitive Readiness Trend
          </h2>
          {cognitiveScoreTrend.length >= 2 &&
            cognitiveScoreTrend[cognitiveScoreTrend.length - 1].score >
              cognitiveScoreTrend[0].score && (
              <span className="text-[10px] font-medium text-db-teal bg-db-teal/10 px-2 py-0.5 rounded-full">
                +
                {cognitiveScoreTrend[cognitiveScoreTrend.length - 1].score -
                  cognitiveScoreTrend[0].score}{' '}
                pts this week
              </span>
            )}
        </div>

        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={cognitiveScoreTrend}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="cogTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6e5ea8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6e5ea8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: '#555577', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[30, 100]}
                tick={{ fill: '#555577', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: '#151a35',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value?: number) => [`${value ?? 0}`, 'Readiness']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6e5ea8"
                strokeWidth={2.5}
                dot={{ fill: '#6e5ea8', r: 3, strokeWidth: 0 }}
                activeDot={{ fill: '#6e5ea8', r: 5, strokeWidth: 2, stroke: '#0a0e27' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-db-text-dim mt-2 text-center">
          Your cognitive readiness has been{' '}
          {cognitiveScoreTrend[cognitiveScoreTrend.length - 1].score >=
          cognitiveScoreTrend[0].score ? (
            <>
              trending{' '}
              <span className="text-db-lavender font-medium">upward</span> this
              week.
            </>
          ) : (
            <>
              <span className="text-db-amber font-medium">declining</span> -- consider
              prioritizing sleep consistency.
            </>
          )}
        </p>
      </section>

      {/* ======================================================================
          Session List
          ====================================================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-db-text-dim flex items-center gap-2">
          <Moon size={14} />
          Nightly Sessions
        </h2>

        {sessions.map((session) => {
          const isExpanded = expandedId === session.id;
          return (
            <motion.div
              key={session.id}
              className="glass skeu-raised rounded-2xl overflow-hidden"
              layout
            >
              {/* Session summary row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                aria-expanded={isExpanded}
                aria-label={`Sleep session ${session.dateShort}, score ${session.sleepScore}, ${formatDuration(session.duration)}`}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                {/* Date */}
                <div className="w-12 text-center flex-shrink-0">
                  <p className="text-xs text-db-text-muted">{session.dayLabel}</p>
                  <p className="text-sm font-bold text-db-text">{session.dateShort.split(' ')[1]}</p>
                </div>

                {/* Score badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: scoreBg(session.sleepScore),
                    color: scoreColor(session.sleepScore),
                    border: `1px solid ${scoreColor(session.sleepScore)}30`,
                  }}
                >
                  {session.sleepScore}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-db-text-dim mb-1.5">
                    <span>{formatDuration(session.duration)}</span>
                    <span className="text-db-text-muted">|</span>
                    <span>{session.bedtime} - {session.wakeTime}</span>
                  </div>
                  <MiniTimelineBar timeline={session.timeline} />
                </div>

                {/* Posture + Chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-db-text-muted">
                    {POSTURE_LABELS[session.dominantPosture]}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-db-text-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-db-text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04] pt-4">
                      {/* Full sleep timeline chart */}
                      <div>
                        <h3 className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Brain size={12} />
                          Sleep Stages
                        </h3>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={session.timeline}
                              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                            >
                              <defs>
                                <linearGradient id={`grad-${session.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6e5ea8" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#0a0e27" stopOpacity={0.1} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="time"
                                tick={{ fill: '#555577', fontSize: 9 }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                              />
                              <YAxis
                                domain={[0, 3]}
                                ticks={[0, 1, 2, 3]}
                                tickFormatter={(v: number) =>
                                  ['Deep', 'Light', 'REM', 'Awake'][v] || ''
                                }
                                tick={{ fill: '#555577', fontSize: 9 }}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                              />
                              <Tooltip content={<ChartTooltip />} />
                              <Area
                                type="stepAfter"
                                dataKey="stage"
                                stroke="#6e5ea8"
                                strokeWidth={2}
                                fill={`url(#grad-${session.id})`}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Posture distribution + Fan speed side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Posture pie */}
                        <div>
                          <h3 className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2">
                            Postures
                          </h3>
                          <div className="h-28">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={session.postureDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={45}
                                  paddingAngle={2}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {session.postureDistribution.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value?: number, name?: string) => [
                                    `${value ?? 0}%`,
                                    name ?? '',
                                  ]}
                                  contentStyle={{
                                    background: '#151a35',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    fontSize: 11,
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                            {session.postureDistribution.map((p) => (
                              <span
                                key={p.name}
                                className="text-[9px] text-db-text-dim flex items-center gap-0.5"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full inline-block"
                                  style={{ backgroundColor: p.color }}
                                />
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Fan speed line */}
                        <div>
                          <h3 className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2">
                            Fan Speed
                          </h3>
                          <div className="h-28">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={session.fanSpeedOverTime}
                                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                              >
                                <XAxis
                                  dataKey="time"
                                  tick={{ fill: '#555577', fontSize: 8 }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[0, 100]}
                                  tick={{ fill: '#555577', fontSize: 8 }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={28}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="speed"
                                  stroke="#4ecdc4"
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div>
                        <h3 className="text-[11px] text-db-text-muted uppercase tracking-wider mb-2">
                          AI Insights
                        </h3>
                        {session.insights.length > 0 ? (
                          <ul className="space-y-1.5">
                            {session.insights.map((insight, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-db-text-dim flex items-start gap-2"
                              >
                                <span className="w-1 h-1 rounded-full bg-db-teal mt-1.5 flex-shrink-0" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-db-text-muted italic">
                            Track 3+ nights for AI insights
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </section>

      {/* ======================================================================
          Trends
          ====================================================================== */}
      <section className="glass skeu-raised rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-db-text-dim flex items-center gap-2">
            <TrendingUp size={14} />
            7-Day Trend
          </h2>
          {improvement > 0 && (
            <span className="text-[10px] font-medium text-db-teal bg-db-teal/10 px-2 py-0.5 rounded-full">
              +{improvement}% this week
            </span>
          )}
        </div>

        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4ecdc4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: '#555577', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[50, 100]}
                tick={{ fill: '#555577', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: '#151a35',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value?: number) => [`${value ?? 0}`, 'Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#4ecdc4"
                strokeWidth={2.5}
                dot={{ fill: '#4ecdc4', r: 3, strokeWidth: 0 }}
                activeDot={{ fill: '#4ecdc4', r: 5, strokeWidth: 2, stroke: '#0a0e27' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {improvement > 0 ? (
          <p className="text-xs text-db-text-dim mt-2 text-center">
            Your sleep quality improved by{' '}
            <span className="text-db-teal font-medium">{improvement}%</span> this week. Keep
            it up!
          </p>
        ) : (
          <p className="text-xs text-db-text-dim mt-2 text-center">
            Your sleep has been consistent. Fine-tune your settings for improvement.
          </p>
        )}
      </section>
    </div>
  );
}
