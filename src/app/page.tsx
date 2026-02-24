'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Wind,
  Brain,
  Sun,
  Smartphone,
  Moon,
  Shield,
  Volume2,
  Wifi,
  Lock,
  Sparkles,
  ChevronRight,
  Github,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { motion, useInView, animate } from 'motion/react';

/* ------------------------- Animated counter hook ------------------------- */
function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

/* ------------------------- Floating particles (CSS-driven) -------------- */
function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="particle absolute rounded-full bg-db-teal/20"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 10 + 10}s`,
          }}
        />
      ))}
      <style>{`
        .particle {
          animation: float-mote linear infinite;
        }
        @keyframes float-mote {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10%  { opacity: 0.6; }
          50%  { transform: translateY(-40vh) translateX(20px) scale(1.2); opacity: 0.4; }
          90%  { opacity: 0.1; }
          100% { transform: translateY(-80vh) translateX(-10px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------- Spinning fan (CSS-only) ---------------------- */
function SpinningFan({ size = 400, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div className="fan-container absolute inset-0">
        {/* Hub */}
        <div
          className="absolute rounded-full bg-db-surface border border-white/10"
          style={{
            width: size * 0.12,
            height: size * 0.12,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        />
        {/* Blades */}
        {[0, 72, 144, 216, 288].map((angle) => (
          <div
            key={angle}
            className="fan-blade absolute"
            style={{
              width: size * 0.18,
              height: size * 0.42,
              left: '50%',
              top: '50%',
              transformOrigin: '50% 0%',
              transform: `translateX(-50%) rotate(${angle}deg)`,
              background: `linear-gradient(180deg, rgba(78,205,196,0.25) 0%, rgba(78,205,196,0.05) 100%)`,
              borderRadius: '50% 50% 40% 40%',
              border: '1px solid rgba(78,205,196,0.15)',
            }}
          />
        ))}
      </div>
      {/* Glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <style>{`
        .fan-container {
          animation: spin-fan 8s linear infinite;
        }
        @keyframes spin-fan {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ------------------------- Section wrapper ------------------------------- */
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative px-6 py-24 md:py-32 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/* ------------------------- Feature card ---------------------------------- */
function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass skeu-raised group relative overflow-hidden p-6 transition-all duration-300 hover:border-db-teal/20"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-db-teal/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-db-teal/10" />
      <div className="relative">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-db-teal/10 text-db-teal">
          <Icon size={24} />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-db-text">{title}</h3>
        <p className="text-sm leading-relaxed text-db-text-dim">{description}</p>
      </div>
    </motion.div>
  );
}

/* ------------------------- Step card ------------------------------------ */
function StepCard({
  icon: Icon,
  number,
  title,
  description,
  index,
}: {
  icon: React.ElementType;
  number: number;
  title: string;
  description: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="glass skeu-raised group relative flex flex-col items-center p-8 text-center"
    >
      {/* Number badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-db-teal text-sm font-bold text-db-navy">
          {number}
        </div>
      </div>
      <div className="mb-4 mt-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-db-teal/15 to-db-lavender/15 text-db-teal transition-all duration-300 group-hover:scale-110">
        <Icon size={32} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-db-text">{title}</h3>
      <p className="text-sm leading-relaxed text-db-text-dim">{description}</p>
    </motion.div>
  );
}

/* ===========================================================================
   LANDING PAGE
   =========================================================================== */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-db-navy texture-fabric">
      {/* --- NAV --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-db-navy/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-db-text">
            <Wind size={24} className="text-db-teal" />
            <span className="text-lg font-bold tracking-tight">DreamBreeze</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-db-text-dim md:flex">
            <a href="#how-it-works" className="transition hover:text-db-teal">
              How It Works
            </a>
            <a href="#features" className="transition hover:text-db-teal">
              Features
            </a>
            <a href="#privacy" className="transition hover:text-db-teal">
              Privacy
            </a>
            <Link href="/pitch" className="transition hover:text-db-teal">
              Investors
            </Link>
          </div>
          <Link
            href="/app"
            className="rounded-full bg-db-teal px-5 py-2 text-sm font-semibold text-db-navy transition hover:bg-db-teal/90"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* --- HERO --- */}
      <Section className="relative flex min-h-screen items-center overflow-hidden pt-32">
        <Particles />
        {/* Background fan */}
        <div className="absolute right-[-10%] top-[10%] opacity-20 md:right-[5%] md:opacity-30">
          <SpinningFan size={500} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-db-teal/20 bg-db-teal/5 px-4 py-1.5 text-sm text-db-teal">
              <Sparkles size={14} />
              AI-Powered Sleep Comfort
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-db-text md:text-7xl"
          >
            Sleep Smarter.{' '}
            <span className="bg-gradient-to-r from-db-teal to-db-lavender bg-clip-text text-transparent">
              Breathe Better.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-10 max-w-xl text-lg leading-relaxed text-db-text-dim md:text-xl"
          >
            Your phone becomes an AI sleep comfort agent. It detects your posture, controls your
            fan, and creates the perfect soundscape&nbsp;&mdash;&nbsp;automatically.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Link
              href="/app"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-db-teal px-8 py-3.5 text-base font-semibold text-db-navy transition-all hover:shadow-[0_0_32px_rgba(78,205,196,0.3)]"
            >
              Start Sleeping Better
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/demo"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-8 py-3.5 text-base font-semibold text-db-text transition-all hover:border-db-teal/30 hover:bg-white/5"
            >
              <Eye size={18} />
              Watch Demo
            </Link>
          </motion.div>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-db-navy to-transparent" />
      </Section>

      {/* --- HOW IT WORKS --- */}
      <Section id="how-it-works">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-3 text-sm font-semibold uppercase tracking-widest text-db-teal"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-db-text md:text-4xl"
          >
            Three steps to perfect sleep
          </motion.h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <StepCard
            icon={Smartphone}
            number={1}
            title="Place Your Phone"
            description="Set your phone on the bed or nightstand. DreamBreeze uses the accelerometer and sensors to understand your sleep surface."
            index={0}
          />
          <StepCard
            icon={Brain}
            number={2}
            title="AI Takes Over"
            description="Our edge AI detects your posture and sleep stage in real-time. No cloud required. It knows when you toss, turn, or enter REM."
            index={1}
          />
          <StepCard
            icon={Sun}
            number={3}
            title="Wake Up Energized"
            description="Your fan speed, direction, and soundscape adapt 40+ times per night. You get uninterrupted, perfectly comfortable sleep."
            index={2}
          />
        </div>

        {/* Connecting line */}
        <div className="mt-8 hidden justify-center md:flex">
          <div className="h-0.5 w-2/3 bg-gradient-to-r from-transparent via-db-teal/30 to-transparent" />
        </div>
      </Section>

      {/* --- FEATURES --- */}
      <Section id="features" className="bg-db-surface/30">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-3 text-sm font-semibold uppercase tracking-widest text-db-teal"
          >
            Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-db-text md:text-4xl"
          >
            Everything you need for perfect sleep
          </motion.h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Wind}
            title="Posture-Aware Cooling"
            description="Fan speed and direction adjust based on whether you're sleeping on your back, side, or stomach. Your comfort follows your body."
            index={0}
          />
          <FeatureCard
            icon={Moon}
            title="Sleep Stage Intelligence"
            description="Knows when you're in REM, deep, or light sleep. During REM, when your body can't thermoregulate, cooling increases automatically."
            index={1}
          />
          <FeatureCard
            icon={Volume2}
            title="Adaptive Soundscapes"
            description="White, pink, and brown noise that morphs with your sleep cycle. Deeper tones for deep sleep, gentle rain for lighter stages."
            index={2}
          />
          <FeatureCard
            icon={Brain}
            title="AI Sleep Coach"
            description="After 3+ nights, get personalized insights on your sleep patterns, optimal room temperature, and comfort preferences."
            index={3}
          />
          <FeatureCard
            icon={Wifi}
            title="Smart Home Ready"
            description="Connect to real smart fans via MQTT, webhooks, or IR blasters. Works with Atomberg, Crompton, and most smart fan brands."
            index={4}
          />
          <FeatureCard
            icon={Lock}
            title="Privacy Vault"
            description="All AI processing happens on your device. Zero raw sensor data leaves your phone. Your sleep data, your rules."
            index={5}
          />
        </div>
      </Section>

      {/* --- PRIVACY PROMISE --- */}
      <Section id="privacy">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass skeu-raised mx-auto max-w-3xl overflow-hidden"
        >
          <div className="relative flex flex-col items-center gap-6 p-10 text-center md:p-14">
            {/* Background shield glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-db-teal/5 to-transparent" />

            <div className="relative">
              <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-db-teal/10">
                <Shield size={40} className="text-db-teal" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-db-text md:text-4xl">
                Your Sleep Data Never Leaves Your Phone
              </h2>
              <p className="mx-auto mb-6 max-w-lg text-db-text-dim leading-relaxed">
                DreamBreeze uses on-device edge AI to process all sensor data locally. No raw
                accelerometer data, no audio recordings, no personal information ever gets uploaded.
                We&rsquo;re compliant with DPDP, GDPR, and CCPA by design&nbsp;&mdash;&nbsp;not as
                an afterthought.
              </p>

              <div className="mb-6 flex flex-wrap justify-center gap-3">
                {['Edge AI', 'On-Device Processing', 'Zero Data Upload', 'GDPR Ready'].map(
                  (badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-db-teal/20 bg-db-teal/5 px-4 py-1.5 text-xs font-medium text-db-teal"
                    >
                      {badge}
                    </span>
                  ),
                )}
              </div>

              <Link
                href="/app/privacy"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-db-teal transition hover:underline"
              >
                View Our Privacy Approach
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* --- SOCIAL PROOF / STATS --- */}
      <Section className="bg-db-surface/30">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-3 text-sm font-semibold uppercase tracking-widest text-db-teal"
          >
            By The Numbers
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-db-text md:text-4xl"
          >
            Sleep comfort, reimagined
          </motion.h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              value: 68,
              suffix: '%',
              label: 'of adults struggle with temperature during sleep',
              color: 'text-db-rose',
            },
            {
              value: 50,
              suffix: 'x',
              label: 'more affordable than Eight Sleep ($2,295)',
              color: 'text-db-teal',
            },
            {
              value: 0,
              suffix: ' bytes',
              label: 'of raw sensor data uploaded to cloud',
              color: 'text-db-lavender',
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass skeu-raised flex flex-col items-center p-8 text-center"
            >
              <span className={`mb-2 text-5xl font-extrabold ${stat.color}`}>
                {stat.value === 0 ? (
                  <>0{stat.suffix}</>
                ) : (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                )}
              </span>
              <p className="text-sm text-db-text-dim">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* --- CTA --- */}
      <Section>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-db-teal/10 via-db-surface to-db-lavender/10 p-12 text-center md:p-20"
        >
          <div className="absolute inset-0 opacity-30">
            <SpinningFan size={300} className="absolute -right-20 -top-20 opacity-20" />
          </div>
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold text-db-text md:text-5xl">
              Ready for your best sleep ever?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-db-text-dim">
              Join thousands of people who are sleeping smarter with DreamBreeze. No hardware
              required&nbsp;&mdash;&nbsp;just your phone and a fan.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-db-teal px-8 py-4 text-base font-semibold text-db-navy transition-all hover:shadow-[0_0_32px_rgba(78,205,196,0.3)]"
              >
                Start Sleeping Better
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/pitch"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-base font-semibold text-db-text transition-all hover:border-db-teal/30 hover:bg-white/5"
              >
                View Pitch Deck
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-db-navy px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2 text-db-text">
                <Wind size={24} className="text-db-teal" />
                <span className="text-lg font-bold tracking-tight">DreamBreeze</span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-db-text-dim">
                Made with care for better sleep. DreamBreeze transforms your phone into an
                intelligent sleep comfort system.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-db-text-dim">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'App', href: '/app' },
                  { label: 'Demo', href: '/demo' },
                  { label: 'Pitch Deck', href: '/pitch' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-db-text-dim transition hover:text-db-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-db-text-dim">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Privacy Policy', href: '/app/privacy' },
                  { label: 'GitHub', href: '#', icon: Github },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-db-text-dim transition hover:text-db-teal"
                    >
                      {link.icon && <link.icon size={14} />}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/5 pt-8 text-center text-sm text-db-text-muted">
            &copy; 2026 DreamBreeze. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
