import { describe, it, expect } from 'vitest';
import { generateInsights } from '../generate-insights';
import type { PreSleepData } from '../types';

// -- Helpers ------------------------------------------------------------------

/** Returns a "clean" baseline where nothing should trigger a warning. */
function baseline(): PreSleepData {
  return {
    stressLevel: 2,
    caffeineMg: 0,
    caffeineLastIntakeHoursAgo: 6,
    alcoholDrinks: 0,
    exerciseIntensity: 'none',
    exerciseHoursAgo: 4,
    mealHoursAgo: 4,
    screenTimeMinutes: 60,
  };
}

// -- Tests --------------------------------------------------------------------

describe('generateInsights', () => {
  it('generates a caffeine warning when effective caffeine > 50mg', () => {
    const data = baseline();
    // 237mg taken 1h ago => effective ~213mg (well above 50)
    data.caffeineMg = 237;
    data.caffeineLastIntakeHoursAgo = 1;

    const insights = generateInsights(data);

    const caffeineInsight = insights.find((i) => i.text.includes('caffeine'));
    expect(caffeineInsight).toBeDefined();
    expect(caffeineInsight!.color).toBe('#f0a060');
  });

  it('generates an alcohol warning when drinks > 0', () => {
    const data = baseline();
    data.alcoholDrinks = 2;

    const insights = generateInsights(data);

    const alcoholInsight = insights.find((i) => i.text.includes('Alcohol'));
    expect(alcoholInsight).toBeDefined();
    expect(alcoholInsight!.color).toBe('#6e5ea8');
  });

  it('generates an exercise warning for intense exercise < 3h ago', () => {
    const data = baseline();
    data.exerciseIntensity = 'intense';
    data.exerciseHoursAgo = 1;

    const insights = generateInsights(data);

    const exerciseInsight = insights.find((i) => i.text.includes('intense exercise'));
    expect(exerciseInsight).toBeDefined();
    expect(exerciseInsight!.color).toBe('#e94560');
  });

  it('generates a stress tip when stress level is 4 or 5', () => {
    const data = baseline();
    data.stressLevel = 4;

    const insights = generateInsights(data);

    const stressInsight = insights.find((i) => i.text.includes('stress'));
    expect(stressInsight).toBeDefined();
    expect(stressInsight!.color).toBe('#6e5ea8');

    // Also verify level 5
    data.stressLevel = 5;
    const insights5 = generateInsights(data);
    const stressInsight5 = insights5.find((i) => i.text.includes('stress'));
    expect(stressInsight5).toBeDefined();
  });

  it('generates a screen time warning when > 360 minutes', () => {
    const data = baseline();
    data.screenTimeMinutes = 420;

    const insights = generateInsights(data);

    const screenInsight = insights.find((i) => i.text.includes('screen time'));
    expect(screenInsight).toBeDefined();
    expect(screenInsight!.color).toBe('#e94560');
  });

  it('generates a positive "all good" insight when nothing is flagged', () => {
    const data = baseline();
    // baseline already has no triggers

    const insights = generateInsights(data);

    expect(insights).toHaveLength(1);
    expect(insights[0].text).toContain('Everything looks great');
    expect(insights[0].color).toBe('#4ecdc4');
  });

  it('combines multiple warnings correctly', () => {
    const data: PreSleepData = {
      stressLevel: 5,
      caffeineMg: 380,
      caffeineLastIntakeHoursAgo: 1,
      alcoholDrinks: 2,
      exerciseIntensity: 'intense',
      exerciseHoursAgo: 1,
      mealHoursAgo: 1,
      screenTimeMinutes: 420,
    };

    const insights = generateInsights(data);

    // Should have: caffeine + alcohol + intense exercise + stress + meal + screen
    // (6 insights total -- no "all good" since list is non-empty)
    expect(insights.length).toBe(6);

    const texts = insights.map((i) => i.text);
    expect(texts.some((t) => t.includes('caffeine'))).toBe(true);
    expect(texts.some((t) => t.includes('Alcohol'))).toBe(true);
    expect(texts.some((t) => t.includes('intense exercise'))).toBe(true);
    expect(texts.some((t) => t.includes('stress'))).toBe(true);
    expect(texts.some((t) => t.includes('Recent meal'))).toBe(true);
    expect(texts.some((t) => t.includes('screen time'))).toBe(true);
  });
});
