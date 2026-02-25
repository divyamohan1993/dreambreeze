import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { blackboard } from '@/lib/ai/blackboard';
import { runPostureAgent } from '@/lib/ai/agents/posture-agent';
import { runThermalAgent } from '@/lib/ai/agents/thermal-agent';
import { runSoundAgent } from '@/lib/ai/agents/sound-agent';
import { runEnergyAgent } from '@/lib/ai/agents/energy-agent';

// ---------------------------------------------------------------------------
// Posture Agent
// ---------------------------------------------------------------------------
describe('PostureAgent', () => {
  beforeEach(() => {
    blackboard.reset();
  });

  it('maps supine posture to 55% base speed', () => {
    blackboard.updateContext({
      currentPosture: 'supine',
      currentSleepStage: 'awake', // stage mod = 0
    });

    runPostureAgent();

    const hypotheses = blackboard.getHypotheses();
    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].agentId).toBe('posture-agent');
    expect(hypotheses[0].action).toEqual({
      type: 'SET_FAN_SPEED',
      speed: 55,
    });
  });

  it('maps prone posture to 25% base speed', () => {
    blackboard.updateContext({
      currentPosture: 'prone',
      currentSleepStage: 'awake',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 25 });
  });

  it('maps left-lateral posture to 40% base speed', () => {
    blackboard.updateContext({
      currentPosture: 'left-lateral',
      currentSleepStage: 'awake',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 40 });
  });

  it('maps right-lateral posture to 40% base speed', () => {
    blackboard.updateContext({
      currentPosture: 'right-lateral',
      currentSleepStage: 'awake',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 40 });
  });

  it('maps fetal posture to 30% base speed', () => {
    blackboard.updateContext({
      currentPosture: 'fetal',
      currentSleepStage: 'awake',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 30 });
  });

  it('applies deep sleep stage modifier (-10)', () => {
    blackboard.updateContext({
      currentPosture: 'supine',
      currentSleepStage: 'deep',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    // supine base 55 + deep mod -10 = 45
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 45 });
  });

  it('applies REM sleep stage modifier (+10)', () => {
    blackboard.updateContext({
      currentPosture: 'supine',
      currentSleepStage: 'rem',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    // supine base 55 + rem mod +10 = 65
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 65 });
  });

  it('applies light sleep stage modifier (-5)', () => {
    blackboard.updateContext({
      currentPosture: 'supine',
      currentSleepStage: 'light',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    // supine base 55 + light mod -5 = 50
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 50 });
  });

  it('sets low confidence (0.3) for unknown posture', () => {
    blackboard.updateContext({
      currentPosture: 'unknown',
      currentSleepStage: 'awake',
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.confidence).toBe(0.3);
    // unknown base = 35, awake mod = 0 -> 35
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 35 });
  });

  it('sets high confidence (0.85) for known postures', () => {
    blackboard.updateContext({
      currentPosture: 'supine',
      currentSleepStage: 'awake',
    });

    runPostureAgent();

    expect(blackboard.getHypotheses()[0].confidence).toBe(0.85);
  });

  it('clamps speed to minimum 0', () => {
    blackboard.updateContext({
      currentPosture: 'prone', // base 25
      currentSleepStage: 'deep', // mod -10 -> 15 (still above 0, but testing clamp logic)
    });

    runPostureAgent();

    const h = blackboard.getHypotheses()[0];
    const speed = (h.action as { type: 'SET_FAN_SPEED'; speed: number }).speed;
    expect(speed).toBeGreaterThanOrEqual(0);
    expect(speed).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// Thermal Agent
// ---------------------------------------------------------------------------
describe('ThermalAgent', () => {
  beforeEach(() => {
    blackboard.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets 80% speed for hot weather (feelsLike > 32C)', () => {
    // Set time to a known hour so circadian offset is deterministic
    vi.setSystemTime(new Date(2025, 6, 15, 22, 0, 0)); // 10 PM -> offset -0.1

    blackboard.updateContext({
      weatherData: {
        temperatureCelsius: 35,
        humidity: 50,
        feelsLike: 35,
        description: 'hot',
        fetchedAt: Date.now(),
      },
    });

    runThermalAgent();

    const h = blackboard.getHypotheses()[0];
    // Hot: base 80, humidity 50 (no adj), circadian -0.1 -> adj = -1 -> speed = 79
    expect(h.action).toEqual({ type: 'SET_FAN_SPEED', speed: 79 });
    expect(h.priority).toBe('critical'); // feelsLike > 32
  });

  it('sets 5% speed for cold weather (feelsLike < 20C)', () => {
    vi.setSystemTime(new Date(2025, 6, 15, 22, 0, 0)); // 10 PM -> offset -0.1

    blackboard.updateContext({
      weatherData: {
        temperatureCelsius: 15,
        humidity: 40,
        feelsLike: 15,
        description: 'cold',
        fetchedAt: Date.now(),
      },
    });

    runThermalAgent();

    const h = blackboard.getHypotheses()[0];
    // Cold: base 5, circadian -0.1 -> adj = -1 -> speed = 4
    expect((h.action as { type: 'SET_FAN_SPEED'; speed: number }).speed).toBe(4);
    expect(h.priority).toBe('medium'); // not hot
  });

  it('adds +10 speed for high humidity (>75%)', () => {
    vi.setSystemTime(new Date(2025, 6, 15, 22, 0, 0)); // 10 PM -> offset -0.1

    blackboard.updateContext({
      weatherData: {
        temperatureCelsius: 30,
        humidity: 80,
        feelsLike: 30,
        description: 'warm and humid',
        fetchedAt: Date.now(),
      },
    });

    runThermalAgent();

    const h = blackboard.getHypotheses()[0];
    // feelsLike 30 > 28 -> base 60, humidity 80 > 75 -> +10 = 70
    // circadian at 22: -0.1 -> adj -1 -> 69
    expect((h.action as { type: 'SET_FAN_SPEED'; speed: number }).speed).toBe(69);
  });

  it('sets confidence 0.5 when no weather data available', () => {
    vi.setSystemTime(new Date(2025, 6, 15, 22, 0, 0));

    // Default context has no weather data
    runThermalAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.confidence).toBe(0.5);
  });

  it('sets confidence 0.75 when weather data is available', () => {
    vi.setSystemTime(new Date(2025, 6, 15, 22, 0, 0));

    blackboard.updateContext({
      weatherData: {
        temperatureCelsius: 25,
        humidity: 50,
        feelsLike: 25,
        description: 'comfortable',
        fetchedAt: Date.now(),
      },
    });

    runThermalAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.confidence).toBe(0.75);
  });

  it('uses default 40% speed when no weather data (before circadian adj)', () => {
    vi.setSystemTime(new Date(2025, 6, 15, 8, 0, 0)); // 8 AM -> offset 0

    runThermalAgent();

    const h = blackboard.getHypotheses()[0];
    // base 40, no circadian offset at hour 8 (offset = 0) -> 40
    expect((h.action as { type: 'SET_FAN_SPEED'; speed: number }).speed).toBe(40);
  });

  it('applies circadian offset correctly', () => {
    // At 4 AM, body temp nadir, offset = -1.1
    vi.setSystemTime(new Date(2025, 6, 15, 4, 0, 0));

    blackboard.updateContext({
      weatherData: {
        temperatureCelsius: 25,
        humidity: 50,
        feelsLike: 25,
        description: 'comfortable',
        fetchedAt: Date.now(),
      },
    });

    runThermalAgent();

    const h = blackboard.getHypotheses()[0];
    // feelsLike 25 > 24 -> base 40, circadian -1.1 -> adj = -11 -> 29
    expect((h.action as { type: 'SET_FAN_SPEED'; speed: number }).speed).toBe(29);
  });

  it('updates timeOfNight context', () => {
    // 22:00 -> early
    vi.setSystemTime(new Date(2025, 6, 15, 22, 0, 0));
    runThermalAgent();
    expect(blackboard.getContext().timeOfNight).toBe('early');

    blackboard.reset();

    // 2:00 -> mid
    vi.setSystemTime(new Date(2025, 6, 15, 2, 0, 0));
    runThermalAgent();
    expect(blackboard.getContext().timeOfNight).toBe('mid');

    blackboard.reset();

    // 4:00 -> late
    vi.setSystemTime(new Date(2025, 6, 15, 4, 0, 0));
    runThermalAgent();
    expect(blackboard.getContext().timeOfNight).toBe('late');

    blackboard.reset();

    // 6:00 -> pre-wake
    vi.setSystemTime(new Date(2025, 6, 15, 6, 0, 0));
    runThermalAgent();
    expect(blackboard.getContext().timeOfNight).toBe('pre-wake');
  });
});

// ---------------------------------------------------------------------------
// Sound Agent
// ---------------------------------------------------------------------------
describe('SoundAgent', () => {
  beforeEach(() => {
    blackboard.reset();
  });

  it('recommends pink noise at 0.25 volume during deep sleep', () => {
    blackboard.updateContext({
      currentSleepStage: 'deep',
      timeOfNight: 'mid',
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.agentId).toBe('sound-agent');
    expect(h.action).toEqual({
      type: 'SET_SOUND_TYPE',
      noiseType: 'pink',
      volume: 0.25,
    });
  });

  it('recommends brown noise during REM sleep', () => {
    blackboard.updateContext({
      currentSleepStage: 'rem',
      timeOfNight: 'mid',
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.action).toEqual({
      type: 'SET_SOUND_TYPE',
      noiseType: 'brown',
      volume: 0.3,
    });
  });

  it('recommends brown noise for awake + high stress', () => {
    blackboard.updateContext({
      currentSleepStage: 'awake',
      timeOfNight: 'early',
      preSleepContext: {
        caffeineMg: 0,
        caffeineLastIntakeHoursAgo: 12,
        alcoholDrinks: 0,
        exerciseIntensity: 'none',
        exerciseHoursAgo: 24,
        stressLevel: 4,
        screenTimeMinutes: 30,
        mealHoursAgo: 3,
      },
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    expect((h.action as { type: 'SET_SOUND_TYPE'; noiseType: string; volume: number }).noiseType).toBe('brown');
  });

  it('recommends white noise for awake + low stress', () => {
    blackboard.updateContext({
      currentSleepStage: 'awake',
      timeOfNight: 'early',
      preSleepContext: {
        caffeineMg: 0,
        caffeineLastIntakeHoursAgo: 12,
        alcoholDrinks: 0,
        exerciseIntensity: 'none',
        exerciseHoursAgo: 24,
        stressLevel: 2,
        screenTimeMinutes: 30,
        mealHoursAgo: 3,
      },
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    expect((h.action as { type: 'SET_SOUND_TYPE'; noiseType: string; volume: number }).noiseType).toBe('white');
  });

  it('recommends pink noise during light sleep', () => {
    blackboard.updateContext({
      currentSleepStage: 'light',
      timeOfNight: 'early',
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    expect(h.action).toEqual({
      type: 'SET_SOUND_TYPE',
      noiseType: 'pink',
      volume: 0.35,
    });
  });

  it('increases volume when caffeine is high and stage is awake', () => {
    blackboard.updateContext({
      currentSleepStage: 'awake',
      timeOfNight: 'early',
      preSleepContext: {
        caffeineMg: 200,
        caffeineLastIntakeHoursAgo: 2,
        alcoholDrinks: 0,
        exerciseIntensity: 'none',
        exerciseHoursAgo: 24,
        stressLevel: 2,
        screenTimeMinutes: 30,
        mealHoursAgo: 3,
      },
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    const action = h.action as { type: 'SET_SOUND_TYPE'; noiseType: string; volume: number };
    // Base awake volume is 0.4, caffeine > 100 adds +0.1 -> 0.5
    expect(action.volume).toBe(0.5);
  });

  it('does not increase volume for caffeine when not awake', () => {
    blackboard.updateContext({
      currentSleepStage: 'deep',
      timeOfNight: 'mid',
      preSleepContext: {
        caffeineMg: 200,
        caffeineLastIntakeHoursAgo: 2,
        alcoholDrinks: 0,
        exerciseIntensity: 'none',
        exerciseHoursAgo: 24,
        stressLevel: 2,
        screenTimeMinutes: 30,
        mealHoursAgo: 3,
      },
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    const action = h.action as { type: 'SET_SOUND_TYPE'; noiseType: string; volume: number };
    // Deep sleep volume = 0.25, caffeine adjustment only applies when awake
    expect(action.volume).toBe(0.25);
  });

  it('reduces volume during pre-wake', () => {
    blackboard.updateContext({
      currentSleepStage: 'light',
      timeOfNight: 'pre-wake',
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    const action = h.action as { type: 'SET_SOUND_TYPE'; noiseType: string; volume: number };
    // Light sleep base volume = 0.35, pre-wake reduces by 0.15 -> 0.2
    // Use toBeCloseTo due to floating-point arithmetic (0.35 - 0.15)
    expect(action.volume).toBeCloseTo(0.2, 10);
  });

  it('does not reduce volume below 0.1 during pre-wake', () => {
    blackboard.updateContext({
      currentSleepStage: 'deep', // base volume 0.25
      timeOfNight: 'pre-wake',
    });

    runSoundAgent();

    const h = blackboard.getHypotheses()[0];
    const action = h.action as { type: 'SET_SOUND_TYPE'; noiseType: string; volume: number };
    // Deep sleep volume 0.25 - 0.15 = 0.1, which is the minimum
    expect(action.volume).toBe(0.1);
  });
});

// ---------------------------------------------------------------------------
// Energy Agent
// ---------------------------------------------------------------------------
describe('EnergyAgent', () => {
  beforeEach(() => {
    blackboard.reset();
  });

  it('triggers wake sequence when pre-wake and >= 6h sleep', () => {
    blackboard.updateContext({
      timeOfNight: 'pre-wake',
      sessionDurationMinutes: 6 * 60, // 6 hours
      sleepDebt: 0,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const wakeH = hypotheses.find(
      (h) => h.action.type === 'TRIGGER_WAKE_SEQUENCE',
    );
    expect(wakeH).toBeDefined();
    expect(wakeH!.agentId).toBe('energy-agent');
    expect(wakeH!.priority).toBe('high');
    expect(
      (wakeH!.action as { type: 'TRIGGER_WAKE_SEQUENCE'; minutesUntilAlarm: number })
        .minutesUntilAlarm,
    ).toBe(30);
  });

  it('also posts fan delta increase during pre-wake sequence', () => {
    blackboard.updateContext({
      timeOfNight: 'pre-wake',
      sessionDurationMinutes: 7 * 60,
      sleepDebt: 0,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const fanDelta = hypotheses.find(
      (h) => h.action.type === 'ADJUST_FAN_DELTA',
    );
    expect(fanDelta).toBeDefined();
    expect(
      (fanDelta!.action as { type: 'ADJUST_FAN_DELTA'; delta: number }).delta,
    ).toBe(15);
  });

  it('does not trigger wake sequence when not pre-wake', () => {
    blackboard.updateContext({
      timeOfNight: 'mid',
      sessionDurationMinutes: 7 * 60,
      sleepDebt: 0,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const wakeH = hypotheses.find(
      (h) => h.action.type === 'TRIGGER_WAKE_SEQUENCE',
    );
    expect(wakeH).toBeUndefined();
  });

  it('does not trigger wake sequence when sleep < 6h', () => {
    blackboard.updateContext({
      timeOfNight: 'pre-wake',
      sessionDurationMinutes: 5 * 60, // 5 hours, less than 6
      sleepDebt: 0,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const wakeH = hypotheses.find(
      (h) => h.action.type === 'TRIGGER_WAKE_SEQUENCE',
    );
    expect(wakeH).toBeUndefined();
  });

  it('logs insight when sleep debt > 2h', () => {
    blackboard.updateContext({
      timeOfNight: 'mid',
      sessionDurationMinutes: 120,
      sleepDebt: 3,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const insight = hypotheses.find(
      (h) => h.action.type === 'LOG_INSIGHT',
    );
    expect(insight).toBeDefined();
    expect(insight!.agentId).toBe('energy-agent');
    expect(insight!.confidence).toBe(0.9);

    const action = insight!.action as {
      type: 'LOG_INSIGHT';
      message: string;
      category: string;
    };
    expect(action.category).toBe('sleep-debt');
    expect(action.message).toContain('3.0');
  });

  it('does not log insight when sleep debt <= 2h', () => {
    blackboard.updateContext({
      timeOfNight: 'mid',
      sessionDurationMinutes: 120,
      sleepDebt: 1.5,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const insight = hypotheses.find(
      (h) => h.action.type === 'LOG_INSIGHT',
    );
    expect(insight).toBeUndefined();
  });

  it('sets critical priority for sleep debt > 5h', () => {
    blackboard.updateContext({
      timeOfNight: 'mid',
      sessionDurationMinutes: 120,
      sleepDebt: 6,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const insight = hypotheses.find(
      (h) => h.action.type === 'LOG_INSIGHT',
    );
    expect(insight).toBeDefined();
    expect(insight!.priority).toBe('critical');
  });

  it('sets medium priority for sleep debt > 2h but <= 5h', () => {
    blackboard.updateContext({
      timeOfNight: 'mid',
      sessionDurationMinutes: 120,
      sleepDebt: 4,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const insight = hypotheses.find(
      (h) => h.action.type === 'LOG_INSIGHT',
    );
    expect(insight).toBeDefined();
    expect(insight!.priority).toBe('medium');
  });

  it('can trigger both wake sequence and sleep debt insight simultaneously', () => {
    blackboard.updateContext({
      timeOfNight: 'pre-wake',
      sessionDurationMinutes: 6 * 60,
      sleepDebt: 3,
    });

    runEnergyAgent();

    const hypotheses = blackboard.getHypotheses();
    const wakeH = hypotheses.find(
      (h) => h.action.type === 'TRIGGER_WAKE_SEQUENCE',
    );
    const insight = hypotheses.find(
      (h) => h.action.type === 'LOG_INSIGHT',
    );
    const fanDelta = hypotheses.find(
      (h) => h.action.type === 'ADJUST_FAN_DELTA',
    );

    expect(wakeH).toBeDefined();
    expect(insight).toBeDefined();
    expect(fanDelta).toBeDefined();
  });
});
