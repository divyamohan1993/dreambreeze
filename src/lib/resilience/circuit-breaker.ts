/**
 * Circuit Breaker -- prevents cascading failures from external service outages.
 *
 * States: CLOSED (healthy) -> OPEN (failing) -> HALF_OPEN (probing) -> CLOSED
 * Inspired by Netflix Hystrix pattern.
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold: number;   // failures before opening (default 3)
  resetTimeoutMs: number;     // time in OPEN before trying HALF_OPEN (default 30000)
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly options: Required<Pick<CircuitBreakerOptions, 'failureThreshold' | 'resetTimeoutMs'>> & Pick<CircuitBreakerOptions, 'onStateChange'>;

  constructor(options: CircuitBreakerOptions = { failureThreshold: 3, resetTimeoutMs: 30000 }) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 3,
      resetTimeoutMs: options.resetTimeoutMs ?? 30000,
      onStateChange: options.onStateChange,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.transition('HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN -- call rejected');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.transition('CLOSED');
    }
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.options.failureThreshold) {
      this.transition('OPEN');
    }
  }

  private transition(to: CircuitState): void {
    const from = this.state;
    if (from !== to) {
      this.state = to;
      if (to === 'CLOSED') this.failureCount = 0;
      this.options.onStateChange?.(from, to);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
