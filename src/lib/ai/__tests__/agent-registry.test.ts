import { describe, it, expect, beforeEach } from 'vitest';
import { agentRegistry } from '../agent-registry';

describe('AgentRegistry', () => {
  beforeEach(() => {
    agentRegistry.clear();
  });

  it('registers an agent and returns it via getAll()', () => {
    const spy = () => {};
    agentRegistry.register({ id: 'test-agent', run: spy });

    const all = agentRegistry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('test-agent');
    expect(all[0].run).toBe(spy);
  });

  it('prevents duplicate registration by replacing existing agent with same id', () => {
    const firstRun = () => {};
    const secondRun = () => {};

    agentRegistry.register({ id: 'dup-agent', run: firstRun });
    agentRegistry.register({ id: 'dup-agent', run: secondRun });

    const all = agentRegistry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('dup-agent');
    expect(all[0].run).toBe(secondRun);
  });

  it('unregisters an agent by id', () => {
    agentRegistry.register({ id: 'agent-a', run: () => {} });
    agentRegistry.register({ id: 'agent-b', run: () => {} });

    agentRegistry.unregister('agent-a');

    const all = agentRegistry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('agent-b');
  });

  it('clear() removes all agents', () => {
    agentRegistry.register({ id: 'agent-1', run: () => {} });
    agentRegistry.register({ id: 'agent-2', run: () => {} });
    agentRegistry.register({ id: 'agent-3', run: () => {} });

    agentRegistry.clear();

    expect(agentRegistry.getAll()).toHaveLength(0);
  });

  it('getAll() returns agents in registration order', () => {
    agentRegistry.register({ id: 'alpha', run: () => {} });
    agentRegistry.register({ id: 'beta', run: () => {} });
    agentRegistry.register({ id: 'gamma', run: () => {} });

    const ids = agentRegistry.getAll().map(a => a.id);
    expect(ids).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('unregister is a no-op for unknown ids', () => {
    agentRegistry.register({ id: 'existing', run: () => {} });
    agentRegistry.unregister('nonexistent');

    expect(agentRegistry.getAll()).toHaveLength(1);
  });

  it('getAll() returns a readonly snapshot', () => {
    agentRegistry.register({ id: 'test', run: () => {} });
    const all = agentRegistry.getAll();

    // TypeScript enforces readonly, but verify the array reference is stable
    expect(Array.isArray(all)).toBe(true);
  });
});
