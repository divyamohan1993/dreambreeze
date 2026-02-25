# "Make It Real" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform DreamBreeze from a prototype with simulated data into a fully functional sleep tracking PWA where every sensor reading, every sound, every metric is real — except fan hardware control.

**Architecture:** Incremental enhancement of existing Next.js PWA. Add permission flow, wire real sensors to UI, make audio play, add microphone ambient noise, GPS weather, public science page, honest claims. Wake Lock bedside mode keeps app alive during sleep.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Web Audio API, DeviceMotion API, MediaDevices API, Vitest, Zustand 5

---

## Task 1: Remove TensorFlow.js Dependency

**Files:**
- Modify: `package.json`

**Step 1: Remove the unused dependency**

```bash
npm uninstall @tensorflow/tfjs
```

**Step 2: Verify no imports exist**

```bash
grep -r "tensorflow" src/ --include="*.ts" --include="*.tsx"
```

Expected: No results (already confirmed unused)

**Step 3: Run build to verify nothing breaks**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Run tests**

```bash
npm test
```

Expected: All 119 tests pass

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused TensorFlow.js dependency (-2MB bundle)"
```

---

## Task 2: Permission Manager Module

**Files:**
- Create: `src/lib/sensors/permission-manager.ts`
- Test: `src/lib/sensors/__tests__/permission-manager.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/sensors/__tests__/permission-manager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionManager, PermissionState, PermissionStatus } from '../permission-manager';

describe('PermissionManager', () => {
  let pm: PermissionManager;

  beforeEach(() => {
    localStorage.clear();
    pm = new PermissionManager();
  });

  describe('getStatus', () => {
    it('returns not-requested for fresh state', () => {
      expect(pm.getStatus('motion')).toBe('not-requested');
      expect(pm.getStatus('microphone')).toBe('not-requested');
      expect(pm.getStatus('location')).toBe('not-requested');
      expect(pm.getStatus('wakeLock')).toBe('not-requested');
    });

    it('returns persisted state from localStorage', () => {
      localStorage.setItem('dreambreeze-permissions', JSON.stringify({
        motion: 'granted',
        microphone: 'denied',
        location: 'granted',
        wakeLock: 'not-requested',
      }));
      pm = new PermissionManager();
      expect(pm.getStatus('motion')).toBe('granted');
      expect(pm.getStatus('microphone')).toBe('denied');
    });
  });

  describe('getAllStatuses', () => {
    it('returns all permission statuses', () => {
      const statuses = pm.getAllStatuses();
      expect(statuses).toHaveProperty('motion');
      expect(statuses).toHaveProperty('microphone');
      expect(statuses).toHaveProperty('location');
      expect(statuses).toHaveProperty('wakeLock');
    });
  });

  describe('hasAllRequired', () => {
    it('returns false when motion is not granted', () => {
      expect(pm.hasAllRequired()).toBe(false);
    });
  });

  describe('persist', () => {
    it('saves state to localStorage', () => {
      pm.setStatus('motion', 'granted');
      const stored = JSON.parse(localStorage.getItem('dreambreeze-permissions') || '{}');
      expect(stored.motion).toBe('granted');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/sensors/__tests__/permission-manager.test.ts
```

Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/lib/sensors/permission-manager.ts

export type PermissionName = 'motion' | 'microphone' | 'location' | 'wakeLock';
export type PermissionStatus = 'not-requested' | 'granted' | 'denied' | 'unavailable';
export type PermissionState = Record<PermissionName, PermissionStatus>;

const STORAGE_KEY = 'dreambreeze-permissions';

const DEFAULT_STATE: PermissionState = {
  motion: 'not-requested',
  microphone: 'not-requested',
  location: 'not-requested',
  wakeLock: 'not-requested',
};

export class PermissionManager {
  private state: PermissionState;

  constructor() {
    this.state = this.load();
  }

  private load(): PermissionState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return { ...DEFAULT_STATE };
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  getStatus(name: PermissionName): PermissionStatus {
    return this.state[name];
  }

  getAllStatuses(): PermissionState {
    return { ...this.state };
  }

  setStatus(name: PermissionName, status: PermissionStatus): void {
    this.state[name] = status;
    this.persist();
  }

  hasAllRequired(): boolean {
    return this.state.motion === 'granted';
  }

  async requestMotion(): Promise<PermissionStatus> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DME = DeviceMotionEvent as any;
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        const status: PermissionStatus = result === 'granted' ? 'granted' : 'denied';
        this.setStatus('motion', status);
        return status;
      } catch {
        this.setStatus('motion', 'denied');
        return 'denied';
      }
    }
    // Android / non-iOS: auto-granted if API exists
    if ('DeviceMotionEvent' in window) {
      this.setStatus('motion', 'granted');
      return 'granted';
    }
    this.setStatus('motion', 'unavailable');
    return 'unavailable';
  }

  async requestMicrophone(): Promise<PermissionStatus> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.setStatus('microphone', 'unavailable');
      return 'unavailable';
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately — we just needed the permission grant
      stream.getTracks().forEach(t => t.stop());
      this.setStatus('microphone', 'granted');
      return 'granted';
    } catch {
      this.setStatus('microphone', 'denied');
      return 'denied';
    }
  }

  async requestLocation(): Promise<PermissionStatus> {
    if (!navigator.geolocation) {
      this.setStatus('location', 'unavailable');
      return 'unavailable';
    }
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        () => {
          this.setStatus('location', 'granted');
          resolve('granted');
        },
        () => {
          this.setStatus('location', 'denied');
          resolve('denied');
        },
        { timeout: 10000 }
      );
    });
  }

  async requestWakeLock(): Promise<PermissionStatus> {
    if (!('wakeLock' in navigator)) {
      this.setStatus('wakeLock', 'unavailable');
      return 'unavailable';
    }
    try {
      const lock = await navigator.wakeLock.request('screen');
      await lock.release();
      this.setStatus('wakeLock', 'granted');
      return 'granted';
    } catch {
      this.setStatus('wakeLock', 'denied');
      return 'denied';
    }
  }
}

let instance: PermissionManager | null = null;
export function getPermissionManager(): PermissionManager {
  if (!instance) instance = new PermissionManager();
  return instance;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/sensors/__tests__/permission-manager.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/sensors/permission-manager.ts src/lib/sensors/__tests__/permission-manager.test.ts
git commit -m "feat: add PermissionManager for motion, mic, GPS, wake lock"
```

---

## Task 3: Permission Gate UI Component

**Files:**
- Create: `src/components/ui/PermissionGate.tsx`
- Modify: `src/app/app/sleep/page.tsx` (lines 351-382, idle/pre-sleep phase)

**Step 1: Create the PermissionGate component**

```tsx
// src/components/ui/PermissionGate.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone, Mic, MapPin, Monitor, CheckCircle2, XCircle, AlertTriangle, ChevronRight
} from 'lucide-react';
import {
  getPermissionManager,
  type PermissionName,
  type PermissionStatus,
} from '@/lib/sensors/permission-manager';

interface PermissionStep {
  name: PermissionName;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

const STEPS: PermissionStep[] = [
  {
    name: 'motion',
    title: 'Motion Sensors',
    description: 'Accelerometer detects your sleep posture throughout the night. Required for posture-based fan control.',
    icon: Smartphone,
    required: true,
  },
  {
    name: 'microphone',
    title: 'Ambient Noise',
    description: 'Measures room noise level (dB only) to auto-adjust soundscape volume. No audio is recorded or stored.',
    icon: Mic,
    required: false,
  },
  {
    name: 'location',
    title: 'Local Weather',
    description: 'Your GPS coordinates fetch accurate local temperature and humidity for thermal comfort. Coordinates are never uploaded.',
    icon: MapPin,
    required: false,
  },
  {
    name: 'wakeLock',
    title: 'Keep Screen On',
    description: 'Prevents your phone from sleeping so sensors stay active throughout the night. Plug in your phone for best results.',
    icon: Monitor,
    required: true,
  },
];

interface PermissionGateProps {
  onComplete: () => void;
  onSkip: () => void;
}

const statusIcon = (status: PermissionStatus) => {
  switch (status) {
    case 'granted': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'denied': return <XCircle className="w-5 h-5 text-red-400" />;
    case 'unavailable': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    default: return <ChevronRight className="w-5 h-5 text-slate-500" />;
  }
};

export default function PermissionGate({ onComplete, onSkip }: PermissionGateProps) {
  const pm = getPermissionManager();
  const [currentStep, setCurrentStep] = useState(0);
  const [statuses, setStatuses] = useState(pm.getAllStatuses());
  const [requesting, setRequesting] = useState(false);

  const step = STEPS[currentStep];
  const allRequiredGranted = STEPS.filter(s => s.required).every(
    s => statuses[s.name] === 'granted'
  );

  const requestCurrent = useCallback(async () => {
    if (!step) return;
    setRequesting(true);
    try {
      switch (step.name) {
        case 'motion': await pm.requestMotion(); break;
        case 'microphone': await pm.requestMicrophone(); break;
        case 'location': await pm.requestLocation(); break;
        case 'wakeLock': await pm.requestWakeLock(); break;
      }
      setStatuses(pm.getAllStatuses());
      // Auto-advance after short delay
      setTimeout(() => {
        if (currentStep < STEPS.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }, 600);
    } finally {
      setRequesting(false);
    }
  }, [step, pm, currentStep]);

  const handleFinish = () => {
    if (allRequiredGranted) {
      onComplete();
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const Icon = step?.icon;

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-white mb-1">Sensor Permissions</h2>
      <p className="text-sm text-slate-400 mb-6 text-center">
        DreamBreeze needs access to your device sensors for real sleep tracking.
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div
            key={s.name}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              statuses[s.name] === 'granted'
                ? 'bg-emerald-400'
                : statuses[s.name] === 'denied'
                  ? 'bg-red-400'
                  : i === currentStep
                    ? 'bg-teal-400'
                    : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Current step card */}
      <AnimatePresence mode="wait">
        {step && (
          <motion.div
            key={step.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              {Icon && <Icon className="w-6 h-6 text-teal-400" />}
              <span className="font-medium text-white">{step.title}</span>
              {step.required && (
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                  Required
                </span>
              )}
              <span className="ml-auto">{statusIcon(statuses[step.name])}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>

            {statuses[step.name] === 'not-requested' && (
              <button
                onClick={requestCurrent}
                disabled={requesting}
                className="mt-4 w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {requesting ? 'Requesting...' : `Allow ${step.title}`}
              </button>
            )}

            {statuses[step.name] === 'denied' && (
              <div className="mt-4 text-sm text-amber-400">
                Permission denied. {step.required
                  ? 'This is required for sleep tracking. Check your browser settings.'
                  : 'This feature will be disabled. You can enable it later in Settings.'}
              </div>
            )}

            {statuses[step.name] === 'unavailable' && (
              <div className="mt-4 text-sm text-amber-400">
                Not available on this device/browser.
                {!step.required && ' This feature will be skipped.'}
              </div>
            )}

            {(statuses[step.name] === 'granted') && !isLastStep && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="mt-4 w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition-colors"
              >
                Next
              </button>
            )}

            {!step.required && statuses[step.name] === 'not-requested' && (
              <button
                onClick={() => {
                  if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
                }}
                className="mt-2 w-full py-2 text-slate-500 text-sm hover:text-slate-400 transition-colors"
              >
                Skip
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary when all steps visited */}
      {isLastStep && statuses[step.name] !== 'not-requested' && (
        <div className="w-full space-y-2 mb-4">
          {STEPS.map(s => (
            <div key={s.name} className="flex items-center gap-2 text-sm">
              {statusIcon(statuses[s.name])}
              <span className={statuses[s.name] === 'granted' ? 'text-white' : 'text-slate-500'}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 bg-slate-800 text-slate-400 text-sm rounded-xl hover:bg-slate-700 transition-colors"
        >
          Skip All
        </button>
        {isLastStep && statuses[step.name] !== 'not-requested' && (
          <button
            onClick={handleFinish}
            disabled={!allRequiredGranted}
            className="flex-1 py-2.5 bg-teal-500 disabled:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Start Tracking
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Integrate into sleep page**

Modify `src/app/app/sleep/page.tsx`. Add a `permissions` phase between pre-sleep and idle:

In the phase type (around line 60):
```typescript
// Change:
// type Phase = 'pre-sleep' | 'idle' | 'calibrating' | 'active';
// To:
type Phase = 'pre-sleep' | 'permissions' | 'idle' | 'calibrating' | 'active';
```

After handlePreSleepComplete/Skip, route to permissions:
```typescript
import PermissionGate from '@/components/ui/PermissionGate';
import { getPermissionManager } from '@/lib/sensors/permission-manager';

// In handlePreSleepComplete: change target from 'idle' to 'permissions'
// In handlePreSleepSkip: change target from 'idle' to 'permissions'
// Add:
const handlePermissionsComplete = useCallback(() => setPhase('idle'), []);
const handlePermissionsSkip = useCallback(() => setPhase('idle'), []);
```

In the JSX, add the permissions phase rendering (after pre-sleep, before idle):
```tsx
{phase === 'permissions' && (
  <PermissionGate
    onComplete={handlePermissionsComplete}
    onSkip={handlePermissionsSkip}
  />
)}
```

**Step 3: Run build to verify**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/ui/PermissionGate.tsx src/app/app/sleep/page.tsx
git commit -m "feat: add stepped permission gate for motion, mic, GPS, wake lock"
```

---

## Task 4: Ambient Noise Analyzer

**Files:**
- Create: `src/lib/sensors/ambient-noise.ts`
- Test: `src/lib/sensors/__tests__/ambient-noise.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/sensors/__tests__/ambient-noise.test.ts
import { describe, it, expect } from 'vitest';
import { classifyNoise, rmsToDb } from '../ambient-noise';

describe('rmsToDb', () => {
  it('returns -Infinity for zero RMS', () => {
    expect(rmsToDb(0)).toBe(-Infinity);
  });

  it('returns 0 dB for RMS of 1', () => {
    expect(rmsToDb(1)).toBeCloseTo(0, 1);
  });

  it('returns ~-6 dB for RMS of 0.5', () => {
    expect(rmsToDb(0.5)).toBeCloseTo(-6.02, 0);
  });
});

describe('classifyNoise', () => {
  it('classifies < 30 dB as quiet', () => {
    expect(classifyNoise(25)).toBe('quiet');
  });

  it('classifies 30-50 dB as moderate', () => {
    expect(classifyNoise(40)).toBe('moderate');
  });

  it('classifies 50-70 dB as noisy', () => {
    expect(classifyNoise(60)).toBe('noisy');
  });

  it('classifies > 70 dB as loud', () => {
    expect(classifyNoise(80)).toBe('loud');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/sensors/__tests__/ambient-noise.test.ts
```

Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/sensors/ambient-noise.ts

export type NoiseClassification = 'quiet' | 'moderate' | 'noisy' | 'loud';

export interface AmbientNoiseReading {
  dbLevel: number;
  noiseFloor: number;
  classification: NoiseClassification;
  timestamp: number;
}

export function rmsToDb(rms: number): number {
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

export function classifyNoise(db: number): NoiseClassification {
  if (db < 30) return 'quiet';
  if (db < 50) return 'moderate';
  if (db < 70) return 'noisy';
  return 'loud';
}

type NoiseCallback = (reading: AmbientNoiseReading) => void;

export class AmbientNoiseAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: NoiseCallback | null = null;
  private noiseFloorBuffer: number[] = [];
  private readonly NOISE_FLOOR_WINDOW = 600; // 5 min at 500ms intervals
  private readonly SAMPLE_INTERVAL_MS = 500;
  private _isRunning = false;

  get isRunning(): boolean { return this._isRunning; }

  onReading(cb: NoiseCallback): void {
    this.callback = cb;
  }

  async start(): Promise<void> {
    if (this._isRunning) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      // Do NOT connect analyser to destination — no feedback loop
      this._isRunning = true;
      this.intervalId = setInterval(() => this.sample(), this.SAMPLE_INTERVAL_MS);
    } catch {
      this.stop();
    }
  }

  stop(): void {
    this._isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.noiseFloorBuffer = [];
  }

  private sample(): void {
    if (!this.analyser || !this.callback) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    // Convert to approximate dB SPL (normalized, not calibrated)
    // Web Audio gives -1 to 1 range. Add 94 to approximate dB SPL (1 Pascal reference)
    const rawDb = rmsToDb(rms);
    const dbSpl = Math.max(0, Math.min(120, rawDb + 94));

    // Update noise floor (rolling minimum)
    this.noiseFloorBuffer.push(dbSpl);
    if (this.noiseFloorBuffer.length > this.NOISE_FLOOR_WINDOW) {
      this.noiseFloorBuffer.shift();
    }
    const noiseFloor = Math.min(...this.noiseFloorBuffer);

    this.callback({
      dbLevel: Math.round(dbSpl * 10) / 10,
      noiseFloor: Math.round(noiseFloor * 10) / 10,
      classification: classifyNoise(dbSpl),
      timestamp: Date.now(),
    });
  }
}

let instance: AmbientNoiseAnalyzer | null = null;
export function getAmbientNoiseAnalyzer(): AmbientNoiseAnalyzer {
  if (!instance) instance = new AmbientNoiseAnalyzer();
  return instance;
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/sensors/__tests__/ambient-noise.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/sensors/ambient-noise.ts src/lib/sensors/__tests__/ambient-noise.test.ts
git commit -m "feat: add AmbientNoiseAnalyzer with real microphone dB measurement"
```

---

## Task 5: GPS-Enhanced Weather Service

**Files:**
- Modify: `src/lib/weather/weather-service.ts` (lines 66-71, geolocation section)
- Create: `src/lib/weather/__tests__/weather-service.test.ts`

**Step 1: Write a failing test for GPS priority**

```typescript
// src/lib/weather/__tests__/weather-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCoordinates } from '../weather-service';

describe('getCoordinates', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses GPS when available and permitted', async () => {
    const mockPosition = {
      coords: { latitude: 28.6139, longitude: 77.2090 },
    };
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => success(mockPosition)),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });
    const coords = await getCoordinates();
    expect(coords).toEqual({ lat: 28.6139, lon: 77.2090 });
  });

  it('falls back gracefully when GPS denied', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => error(new Error('denied'))),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });
    const coords = await getCoordinates();
    // Should not throw, returns null for fallback
    expect(coords).toBeDefined();
  });
});
```

**Step 2: Run test to verify failure**

```bash
npx vitest run src/lib/weather/__tests__/weather-service.test.ts
```

Expected: FAIL — getCoordinates not exported

**Step 3: Refactor weather-service.ts to export getCoordinates with GPS priority**

Add to `src/lib/weather/weather-service.ts` — extract the geolocation logic into an exported `getCoordinates()` function:

```typescript
// Add near top, after existing types:

interface Coordinates {
  lat: number;
  lon: number;
}

let cachedCoords: { coords: Coordinates; fetchedAt: number } | null = null;
const COORDS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getCoordinates(): Promise<Coordinates | null> {
  // Return cached if fresh
  if (cachedCoords && Date.now() - cachedCoords.fetchedAt < COORDS_CACHE_TTL) {
    return cachedCoords.coords;
  }

  // Try GPS first
  if (navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: COORDS_CACHE_TTL,
          enableHighAccuracy: false,
        });
      });
      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      cachedCoords = { coords, fetchedAt: Date.now() };
      return coords;
    } catch {
      // GPS denied or timed out, fall through to IP
    }
  }

  // IP-based fallback
  try {
    const resp = await fetch('https://ipapi.co/json/');
    if (resp.ok) {
      const data = await resp.json();
      if (data.latitude && data.longitude) {
        const coords = { lat: data.latitude, lon: data.longitude };
        cachedCoords = { coords, fetchedAt: Date.now() };
        return coords;
      }
    }
  } catch { /* ignore */ }

  return cachedCoords?.coords ?? null;
}
```

Then update the existing `getWeather()` function to use `getCoordinates()` instead of its inline geolocation.

**Step 4: Run tests**

```bash
npx vitest run src/lib/weather/__tests__/weather-service.test.ts
```

Expected: PASS

**Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/lib/weather/weather-service.ts src/lib/weather/__tests__/weather-service.test.ts
git commit -m "feat: GPS-first geolocation with IP fallback for accurate weather"
```

---

## Task 6: Real Audio Samples for Nature Sounds

**Files:**
- Create: `public/audio/rain-loop.mp3` (download royalty-free)
- Create: `public/audio/ocean-loop.mp3`
- Create: `public/audio/forest-loop.mp3`
- Create: `src/lib/audio/sample-loader.ts`
- Modify: `src/lib/audio/soundscape-engine.ts` (lines 294-316, `_createNoiseNode`)

**Step 1: Create sample loader module**

```typescript
// src/lib/audio/sample-loader.ts

const SAMPLE_URLS: Record<string, string> = {
  rain: '/audio/rain-loop.mp3',
  ocean: '/audio/ocean-loop.mp3',
  forest: '/audio/forest-loop.mp3',
};

const bufferCache = new Map<string, AudioBuffer>();

export async function loadSample(
  ctx: AudioContext,
  name: string
): Promise<AudioBuffer | null> {
  if (bufferCache.has(name)) return bufferCache.get(name)!;

  const url = SAMPLE_URLS[name];
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCache.set(name, audioBuffer);
    return audioBuffer;
  } catch {
    return null;
  }
}

export function isSampleBased(type: string): boolean {
  return type in SAMPLE_URLS;
}

export function clearSampleCache(): void {
  bufferCache.clear();
}
```

**Step 2: Source royalty-free audio samples**

The implementing engineer needs CC0-licensed audio loops from freesound.org or similar:
- `rain-loop.mp3`: ~30-60s rain ambience loop (~1.5MB)
- `ocean-loop.mp3`: ~30-60s ocean waves loop (~2MB)
- `forest-loop.mp3`: ~30-60s forest ambience loop (~1.5MB)

```bash
mkdir -p public/audio
```

**Step 3: Modify soundscape engine to use samples for nature sounds**

In `src/lib/audio/soundscape-engine.ts`, modify `_createNoiseNode()` (lines 294-316):

Add import at top:
```typescript
import { loadSample, isSampleBased } from './sample-loader';
```

Make `_createNoiseNode` async and add sample loading:
```typescript
private async _createNoiseNode(ctx: AudioContext, type: string): Promise<NoiseNode> {
  // Sample-based sounds (rain, ocean, forest)
  if (isSampleBased(type)) {
    const buffer = await loadSample(ctx, type);
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0.5;
      source.loopEnd = buffer.duration - 0.5;
      return {
        node: source,
        start: () => source.start(0),
        stop: () => { try { source.stop(); } catch { /* already stopped */ } },
      };
    }
    // Fallback to synthesized if sample fails to load
  }

  // Synthesized sounds (white, pink, brown, or fallback for nature)
  switch (type) {
    case 'white': return generateWhiteNoise(ctx);
    case 'pink':
    case 'rain':    // fallback
    case 'forest':  // fallback
      return generatePinkNoise(ctx);
    case 'brown':
    case 'ocean':   // fallback
      return generateBrownNoise(ctx);
    default:
      return generateWhiteNoise(ctx);
  }
}
```

Update callers (`_addLayer`, `play`) to await the now-async `_createNoiseNode`.

**Step 4: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/lib/audio/sample-loader.ts src/lib/audio/soundscape-engine.ts public/audio/
git commit -m "feat: real audio samples for rain/ocean/forest with synth fallback"
```

---

## Task 7: Wire Real Sensor Data to Sleep Page

**Files:**
- Modify: `src/app/app/sleep/page.tsx` (critical: lines 130-147, simulated data cycling)
- Create: `src/hooks/use-ambient-noise.ts`

**Step 1: Create useAmbientNoise hook**

```typescript
// src/hooks/use-ambient-noise.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AmbientNoiseAnalyzer,
  type AmbientNoiseReading,
} from '@/lib/sensors/ambient-noise';

interface UseAmbientNoiseReturn {
  isRunning: boolean;
  reading: AmbientNoiseReading | null;
  start: () => Promise<void>;
  stop: () => void;
}

export function useAmbientNoise(): UseAmbientNoiseReturn {
  const analyzerRef = useRef<AmbientNoiseAnalyzer | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [reading, setReading] = useState<AmbientNoiseReading | null>(null);

  useEffect(() => {
    return () => {
      analyzerRef.current?.stop();
    };
  }, []);

  const start = useCallback(async () => {
    if (!analyzerRef.current) {
      analyzerRef.current = new AmbientNoiseAnalyzer();
    }
    analyzerRef.current.onReading(setReading);
    await analyzerRef.current.start();
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    analyzerRef.current?.stop();
    setIsRunning(false);
    setReading(null);
  }, []);

  return { isRunning, reading, start, stop };
}
```

**Step 2: Remove simulated data cycling from sleep page**

In `src/app/app/sleep/page.tsx`, find and DELETE the useEffect that cycles simulated posture/stage/speed/noise values every 15 seconds (around lines 130-147).

The real data pipeline is:
1. `useDeviceMotion` hook -> raw accelerometer -> `sensor-store`
2. `PostureClassifier` consumes sensor store -> classifies -> `sleep-store.updatePosture()`
3. `SleepStageEstimator` consumes sensor store -> epochs -> `sleep-store.updateSleepStage()`
4. Blackboard agents read context -> post hypotheses
5. Controller resolves -> `fan-store`, `audio-store`

The `useBlackboard` hook already syncs sleep store to blackboard context (lines 73-84).

**Step 3: Add ambient noise to the active session UI**

Import and use the ambient noise hook:

```typescript
import { useAmbientNoise } from '@/hooks/use-ambient-noise';
import { Mic } from 'lucide-react';

// Inside component:
const { reading: noiseReading, start: startNoise, stop: stopNoise } = useAmbientNoise();
```

In `startSession()`, after calibration completes:
```typescript
const pm = getPermissionManager();
if (pm.getStatus('microphone') === 'granted') {
  startNoise();
}
```

In `persistSession()` / stop flow:
```typescript
stopNoise();
```

In the active session JSX, add dB display:
```tsx
{noiseReading && (
  <div className="flex items-center gap-1.5 text-xs opacity-60">
    <Mic className="w-3 h-3" />
    <span>{noiseReading.dbLevel} dB</span>
    <span className="text-[10px]">({noiseReading.classification})</span>
  </div>
)}
```

**Step 4: Run build and test**

```bash
npm run build && npm test
```

Expected: Build succeeds, all tests pass

**Step 5: Commit**

```bash
git add src/hooks/use-ambient-noise.ts src/app/app/sleep/page.tsx
git commit -m "feat: wire real sensor data pipeline, remove simulated cycling"
```

---

## Task 8: Make Sounds Actually Play During Tracking

**Files:**
- Modify: `src/hooks/use-soundscape.ts` (ensure AudioContext resumes)
- Modify: `src/app/app/sleep/page.tsx` (sound activation)

**Step 1: Fix AudioContext initialization in use-soundscape.ts**

In `src/hooks/use-soundscape.ts`, modify the `play()` function to ensure AudioContext resumes (browser autoplay policy requires user gesture):

```typescript
const play = useCallback(async (type?: NoiseType, vol?: number) => {
  const engine = await ensureEngine();
  if (!engine) return;

  // Resume AudioContext if suspended (browser autoplay policy)
  if (engine.audioContext?.state === 'suspended') {
    await engine.audioContext.resume();
  }

  const t = type ?? store.noiseType;
  const v = vol ?? store.volume;
  await engine.play(t, v);
  store.play();
  store.setNoiseType(t);
  store.setVolume(v);
}, [ensureEngine, store]);
```

**Step 2: Auto-start sound when session begins**

In `src/app/app/sleep/page.tsx`, after the calibration phase transitions to 'active', start sound if user has a preference:

```typescript
// In the calibration timeout where phase -> 'active':
const audioState = useAudioStore.getState();
if (audioState.noiseType && audioState.adaptiveMode) {
  soundscape.play(audioState.noiseType, audioState.volume);
}
```

**Step 3: Connect adaptive volume to ambient noise**

Add an effect in the sleep page:

```typescript
useEffect(() => {
  if (!noiseReading || phase !== 'active') return;
  const audioState = useAudioStore.getState();
  if (!audioState.adaptiveMode || !audioState.isPlaying) return;

  // Target: soundscape 8dB above ambient noise floor
  const targetDb = noiseReading.noiseFloor + 8;
  const targetVolume = Math.max(0.1, Math.min(0.8, targetDb / 75));

  // Only adjust if difference is significant (>5%)
  if (Math.abs(targetVolume - audioState.volume) > 0.05) {
    audioState.setVolume(targetVolume);
  }
}, [noiseReading, phase]);
```

**Step 4: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/hooks/use-soundscape.ts src/app/app/sleep/page.tsx
git commit -m "feat: sounds actually play during tracking with adaptive mic-based volume"
```

---

## Task 9: Enhanced Bedside Mode with Wake Lock

**Files:**
- Modify: `src/app/app/sleep/page.tsx` (lines 150-185, wake lock section)

**Step 1: Enhance wake lock with auto-reacquire**

Replace the wake lock logic in `src/app/app/sleep/page.tsx`:

```typescript
const wakeLockRef = useRef<WakeLockSentinel | null>(null);

const acquireWakeLock = useCallback(async () => {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLockRef.current = await navigator.wakeLock.request('screen');
    wakeLockRef.current.addEventListener('release', () => {
      // Re-acquire if still tracking
      if (phaseRef.current === 'active') {
        acquireWakeLock();
      }
    });
  } catch { /* Wake lock failed */ }
}, []);

const releaseWakeLock = useCallback(() => {
  wakeLockRef.current?.release().catch(() => {});
  wakeLockRef.current = null;
}, []);

// Acquire on session start, release on stop
useEffect(() => {
  if (phase === 'active') acquireWakeLock();
  return () => releaseWakeLock();
}, [phase, acquireWakeLock, releaseWakeLock]);

// Re-acquire on visibility change
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && phase === 'active') {
      acquireWakeLock();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, [phase, acquireWakeLock]);
```

**Step 2: Add screen dimming for bedside mode**

```typescript
const [dimmed, setDimmed] = useState(true);
const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handlePeek = useCallback(() => {
  setDimmed(false);
  if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
  peekTimeoutRef.current = setTimeout(() => setDimmed(true), 5000);
}, []);
```

Wrap the active session content with a dimming container:

```tsx
{phase === 'active' && (
  <div
    className="transition-all duration-1000"
    style={{ filter: `brightness(${dimmed ? 0.05 : 0.3})` }}
    onClick={handlePeek}
  >
    {/* existing bedside content */}
  </div>
)}
```

**Step 3: Add battery warning in idle phase**

```tsx
{phase === 'idle' && (
  <div className="flex items-center gap-2 text-xs text-amber-400/70 mb-4">
    <Battery className="w-4 h-4" />
    <span>Plug in your phone. Bedside mode uses ~10-15% battery overnight.</span>
  </div>
)}
```

**Step 4: Commit**

```bash
git add src/app/app/sleep/page.tsx
git commit -m "feat: robust wake lock, screen dimming, tap-to-peek bedside mode"
```

---

## Task 10: Public Science Page

**Files:**
- Create: `src/app/app/science/page.tsx`

**Step 1: Create the science page**

Create `src/app/app/science/page.tsx` with accordion sections covering:
1. How We Detect Sleep Stages (actigraphy method, thresholds, Ancoli-Israel 2003)
2. How We Detect Posture (accelerometer angles, Okamoto-Mizuno 2012)
3. How We Calculate Sleep Quality (5-component scoring model)
4. How We Calculate Sleep Debt (Van Dongen 2003, 14-day rolling)
5. How We Forecast Energy (Borbely 1982 Two-Process Model, Process S + C formulas)
6. How Soundscapes Work (Ngo 2013, noise generation methods)
7. How Thermal Comfort Works (Krauchi 2007, circadian temperature)
8. Limitations & When to See a Doctor

Each section includes:
- Plain-language explanation
- Actual formula/threshold table from the code
- DOI-linked scientific reference
- Honest limitations

See the full component code in the design document: `docs/plans/2026-02-25-make-it-real-design.md`

**Step 2: Add navigation link**

Add a link to `/app/science` from the Settings page or bottom nav.

**Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/app/science/page.tsx
git commit -m "feat: public science page with all algorithms, formulas, and citations"
```

---

## Task 11: Correct Misleading Claims

**Files:**
- Modify: `src/app/page.tsx` (landing page)
- Modify: `public/manifest.json`
- Modify: `src/app/layout.tsx` (metadata)

**Step 1: Find and replace misleading "AI" claims in landing page**

In `src/app/page.tsx`:
- Replace "AI Sleep Comfort" with "Science-Based Sleep Comfort"
- Replace all "AI-powered" with "Algorithm-powered" or "Science-based"
- Replace "Edge AI" with "On-device processing"
- Replace "AI Takes Over" with "Algorithms Take Over"
- Add disclaimer near bottom:

```tsx
<p className="text-xs text-slate-500 max-w-md mx-auto">
  Sleep stages estimated via accelerometer actigraphy. Not a medical device.{' '}
  <a href="/app/science" className="text-teal-400 hover:underline">
    See our methodology and citations
  </a>.
</p>
```

**Step 2: Update manifest.json name**

```json
"name": "DreamBreeze - Science-Based Sleep Comfort"
```

**Step 3: Update layout.tsx metadata description**

```typescript
description: 'Science-based sleep tracking with posture-aware fan control and adaptive soundscapes. All processing on-device.',
```

**Step 4: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/app/page.tsx public/manifest.json src/app/layout.tsx
git commit -m "fix: replace misleading AI claims with accurate science-based language"
```

---

## Task 12: Service Worker for Offline Caching

**Files:**
- Create: `src/components/ServiceWorkerRegistrar.tsx`
- Create: `public/sw.js`
- Modify: `src/app/layout.tsx`

**Step 1: Create service worker**

```javascript
// public/sw.js
const CACHE_NAME = 'dreambreeze-v1';
const AUDIO_CACHE = 'dreambreeze-audio-v1';

const AUDIO_ASSETS = [
  '/audio/rain-loop.mp3',
  '/audio/ocean-loop.mp3',
  '/audio/forest-loop.mp3',
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== AUDIO_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Audio files: cache-first
  if (AUDIO_ASSETS.some((a) => url.pathname === a)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Everything else: network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
```

**Step 2: Create a client component for SW registration (avoids dangerouslySetInnerHTML)**

```tsx
// src/components/ServiceWorkerRegistrar.tsx
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
```

**Step 3: Add to layout.tsx**

```tsx
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

// Inside the body, alongside other providers:
<ServiceWorkerRegistrar />
```

**Step 4: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add public/sw.js src/components/ServiceWorkerRegistrar.tsx src/app/layout.tsx
git commit -m "feat: service worker for offline caching of audio samples"
```

---

## Task 13: Add Tests to CI Pipeline

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Add test job**

```yaml
  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
```

Update build job to depend on test:
```yaml
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add test job to CI pipeline"
```

---

## Task 14: Integration Verification

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors

**Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Manual verification checklist (run npm run dev, test on mobile)**

- [ ] `/app/sleep` shows permission gate before tracking starts
- [ ] Motion permission: iOS shows system dialog, Android auto-grants
- [ ] Microphone permission: system dialog, real dB value displayed
- [ ] Location permission: system dialog, accurate local weather
- [ ] Start tracking: wake lock acquired, screen stays on
- [ ] Bedside mode: dims after 5s, tap to peek for 5s
- [ ] All 6 sounds play real audio when tapped
- [ ] Adaptive volume adjusts based on ambient microphone dB
- [ ] Posture shows real accelerometer-derived classification
- [ ] Sleep stage shows real epoch-based classification
- [ ] Fan speed calculated by real agents with "Simulated" badge
- [ ] Stop tracking (3s hold): session saved with real data
- [ ] History page shows real sessions with accurate stats
- [ ] Science page: all sections, all citations with DOI links
- [ ] Landing page: no "AI-powered" claims, has science disclaimer
- [ ] Works on iPhone Safari 16.4+
- [ ] Works on Android Chrome
- [ ] PWA installable on both platforms

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: DreamBreeze Make It Real - all sensors, sounds, metrics are live"
```

---

## Dependency Graph

| Task | Depends On |
|------|-----------|
| 1. Remove TF.js | None |
| 2. Permission Manager | None |
| 3. Permission Gate UI | Task 2 |
| 4. Ambient Noise Analyzer | None |
| 5. GPS Weather | None |
| 6. Audio Samples | None |
| 7. Wire Real Sensors | Tasks 2, 4 |
| 8. Sound Playback | Task 6 |
| 9. Bedside Mode | None |
| 10. Science Page | None |
| 11. Correct Claims | None |
| 12. Service Worker | Task 6 |
| 13. CI Tests | Tasks 2, 4 |
| 14. Integration | All above |

**Parallelizable groups:**
- Group A (no deps): Tasks 1, 2, 4, 5, 6, 9, 10, 11
- Group B (after A): Tasks 3, 7, 8, 12, 13
- Group C (after B): Task 14
