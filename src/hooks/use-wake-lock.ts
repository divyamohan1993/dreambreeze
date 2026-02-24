'use client';

/**
 * React hook for the Screen Wake Lock API.
 *
 * Keeps the screen on during sleep tracking so the app can continue
 * reading sensor data without the device going to sleep.
 *
 * - Automatically re-acquires the wake lock when the page regains visibility
 *   (e.g. after the user switches back from another app).
 * - Gracefully handles browsers that don't support the API.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

export function useWakeLock(): UseWakeLockReturn {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldBeActiveRef = useRef(false);

  const isSupported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  // Re-acquire on visibility change (when user returns to the tab/app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === 'visible' &&
        shouldBeActiveRef.current &&
        !wakeLockRef.current
      ) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setIsActive(true);
          setError(null);

          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
            setIsActive(false);
          });
        } catch (err) {
          // Silent re-acquisition failure — not critical
          setError(err instanceof Error ? err.message : 'Failed to re-acquire wake lock');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const request = useCallback(async () => {
    if (!isSupported) {
      setError('Wake Lock API not supported on this device.');
      return;
    }

    try {
      // Release existing lock if any
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }

      wakeLockRef.current = await navigator.wakeLock.request('screen');
      shouldBeActiveRef.current = true;
      setIsActive(true);
      setError(null);

      // Listen for release (e.g. when tab becomes hidden)
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
        setIsActive(false);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request wake lock';
      setError(message);
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    shouldBeActiveRef.current = false;
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setIsActive(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release wake lock');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldBeActiveRef.current = false;
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  return {
    isSupported,
    isActive,
    error,
    request,
    release,
  };
}
