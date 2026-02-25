import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionManager } from '../permission-manager';

describe('PermissionManager', () => {
  let pm: PermissionManager;

  beforeEach(() => {
    localStorage.clear();
    pm = new PermissionManager();
  });

  describe('getStatus', () => {
    it('returns not-requested for fresh state', () => {
      expect(pm.getStatus('motion')).toBe('not-requested');
      expect(pm.getStatus('microphone')).toBe('not-requested');
      expect(pm.getStatus('location')).toBe('not-requested');
      expect(pm.getStatus('wakeLock')).toBe('not-requested');
    });

    it('returns persisted state from localStorage', () => {
      localStorage.setItem('dreambreeze-permissions', JSON.stringify({
        motion: 'granted',
        microphone: 'denied',
        location: 'granted',
        wakeLock: 'not-requested',
      }));
      pm = new PermissionManager();
      expect(pm.getStatus('motion')).toBe('granted');
      expect(pm.getStatus('microphone')).toBe('denied');
    });
  });

  describe('getAllStatuses', () => {
    it('returns all permission statuses', () => {
      const statuses = pm.getAllStatuses();
      expect(statuses).toHaveProperty('motion');
      expect(statuses).toHaveProperty('microphone');
      expect(statuses).toHaveProperty('location');
      expect(statuses).toHaveProperty('wakeLock');
    });
  });

  describe('hasAllRequired', () => {
    it('returns false when motion is not granted', () => {
      expect(pm.hasAllRequired()).toBe(false);
    });

    it('returns true when motion is granted', () => {
      pm.setStatus('motion', 'granted');
      expect(pm.hasAllRequired()).toBe(true);
    });
  });

  describe('persist', () => {
    it('saves state to localStorage', () => {
      pm.setStatus('motion', 'granted');
      const stored = JSON.parse(localStorage.getItem('dreambreeze-permissions') || '{}');
      expect(stored.motion).toBe('granted');
    });
  });
});
