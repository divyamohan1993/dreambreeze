# DreamBreeze — AI Sleep Comfort System

Your phone becomes an AI sleep comfort agent. It detects your sleep posture, controls your fan speed, and creates adaptive soundscapes — all while keeping your data private.

## The Problem

68% of adults struggle with temperature during sleep. Fans are binary — on or off. But your body's thermal needs change 40+ times per night. During REM sleep, your body **cannot regulate its own temperature**. Nobody is solving this.

## The Solution

DreamBreeze transforms your phone into an intelligent sleep system:

- **Posture Detection** — Phone accelerometer classifies supine, prone, lateral, fetal positions
- **Sleep Stage Estimation** — Movement analysis estimates awake/light/deep/REM cycles
- **Smart Fan Control** — AI maps posture + sleep stage to optimal fan speed via MQTT/webhooks
- **Adaptive Soundscapes** — White/pink/brown noise that morphs with your sleep stages
- **AI Sleep Coach** — Personalized insights after 3+ nights of data
- **Morning Energy Mode** — Gradual comfort adjustments for energized waking

## Privacy First

All sensor processing happens **on your device** via TensorFlow.js. No raw accelerometer data ever leaves your phone. Only aggregated sleep summaries (if you choose) go to the cloud.

Compliant with:
- **DPDP Act 2023** (India) — Consent, purpose limitation, data principal rights
- **GDPR** (EU) — Explicit consent, right to erasure, data portability
- **CCPA** (California) — Right to know, right to delete, no data sales

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19 + Tailwind CSS v4 |
| Animation | Motion 12 + Canvas 2D |
| Audio | Web Audio API |
| Sensors | DeviceMotion API |
| AI/ML | TensorFlow.js 4 |
| State | Zustand 5 |
| Backend | Supabase (Auth + PostgreSQL + Realtime) |
| IoT | MQTT.js 5 |
| Charts | Recharts 3 |
| Deployment | Vercel (PWA) |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Routes

| Route | Description |
|-------|------------|
| `/` | Landing page |
| `/app` | Main dashboard — skeuomorphic fan controller |
| `/app/sleep` | Active sleep session (bedside display) |
| `/app/history` | Sleep analytics and history |
| `/app/settings` | Fan integration, sound preferences |
| `/app/privacy` | Privacy vault — data control center |
| `/demo` | 60-second full-night simulation |
| `/pitch` | Guy Kawasaki 10-slide investor pitch |

## Environment Variables

Copy `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app works in demo mode without Supabase.

## Architecture

```
Phone (Sensor + UI + Edge AI)
  ├── DeviceMotion API → Posture Classification (on-device)
  ├── Movement Patterns → Sleep Stage Estimation (on-device)
  ├── Web Audio API → Adaptive Soundscape Engine
  ├── MQTT/Webhook → Smart Fan Control
  └── Supabase → Auth + Encrypted Sleep Summaries Only
```

## Project Structure

```
src/
├── app/          # Next.js pages and routes
├── components/   # Skeuomorphic UI components
│   ├── fan/      # Fan visualization, speed knob, LEDs
│   ├── ui/       # Glass cards, indicators, controls
│   ├── charts/   # Sleep timeline, posture charts
│   └── layout/   # Navigation
├── hooks/        # React hooks (sensors, audio, fan)
├── lib/          # Core engines
│   ├── ai/       # Sleep agent, pattern analyzer
│   ├── audio/    # Noise generator, soundscape engine
│   ├── fan/      # MQTT, webhook, demo controllers
│   ├── privacy/  # Consent, data vault, compliance
│   ├── sensors/  # Device motion, posture classifier
│   └── supabase/ # Database client
└── stores/       # Zustand state management
```

## License

MIT
