'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getWeather,
  getWeatherFanRecommendation,
  type WeatherData,
} from '@/lib/weather/weather-service';

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeather();
      setWeather(data);
      if (!data) setError('Could not get weather data');
    } catch {
      setError('Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const recommendation = weather ? getWeatherFanRecommendation(weather) : null;

  return { weather, loading, error, recommendation, refresh: fetchWeather };
}
