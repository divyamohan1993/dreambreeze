# DreamBreeze Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready PWA that detects sleep posture via phone sensors, controls fan speed with AI, generates adaptive soundscapes, and includes a Guy Kawasaki pitch deck — all with privacy-first architecture and DPDP/GDPR/CCPA compliance.

**Architecture:** Single Next.js 16 PWA deployed to Vercel. Edge AI via TensorFlow.js for on-device posture classification. Supabase for auth + encrypted sleep summaries. Web Audio API for adaptive soundscapes. MQTT for smart fan control.

**Tech Stack:** Next.js 16.1.6, React 19.2.4, TypeScript 5.9.3, Tailwind CSS 4.2.1, Motion 12.34.3, TensorFlow.js 4.22.0, Supabase 2.97.0, Zustand 5.0.11, Recharts 3.7.0, Serwist 9.2.3

---

## Phase 1: Project Foundation

### Task 1: Scaffold Next.js 16 Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.env.local`
- Create: `.gitignore`

**Steps:**
1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
2. Update to exact versions: next@16, react@19, tailwindcss@4, typescript@5.9
3. Install core deps: `motion`, `zustand`, `recharts`, `lucide-react`, `@supabase/supabase-js`, `@supabase/ssr`
4. Install dev deps: `@tailwindcss/postcss`
5. Configure globals.css with `@import "tailwindcss"` and custom theme
6. Configure next.config.ts for PWA headers
7. Verify dev server starts

### Task 2: Supabase Schema + Auth

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `supabase/schema.sql`

**Schema:**
- `profiles` — user settings, preferences, consent records
- `sleep_sessions` — aggregated session summaries (NO raw sensor data)
- `sleep_events` — posture changes, fan adjustments per session
- `consent_log` — DPDP/GDPR consent audit trail
- `fan_configs` — MQTT/webhook fan integration settings

### Task 3: Zustand State Management

**Files:**
- Create: `src/stores/sleep-store.ts` — active sleep session state
- Create: `src/stores/fan-store.ts` — fan speed, mode, connection
- Create: `src/stores/audio-store.ts` — soundscape state
- Create: `src/stores/sensor-store.ts` — sensor readings
- Create: `src/stores/ui-store.ts` — UI preferences, theme

---

## Phase 2: Core Engines (Parallelizable)

### Task 4: Sensor Engine (DeviceMotion API)

**Files:**
- Create: `src/lib/sensors/device-motion.ts`
- Create: `src/lib/sensors/posture-classifier.ts`
- Create: `src/hooks/use-device-motion.ts`
- Create: `src/hooks/use-posture.ts`

**Logic:**
- Request DeviceMotion permission (iOS requires user gesture)
- Read accelerometer (x, y, z) + gyroscope (alpha, beta, gamma)
- Classify posture from phone orientation:
  - Phone flat face-up on bed → detect bed tilt from body movement
  - Use rolling window of 50 samples (1 second at 50Hz)
  - Classify: supine, prone, left-lateral, right-lateral, fetal, sitting/awake
- Smooth transitions with hysteresis (must hold new posture 10s before registering change)

### Task 5: Sleep Stage Estimation Engine

**Files:**
- Create: `src/lib/ai/sleep-stage-estimator.ts`
- Create: `src/hooks/use-sleep-stage.ts`

**Logic:**
- Track movement intensity over rolling 5-minute windows
- High movement → Awake
- Moderate movement → Light sleep (N1/N2)
- Very low movement → Deep sleep (N3)
- Low movement with periodic micro-bursts → REM
- Use epoch-based scoring (30-second epochs, standard in polysomnography)

### Task 6: Adaptive Soundscape Engine (Web Audio API)

**Files:**
- Create: `src/lib/audio/noise-generator.ts`
- Create: `src/lib/audio/soundscape-engine.ts`
- Create: `src/hooks/use-soundscape.ts`

**Logic:**
- Generate white/pink/brown noise procedurally (no audio files needed)
- Pink noise: filter white noise with -3dB/octave rolloff
- Brown noise: filter with -6dB/octave rolloff
- Nature sounds: rain, ocean, forest (loaded as small audio buffers)
- Adaptive mixing based on sleep stage:
  - Awake → User's preferred sound at chosen volume
  - Light sleep → Gradually reduce volume 20%
  - Deep sleep → Minimum volume, pure low-frequency
  - REM → Slightly increase to mask external noise
- Crossfade transitions (10-second fade)

### Task 7: Fan Control Engine

**Files:**
- Create: `src/lib/fan/fan-controller.ts`
- Create: `src/lib/fan/mqtt-client.ts`
- Create: `src/lib/fan/webhook-client.ts`
- Create: `src/hooks/use-fan-control.ts`

**Logic:**
- Abstract FanController interface (MQTT, webhook, demo modes)
- Posture-to-speed mapping:
  - Supine → Medium (body heat rises, moderate cooling needed)
  - Prone → Low (face-down, direct airflow uncomfortable)
  - Left/Right lateral → Medium-Low (partial exposure)
  - Fetal → Low (indicates cold, reduce cooling)
  - Awake/Sitting → User's preferred speed
- Sleep stage modifier:
  - REM → +1 speed level (body can't thermoregulate)
  - Deep → -1 speed level (metabolic rate drops)
- Smooth transitions: change speed max 1 level per 30 seconds

### Task 8: Agentic Sleep Coach

**Files:**
- Create: `src/lib/ai/sleep-agent.ts`
- Create: `src/lib/ai/pattern-analyzer.ts`

**Logic:**
- Runs on accumulated sleep data (min 3 nights)
- Pattern detection:
  - "You tend to get hot between 2-4 AM — pre-cooling enabled"
  - "Left-side sleeping gives you 18% more deep sleep"
  - "Your REM cycles are longer with pink noise vs white noise"
- Morning briefing generation (text summary of night)
- Energy score prediction based on sleep quality

---

## Phase 3: Skeuomorphic UI Components (Parallelizable)

### Task 9: Fan Blade Visualization (Canvas 2D)

**Files:**
- Create: `src/components/fan/FanVisualization.tsx`
- Create: `src/components/fan/fan-renderer.ts`

**Design:**
- 5-blade ceiling fan rendered on Canvas 2D
- Brushed aluminum housing with radial gradient
- Time-based rotation with smooth speed interpolation
- Motion blur at high speeds (3 ghost frames)
- Realistic deceleration when turning off
- Central hub with metallic finish

### Task 10: Speed Control Knob

**Files:**
- Create: `src/components/fan/SpeedKnob.tsx`

**Design:**
- Rotatable metallic dial using conic-gradient brushed metal
- Red indicator notch with glow
- Drag-to-rotate interaction (Motion drag)
- Haptic feedback on speed boundaries (Vibration API)
- 5 detent positions (Off, Breeze, Gentle, Strong, Turbo)
- Outer ring with tick marks and labels

### Task 11: LED Speed Indicators

**Files:**
- Create: `src/components/fan/LEDStrip.tsx`

**Design:**
- 5 LEDs: green → yellow → orange → red → purple
- Realistic glow with multi-layer box-shadow
- Active LEDs pulse subtly (2s breathing animation)
- Inactive LEDs show dark tinted glass

### Task 12: Glassmorphic Data Cards

**Files:**
- Create: `src/components/ui/GlassCard.tsx`
- Create: `src/components/ui/MetricCard.tsx`
- Create: `src/components/ui/PostureIndicator.tsx`
- Create: `src/components/ui/SleepStageIndicator.tsx`
- Create: `src/components/ui/BreathingPulse.tsx`

### Task 13: Sleep Timeline Chart

**Files:**
- Create: `src/components/charts/SleepTimeline.tsx`
- Create: `src/components/charts/PostureTimeline.tsx`
- Create: `src/components/charts/FanSpeedOverlay.tsx`

---

## Phase 4: Pages

### Task 14: Landing Page

**Route:** `/`
**Files:** `src/app/page.tsx`

Sections: Hero with animated fan, Features grid, How it works (3 steps), Privacy promise, CTA

### Task 15: Main Dashboard

**Route:** `/app`
**Files:** `src/app/app/page.tsx`, `src/app/app/layout.tsx`

Layout: Central fan viz + knob, surrounding metric cards, bottom sleep timeline

### Task 16: Active Sleep Session

**Route:** `/app/sleep`
**Files:** `src/app/app/sleep/page.tsx`

Minimal bedside display: dim UI, large clock, posture icon, fan speed, soundscape controls

### Task 17: Sleep History

**Route:** `/app/history`
**Files:** `src/app/app/history/page.tsx`

Calendar view, session details, trends, AI coach insights

### Task 18: Settings + Privacy Vault

**Routes:** `/app/settings`, `/app/privacy`
**Files:** `src/app/app/settings/page.tsx`, `src/app/app/privacy/page.tsx`

Fan integration config, sound preferences, consent management, data export, data deletion

### Task 19: Demo Mode

**Route:** `/demo`
**Files:** `src/app/demo/page.tsx`

60-second simulation of a full night. Pre-scripted posture/stage/fan changes.

### Task 20: Pitch Deck (Guy Kawasaki 10 Slides)

**Route:** `/pitch`
**Files:** `src/app/pitch/page.tsx`, `src/components/pitch/slides/*.tsx`

10 slides: Title, Problem, Solution, Magic (live demo embed), Business Model, Go-to-Market, Competition, Team, Projections, The Ask

---

## Phase 5: Privacy & Compliance

### Task 21: Privacy Framework

**Files:**
- Create: `src/lib/privacy/consent-manager.ts`
- Create: `src/lib/privacy/data-vault.ts`
- Create: `src/lib/privacy/compliance.ts`
- Create: `src/components/privacy/ConsentBanner.tsx`
- Create: `src/components/privacy/DataVault.tsx`

**Requirements:**
- Consent before any data collection (DPDP Section 6)
- Purpose limitation — only collect what's needed (DPDP Section 4)
- Data principal rights: access, correction, erasure, portability (DPDP Section 11-14)
- Grievance redressal mechanism (DPDP Section 13)
- GDPR: Explicit consent, DPO contact, data breach notification plan
- CCPA: Right to know, right to delete, opt-out of sale (N/A — we never sell)
- All raw sensor data stays on device — only aggregated summaries to cloud
- Data retention: auto-delete after 1 year unless user opts in to keep

---

## Phase 6: PWA + Deployment

### Task 22: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Create: `src/app/sw.ts` (service worker)
- Configure: `@serwist/next`

### Task 23: Vercel Deployment + GitHub

- Initialize git repo
- Create GitHub repo
- Push code
- Deploy to Vercel
- Configure environment variables
