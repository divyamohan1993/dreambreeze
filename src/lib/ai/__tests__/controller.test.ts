import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock agents before importing controller
vi.mock('../agents/posture-agent', () => ({ runPostureAgent: vi.fn() }));
vi.mock('../agents/thermal-agent', () => ({ runThermalAgent: vi.fn() }));
vi.mock('../agents/sound-agent', () => ({ runSoundAgent: vi.fn() }));
vi.mock('../agents/energy-agent', () => ({ runEnergyAgent: vi.fn() }));

import { createController } from '@/lib/ai/controller';
import { blackboard, type Hypothesis } from '@/lib/ai/blackboard';

function makeHypothesis(
  overrides: Partial<Hypothesis> = {},
): Hypothesis {
  return {
    agentId: 'posture-agent',
    timestamp: Date.now(),
    confidence: 0.8,
    action: { type: 'SET_FAN_SPEED', speed: 50 },
    reasoning: 'test',
    priority: 'medium',
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

describe('BlackboardController', () => {
  beforeEach(() => {
    blackboard.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------
  // start / stop
  // ---------------------------------------------------------------
  describe('start and stop', () => {
    it('starts and runs an immediate cycle', () => {
      const onFanSpeed = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onFanSpeed,
      });

      // Post a hypothesis so there is something to resolve
      blackboard.postHypothesis(makeHypothesis());

      ctrl.start();

      // The first cycle runs immediately on start
      expect(ctrl.getCycleCount()).toBe(1);
      expect(onFanSpeed).toHaveBeenCalled();

      ctrl.stop();
    });

    it('stops interval and resets cycle count', () => {
      const ctrl = createController({ cycleIntervalMs: 30_000 });

      ctrl.start();
      expect(ctrl.getCycleCount()).toBe(1);

      ctrl.stop();
      expect(ctrl.getCycleCount()).toBe(0);

      // Advancing time should not trigger more cycles
      vi.advanceTimersByTime(60_000);
      expect(ctrl.getCycleCount()).toBe(0);
    });

    it('runs additional cycles on the configured interval', () => {
      const ctrl = createController({ cycleIntervalMs: 10_000 });

      ctrl.start(); // immediate cycle -> count = 1
      vi.advanceTimersByTime(10_000); // second cycle -> count = 2
      vi.advanceTimersByTime(10_000); // third cycle -> count = 3

      expect(ctrl.getCycleCount()).toBe(3);
      ctrl.stop();
    });

    it('does not double-start if start() is called twice', () => {
      const ctrl = createController({ cycleIntervalMs: 10_000 });

      ctrl.start();
      ctrl.start(); // should be a no-op

      expect(ctrl.getCycleCount()).toBe(1);

      vi.advanceTimersByTime(10_000);
      expect(ctrl.getCycleCount()).toBe(2); // only 1 interval, not 2

      ctrl.stop();
    });
  });

  // ---------------------------------------------------------------
  // Fan speed weighted average resolution
  // ---------------------------------------------------------------
  describe('fan speed resolution (weighted average)', () => {
    it('resolves fan speed as weighted average by confidence * priority weight', () => {
      const onFanSpeed = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onFanSpeed,
      });

      // Post two fan speed hypotheses before starting
      // Posture: speed 60, confidence 0.8, high (weight 3) -> weighted = 60 * 0.8 * 3 = 144
      // Thermal: speed 40, confidence 0.6, medium (weight 2) -> weighted = 40 * 0.6 * 2 = 48
      // Total weight: 0.8*3 + 0.6*2 = 2.4 + 1.2 = 3.6
      // Weighted average: (144 + 48) / 3.6 = 192 / 3.6 = 53.33 -> rounded to 53
      // But smoothing: last fan speed is 0, max change 5 -> clamped to 5
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.8,
          action: { type: 'SET_FAN_SPEED', speed: 60 },
          priority: 'high',
        }),
      );
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'thermal-agent',
          confidence: 0.6,
          action: { type: 'SET_FAN_SPEED', speed: 40 },
          priority: 'medium',
        }),
      );

      ctrl.start();

      // First cycle: last fan speed was 0, target is ~53, clamped to 0+5 = 5
      expect(onFanSpeed).toHaveBeenCalledWith(5);

      ctrl.stop();
    });

    it('uses critical priority weight of 4', () => {
      const onFanSpeed = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onFanSpeed,
      });

      // Single critical hypothesis: speed 80, confidence 1.0, critical (weight 4)
      // Weighted average = 80 (only one hypothesis)
      // Smoothing from 0: clamped to 5
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'thermal-agent',
          confidence: 1.0,
          action: { type: 'SET_FAN_SPEED', speed: 80 },
          priority: 'critical',
        }),
      );

      ctrl.start();

      // Smoothing from 0 -> max change 5 -> result is 5
      expect(onFanSpeed).toHaveBeenCalledWith(5);

      ctrl.stop();
    });
  });

  // ---------------------------------------------------------------
  // Smoothing: max 5% change per cycle
  // ---------------------------------------------------------------
  describe('smoothing (max 5% per cycle)', () => {
    it('limits fan speed increase to 5% per cycle', () => {
      const speeds: number[] = [];
      const onFanSpeed = vi.fn((s: number) => speeds.push(s));
      const ctrl = createController({
        cycleIntervalMs: 1_000,
        onFanSpeed,
      });

      // Post hypothesis targeting 50%
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 50 },
          priority: 'high',
        }),
      );

      ctrl.start(); // cycle 1: from 0 -> clamped to 5
      expect(speeds[0]).toBe(5);

      // Re-post hypothesis for next cycle (agents are mocked, so we post manually)
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 50 },
          priority: 'high',
        }),
      );
      vi.advanceTimersByTime(1_000); // cycle 2: from 5 -> 10
      expect(speeds[1]).toBe(10);

      // Re-post for third cycle
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 50 },
          priority: 'high',
        }),
      );
      vi.advanceTimersByTime(1_000); // cycle 3: from 10 -> 15
      expect(speeds[2]).toBe(15);

      ctrl.stop();
    });

    it('limits fan speed decrease to 5% per cycle', () => {
      const speeds: number[] = [];
      const onFanSpeed = vi.fn((s: number) => speeds.push(s));
      const ctrl = createController({
        cycleIntervalMs: 1_000,
        onFanSpeed,
      });

      // First ramp up to a known level by posting small values close together
      // Post speed 5 first (within 5 of 0)
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 5 },
          priority: 'high',
        }),
      );
      ctrl.start(); // cycle 1: 0 -> 5

      // Now go to 10
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 10 },
          priority: 'high',
        }),
      );
      vi.advanceTimersByTime(1_000); // cycle 2: 5 -> 10

      // Now go to 15
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 15 },
          priority: 'high',
        }),
      );
      vi.advanceTimersByTime(1_000); // cycle 3: 10 -> 15

      // Now target 0 -- should only go down by 5
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 0 },
          priority: 'high',
        }),
      );
      vi.advanceTimersByTime(1_000); // cycle 4: 15 -> 10

      expect(speeds[speeds.length - 1]).toBe(10);

      ctrl.stop();
    });

    it('does not clamp when change is within 5%', () => {
      const speeds: number[] = [];
      const onFanSpeed = vi.fn((s: number) => speeds.push(s));
      const ctrl = createController({
        cycleIntervalMs: 1_000,
        onFanSpeed,
      });

      // Target 3 (within 5 of starting 0)
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'posture-agent',
          confidence: 0.9,
          action: { type: 'SET_FAN_SPEED', speed: 3 },
          priority: 'high',
        }),
      );

      ctrl.start();
      expect(speeds[0]).toBe(3);

      ctrl.stop();
    });
  });

  // ---------------------------------------------------------------
  // Sound resolution: highest priority*confidence wins
  // ---------------------------------------------------------------
  describe('sound resolution', () => {
    it('picks the sound hypothesis with highest priority*confidence score', () => {
      const onSoundChange = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onSoundChange,
      });

      // Sound A: confidence 0.7, medium (weight 2) -> score = 1.4
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'sound-agent',
          confidence: 0.7,
          action: { type: 'SET_SOUND_TYPE', noiseType: 'white', volume: 0.4 },
          priority: 'medium',
        }),
      );

      // Sound B: confidence 0.6, high (weight 3) -> score = 1.8 (winner)
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'comfort-agent',
          confidence: 0.6,
          action: { type: 'SET_SOUND_TYPE', noiseType: 'pink', volume: 0.25 },
          priority: 'high',
        }),
      );

      ctrl.start();

      expect(onSoundChange).toHaveBeenCalledWith('pink', 0.25);

      ctrl.stop();
    });

    it('picks higher confidence when priorities are equal', () => {
      const onSoundChange = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onSoundChange,
      });

      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'sound-agent',
          confidence: 0.5,
          action: { type: 'SET_SOUND_TYPE', noiseType: 'white', volume: 0.3 },
          priority: 'medium',
        }),
      );
      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'comfort-agent',
          confidence: 0.9,
          action: { type: 'SET_SOUND_TYPE', noiseType: 'brown', volume: 0.35 },
          priority: 'medium',
        }),
      );

      ctrl.start();

      expect(onSoundChange).toHaveBeenCalledWith('brown', 0.35);

      ctrl.stop();
    });
  });

  // ---------------------------------------------------------------
  // Callbacks fire correctly
  // ---------------------------------------------------------------
  describe('callbacks', () => {
    it('fires onFanSpeed callback with resolved speed', () => {
      const onFanSpeed = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onFanSpeed,
      });

      blackboard.postHypothesis(
        makeHypothesis({
          action: { type: 'SET_FAN_SPEED', speed: 3 },
        }),
      );

      ctrl.start();
      expect(onFanSpeed).toHaveBeenCalledTimes(1);
      expect(onFanSpeed).toHaveBeenCalledWith(3);

      ctrl.stop();
    });

    it('fires onSoundChange callback', () => {
      const onSoundChange = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onSoundChange,
      });

      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'sound-agent',
          action: { type: 'SET_SOUND_TYPE', noiseType: 'pink', volume: 0.25 },
        }),
      );

      ctrl.start();
      expect(onSoundChange).toHaveBeenCalledWith('pink', 0.25);

      ctrl.stop();
    });

    it('fires onInsight callback for LOG_INSIGHT actions', () => {
      const onInsight = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onInsight,
      });

      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'energy-agent',
          action: {
            type: 'LOG_INSIGHT',
            message: 'Sleep debt is high',
            category: 'sleep-debt',
          },
        }),
      );

      ctrl.start();
      expect(onInsight).toHaveBeenCalledWith(
        'Sleep debt is high',
        'sleep-debt',
      );

      ctrl.stop();
    });

    it('fires onWakeSequence callback', () => {
      const onWakeSequence = vi.fn();
      const ctrl = createController({
        cycleIntervalMs: 30_000,
        onWakeSequence,
      });

      blackboard.postHypothesis(
        makeHypothesis({
          agentId: 'energy-agent',
          action: {
            type: 'TRIGGER_WAKE_SEQUENCE',
            minutesUntilAlarm: 30,
          },
        }),
      );

      ctrl.start();
      expect(onWakeSequence).toHaveBeenCalledWith(30);

      ctrl.stop();
    });

    it('does not throw when callbacks are not provided', () => {
      const ctrl = createController({ cycleIntervalMs: 30_000 });

      blackboard.postHypothesis(makeHypothesis());

      expect(() => {
        ctrl.start();
      }).not.toThrow();

      ctrl.stop();
    });
  });
});
