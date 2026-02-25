# DreamBreeze: "Make It Real" Design Document

**Date:** 2025-02-25
**Goal:** Transform DreamBreeze from a high-fidelity prototype with simulated data into a fully functional sleep tracking app where every sensor, every metric, and every sound is real — except fan hardware control.

## Problem Statement

The app makes claims it doesn't fully deliver:
1. Never requests sensor permissions (accelerometer on iOS, microphone, GPS)
2. Sleep tracking stops if browser closes (no wake lock / bedside mode)
3. Sound engine exists but doesn't reliably start playback
4. Rain/ocean/forest sounds are UI-only (no audio behind them)
5. Claims "AI-powered" but uses rule-based algorithms (not dishonest, but misleading)
6. Algorithm thresholds lack documented scientific justification
7. TensorFlow.js is a dependency but never used

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Background execution | Wake Lock + Bedside Mode | Proven pattern (Sleep Cycle). Works on iOS 16.4+ and Android. |
| Microphone | Real, dB-level only | Enables adaptive volume + ambient noise detection. No recording. |
| Location | GPS with IP fallback | Precise weather for thermal agent. Graceful degradation if denied. |
| Nature sounds | Real audio samples (~5MB) | Synth for white/pink/brown, samples for rain/ocean/forest. |
| "AI" language | Replace with "Science-Based" | Honest. The algorithms are good — they just aren't neural networks. |
| TensorFlow.js | Remove dependency | Not used. Removing saves ~2MB bundle. |
| Algorithm docs | Public `/app/science` page | Full transparency. Every formula, threshold, citation. |

## Architecture Changes

### 1. Permission Flow (`src/components/ui/PermissionGate.tsx`)

New stepped permission dialog shown before first sleep tracking session:

```
Step 1: Motion Sensors
  - iOS: DeviceMotionEvent.requestPermission()
  - Android: Auto-granted (ambient sensor)
  - Fallback: Disable posture detection, show warning

Step 2: Microphone
  - navigator.mediaDevices.getUserMedia({audio: true})
  - Process: Extract dB level via AnalyserNode.getFloatFrequencyData()
  - Privacy: No MediaRecorder, no audio storage, stream discarded after analysis
  - Fallback: Manual volume control only

Step 3: Location
  - navigator.geolocation.getCurrentPosition()
  - Cache: 30-minute TTL
  - Fallback: IP-based geolocation (existing)

Step 4: Wake Lock
  - navigator.wakeLock.request('screen')
  - Fallback: Show warning about tracking interruption
```

Permission state stored in localStorage. Re-request only if previously denied + user taps "Fix Permissions" in settings.

### 2. Bedside Mode (`src/components/sleep/BedsideDisplay.tsx`)

Existing bedside display enhanced:

- **Wake Lock acquisition** on session start, release on stop
- **CSS dimming:** `filter: brightness(0.05)` on OLED-friendly black background
- **Touch to peek:** Tap anywhere → brightness 0.3 for 5 seconds → fade back
- **Minimal UI:** Large clock, posture icon, fan dots, sound indicator, elapsed time
- **Battery warning:** "Plug in your phone for best results (~10-15% battery usage overnight)"
- **Wake Lock lost handler:** If OS kills wake lock, re-acquire. If failed, show notification-like banner.

### 3. Real Audio System (`src/lib/audio/`)

#### Synthesized (existing, needs activation fix):
- White noise: Random samples, flat spectrum
- Pink noise: Paul Kellet 6-filter cascade (already implemented)
- Brown noise: Leaky integrator (already implemented)

#### Audio Samples (new):
- Rain: Royalty-free loop (~1.5MB, .ogg + .mp3 fallback)
- Ocean: Royalty-free loop (~2MB)
- Forest: Royalty-free loop (~1.5MB)
- Source: freesound.org (CC0 license) or similar
- Loading: Lazy-loaded on first use, cached via Service Worker
- Looping: Seamless crossfade at loop point (500ms overlap)

#### Adaptive Volume (new, requires microphone):
- Sample ambient dB every 500ms via AnalyserNode
- Target: Soundscape 5-10dB above ambient (configurable)
- Smooth volume changes over 2-second ramps
- Floor: Never below 10% (user can hear it)
- Ceiling: Never above 80% (protect hearing)

### 4. Ambient Noise Analyzer (`src/lib/sensors/ambient-noise.ts`)

New module:
```typescript
interface AmbientNoiseReading {
  dbLevel: number;        // Current dB SPL estimate
  noiseFloor: number;     // Rolling 5-minute minimum
  classification: 'quiet' | 'moderate' | 'noisy' | 'loud';
  dominantFrequency: 'low' | 'mid' | 'high';
  timestamp: number;
}
```

- Uses Web Audio AnalyserNode (FFT size: 2048)
- Calculates RMS amplitude → approximate dB SPL
- Classification thresholds: quiet <30dB, moderate 30-50dB, noisy 50-70dB, loud >70dB
- Posts to Blackboard for Sound Agent consumption
- **No audio recording.** Stream is analyzed and discarded frame-by-frame.

### 5. GPS Weather Integration (`src/lib/weather/weather-service.ts`)

Modify existing weather service:
- Request GPS coordinates via Geolocation API
- Pass to Open-Meteo: `latitude={lat}&longitude={lon}`
- Cache coordinates for 30 minutes (user doesn't move during sleep)
- Fallback chain: GPS → IP geolocation → last known → default (25°C, 60% humidity)

### 6. Real-Time Data Pipeline

Every displayed metric must trace back to a real source:

| Metric | Source | Update | Storage |
|--------|--------|--------|---------|
| Time | `Date.now()` | 1s | None |
| Elapsed | Start time delta | 1s | Session |
| Posture | DeviceMotionEvent accelerometer | 100ms sample, 30s classify | Session |
| Sleep stage | Accelerometer movement epochs | 30s epoch | Session |
| Ambient dB | Microphone AnalyserNode | 500ms | None (ephemeral) |
| Temperature | Open-Meteo + GPS | 30min | Cache |
| Humidity | Open-Meteo + GPS | 30min | Cache |
| Fan speed | Agent calculation | 30s | Session |
| Sound type | Sound Agent decision | 30s | Session |
| Cognitive readiness | Session history formula | Per session | localStorage |
| Sleep debt | 14-day rolling calculation | Per session | localStorage |
| Energy forecast | Two-Process Model | Per session end | localStorage |

### 7. Claim Validation & Corrections

#### Correct:
- "All data stays on device" → TRUE (raw sensor data never uploaded)
- "Zero raw sensor data leaves your phone" → TRUE
- "Privacy-first" → TRUE (on-device processing, optional cloud)

#### Must Fix:
- ~~"AI-Powered"~~ → "Science-Based Algorithms"
- ~~"Edge AI processing"~~ → "On-Device Processing"
- ~~"Advanced sleep analysis"~~ → "Actigraphy-Based Sleep Estimation"
- Add: "Sleep stages estimated via movement patterns. Not a medical device. For clinical diagnosis, consult a sleep specialist."
- Add: "Sound effectiveness based on Ngo et al. (2013) — pink noise may enhance slow-wave sleep activity."

#### Remove:
- TensorFlow.js dependency (unused)
- Any implication of neural network / ML processing

### 8. Public Science Page (`src/app/app/science/page.tsx`)

Accessible to anyone. Sections:

1. **How We Detect Sleep Stages** — Actigraphy method, epoch classification, thresholds with citations
2. **How We Detect Posture** — Accelerometer angle computation, limitations
3. **How We Calculate Sleep Quality** — 5-component scoring model, each with rationale
4. **How We Calculate Sleep Debt** — 14-day rolling window, Van Dongen (2003) mapping
5. **How We Calculate Cognitive Readiness** — 4-pillar model, scoring breakdown
6. **How We Generate Energy Forecasts** — Two-Process Model (Borbely 1982), Process S + C formulas
7. **How Soundscapes Work** — Noise generation methods, Ngo et al. research, adaptive volume
8. **How Thermal Comfort Works** — Weather integration, circadian temperature profiles, Krauchi (2007)
9. **Limitations & Disclaimers** — What actigraphy can't do, not a medical device, when to see a doctor
10. **References** — Full bibliography with DOI links

### 9. Cross-Platform Compatibility

| Feature | iOS Safari 16.4+ | Android Chrome | Desktop |
|---------|-------------------|----------------|---------|
| Wake Lock | Yes | Yes | Yes |
| DeviceMotion | Yes (permission) | Yes (auto) | No (desktop) |
| Microphone | Yes (permission) | Yes (permission) | Yes |
| Geolocation | Yes (permission) | Yes (permission) | Yes |
| Web Audio | Yes (needs gesture) | Yes | Yes |
| Audio samples | Yes (.mp3) | Yes (.ogg) | Yes |
| PWA Install | Yes | Yes | Yes |
| Service Worker | Yes | Yes | Yes |

### 10. Service Worker (Offline Caching)

Add service worker for:
- Cache app shell (HTML, CSS, JS)
- Cache audio samples after first load
- Cache last weather data
- **NOT for background tracking** (impossible in SW)
- Use `next-pwa` or manual SW registration

## What Remains Simulated

**Only one thing: Fan hardware control.**

The fan speed is calculated by real algorithms using real sensor data. The speed value is displayed accurately. But no actual fan motor is controlled because there's no IoT hardware connected.

The UI shows a clear "Simulated" badge on the fan control when no MQTT broker is configured.

## Success Criteria

1. App requests all necessary permissions on first use
2. Sleep tracking continues for 8+ hours without interruption (bedside mode)
3. All 6 sounds actually play audio output
4. Ambient noise level displayed from real microphone input
5. Weather data matches actual local conditions (GPS-accurate)
6. Every displayed number traces to a real sensor or documented formula
7. Science page is accessible and explains every algorithm
8. Works on iPhone Safari and Android Chrome
9. No misleading "AI" claims — honest about methodology
10. Battery usage <15% overnight on OLED with bedside mode
