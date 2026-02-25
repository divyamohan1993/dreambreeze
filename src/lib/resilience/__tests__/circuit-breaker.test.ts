import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('executes successfully in CLOSED state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    const result = await cb.execute(() => Promise.resolve('ok'));

    expect(result).toBe('ok');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('opens after failureThreshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    const failing = () => Promise.reject(new Error('fail'));

    // First two failures: still CLOSED
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('CLOSED');

    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('CLOSED');

    // Third failure: opens the circuit
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('OPEN');
  });

  it('rejects calls when OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60_000 });
    const failing = () => Promise.reject(new Error('fail'));

    // Trip the breaker
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('OPEN');

    // Next call should be rejected without executing
    const fn = vi.fn(() => Promise.resolve('should not run'));
    await expect(cb.execute(fn)).rejects.toThrow('Circuit breaker is OPEN -- call rejected');
    expect(fn).not.toHaveBeenCalled();
  });

  it('transitions to HALF_OPEN after resetTimeoutMs', async () => {
    vi.useFakeTimers();

    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 5000 });
    const failing = () => Promise.reject(new Error('fail'));

    // Trip the breaker
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('OPEN');

    // Advance time past resetTimeoutMs
    vi.advanceTimersByTime(5000);

    // The next call should transition to HALF_OPEN and execute
    const result = await cb.execute(() => Promise.resolve('recovered'));
    expect(result).toBe('recovered');
    // After success in HALF_OPEN, it should transition back to CLOSED
    expect(cb.getState()).toBe('CLOSED');
  });

  it('closes again on success in HALF_OPEN', async () => {
    vi.useFakeTimers();

    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 3000 });
    const failing = () => Promise.reject(new Error('fail'));

    // Trip the breaker
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('OPEN');

    // Advance time to allow HALF_OPEN
    vi.advanceTimersByTime(3000);

    // Successful call in HALF_OPEN should close the circuit
    const result = await cb.execute(() => Promise.resolve(42));
    expect(result).toBe(42);
    expect(cb.getState()).toBe('CLOSED');
  });

  it('fires onStateChange callback', async () => {
    const onChange = vi.fn();
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMs: 1000,
      onStateChange: onChange,
    });
    const failing = () => Promise.reject(new Error('fail'));

    // Two failures -> OPEN
    await expect(cb.execute(failing)).rejects.toThrow();
    await expect(cb.execute(failing)).rejects.toThrow();

    expect(onChange).toHaveBeenCalledWith('CLOSED', 'OPEN');
    expect(onChange).toHaveBeenCalledTimes(1);

    // Advance time and succeed -> HALF_OPEN -> CLOSED
    vi.useFakeTimers();
    // We need to re-trip because useFakeTimers resets Date.now
    // Instead, just reset and re-test with fake timers from the start
    vi.useRealTimers();
    onChange.mockClear();

    const cb2 = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMs: 1000,
      onStateChange: onChange,
    });

    vi.useFakeTimers();

    await expect(cb2.execute(failing)).rejects.toThrow();
    await expect(cb2.execute(failing)).rejects.toThrow();
    expect(onChange).toHaveBeenCalledWith('CLOSED', 'OPEN');

    vi.advanceTimersByTime(1000);

    await cb2.execute(() => Promise.resolve('ok'));
    // Should have fired: CLOSED->OPEN, OPEN->HALF_OPEN, HALF_OPEN->CLOSED
    expect(onChange).toHaveBeenCalledWith('OPEN', 'HALF_OPEN');
    expect(onChange).toHaveBeenCalledWith('HALF_OPEN', 'CLOSED');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('reset() returns to CLOSED state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60_000 });
    const failing = () => Promise.reject(new Error('fail'));

    // Trip the breaker
    await expect(cb.execute(failing)).rejects.toThrow();
    await expect(cb.execute(failing)).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');

    // Reset should return to CLOSED
    cb.reset();
    expect(cb.getState()).toBe('CLOSED');

    // Should be able to execute again
    const result = await cb.execute(() => Promise.resolve('back to normal'));
    expect(result).toBe('back to normal');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('re-opens if HALF_OPEN probe fails', async () => {
    vi.useFakeTimers();

    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 2000 });
    const failing = () => Promise.reject(new Error('fail'));

    // Trip the breaker (threshold=1, so 1 failure opens it)
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('OPEN');

    // Advance time past resetTimeoutMs
    vi.advanceTimersByTime(2000);

    // Fail again in HALF_OPEN -> should go back to OPEN
    await expect(cb.execute(failing)).rejects.toThrow('fail');
    expect(cb.getState()).toBe('OPEN');
  });
});
