/**
 * Blackboard Architecture -- shared knowledge store for DreamBreeze agents.
 *
 * Agents write hypotheses to the blackboard. The controller evaluates
 * and selects the best composite action each cycle (every 30 seconds).
 */

export type AgentId =
  | 'posture-agent'
  | 'thermal-agent'
  | 'sound-agent'
  | 'circadian-agent'
  | 'comfort-agent'
  | 'energy-agent';

export interface Hypothesis {
  agentId: AgentId;
  timestamp: number;
  confidence: number; // 0-1
  action: AgentAction;
  reasoning: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expiresAt: number; // auto-expire stale hypotheses
}

export type AgentAction =
  | { type: 'SET_FAN_SPEED'; speed: number }
  | { type: 'ADJUST_FAN_DELTA'; delta: number }
  | { type: 'SET_SOUND_TYPE'; noiseType: string; volume: number }
  | { type: 'ADJUST_VOLUME'; delta: number }
  | { type: 'SET_TEMPERATURE_PROFILE'; profile: string }
  | { type: 'TRIGGER_WAKE_SEQUENCE'; minutesUntilAlarm: number }
  | { type: 'LOG_INSIGHT'; message: string; category: string };

export interface BlackboardState {
  hypotheses: Hypothesis[];
  context: SleepContext;
  resolvedActions: ResolvedAction[];
}

export interface SleepContext {
  currentPosture: string;
  currentSleepStage: string;
  sessionDurationMinutes: number;
  roomTemperatureEstimate: number | null;
  weatherData: WeatherData | null;
  preSleepContext: PreSleepContext | null;
  timeOfNight: 'early' | 'mid' | 'late' | 'pre-wake';
  sleepDebt: number;
}

export interface WeatherData {
  temperatureCelsius: number;
  humidity: number;
  feelsLike: number;
  description: string;
  fetchedAt: number;
}

export interface PreSleepContext {
  caffeineMg: number;
  caffeineLastIntakeHoursAgo: number;
  alcoholDrinks: number;
  exerciseIntensity: 'none' | 'light' | 'moderate' | 'intense';
  exerciseHoursAgo: number;
  stressLevel: number; // 1-5
  screenTimeMinutes: number;
  mealHoursAgo: number;
}

export interface ResolvedAction {
  action: AgentAction;
  sourceAgents: AgentId[];
  confidence: number;
  timestamp: number;
}

class Blackboard {
  private _hypotheses: Hypothesis[] = [];
  private _context: SleepContext = {
    currentPosture: 'unknown',
    currentSleepStage: 'awake',
    sessionDurationMinutes: 0,
    roomTemperatureEstimate: null,
    weatherData: null,
    preSleepContext: null,
    timeOfNight: 'early',
    sleepDebt: 0,
  };
  private _resolvedActions: ResolvedAction[] = [];
  private _listeners: Set<() => void> = new Set();

  /** Agents post hypotheses here */
  postHypothesis(hypothesis: Hypothesis): void {
    // Remove previous hypothesis from same agent with same action type
    this._hypotheses = this._hypotheses.filter(
      (h) =>
        !(
          h.agentId === hypothesis.agentId &&
          h.action.type === hypothesis.action.type
        ),
    );
    this._hypotheses.push(hypothesis);
    this._notifyListeners();
  }

  /** Update shared context -- any agent or sensor can write here */
  updateContext(partial: Partial<SleepContext>): void {
    this._context = { ...this._context, ...partial };
    this._notifyListeners();
  }

  /** Controller reads all current hypotheses */
  getHypotheses(): Hypothesis[] {
    const now = Date.now();
    // Auto-expire stale hypotheses
    this._hypotheses = this._hypotheses.filter((h) => h.expiresAt > now);
    return [...this._hypotheses];
  }

  getContext(): SleepContext {
    return { ...this._context };
  }

  getResolvedActions(): ResolvedAction[] {
    return [...this._resolvedActions];
  }

  /** Controller resolves conflicts and posts final actions */
  resolve(actions: ResolvedAction[]): void {
    this._resolvedActions = actions;
    this._notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notifyListeners(): void {
    this._listeners.forEach((fn) => fn());
  }

  /** Get full state snapshot for debugging/display */
  getSnapshot(): BlackboardState {
    return {
      hypotheses: this.getHypotheses(),
      context: this.getContext(),
      resolvedActions: this.getResolvedActions(),
    };
  }

  /** Reset for new session */
  reset(): void {
    this._hypotheses = [];
    this._resolvedActions = [];
    this._context = {
      currentPosture: 'unknown',
      currentSleepStage: 'awake',
      sessionDurationMinutes: 0,
      roomTemperatureEstimate: null,
      weatherData: null,
      preSleepContext: null,
      timeOfNight: 'early',
      sleepDebt: 0,
    };
  }
}

// Singleton
export const blackboard = new Blackboard();
