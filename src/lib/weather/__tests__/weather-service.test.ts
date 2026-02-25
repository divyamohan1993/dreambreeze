import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCoordinates, clearWeatherCache } from '../weather-service';

describe('getCoordinates', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearWeatherCache();
  });

  it('uses GPS when available and permitted', async () => {
    const mockPosition = {
      coords: { latitude: 28.6139, longitude: 77.2090 },
    };
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success: (pos: typeof mockPosition) => void) => success(mockPosition)),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });
    const coords = await getCoordinates();
    expect(coords).toEqual({ lat: 28.6139, lon: 77.2090 });
  });

  it('returns null when GPS denied and no IP fallback', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success: unknown, error: (err: Error) => void) => error(new Error('denied'))),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });
    // Mock fetch to fail (no IP fallback available)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const coords = await getCoordinates();
    expect(coords).toBeNull();
  });
});
