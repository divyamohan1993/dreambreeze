/**
 * Sound Agent -- adapts soundscape to sleep stage and context.
 *
 * Research-backed: pink noise boosts deep sleep (Ngo et al., 2013),
 * brown noise masks low-frequency disturbances,
 * white noise best for sleep onset.
 */
import { blackboard, type Hypothesis } from '../blackboard';

interface SoundRecommendation {
  noiseType: string;
  volume: number;
  reasoning: string;
}

function getSoundForStage(
  stage: string,
  context: {
    timeOfNight: string;
    stressLevel?: number;
  },
): SoundRecommendation {
  switch (stage) {
    case 'awake':
      return {
        noiseType:
          context.stressLevel && context.stressLevel > 3 ? 'brown' : 'white',
        volume: 0.4,
        reasoning:
          'Sleep onset -- white noise for consistent masking, brown if stressed',
      };
    case 'light':
      return {
        noiseType: 'pink',
        volume: 0.35,
        reasoning: 'Light sleep -- pink noise to encourage transition to deep',
      };
    case 'deep':
      return {
        noiseType: 'pink',
        volume: 0.25,
        reasoning:
          'Deep sleep -- low-volume pink noise for slow-wave enhancement',
      };
    case 'rem':
      return {
        noiseType: 'brown',
        volume: 0.3,
        reasoning:
          'REM sleep -- brown noise masks external sounds without disruption',
      };
    default:
      return { noiseType: 'white', volume: 0.3, reasoning: 'Default' };
  }
}

export function runSoundAgent(): void {
  const ctx = blackboard.getContext();
  const stress = ctx.preSleepContext?.stressLevel;

  const rec = getSoundForStage(ctx.currentSleepStage, {
    timeOfNight: ctx.timeOfNight,
    stressLevel: stress,
  });

  // Pre-wake: gradually reduce volume to allow natural waking
  if (ctx.timeOfNight === 'pre-wake') {
    rec.volume = Math.max(0.1, rec.volume - 0.15);
    rec.reasoning += ' | Pre-wake: reducing volume for natural arousal';
  }

  // If high caffeine, slightly increase masking volume (harder to fall asleep)
  if (
    ctx.preSleepContext &&
    ctx.preSleepContext.caffeineMg > 100 &&
    ctx.currentSleepStage === 'awake'
  ) {
    rec.volume = Math.min(0.6, rec.volume + 0.1);
    rec.reasoning += ` | Caffeine (${ctx.preSleepContext.caffeineMg}mg) -- increased masking`;
  }

  const hypothesis: Hypothesis = {
    agentId: 'sound-agent',
    timestamp: Date.now(),
    confidence: 0.7,
    action: {
      type: 'SET_SOUND_TYPE',
      noiseType: rec.noiseType,
      volume: rec.volume,
    },
    reasoning: rec.reasoning,
    priority: 'medium',
    expiresAt: Date.now() + 60_000,
  };

  blackboard.postHypothesis(hypothesis);
}
