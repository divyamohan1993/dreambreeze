import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSessions,
  saveSession,
  deleteSession,
  clearSessions,
  type StoredSession,
} from '../session-storage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<StoredSession> = {}): StoredSession {
  const id = overrides.id ?? `session-${Date.now()}-${Math.random()}`;
  return {
    id,
    date: '2025-06-15',
    startedAt: '2025-06-15T23:00:00.000Z',
    endedAt: '2025-06-16T07:00:00.000Z',
    durationMinutes: 480,
    sleepScore: 82,
    stages: { awake: 5, light: 45, deep: 25, rem: 25 },
    postures: { supine: 40, lateral: 30, prone: 10, fetal: 20 },
    dominantPosture: 'supine',
    avgFanSpeed: 45,
    insights: ['Good deep sleep percentage.'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((_index: number) => null),
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal('localStorage', localStorageMock);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('session-storage', () => {
  // 1. getSessions returns empty array when nothing stored
  it('returns an empty array when nothing is stored', () => {
    const sessions = getSessions();
    expect(sessions).toEqual([]);
  });

  // 2. saveSession stores and retrieves a session
  it('stores and retrieves a session', () => {
    const session = makeSession({ id: 'test-1' });
    saveSession(session);

    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('test-1');
    expect(sessions[0].sleepScore).toBe(82);
  });

  // 3. saveSession prevents duplicate ids
  it('prevents duplicate ids', () => {
    const session1 = makeSession({ id: 'dup-id', sleepScore: 70 });
    const session2 = makeSession({ id: 'dup-id', sleepScore: 90 });

    saveSession(session1);
    saveSession(session2);

    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    // The newer one (session2) should replace the old one
    expect(sessions[0].sleepScore).toBe(90);
  });

  // 4. Sessions are ordered newest first
  it('stores sessions newest first', () => {
    const s1 = makeSession({ id: 'first' });
    const s2 = makeSession({ id: 'second' });
    const s3 = makeSession({ id: 'third' });

    saveSession(s1);
    saveSession(s2);
    saveSession(s3);

    const sessions = getSessions();
    expect(sessions).toHaveLength(3);
    expect(sessions[0].id).toBe('third');
    expect(sessions[1].id).toBe('second');
    expect(sessions[2].id).toBe('first');
  });

  // 5. Max 30 sessions stored (overflow trimmed)
  it('trims to a maximum of 30 sessions', () => {
    // Save 32 sessions
    for (let i = 0; i < 32; i++) {
      saveSession(makeSession({ id: `session-${i}` }));
    }

    const sessions = getSessions();
    expect(sessions).toHaveLength(30);
    // The newest (session-31) should be first
    expect(sessions[0].id).toBe('session-31');
    // The oldest kept should be session-2 (session-0 and session-1 trimmed)
    expect(sessions[29].id).toBe('session-2');
  });

  // 6. deleteSession removes by id
  it('deletes a session by id', () => {
    saveSession(makeSession({ id: 'keep-1' }));
    saveSession(makeSession({ id: 'remove-me' }));
    saveSession(makeSession({ id: 'keep-2' }));

    deleteSession('remove-me');

    const sessions = getSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions.map(s => s.id)).toEqual(['keep-2', 'keep-1']);
  });

  // 7. clearSessions removes all
  it('clears all sessions', () => {
    saveSession(makeSession({ id: 'a' }));
    saveSession(makeSession({ id: 'b' }));

    clearSessions();

    const sessions = getSessions();
    expect(sessions).toEqual([]);
  });

  // Edge case: corrupted localStorage data returns empty array
  it('returns empty array when localStorage data is corrupted', () => {
    localStorageMock.setItem('dreambreeze_sessions', 'not-valid-json{{{');

    const sessions = getSessions();
    expect(sessions).toEqual([]);
  });
});
