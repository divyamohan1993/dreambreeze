'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wind,
  Thermometer,
  AlertTriangle,
  Smartphone,
  Brain,
  Volume2,
  Play,
  Megaphone,
  Shield,
  Users,
  Rocket,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  Zap,
  Wifi,
  Code,
  TrendingUp,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ===========================================================================
   SHARED COMPONENTS
   =========================================================================== */
function SpinningFanBg({ opacity = 'opacity-10' }: { opacity?: string }) {
  return (
    <div className={`pointer-events-none absolute -right-32 -top-32 ${opacity}`}>
      <div className="fan-bg-spin relative h-[400px] w-[400px]">
        {[0, 72, 144, 216, 288].map((angle) => (
          <div
            key={angle}
            className="absolute"
            style={{
              width: 72,
              height: 168,
              left: '50%',
              top: '50%',
              transformOrigin: '50% 0%',
              transform: `translateX(-50%) rotate(${angle}deg)`,
              background:
                'linear-gradient(180deg, rgba(78,205,196,0.35) 0%, rgba(78,205,196,0.05) 100%)',
              borderRadius: '50% 50% 40% 40%',
              border: '1px solid rgba(78,205,196,0.2)',
            }}
          />
        ))}
        <div
          className="absolute rounded-full border border-white/10 bg-db-surface"
          style={{ width: 48, height: 48, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 2 }}
        />
      </div>
      <style>{`
        .fan-bg-spin { animation: spin-pitch-fan 10s linear infinite; }
        @keyframes spin-pitch-fan { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function SlideShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-8 py-12 md:px-16 ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-db-teal/20 bg-db-teal/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-db-teal">
      {children}
    </span>
  );
}

/* ===========================================================================
   SLIDES
   =========================================================================== */

/* SLIDE 1 -- Title */
function SlideTitle() {
  return (
    <SlideShell>
      <SpinningFanBg opacity="opacity-15" />
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-db-teal/10"
        >
          <Wind size={48} className="text-db-teal" />
        </motion.div>
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-4 text-6xl font-extrabold tracking-tight text-db-text md:text-8xl"
        >
          Dream
          <span className="bg-gradient-to-r from-db-teal to-db-lavender bg-clip-text text-transparent">
            Breeze
          </span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl text-db-text-dim md:text-2xl"
        >
          AI Sleep Comfort, Reimagined
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-sm text-db-text-muted"
        >
          Seed Round Pitch &middot; 2026
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* SLIDE 2 -- Problem */
function SlideProblem() {
  const stats = [
    { value: '68%', label: 'of Americans report poor sleep quality' },
    { value: '74%', label: 'of Indians report poor sleep quality' },
  ];
  return (
    <SlideShell>
      <Badge>The Problem</Badge>
      <h2 className="mb-10 max-w-2xl text-center text-3xl font-bold text-db-text md:text-5xl">
        Billions sleep poorly.{' '}
        <span className="text-db-rose">Fans can&rsquo;t keep up.</span>
      </h2>
      <div className="mb-10 flex flex-wrap justify-center gap-6">
        {stats.map((s) => (
          <motion.div
            key={s.value}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="glass skeu-raised flex flex-col items-center p-6 text-center"
            style={{ minWidth: 200 }}
          >
            <span className="mb-1 text-4xl font-extrabold text-db-rose">{s.value}</span>
            <span className="text-sm text-db-text-dim">{s.label}</span>
          </motion.div>
        ))}
      </div>
      <div className="max-w-xl space-y-4 text-center">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass flex items-start gap-3 p-4 text-left"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-db-amber" />
          <p className="text-sm text-db-text-dim">
            <strong className="text-db-text">Fans are binary</strong> &mdash; on or off. But your
            body&rsquo;s needs change <strong className="text-db-text">40+ times per night</strong>.
          </p>
        </motion.div>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass flex items-start gap-3 p-4 text-left"
        >
          <Thermometer size={20} className="mt-0.5 shrink-0 text-db-rose" />
          <p className="text-sm text-db-text-dim">
            During <strong className="text-db-text">REM sleep</strong>, your body{' '}
            <strong className="text-db-rose">CANNOT</strong> regulate its own temperature.
          </p>
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* SLIDE 3 -- Solution */
function SlideSolution() {
  const steps = [
    { icon: Smartphone, label: 'Detects posture', color: 'text-db-teal' },
    { icon: Brain, label: 'Controls fan speed', color: 'text-db-lavender' },
    { icon: Volume2, label: 'Adapts soundscapes', color: 'text-db-amber' },
  ];
  return (
    <SlideShell>
      <Badge>The Solution</Badge>
      <h2 className="mb-4 text-center text-3xl font-bold text-db-text md:text-5xl">
        Your phone becomes a{' '}
        <span className="bg-gradient-to-r from-db-teal to-db-lavender bg-clip-text text-transparent">
          sleep comfort AI agent
        </span>
      </h2>
      <p className="mb-12 text-center text-db-text-dim">
        No new hardware. Just your phone and a fan.
      </p>

      {/* Flow diagram */}
      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-0">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.2 }}
            className="flex items-center gap-4"
          >
            <div className="glass skeu-raised flex flex-col items-center gap-3 p-6" style={{ minWidth: 160 }}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 ${step.color}`}>
                <step.icon size={28} />
              </div>
              <span className="text-sm font-medium text-db-text">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={24} className="hidden text-db-teal/40 md:block" />
            )}
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* SLIDE 4 -- Magic / Demo */
function SlideMagic() {
  const stages = [
    { time: '0s', posture: 'Supine', fan: '40%', stage: 'Light Sleep' },
    { time: '2s', posture: 'Supine', fan: '25%', stage: 'Deep Sleep' },
    { time: '4s', posture: 'Supine', fan: '60%', stage: 'REM Sleep' },
    { time: '6s', posture: 'Lateral', fan: '45%', stage: 'REM Sleep' },
    { time: '8s', posture: 'Lateral', fan: '30%', stage: 'Light Sleep' },
  ];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((p) => (p + 1) % stages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [stages.length]);

  const current = stages[activeIdx];

  return (
    <SlideShell>
      <Badge>The Magic</Badge>
      <h2 className="mb-8 text-center text-3xl font-bold text-db-text md:text-5xl">
        See it in action
      </h2>

      <motion.div
        className="glass skeu-raised mx-auto mb-8 w-full max-w-lg overflow-hidden"
        layout
      >
        <div className="border-b border-white/5 px-6 py-3 text-xs text-db-text-dim">
          Live Simulation
        </div>
        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="text-center">
            <div className="mb-1 text-xs text-db-text-dim">Posture</div>
            <motion.div
              key={current.posture}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-db-teal"
            >
              {current.posture}
            </motion.div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-xs text-db-text-dim">Fan Speed</div>
            <motion.div
              key={current.fan}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-db-amber"
            >
              {current.fan}
            </motion.div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-xs text-db-text-dim">Sleep Stage</div>
            <motion.div
              key={current.stage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-db-lavender"
            >
              {current.stage}
            </motion.div>
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 px-6 pb-4">
          {stages.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-all ${
                i === activeIdx ? 'bg-db-teal' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="flex items-center gap-2 text-sm text-db-text-dim">
          <Zap size={14} className="text-db-amber" />
          Response time: <strong className="text-db-text">&lt;2 seconds</strong>
        </p>
        <Link
          href="/demo"
          className="group inline-flex items-center gap-2 rounded-full bg-db-teal/10 px-6 py-2.5 text-sm font-semibold text-db-teal transition hover:bg-db-teal/20"
        >
          <Play size={14} />
          Watch Full 60-Second Demo
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </SlideShell>
  );
}

/* SLIDE 5 -- Business Model */
function SlideBusinessModel() {
  const free = [
    'Basic posture detection',
    'Manual fan control',
    '7-day history',
  ];
  const premium = [
    'AI sleep coach',
    'Adaptive soundscapes',
    'Smart home integration',
    'Unlimited history',
    'Family sharing (up to 5)',
  ];

  return (
    <SlideShell>
      <Badge>Business Model</Badge>
      <h2 className="mb-10 text-center text-3xl font-bold text-db-text md:text-5xl">
        Freemium that <span className="text-db-teal">converts</span>
      </h2>

      <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
        {/* Free tier */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass flex flex-col p-6"
        >
          <h3 className="mb-1 text-lg font-bold text-db-text">Free</h3>
          <p className="mb-4 text-2xl font-extrabold text-db-text-dim">$0</p>
          <ul className="space-y-2">
            {free.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-db-text-dim">
                <Check size={14} className="shrink-0 text-db-teal" />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Premium tier */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass skeu-raised relative flex flex-col border-db-teal/30 p-6"
        >
          <div className="absolute -top-3 right-4 rounded-full bg-db-teal px-3 py-0.5 text-xs font-bold text-db-navy">
            RECOMMENDED
          </div>
          <h3 className="mb-1 text-lg font-bold text-db-text">Premium</h3>
          <p className="mb-4 text-2xl font-extrabold text-db-teal">
            $4.99<span className="text-sm font-normal text-db-text-dim">/mo</span>
          </p>
          <ul className="space-y-2">
            {premium.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-db-text-dim">
                <Check size={14} className="shrink-0 text-db-teal" />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* SLIDE 6 -- Go-to-Market */
function SlideGoToMarket() {
  const phases = [
    {
      icon: Users,
      phase: 'Phase 1',
      title: 'Community Seeding',
      desc: 'Reddit r/sleep, r/smarthome, sleep wellness forums, sleep influencers',
    },
    {
      icon: Rocket,
      phase: 'Phase 2',
      title: 'Launch & Media',
      desc: 'ProductHunt launch, tech media outreach, sleep tech reviews',
    },
    {
      icon: Wifi,
      phase: 'Phase 3',
      title: 'Hardware Partnerships',
      desc: 'Atomberg, Crompton, Havells -- preinstalled on smart fan apps',
    },
    {
      icon: Shield,
      phase: 'Phase 4',
      title: 'Wellness Programs',
      desc: 'Health insurance wellness integrations, corporate wellness packages',
    },
  ];
  return (
    <SlideShell>
      <Badge>Go-to-Market</Badge>
      <h2 className="mb-10 text-center text-3xl font-bold text-db-text md:text-5xl">
        How we <span className="text-db-teal">grow</span>
      </h2>
      <div className="grid w-full max-w-2xl gap-4">
        {phases.map((p, i) => (
          <motion.div
            key={p.phase}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 * i }}
            className="glass flex items-center gap-4 p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-db-teal/10 text-db-teal">
              <p.icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-db-teal">
                  {p.phase}
                </span>
                <span className="text-sm font-semibold text-db-text">{p.title}</span>
              </div>
              <p className="text-xs text-db-text-dim">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* SLIDE 7 -- Competition */
function SlideCompetition() {
  const rows = [
    {
      name: 'Eight Sleep Pod',
      price: '$2,295',
      posture: false,
      fan: false,
      sound: false,
      ai: true,
      phone: false,
    },
    {
      name: 'Dreo Smart Fan',
      price: '$89',
      posture: false,
      fan: true,
      sound: false,
      ai: false,
      phone: false,
    },
    {
      name: 'Sleep Cycle App',
      price: 'Free',
      posture: false,
      fan: false,
      sound: false,
      ai: false,
      phone: true,
    },
    {
      name: 'DreamBreeze',
      price: '$4.99/mo',
      posture: true,
      fan: true,
      sound: true,
      ai: true,
      phone: true,
      highlight: true,
    },
  ];
  const cols = ['Posture', 'Fan', 'Sound', 'AI', 'Phone'];

  return (
    <SlideShell>
      <Badge>Competitive Landscape</Badge>
      <h2 className="mb-8 text-center text-3xl font-bold text-db-text md:text-4xl">
        50x cheaper. 10x smarter.
      </h2>
      <div className="w-full max-w-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-3 py-3 text-left font-medium text-db-text-dim">Product</th>
              <th className="px-3 py-3 text-center font-medium text-db-text-dim">Price</th>
              {cols.map((c) => (
                <th key={c} className="px-3 py-3 text-center font-medium text-db-text-dim">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <motion.tr
                key={r.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-b border-white/5 ${
                  r.highlight ? 'bg-db-teal/5' : ''
                }`}
              >
                <td className={`px-3 py-3 font-medium ${r.highlight ? 'text-db-teal' : 'text-db-text'}`}>
                  {r.name}
                </td>
                <td className="px-3 py-3 text-center text-db-text-dim">{r.price}</td>
                {[r.posture, r.fan, r.sound, r.ai, r.phone].map((v, i) => (
                  <td key={i} className="px-3 py-3 text-center">
                    {v ? (
                      <Check size={16} className="mx-auto text-db-teal" />
                    ) : (
                      <X size={16} className="mx-auto text-db-text-muted" />
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideShell>
  );
}

/* SLIDE 8 -- Team */
function SlideTeam() {
  const members = [
    { initials: 'SK', role: 'CEO / Product', desc: 'Ex-sleep tech researcher, 5 yrs ML' },
    { initials: 'RP', role: 'CTO / Engineering', desc: 'Ex-Google, TensorFlow contributor' },
    { initials: 'AM', role: 'Design / UX', desc: 'Human-centered design, health apps' },
    { initials: 'VN', role: 'Hardware / IoT', desc: 'Smart home systems, MQTT expert' },
  ];
  return (
    <SlideShell>
      <Badge>The Team</Badge>
      <h2 className="mb-3 text-center text-3xl font-bold text-db-text md:text-5xl">
        Built by engineers who{' '}
        <span className="text-db-lavender">couldn&rsquo;t sleep well</span>
      </h2>
      <p className="mb-10 text-center text-db-text-dim">We solved our own problem first.</p>
      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
        {members.map((m, i) => (
          <motion.div
            key={m.initials}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 * i }}
            className="glass flex flex-col items-center p-5 text-center"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-db-teal/20 to-db-lavender/20 text-lg font-bold text-db-teal">
              {m.initials}
            </div>
            <span className="text-sm font-semibold text-db-text">{m.role}</span>
            <span className="mt-1 text-xs text-db-text-dim">{m.desc}</span>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* SLIDE 9 -- Projections */
function SlideProjections() {
  const years = [
    { year: 'Year 1', users: '50K', conv: '5%', paid: '2,500', arr: '$150K', barH: 20 },
    { year: 'Year 2', users: '200K', conv: '8%', paid: '16,000', arr: '$960K', barH: 55 },
    { year: 'Year 3', users: '500K', conv: '10%', paid: '50,000', arr: '$3M', barH: 100 },
  ];

  return (
    <SlideShell>
      <Badge>Projections</Badge>
      <h2 className="mb-10 text-center text-3xl font-bold text-db-text md:text-5xl">
        Path to <span className="text-db-teal">$3M ARR</span>
      </h2>

      {/* Bar chart */}
      <div className="mb-8 flex items-end justify-center gap-8">
        {years.map((y, i) => (
          <motion.div
            key={y.year}
            initial={{ height: 0 }}
            animate={{ height: `${y.barH * 2}px` }}
            transition={{ delay: 0.2 + i * 0.2, duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            <span className="mb-2 text-sm font-bold text-db-teal">{y.arr}</span>
            <div
              className="w-16 rounded-t-lg bg-gradient-to-t from-db-teal/60 to-db-teal md:w-20"
              style={{ height: `${y.barH * 2}px` }}
            />
            <span className="mt-2 text-xs text-db-text-dim">{y.year}</span>
          </motion.div>
        ))}
      </div>

      {/* Data table */}
      <div className="w-full max-w-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-db-text-dim">
              <th className="px-2 py-2 text-left"></th>
              <th className="px-2 py-2 text-center">Users</th>
              <th className="px-2 py-2 text-center">Conv.</th>
              <th className="px-2 py-2 text-center">Paid</th>
              <th className="px-2 py-2 text-center">ARR</th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y.year} className="border-b border-white/5">
                <td className="px-2 py-2 font-medium text-db-text">{y.year}</td>
                <td className="px-2 py-2 text-center text-db-text-dim">{y.users}</td>
                <td className="px-2 py-2 text-center text-db-text-dim">{y.conv}</td>
                <td className="px-2 py-2 text-center text-db-text-dim">{y.paid}</td>
                <td className="px-2 py-2 text-center font-semibold text-db-teal">{y.arr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideShell>
  );
}

/* SLIDE 10 -- The Ask */
function SlideAsk() {
  const funds = [
    { label: 'Engineering (native apps)', pct: 40, color: 'bg-db-teal', icon: Code },
    { label: 'Marketing', pct: 30, color: 'bg-db-lavender', icon: Megaphone },
    { label: 'Hardware partnerships', pct: 20, color: 'bg-db-amber', icon: Wifi },
    { label: 'Operations', pct: 10, color: 'bg-db-rose', icon: TrendingUp },
  ];

  return (
    <SlideShell>
      <Badge>The Ask</Badge>
      <h2 className="mb-4 text-center text-3xl font-bold text-db-text md:text-5xl">
        Seeking{' '}
        <span className="bg-gradient-to-r from-db-teal to-db-lavender bg-clip-text text-transparent">
          $500K Seed Round
        </span>
      </h2>
      <p className="mb-10 text-center text-db-text-dim">Use of funds</p>

      <div className="mb-8 w-full max-w-lg">
        {/* Stacked bar */}
        <div className="mb-6 flex h-4 overflow-hidden rounded-full">
          {funds.map((f) => (
            <motion.div
              key={f.label}
              initial={{ width: 0 }}
              animate={{ width: `${f.pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`${f.color}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {funds.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-sm ${f.color}`} />
              <span className="text-sm text-db-text-dim">
                {f.pct}% {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center"
      >
        <p className="mb-4 text-xl font-semibold text-db-text">
          Let&rsquo;s make every night a perfect night.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-db-text-dim">
          <Mail size={14} className="text-db-teal" />
          hello@dreambreeze.app
        </div>
      </motion.div>
    </SlideShell>
  );
}

/* ===========================================================================
   MAIN PITCH DECK PAGE
   =========================================================================== */
const SLIDES = [
  SlideTitle,
  SlideProblem,
  SlideSolution,
  SlideMagic,
  SlideBusinessModel,
  SlideGoToMarket,
  SlideCompetition,
  SlideTeam,
  SlideProjections,
  SlideAsk,
];

const SLIDE_LABELS = [
  'Title',
  'Problem',
  'Solution',
  'Magic',
  'Business Model',
  'Go-to-Market',
  'Competition',
  'Team',
  'Projections',
  'The Ask',
];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= SLIDES.length || idx === current) return;
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
    },
    [current],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Touch/swipe
  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) { next(); } else { prev(); }
      }
    };
    window.addEventListener('touchstart', onStart);
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [next, prev]);

  const CurrentSlide = SLIDES[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-db-navy texture-fabric select-none">
      {/* Slide counter */}
      <div className="absolute left-6 top-6 z-30 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-db-text-dim backdrop-blur-sm">
        {current + 1}/{SLIDES.length}
      </div>

      {/* Home link */}
      <Link
        href="/"
        className="absolute right-6 top-6 z-30 flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-db-text-dim backdrop-blur-sm transition hover:text-db-teal"
      >
        <Wind size={12} className="text-db-teal" />
        DreamBreeze
      </Link>

      {/* Slides */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.4, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <CurrentSlide />
        </motion.div>
      </AnimatePresence>

      {/* Arrow nav */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-6 pb-6">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-db-text-dim backdrop-blur-sm transition hover:bg-white/10 hover:text-db-teal disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-db-text-dim"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? 'w-6 bg-db-teal' : 'w-2 bg-white/20 hover:bg-white/30'
              }`}
              aria-label={`Go to slide ${i + 1}: ${SLIDE_LABELS[i]}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === SLIDES.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-db-text-dim backdrop-blur-sm transition hover:bg-white/10 hover:text-db-teal disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-db-text-dim"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
