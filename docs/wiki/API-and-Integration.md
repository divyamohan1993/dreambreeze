# API and Integration

DreamBreeze integrates with smart fans, weather services, and optional cloud backends. This page documents all integration points.

## Fan Control

### Overview

DreamBreeze outputs fan speed as a value from **0 to 100** (percentage). This value is the resolved output of the four-agent blackboard system after conflict resolution and smoothing.

The controller supports three modes:

| Mode | Protocol | Latency | Setup |
|------|----------|---------|-------|
| Demo | None (visual only) | 0ms | None |
| MQTT | MQTT 3.1.1 / 5.0 | ~50ms LAN | Broker URL + topic |
| Webhook | HTTP POST | ~100ms LAN | Endpoint URL |

### MQTT Protocol

DreamBreeze uses MQTT.js 5 for smart fan communication.

**Connection:**
```
Broker: mqtt://your-broker:1883
Protocol: MQTT 3.1.1 or 5.0
QoS: 1 (at least once delivery)
```

**Published Message Format:**
```json
{
  "speed": 42,
  "timestamp": "2025-01-15T02:30:00.000Z",
  "source": "dreambreeze",
  "context": {
    "posture": "lateral",
    "sleepStage": "deep",
    "agents": {
      "posture": 40,
      "thermal": 45,
      "sound": 38,
      "energy": 42
    }
  }
}
```

**Topic Structure:**
```
dreambreeze/fan/speed     -- Primary speed command (0-100)
dreambreeze/fan/status    -- Fan status updates (subscribe)
dreambreeze/session/start -- Session started
dreambreeze/session/end   -- Session ended
```

**Configuration** (Settings > Fan Integration):
- Broker URL: `mqtt://192.168.1.100:1883` or `wss://broker.example.com:8884`
- Topic prefix: `dreambreeze` (customizable)
- Client ID: Auto-generated, persistent across sessions
- Clean session: true
- Keep alive: 60 seconds

### Webhook Protocol

For HTTP-based fan controllers.

**Request:**
```
POST {webhook_url}
Content-Type: application/json

{
  "speed": 42,
  "timestamp": "2025-01-15T02:30:00.000Z"
}
```

**Expected Response:**
```
HTTP 200 OK
```

**Retry Policy:**
- 3 attempts with exponential backoff (1s, 2s, 4s)
- Falls back to demo mode if all retries fail
- Resumes webhook delivery when endpoint responds again

## Weather Integration

### Open-Meteo API

DreamBreeze uses the [Open-Meteo API](https://open-meteo.com/) for weather data. It is free, requires no API key, and has global coverage.

**Request:**
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m
  &hourly=temperature_2m,relative_humidity_2m
  &forecast_days=1
  &timezone=auto
```

**Cache:** 30-minute TTL. Weather data does not change fast enough to justify more frequent calls.

**Fallback:** If weather data is unavailable (no internet, API down, location denied), the Thermal Agent operates using only the circadian body temperature curve -- degraded but functional.

### Weather Data Usage

The Thermal Agent uses weather data to:

1. **Adjust baseline fan speed** -- hotter outdoor temperature = higher baseline
2. **Predict overnight temperature drop** -- pre-emptively lower fan speed before the room cools
3. **Factor in humidity** -- high humidity reduces evaporative cooling effectiveness, so fan speed increases
4. **Weather condition context** -- rain/storms may cool the room faster than forecast

## Supabase Integration (Optional)

### Authentication

DreamBreeze uses Supabase Auth for user accounts:

- Email/password authentication
- OAuth providers (Google, GitHub -- configurable)
- Session management via `@supabase/ssr`
- Server-side auth helpers for Next.js App Router

### Database Schema

Sleep session summaries (only stored if user opts in):

```sql
-- sleep_sessions table
id              uuid PRIMARY KEY
user_id         uuid REFERENCES auth.users
started_at      timestamptz
ended_at        timestamptz
duration_minutes integer
avg_fan_speed   integer
posture_summary jsonb   -- { supine: 45, lateral: 30, prone: 15, fetal: 10 }
stage_summary   jsonb   -- { awake: 5, light: 35, deep: 30, rem: 30 }
cognitive_score integer -- 0-100
sleep_debt_hours numeric(4,1)
weather_summary jsonb   -- { avg_temp: 22.5, humidity: 65 }
created_at      timestamptz DEFAULT now()
```

**Row-Level Security:**
```sql
-- Users can only read their own sessions
CREATE POLICY "Users read own sessions"
  ON sleep_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users insert own sessions"
  ON sleep_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions (privacy vault)
CREATE POLICY "Users delete own sessions"
  ON sleep_sessions FOR DELETE
  USING (auth.uid() = user_id);
```

## Blackboard API (Internal)

For developers extending DreamBreeze with custom agents.

### Posting a Hypothesis

```typescript
import { blackboard } from '@/lib/ai/blackboard';

blackboard.postHypothesis({
  agentId: 'custom-agent',
  type: 'fan-speed',
  value: 55,
  confidence: 0.8,
  priority: 3,       // 1 (lowest) to 5 (highest)
  ttl: 60000,        // Auto-expire after 60 seconds
  reasoning: 'Custom logic determined 55% optimal'
});
```

### Reading Context

```typescript
const context = blackboard.getContext();
// {
//   posture: 'lateral',
//   sleepStage: 'deep',
//   movementIntensity: 0.15,
//   sessionDuration: 14400000,  // ms
//   weather: { temp: 22.5, humidity: 65 },
//   timestamp: 1705283400000
// }
```

### Subscribing to Changes

```typescript
const unsubscribe = blackboard.subscribe((event) => {
  if (event.type === 'hypothesis-posted') {
    console.log(`${event.agentId} proposed ${event.value}`);
  }
});

// Clean up
unsubscribe();
```

## DeviceMotion API

### Accelerometer Access

```typescript
// Request permission (iOS Safari)
if (typeof DeviceMotionEvent.requestPermission === 'function') {
  const permission = await DeviceMotionEvent.requestPermission();
  if (permission !== 'granted') return;
}

// Listen for motion events
window.addEventListener('devicemotion', (event) => {
  const { x, y, z } = event.accelerationIncludingGravity;
  // Process for posture classification
});
```

### Posture Classification

The posture classifier uses accelerometer orientation to determine body position:

| Axis Values | Posture |
|------------|---------|
| z dominant positive | Supine (face up) |
| z dominant negative | Prone (face down) |
| x dominant | Lateral (side) |
| Mixed with low magnitude | Fetal (curled) |

Sampling rate: 20Hz (configurable). Classification updates every 5 seconds with a 10-sample moving average to filter noise.
