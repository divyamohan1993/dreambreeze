/**
 * Posture Agent — adjusts fan speed based on body position.
 *
 * Different postures expose different body surface areas to airflow.
 * Supine (back) = max exposure, prone (face down) = minimal, lateral = moderate.
 */
import { blackboard, type Hypothesis } from '../blackboard';

const POSTURE_FAN_MAP: Record<string, number> = {
  supine: 55, // Back — full torso exposed, moderate-high airflow
  'left-lateral': 40, // Side — partial exposure
  'right-lateral': 40,
  prone: 25, // Face down — minimal, avoid face draft
  fetal: 30, // Curled up — likely cold, reduce airflow
  unknown: 35, // Default conservative
};

const SLEEP_STAGE_MODIFIER: Record<string, number> = {
  awake: 0,
  light: -5,
  deep: -10, // Deep sleep = lower body temp, less fan needed
  rem: +10, // REM = body can't thermoregulate, needs more help
};

export function runPostureAgent(): void {
  const ctx = blackboard.getContext();
  const baseSpeed = POSTURE_FAN_MAP[ctx.currentPosture] ?? 35;
  const stageMod = SLEEP_STAGE_MODIFIER[ctx.currentSleepStage] ?? 0;
  const speed = Math.max(0, Math.min(100, baseSpeed + stageMod));

  const hypothesis: Hypothesis = {
    agentId: 'posture-agent',
    timestamp: Date.now(),
    confidence: ctx.currentPosture === 'unknown' ? 0.3 : 0.85,
    action: { type: 'SET_FAN_SPEED', speed },
    reasoning: `Posture "${ctx.currentPosture}" + stage "${ctx.currentSleepStage}" → base ${baseSpeed} + mod ${stageMod} = ${speed}%`,
    priority: 'high',
    expiresAt: Date.now() + 60_000, // 60s TTL
  };

  blackboard.postHypothesis(hypothesis);
}
