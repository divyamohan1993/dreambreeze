<p align="center">
  <img src="https://img.shields.io/badge/DreamBreeze-AI%20Sleep%20Comfort-6366f1?style=for-the-badge&logoColor=white" alt="DreamBreeze" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TensorFlow.js-4-ff6f00?style=flat-square&logo=tensorflow&logoColor=white" alt="TensorFlow.js 4" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/MQTT-IoT-660066?style=flat-square&logo=mqtt&logoColor=white" alt="MQTT" />
  <img src="https://img.shields.io/badge/PWA-Installable-5a0fc8?style=flat-square&logo=pwa&logoColor=white" alt="PWA" />
</p>

<p align="center">
  <a href="https://dreambreeze-app.vercel.app"><img src="https://img.shields.io/badge/Live%20App-dreambreeze--app.vercel.app-22c55e?style=for-the-badge" alt="Live App" /></a>
  <a href="https://dreambreeze-app.vercel.app/demo"><img src="https://img.shields.io/badge/60s%20Demo-Try%20It%20Now-f59e0b?style=for-the-badge" alt="Demo" /></a>
  <a href="https://dreambreeze-app.vercel.app/pitch"><img src="https://img.shields.io/badge/Pitch%20Deck-10%20Slides-8b5cf6?style=for-the-badge" alt="Pitch Deck" /></a>
</p>

---

# DreamBreeze

### Your phone already knows how you sleep. Now it does something about it.

---

## The Night You Deserve

You spend **one-third of your life** asleep. That is 26 years.

And for most of those years, you are either too hot, too cold, tangled in sheets, or woken up by a fan blasting at the wrong speed. The average person adjusts their fan or thermostat **3 to 5 times per night** -- and those are just the times you actually wake up. There are dozens more micro-arousals you never even remember.

Here is the thing nobody talks about: **during REM sleep, your body literally cannot regulate its own temperature.** Your brain shuts down thermoregulation to let you dream. That is exactly when you need intelligent comfort the most -- and exactly when you have zero control over it.

68% of adults report struggling with temperature during sleep. Fans are binary -- on or off. Maybe three speeds if you are lucky. But your body's thermal needs change **40+ times per night** as you shift between sleep stages, roll from your back to your side, and cycle through light sleep, deep sleep, and REM.

**Nobody is solving this.**

Until now.

---

## What If Your Fan Could Think?

> *"DreamBreeze turns any phone into an AI sleep comfort system. Place it on your mattress. Go to sleep. Wake up better."*

That is it. No wearable. No special hardware. No subscription.

**Your phone's accelerometer** detects your sleep posture -- supine, prone, lateral, fetal -- in real time. **Edge AI** estimates your sleep stage from movement patterns. A **four-agent blackboard system** makes the decisions: what fan speed, what sound, what temperature profile, and when to gently wake you up.

Everything runs **on your device**. Your raw sensor data never leaves your phone. Ever.

---

## See It In Action

### The 60-Second Night

Visit [`/demo`](https://dreambreeze-app.vercel.app/demo) to watch a full simulated night compressed into 60 seconds:

```
  10:30 PM  ->  Bedtime. Fan starts low. Pink noise fades in.
  11:15 PM  ->  You roll to your side. Fan adjusts down. Sound deepens.
  12:00 AM  ->  Deep sleep detected. Fan drops to whisper. Brown noise.
   2:30 AM  ->  REM cycle. Thermal agent raises fan -- your body can't self-regulate.
   4:00 AM  ->  You shift to prone. Posture agent adapts instantly.
   6:15 AM  ->  Light sleep. Energy agent begins gentle wake sequence.
   6:45 AM  ->  Good morning. Cognitive readiness score: 82/100.
```

> Watch the skeuomorphic fan visualization spin in real time, LEDs shift color with sleep stages, and the soundscape morph through the night.

---

## Why DreamBreeze?

Think of it as a keynote in three acts.

### Act I: The Problem Is Invisible

You do not know you slept badly until you have already lost the day. By the time you feel the fog, skip the workout, reach for the third coffee -- it is too late. Poor sleep is not dramatic. It is a slow drain. **$411 billion per year** in lost productivity across just five OECD countries. And it starts with something as simple as a fan that cannot adapt.

### Act II: The Technology Already Exists

Every smartphone manufactured in the last decade has an accelerometer, a gyroscope, and enough processing power to run neural networks. The Web Audio API can synthesize clinical-grade noise profiles. MQTT can control any smart fan on the market. **The pieces have been sitting on your nightstand this whole time.** Nobody thought to connect them.

### Act III: Four Agents, One Goal

DreamBreeze does not use a single algorithm. It uses a **blackboard architecture** -- four specialized AI agents that collaborate in real time:

| Agent | Watches | Controls | Logic |
|-------|---------|----------|-------|
| **Posture Agent** | Accelerometer data | Fan speed | Back sleepers need more airflow than side sleepers. Prone sleepers need the least. |
| **Thermal Agent** | Weather + circadian rhythm | Temperature profile | Cross-references outdoor temperature, humidity, and your body's natural thermal dip at 3 AM. |
| **Sound Agent** | Sleep stage estimation | Noise type + volume | Pink noise for falling asleep. Brown noise for deep sleep. Gradual fade during REM. |
| **Energy Agent** | Two-Process Model | Wake sequence | Calculates your optimal wake window and begins a gentle 20-minute arousal sequence. |

They do not take turns. They negotiate. The blackboard mediates. The result is a comfort curve that no single algorithm could produce.

---

## The Science

DreamBreeze is not guesswork. Every decision is grounded in peer-reviewed sleep research.

### Posture and Thermoregulation

- **Supine (back):** Maximum skin surface exposure. Highest airflow preference. Core temperature drops fastest in this position (Okamoto-Mizuno & Mizuno, 2012).
- **Lateral (side):** Moderate exposure. The pillow-side face creates a microclimate that traps heat. Fan compensation is asymmetric.
- **Prone (stomach):** Minimal exposure. Mattress contact insulates the torso. Over-cooling causes awakenings.
- **Fetal:** Curled posture signals thermal discomfort or light sleep. A transitional state that often precedes a stage shift.

### The Two-Process Model of Sleep

Borbely's Two-Process Model (1982) describes sleep regulation through two independent processes:

- **Process S (Sleep Pressure):** Homeostatic drive that builds during waking hours. Measured via adenosine accumulation.
- **Process C (Circadian Rhythm):** The 24-hour biological clock governed by suprachiasmatic nucleus signaling.

DreamBreeze's Energy Agent implements both processes to calculate your **sleep debt** (14-day rolling window) and predict your **cognitive readiness** upon waking -- scored 0 to 100 with a four-pillar breakdown:

| Pillar | What It Measures |
|--------|-----------------|
| Restoration | Deep sleep percentage vs. target |
| Stability | Sleep stage transition smoothness |
| Rhythm | Circadian alignment consistency |
| Debt | Accumulated sleep deficit impact |

### Adaptive Sound Research

- **Pink noise** during NREM sleep increases slow-wave activity by 25% and improves memory consolidation (Ngo et al., 2013).
- **Brown noise** at low amplitude provides consistent masking without cortical arousal.
- **Sound morphing** -- gradual transitions between noise profiles -- prevents the micro-arousals caused by sudden acoustic changes.

---

## Features

<table>
<tr>
<td width="50%">

### Intelligence
- 4-Agent Blackboard AI system
- Real-time posture detection (supine, prone, lateral, fetal)
- Sleep stage estimation (awake / light / deep / REM)
- Weather-aware fan adjustments via Open-Meteo API
- 5 temperature cycling profiles
- Sleep debt calculator (14-day rolling window)
- Cognitive readiness score (0-100)
- Energy forecaster (Two-Process Model)

</td>
<td width="50%">

### Experience
- Skeuomorphic fan UI with glassmorphism
- Adaptive soundscapes (white / pink / brown noise)
- Pre-sleep check-in (caffeine, stress, exercise, screen time)
- Bedside sleep session display
- Sleep analytics and history charts
- 60-second full-night demo simulation
- PWA with animated loading screen
- Guy Kawasaki 10-slide pitch deck

</td>
</tr>
<tr>
<td width="50%">

### Integration
- Smart fan control via MQTT protocol
- Webhook-based fan control
- Demo mode (no hardware needed)
- Supabase Auth + PostgreSQL + Realtime
- Open-Meteo weather (free, no API key)
- Installable as Progressive Web App

</td>
<td width="50%">

### Privacy
- All AI runs on-device via TensorFlow.js
- Zero raw sensor data leaves your phone
- Only encrypted sleep summaries stored (opt-in)
- GDPR consent banner and data controls
- DPDP Act 2023 compliant
- CCPA compliant
- Privacy vault with full data control

</td>
</tr>
</table>

---

## Architecture

```
+------------------------------------------------------------------+
|                    PHONE (Your Nightstand)                        |
|                                                                   |
|  +------------------+    +-------------------+                    |
|  | DeviceMotion API | -> | Posture Classifier|--+                 |
|  +------------------+    +-------------------+  |                 |
|                                                 |                 |
|  +------------------+    +-------------------+  |                 |
|  | Movement Tracker | -> | Sleep Stage Est.  |--+                 |
|  +------------------+    +-------------------+  |                 |
|                                                 v                 |
|                    +-----------------------------+                |
|                    |   BLACKBOARD (Mediator)      |               |
|                    |                              |               |
|                    |  +----------+ +----------+   |               |
|                    |  | Posture  | | Thermal  |   |               |
|                    |  | Agent    | | Agent    |   |               |
|                    |  +----------+ +----------+   |               |
|                    |  +----------+ +----------+   |               |
|                    |  | Sound    | | Energy   |   |               |
|                    |  | Agent    | | Agent    |   |               |
|                    |  +----------+ +----------+   |               |
|                    +-----------------------------+                |
|                         |         |        |                      |
|                         v         v        v                      |
|                    +---------+ +-----+ +--------+                 |
|                    | Web     | | Fan | | Wake   |                 |
|                    | Audio   | | Cmd | | Sched  |                 |
|                    +---------+ +-----+ +--------+                 |
|                                   |                               |
+-----------------------------------|-------------------------------+
                                    |
                    +---------------v----------------+
                    |     MQTT / Webhook / Demo      |
                    +---------------+----------------+
                                    |
                    +---------------v----------------+
                    |         Smart Fan              |
                    +--------------------------------+

                    +--------------------------------+
                    |   Supabase (Optional Cloud)    |
                    |   Auth + Encrypted Summaries   |
                    +--------------------------------+
```

**Everything above the line runs on your phone.** The smart fan connection works over your local network. Supabase is optional -- the app works fully offline in demo mode.

---

## Privacy Promise

We believe privacy is a **fundamental right**, not a feature you pay extra for.

### What Stays On Your Phone
- All accelerometer data
- All posture classifications
- All sleep stage estimations
- All AI agent computations
- All audio generation

### What Leaves Your Phone (Only If You Choose)
- Encrypted sleep session summaries
- Account authentication tokens

### What We Will Never Do
- Sell your data
- Share your data with third parties
- Store raw sensor readings
- Track you across apps or websites
- Use your sleep data for advertising

### Compliance

| Regulation | Status | Key Rights |
|-----------|--------|------------|
| **GDPR** (EU) | Compliant | Explicit consent, right to erasure, data portability, DPO contact |
| **DPDP Act 2023** (India) | Compliant | Consent-based processing, purpose limitation, data principal rights |
| **CCPA** (California) | Compliant | Right to know, right to delete, no data sales, opt-out of sharing |

Visit [`/app/privacy`](https://dreambreeze-app.vercel.app/app/privacy) to access your **Privacy Vault** -- download, delete, or inspect every byte of data we have.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | Server components, streaming, edge runtime |
| Language | TypeScript 5.9 | Type safety across the entire stack |
| UI | React 19 + Tailwind CSS v4 | Concurrent rendering + utility-first styling |
| Animation | Motion 12 + Canvas 2D | 60fps fan visualization and sleep transitions |
| Audio | Web Audio API | Real-time noise synthesis with zero latency |
| Sensors | DeviceMotion API | Native accelerometer access, no permissions needed |
| AI/ML | TensorFlow.js 4 | On-device inference, no server roundtrip |
| State | Zustand 5 | Minimal, fast, no boilerplate |
| Backend | Supabase (Auth + PostgreSQL + Realtime) | Open-source Firebase alternative, row-level security |
| IoT | MQTT.js 5 | Industry-standard IoT messaging for fan control |
| Charts | Recharts 3 | Composable sleep timeline and energy forecast charts |
| Weather | Open-Meteo API | Free, no API key required, global coverage |
| Deployment | Vercel (PWA) | Edge network, instant deploys, installable app |

---

## Getting Started

### Prerequisites

- Node.js 18+ (20 recommended)
- npm, yarn, or pnpm

### Quick Start

```bash
# Clone the repository
git clone https://github.com/divyamohan1993/dreambreeze.git
cd dreambreeze

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you are in.

> **No hardware? No problem.** The app runs in full demo mode out of the box. Every feature works -- posture detection, sleep stages, fan control, soundscapes -- all simulated.

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase (optional -- app works without these in demo mode)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Start the production server
npm start
```

### Lint

```bash
npm run lint
```

---

## Routes

| Route | What You Will Find |
|-------|-------------------|
| `/` | Landing page -- the story of DreamBreeze |
| `/app` | Main dashboard -- skeuomorphic fan controller with real-time AI |
| `/app/sleep` | Active sleep session -- bedside display optimized for darkness |
| `/app/history` | Sleep analytics -- timelines, posture charts, trend analysis |
| `/app/settings` | Fan integration (MQTT/webhook), sound preferences, profiles |
| `/app/privacy` | Privacy vault -- download, delete, or inspect all your data |
| `/demo` | 60-second simulation -- watch a full night unfold in one minute |
| `/pitch` | Guy Kawasaki 10-slide investor pitch deck |

---

## Project Structure

```
src/
|-- app/              # Next.js App Router pages and layouts
|-- components/       # Skeuomorphic UI components
|   |-- fan/          # Fan visualization, speed knob, LED indicators
|   |-- ui/           # Glass cards, weather, cognitive readiness, sleep debt
|   |-- charts/       # Sleep timeline, energy forecast, posture breakdown
|   |-- layout/       # Navigation, app shell
|-- hooks/            # React hooks
|   |                 #   useSensors, useAudio, useFan,
|   |                 #   useBlackboard, useWeather
|-- lib/              # Core engines
|   |-- ai/           # Blackboard controller, 4 agents,
|   |                 #   sleep debt calculator, cognitive readiness
|   |-- audio/        # Noise generator, soundscape engine
|   |-- fan/          # MQTT controller, webhook controller, demo mode
|   |-- privacy/      # Consent manager, data vault, compliance engine
|   |-- sensors/      # DeviceMotion adapter, posture classifier
|   |-- weather/      # Weather service, temperature cycling profiles
|   |-- supabase/     # Database client, auth helpers
|-- stores/           # Zustand state management
```

---

## Contributing

DreamBreeze is open source and contributions are welcome.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m "Add your feature"`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

### Guidelines

- Follow the existing TypeScript and code style conventions
- Ensure `npm run lint` passes with no errors
- Ensure `npm run build` completes successfully
- Write descriptive commit messages
- Keep PRs focused -- one feature or fix per pull request

### Areas Where Help Is Needed

- **Hardware testing** -- MQTT integration with real smart fans
- **Sleep research** -- Improving posture classification accuracy
- **Accessibility** -- Screen reader support, high contrast modes
- **Localization** -- Translating the app to other languages
- **iOS Safari** -- DeviceMotion permission flow improvements

---

## One More Thing

> *You charge your phone every night. You place it on your nightstand. It sits there for 8 hours doing absolutely nothing.*
>
> *What if, during those 8 hours, it made you healthier?*

**DreamBreeze takes the most underutilized hours of your phone's life and turns them into the most impactful hours of yours.**

<p align="center">
  <a href="https://dreambreeze-app.vercel.app/demo">
    <img src="https://img.shields.io/badge/Try%20the%2060--Second%20Demo-It%20Takes%20One%20Minute%20to%20See%20the%20Future-6366f1?style=for-the-badge" alt="Try the Demo" />
  </a>
</p>

<p align="center">
  <a href="https://dreambreeze-app.vercel.app">Live App</a> --
  <a href="https://dreambreeze-app.vercel.app/demo">60s Demo</a> --
  <a href="https://dreambreeze-app.vercel.app/pitch">Pitch Deck</a> --
  <a href="https://github.com/divyamohan1993/dreambreeze">GitHub</a>
</p>

---

<p align="center">
  <sub>Built with conviction that better sleep should not require expensive hardware.</sub>
  <br />
  <sub>MIT License</sub>
</p>
