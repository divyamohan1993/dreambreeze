import { describe, it, expect, beforeEach, vi } from 'vitest';
import { blackboard, type Hypothesis } from '@/lib/ai/blackboard';

function makeHypothesis(
  overrides: Partial<Hypothesis> = {},
): Hypothesis {
  return {
    agentId: 'posture-agent',
    timestamp: Date.now(),
    confidence: 0.8,
    action: { type: 'SET_FAN_SPEED', speed: 50 },
    reasoning: 'test hypothesis',
    priority: 'medium',
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

describe('Blackboard', () => {
  beforeEach(() => {
    blackboard.reset();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------
  // postHypothesis
  // ---------------------------------------------------------------
  describe('postHypothesis', () => {
    it('adds a hypothesis that can be retrieved', () => {
      const h = makeHypothesis();
      blackboard.postHypothesis(h);

      const all = blackboard.getHypotheses();
      expect(all).toHaveLength(1);
      expect(all[0].agentId).toBe('posture-agent');
      expect(all[0].action).toEqual({ type: 'SET_FAN_SPEED', speed: 50 });
    });

    it('replaces previous hypothesis from same agent with same action type', () => {
      const first = makeHypothesis({ confidence: 0.6 });
      const second = makeHypothesis({ confidence: 0.9 });

      blackboard.postHypothesis(first);
      blackboard.postHypothesis(second);

      const all = blackboard.getHypotheses();
      expect(all).toHaveLength(1);
      expect(all[0].confidence).toBe(0.9);
    });

    it('keeps hypotheses from different agents', () => {
      const postureH = makeHypothesis({ agentId: 'posture-agent' });
      const thermalH = makeHypothesis({ agentId: 'thermal-agent' });

      blackboard.postHypothesis(postureH);
      blackboard.postHypothesis(thermalH);

      expect(blackboard.getHypotheses()).toHaveLength(2);
    });

    it('keeps hypotheses from same agent with different action types', () => {
      const fanH = makeHypothesis({
        agentId: 'energy-agent',
        action: { type: 'SET_FAN_SPEED', speed: 40 },
      });
      const insightH = makeHypothesis({
        agentId: 'energy-agent',
        action: {
          type: 'LOG_INSIGHT',
          message: 'test',
          category: 'sleep-debt',
        },
      });

      blackboard.postHypothesis(fanH);
      blackboard.postHypothesis(insightH);

      expect(blackboard.getHypotheses()).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------
  // getHypotheses -- expiry filtering
  // ---------------------------------------------------------------
  describe('getHypotheses (expiry)', () => {
    it('filters out expired hypotheses', () => {
      vi.useFakeTimers();
      const now = Date.now();

      const fresh = makeHypothesis({
        agentId: 'posture-agent',
        expiresAt: now + 60_000,
      });
      const stale = makeHypothesis({
        agentId: 'thermal-agent',
        expiresAt: now + 10_000,
      });

      blackboard.postHypothesis(fresh);
      blackboard.postHypothesis(stale);
      expect(blackboard.getHypotheses()).toHaveLength(2);

      // Advance time past the stale hypothesis expiry
      vi.advanceTimersByTime(15_000);

      const remaining = blackboard.getHypotheses();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].agentId).toBe('posture-agent');
    });

    it('returns empty array when all hypotheses have expired', () => {
      vi.useFakeTimers();
      const now = Date.now();

      blackboard.postHypothesis(
        makeHypothesis({ expiresAt: now + 5_000 }),
      );

      vi.advanceTimersByTime(6_000);
      expect(blackboard.getHypotheses()).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------
  // updateContext
  // ---------------------------------------------------------------
  describe('updateContext', () => {
    it('merges partial context into state', () => {
      blackboard.updateContext({ currentPosture: 'supine' });
      expect(blackboard.getContext().currentPosture).toBe('supine');

      // Other fields remain at defaults
      expect(blackboard.getContext().currentSleepStage).toBe('awake');
    });

    it('merges multiple partial updates', () => {
      blackboard.updateContext({ currentPosture: 'prone' });
      blackboard.updateContext({ currentSleepStage: 'deep' });

      const ctx = blackboard.getContext();
      expect(ctx.currentPosture).toBe('prone');
      expect(ctx.currentSleepStage).toBe('deep');
    });

    it('overwrites previously set fields', () => {
      blackboard.updateContext({ currentPosture: 'supine' });
      blackboard.updateContext({ currentPosture: 'prone' });

      expect(blackboard.getContext().currentPosture).toBe('prone');
    });
  });

  // ---------------------------------------------------------------
  // subscribe
  // ---------------------------------------------------------------
  describe('subscribe', () => {
    it('notifies listeners when a hypothesis is posted', () => {
      const listener = vi.fn();
      blackboard.subscribe(listener);

      blackboard.postHypothesis(makeHypothesis());
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies listeners when context is updated', () => {
      const listener = vi.fn();
      blackboard.subscribe(listener);

      blackboard.updateContext({ currentPosture: 'supine' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies listeners when actions are resolved', () => {
      const listener = vi.fn();
      blackboard.subscribe(listener);

      blackboard.resolve([
        {
          action: { type: 'SET_FAN_SPEED', speed: 50 },
          sourceAgents: ['posture-agent'],
          confidence: 0.8,
          timestamp: Date.now(),
        },
      ]);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function that stops notifications', () => {
      const listener = vi.fn();
      const unsub = blackboard.subscribe(listener);

      blackboard.postHypothesis(makeHypothesis());
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      blackboard.postHypothesis(
        makeHypothesis({ agentId: 'thermal-agent' }),
      );
      expect(listener).toHaveBeenCalledTimes(1); // not called again
    });

    it('supports multiple listeners', () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      blackboard.subscribe(listenerA);
      blackboard.subscribe(listenerB);

      blackboard.postHypothesis(makeHypothesis());

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // resolve / getResolvedActions
  // ---------------------------------------------------------------
  describe('resolve and getResolvedActions', () => {
    it('stores and retrieves resolved actions', () => {
      const actions = [
        {
          action: { type: 'SET_FAN_SPEED' as const, speed: 42 },
          sourceAgents: ['posture-agent' as const, 'thermal-agent' as const],
          confidence: 0.85,
          timestamp: Date.now(),
        },
      ];

      blackboard.resolve(actions);
      const retrieved = blackboard.getResolvedActions();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].action).toEqual({ type: 'SET_FAN_SPEED', speed: 42 });
      expect(retrieved[0].sourceAgents).toContain('posture-agent');
    });
  });

  // ---------------------------------------------------------------
  // getSnapshot
  // ---------------------------------------------------------------
  describe('getSnapshot', () => {
    it('returns full blackboard state', () => {
      blackboard.updateContext({ currentPosture: 'supine' });
      blackboard.postHypothesis(makeHypothesis());

      const snapshot = blackboard.getSnapshot();
      expect(snapshot).toHaveProperty('hypotheses');
      expect(snapshot).toHaveProperty('context');
      expect(snapshot).toHaveProperty('resolvedActions');
      expect(snapshot.hypotheses).toHaveLength(1);
      expect(snapshot.context.currentPosture).toBe('supine');
    });
  });

  // ---------------------------------------------------------------
  // reset
  // ---------------------------------------------------------------
  describe('reset', () => {
    it('clears all hypotheses', () => {
      blackboard.postHypothesis(makeHypothesis());
      expect(blackboard.getHypotheses()).toHaveLength(1);

      blackboard.reset();
      expect(blackboard.getHypotheses()).toHaveLength(0);
    });

    it('clears resolved actions', () => {
      blackboard.resolve([
        {
          action: { type: 'SET_FAN_SPEED', speed: 50 },
          sourceAgents: ['posture-agent'],
          confidence: 0.8,
          timestamp: Date.now(),
        },
      ]);
      expect(blackboard.getResolvedActions()).toHaveLength(1);

      blackboard.reset();
      expect(blackboard.getResolvedActions()).toHaveLength(0);
    });

    it('resets context to defaults', () => {
      blackboard.updateContext({
        currentPosture: 'supine',
        currentSleepStage: 'deep',
        sessionDurationMinutes: 120,
      });

      blackboard.reset();
      const ctx = blackboard.getContext();

      expect(ctx.currentPosture).toBe('unknown');
      expect(ctx.currentSleepStage).toBe('awake');
      expect(ctx.sessionDurationMinutes).toBe(0);
      expect(ctx.weatherData).toBeNull();
      expect(ctx.preSleepContext).toBeNull();
      expect(ctx.timeOfNight).toBe('early');
      expect(ctx.sleepDebt).toBe(0);
    });
  });
});
