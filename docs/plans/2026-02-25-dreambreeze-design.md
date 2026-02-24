# DreamBreeze — AI Sleep Comfort System Design

**Date:** 2026-02-25
**Status:** Approved

## Product Vision

DreamBreeze transforms your phone into an AI sleep comfort agent. It detects sleep posture via phone sensors, estimates sleep stages, controls smart fans in real-time, and generates adaptive soundscapes — all while keeping your data private and on-device.

**USP:** The only sleep system that combines posture-aware fan control + adaptive soundscapes + agentic AI coaching — running entirely from your phone, no extra hardware needed.

## Architecture

### Single PWA (Next.js 15 on Vercel)

```
Phone (Sensor + UI + Edge AI)
  ├── DeviceMotion API → Posture Classification (TF.js on-device)
  ├── Movement Patterns → Sleep Stage Estimation (on-device)
  ├── Web Audio API → Adaptive Soundscape Engine
  ├── MQTT/Webhook → Smart Fan Control
  └── Supabase → Auth + Encrypted Sleep Summaries Only
```

### Privacy-First: Edge Processing

- ALL sensor data processed on-device via TensorFlow.js
- NO raw accelerometer/gyroscope data ever leaves the phone
- Only aggregated sleep summaries (scores, durations, posture %) stored in Supabase
- Full DPDP Act 2023, GDPR, CCPA compliance
- Consent management, right to erasure, data portability

## Tech Stack (All Latest as of Feb 2026)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15 |
| Language | TypeScript | 5.7 |
| React | React | 19 |
| Styling | Tailwind CSS | v4 |
| Animation | Framer Motion | 12 |
| Audio | Web Audio API | Native |
| Sensors | DeviceMotion/Orientation API | Native |
| ML | TensorFlow.js | 4.x |
| Backend | Supabase | Latest |
| IoT | MQTT.js | 5.x |
| Charts | Recharts | 2.x |
| Deployment | Vercel | Latest |

## Feature Set

### Core
1. **Posture Detection** — TF.js classifies supine/prone/lateral/fetal from accelerometer
2. **Sleep Stage Estimation** — Movement pattern analysis estimates awake/light/deep/REM
3. **Smart Fan Control** — Posture + stage → optimal fan speed via MQTT/webhooks
4. **Adaptive Soundscape** — White/pink/brown noise + nature sounds that morph with sleep stage
5. **Agentic Sleep Coach** — AI agent that learns your patterns, makes autonomous comfort decisions, explains reasoning
6. **Sleep Score** — Nightly 0-100 score with breakdown
7. **Sleep History** — Hypnogram timeline with posture + fan overlays

### Differentiators
- **Agentic AI** — Not rule-based. Agent observes, reasons, and acts autonomously
- **White Noise Advantage** — Fan noise + digital noise calibrated together
- **Morning Energy Mode** — Gradual fan/sound changes 30min before alarm for energized waking
- **Privacy Vault** — User sees exactly what data exists and can nuke it instantly
- **Demo Mode** — 60-second full-night simulation for pitches

## Compliance

| Regulation | Requirements Met |
|-----------|-----------------|
| DPDP Act 2023 (India) | Consent before collection, purpose limitation, data principal rights, grievance redressal |
| GDPR (EU) | Explicit consent, right to erasure/portability, data minimization, DPO contact |
| CCPA (California) | Right to know, right to delete, opt-out of sale (we never sell) |

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/app` | Main skeuomorphic dashboard |
| `/app/sleep` | Active sleep session |
| `/app/history` | Sleep analytics |
| `/app/settings` | Configuration + privacy vault |
| `/app/privacy` | Compliance center |
| `/demo` | 60-second pitch demo |
| `/pitch` | Guy Kawasaki 10-slide deck |

## Skeuomorphic UI

Theme: Premium bedside device on deep navy background.
- Spinning fan blades (Canvas 2D with motion blur)
- Brushed metal speed knob (conic-gradient)
- LED speed indicators with glow
- Glassmorphic data cards
- Breathing pulse indicators
- Calming lavender/teal palette
