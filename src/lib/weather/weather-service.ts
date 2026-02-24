/**
 * Weather service for DreamBreeze.
 * Uses Open-Meteo free API — no API key required.
 * Fetches weather based on user's geolocation (with permission).
 */

export interface WeatherData {
  temperatureCelsius: number;
  humidity: number;
  feelsLike: number; // apparent temperature
  description: string;
  windSpeed: number;
  isNight: boolean;
  fetchedAt: number;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let _cache: { data: WeatherData; timestamp: number } | null = null;

function getWeatherDescription(code: number): string {
  // WMO Weather interpretation codes
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Light showers',
    81: 'Moderate showers',
    82: 'Violent showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] ?? 'Unknown';
}

export async function getWeather(): Promise<WeatherData | null> {
  // Check cache
  if (_cache && Date.now() - _cache.timestamp < CACHE_DURATION) {
    return _cache.data;
  }

  try {
    // Get user's location
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 600000, // 10min cache
      });
    });

    const { latitude, longitude } = position.coords;

    // Fetch from Open-Meteo (free, no API key)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

    const json = await res.json();
    const current = json.current;

    const data: WeatherData = {
      temperatureCelsius: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      feelsLike: current.apparent_temperature,
      description: getWeatherDescription(current.weather_code),
      windSpeed: current.wind_speed_10m,
      isNight: current.is_day === 0,
      fetchedAt: Date.now(),
    };

    _cache = { data, timestamp: Date.now() };
    return data;
  } catch (err) {
    console.warn('[DreamBreeze Weather] Failed to fetch:', err);
    return null;
  }
}

/** Get weather-based fan recommendation */
export function getWeatherFanRecommendation(weather: WeatherData): {
  speedAdjustment: number; // -20 to +20
  reasoning: string;
} {
  let adj = 0;
  const reasons: string[] = [];

  // Temperature-based
  if (weather.feelsLike > 35) {
    adj += 20;
    reasons.push(`Very hot (${weather.feelsLike.toFixed(0)}°C)`);
  } else if (weather.feelsLike > 30) {
    adj += 15;
    reasons.push(`Hot (${weather.feelsLike.toFixed(0)}°C)`);
  } else if (weather.feelsLike > 26) {
    adj += 8;
    reasons.push(`Warm (${weather.feelsLike.toFixed(0)}°C)`);
  } else if (weather.feelsLike < 18) {
    adj -= 15;
    reasons.push(`Cool (${weather.feelsLike.toFixed(0)}°C)`);
  } else if (weather.feelsLike < 22) {
    adj -= 5;
    reasons.push(`Comfortable (${weather.feelsLike.toFixed(0)}°C)`);
  }

  // Humidity-based
  if (weather.humidity > 80) {
    adj += 10;
    reasons.push(`High humidity (${weather.humidity}%)`);
  } else if (weather.humidity > 65) {
    adj += 5;
    reasons.push(`Moderate humidity (${weather.humidity}%)`);
  }

  return {
    speedAdjustment: Math.max(-20, Math.min(20, adj)),
    reasoning: reasons.join(', ') || 'Weather is comfortable',
  };
}

export function clearWeatherCache(): void {
  _cache = null;
}
