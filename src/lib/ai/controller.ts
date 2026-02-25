/**
 * Blackboard Controller -- resolves conflicting agent hypotheses into actions.
 *
 * Priority-weighted conflict resolution:
 * 1. Critical always wins
 * 2. Among same priority, higher confidence wins
 * 3. For fan speed: weighted average by confidence
 * 4. Actions are smoothed to prevent jarring changes
 */
import {
  blackboard,
  type Hypothesis,
  type ResolvedAction,
  type AgentId,
} from './blackboard';
import { agentRegistry } from './agent-registry';

// Side-effect imports: agents self-register with the registry
import './agents/posture-agent';
import './agents/thermal-agent';
import './agents/sound-agent';
import './agents/energy-agent';

const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

interface ControllerConfig {
  cycleIntervalMs: number;
  onFanSpeed?: (speed: number) => void;
  onSoundChange?: (noiseType: string, volume: number) => void;
  onInsight?: (message: string, category: string) => void;
  onWakeSequence?: (minutesUntilAlarm: number) => void;
}

class BlackboardController {
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _config: ControllerConfig;
  private _lastFanSpeed = 0;
  private _cycleCount = 0;

  constructor(config: ControllerConfig) {
    this._config = config;
  }

  start(): void {
    if (this._intervalId) return;

    // Run immediately, then on interval
    this._runCycle();
    this._intervalId = setInterval(
      () => this._runCycle(),
      this._config.cycleIntervalMs,
    );
  }

  stop(): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._cycleCount = 0;
    this._lastFanSpeed = 0;
  }

  /** Run a single agent cycle */
  private _runCycle(): void {
    this._cycleCount++;

    // 1. Run all registered agents (they post hypotheses to blackboard)
    for (const agent of agentRegistry.getAll()) {
      agent.run();
    }

    // 2. Read all hypotheses
    const hypotheses = blackboard.getHypotheses();

    // 3. Resolve conflicts
    const resolved = this._resolveConflicts(hypotheses);
    blackboard.resolve(resolved);

    // 4. Execute resolved actions
    this._executeActions(resolved);
  }

  private _resolveConflicts(hypotheses: Hypothesis[]): ResolvedAction[] {
    const resolved: ResolvedAction[] = [];

    // Group hypotheses by action type
    const fanSpeedHypotheses = hypotheses.filter(
      (h) => h.action.type === 'SET_FAN_SPEED',
    );
    const fanDeltaHypotheses = hypotheses.filter(
      (h) => h.action.type === 'ADJUST_FAN_DELTA',
    );
    const soundHypotheses = hypotheses.filter(
      (h) => h.action.type === 'SET_SOUND_TYPE',
    );
    const insightHypotheses = hypotheses.filter(
      (h) => h.action.type === 'LOG_INSIGHT',
    );
    const wakeHypotheses = hypotheses.filter(
      (h) => h.action.type === 'TRIGGER_WAKE_SEQUENCE',
    );

    // Resolve fan speed: weighted average by (confidence x priority_weight)
    if (fanSpeedHypotheses.length > 0) {
      let totalWeight = 0;
      let weightedSpeed = 0;
      const sourceAgents: AgentId[] = [];

      for (const h of fanSpeedHypotheses) {
        const weight = h.confidence * PRIORITY_WEIGHTS[h.priority];
        weightedSpeed +=
          (h.action as { type: 'SET_FAN_SPEED'; speed: number }).speed *
          weight;
        totalWeight += weight;
        sourceAgents.push(h.agentId);
      }

      let finalSpeed = Math.round(weightedSpeed / totalWeight);

      // Apply deltas
      for (const h of fanDeltaHypotheses) {
        finalSpeed += (
          h.action as { type: 'ADJUST_FAN_DELTA'; delta: number }
        ).delta;
        sourceAgents.push(h.agentId);
      }

      // Smooth: max 5% change per cycle
      const maxChange = 5;
      if (Math.abs(finalSpeed - this._lastFanSpeed) > maxChange) {
        finalSpeed =
          this._lastFanSpeed +
          Math.sign(finalSpeed - this._lastFanSpeed) * maxChange;
      }
      finalSpeed = Math.max(0, Math.min(100, finalSpeed));
      this._lastFanSpeed = finalSpeed;

      resolved.push({
        action: { type: 'SET_FAN_SPEED', speed: finalSpeed },
        sourceAgents,
        confidence: Math.max(...fanSpeedHypotheses.map((h) => h.confidence)),
        timestamp: Date.now(),
      });
    }

    // Resolve sound: highest priority+confidence wins
    if (soundHypotheses.length > 0) {
      const best = soundHypotheses.sort((a, b) => {
        const scoreA = PRIORITY_WEIGHTS[a.priority] * a.confidence;
        const scoreB = PRIORITY_WEIGHTS[b.priority] * b.confidence;
        return scoreB - scoreA;
      })[0];

      resolved.push({
        action: best.action,
        sourceAgents: [best.agentId],
        confidence: best.confidence,
        timestamp: Date.now(),
      });
    }

    // Pass through all insights
    for (const h of insightHypotheses) {
      resolved.push({
        action: h.action,
        sourceAgents: [h.agentId],
        confidence: h.confidence,
        timestamp: Date.now(),
      });
    }

    // Wake sequence: any agent can trigger
    if (wakeHypotheses.length > 0) {
      const best = wakeHypotheses.sort(
        (a, b) => b.confidence - a.confidence,
      )[0];
      resolved.push({
        action: best.action,
        sourceAgents: [best.agentId],
        confidence: best.confidence,
        timestamp: Date.now(),
      });
    }

    return resolved;
  }

  private _executeActions(actions: ResolvedAction[]): void {
    for (const { action } of actions) {
      switch (action.type) {
        case 'SET_FAN_SPEED':
          this._config.onFanSpeed?.(action.speed);
          break;
        case 'SET_SOUND_TYPE':
          this._config.onSoundChange?.(action.noiseType, action.volume);
          break;
        case 'LOG_INSIGHT':
          this._config.onInsight?.(action.message, action.category);
          break;
        case 'TRIGGER_WAKE_SEQUENCE':
          this._config.onWakeSequence?.(action.minutesUntilAlarm);
          break;
      }
    }
  }

  getCycleCount(): number {
    return this._cycleCount;
  }
}

export function createController(
  config: ControllerConfig,
): BlackboardController {
  return new BlackboardController(config);
}

export type { BlackboardController, ControllerConfig };
