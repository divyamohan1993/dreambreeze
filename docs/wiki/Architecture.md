# Architecture

DreamBreeze uses a **Multi-Agent Blackboard Architecture** -- a pattern from AI research where specialized agents collaborate through a shared workspace (the "blackboard") to solve problems no single agent could handle alone.

## System Overview

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
+------------------------------------------------------------------+
                                   |
                    +--------------v-----------------+
                    |     MQTT / Webhook / Demo      |
                    +---------------+----------------+
                                    |
                    +---------------v----------------+
                    |         Smart Fan              |
                    +--------------------------------+
```

## The Blackboard Pattern

The blackboard is a singleton shared workspace (`src/lib/ai/blackboard.ts`) where:

1. **Sensors write context** -- posture, movement intensity, ambient light, time
2. **Agents read context and post hypotheses** -- each agent proposes actions based on its specialty
3. **Controller resolves conflicts** -- priority-weighted conflict resolution determines final output
4. **Hypotheses auto-expire** -- stale data is cleaned up automatically

### Why Blackboard Over Pipeline?

| Approach | Problem |
|----------|---------|
| Pipeline (A -> B -> C) | Agents cannot react to each other. Posture change cannot influence sound. |
| Event Bus | No mediation. Conflicting events cause thrashing. |
| **Blackboard** | Agents read the same shared state, post proposals, and a controller resolves conflicts intelligently. |

## The Four Agents

### Posture Agent (`src/lib/ai/agents/posture-agent.ts`)
- **Input**: Accelerometer data (DeviceMotion API)
- **Output**: Fan speed recommendation (0-100%)
- **Logic**: Supine (back) = 55%, Lateral (side) = 40%, Fetal = 35%, Prone (stomach) = 25%
- **Modifiers**: REM sleep adds +10% (body cannot self-thermoregulate during REM)

### Thermal Agent (`src/lib/ai/agents/thermal-agent.ts`)
- **Input**: Weather data (Open-Meteo API) + circadian body temperature curve
- **Output**: Temperature profile adjustments
- **Logic**: Cross-references outdoor temperature, humidity, and the natural body temperature nadir at 4-5 AM
- **Cache**: Weather data cached for 30 minutes to minimize API calls

### Sound Agent (`src/lib/ai/agents/sound-agent.ts`)
- **Input**: Estimated sleep stage
- **Output**: Noise type (white/pink/brown) + volume level
- **Logic**: Pink noise for falling asleep (boosts slow-wave activity), brown noise for deep sleep, gradual fade during REM
- **Implementation**: Web Audio API with real-time synthesis

### Energy Agent (`src/lib/ai/agents/energy-agent.ts`)
- **Input**: Sleep history, current session timing, Two-Process Model calculations
- **Output**: Energy forecast + wake sequence trigger
- **Logic**: Implements Borbely's Two-Process Model (Process S + Process C) to predict optimal wake time
- **Wake Sequence**: 20-minute gradual arousal -- fan speed increase, sound shift, light suggestion

## Controller Cycle

The `BlackboardController` (`src/lib/ai/controller.ts`) runs a 30-second cycle:

1. **Read** -- Gather current blackboard state
2. **Evaluate** -- Each agent reads context and posts hypotheses
3. **Resolve** -- Priority-weighted conflict resolution (higher-priority agents win ties)
4. **Smooth** -- Maximum 5% speed change per cycle prevents jarring transitions
5. **Execute** -- Send final commands to fan, audio, and UI

## Data Flow

```
Accelerometer -> Posture Classifier -> Blackboard Context
                                              |
                                    +---------+---------+
                                    |         |         |
                                Posture   Thermal    Sound
                                Agent     Agent      Agent
                                    |         |         |
                                    +---------+---------+
                                              |
                                        Controller
                                        (Resolve)
                                              |
                                    +---------+---------+
                                    |         |         |
                                  Fan       Audio     Wake
                                  MQTT    Web Audio   Timer
```

## State Management

- **Zustand stores** (`src/stores/`) manage UI state
- **Blackboard** manages AI state (separate from UI)
- **`useBlackboard` hook** (`src/hooks/use-blackboard.ts`) bridges the two -- subscribes to blackboard changes and syncs to Zustand

## File Map

| File | Purpose |
|------|---------|
| `src/lib/ai/blackboard.ts` | Singleton blackboard with subscribe/notify |
| `src/lib/ai/controller.ts` | 30-second cycle, conflict resolution, smoothing |
| `src/lib/ai/agents/posture-agent.ts` | Posture -> fan speed mapping |
| `src/lib/ai/agents/thermal-agent.ts` | Weather + circadian -> temperature |
| `src/lib/ai/agents/sound-agent.ts` | Sleep stage -> noise profile |
| `src/lib/ai/agents/energy-agent.ts` | Two-Process Model -> wake timing |
| `src/lib/ai/sleep-debt.ts` | 14-day rolling sleep debt calculator |
| `src/lib/ai/cognitive-readiness.ts` | 4-pillar cognitive readiness score |
| `src/hooks/use-blackboard.ts` | Blackboard <-> Zustand bridge |
