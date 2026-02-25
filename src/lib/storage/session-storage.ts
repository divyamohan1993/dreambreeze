/**
 * Session Storage -- persists sleep session summaries to localStorage.
 *
 * Privacy-first: all data stays on-device. No server calls.
 * Sessions are stored as an array, limited to the last 30 nights.
 */

import type { Posture } from '@/types/sleep';

export interface StoredSession {
  id: string;
  date: string;                    // ISO date string (YYYY-MM-DD)
  startedAt: string;               // ISO datetime
  endedAt: string;                 // ISO datetime
  durationMinutes: number;
  sleepScore: number;              // 0-100
  stages: {
    awake: number;                 // percentage
    light: number;
    deep: number;
    rem: number;
  };
  postures: {
    supine: number;                // percentage
    lateral: number;
    prone: number;
    fetal: number;
  };
  dominantPosture: Posture;
  avgFanSpeed: number;
  insights: string[];
}

const STORAGE_KEY = 'dreambreeze_sessions';
const MAX_SESSIONS = 30;

export function getSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredSession[];
  } catch {
    return [];
  }
}

export function saveSession(session: StoredSession): void {
  const sessions = getSessions();
  // Prevent duplicates by id
  const filtered = sessions.filter(s => s.id !== session.id);
  filtered.unshift(session); // newest first
  // Keep only last MAX_SESSIONS
  const trimmed = filtered.slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
