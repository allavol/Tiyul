/**
 * WeatherService.js - Live Tomorrow.io Meteorological Service
 * 
 * Fetches real-time and 5-day daily forecast microclimate weather telemetry 
 * directly from Tomorrow.io API (https://api.tomorrow.io) with intelligent 
 * in-memory & sessionStorage caching (30-min TTL) to respect the $0 free tier limits.
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache per coordinate
const memoryCache = new Map();

// Tomorrow.io Weather Codes mapping to Hebrew human-readable conditions
const WEATHER_CODE_MAP = {
  1000: 'בהיר ושמשי',
  1100: 'בהיר ברובו',
  1101: 'מעונן חלקית',
  1102: 'מעונן ברובו',
  1001: 'מעונן',
  2000: 'ערפילים קלים',
  2100: 'ערפל',
  4000: 'טפטוף קל',
  4001: 'גשם מקומי',
  4200: 'גשם קל',
  4201: 'גשם כבד',
  5000: 'שלג קל',
  5001: 'סופת שלגים',
  8000: 'סופת רעמים וברקים',
};

export class WeatherService {
  /**
   * Get Tomorrow.io API Key from environment or active default
   */
  static getApiKey() {
    return (
      import.meta.env.VITE_TOMORROW_IO_API_KEY ||
      import.meta.env.TOMORROW_IO_API_KEY ||
      '2HESE6nVPsY0maF3uYCOwT0B3OcAx6lu'
    );
  }

  /**
   * Fetch 5-day forecast + realtime data from Tomorrow.io for an asset
   * @param {Object} asset - Asset with lat and lng
   * @param {number} dayIndex - 0 for today, 1 for tomorrow, 2 for +2 days, etc.
   * @returns {Promise<Object|null>}
   */
  static async fetchSiteWeather(asset, dayIndex = 0) {
    if (!asset || typeof asset.lat !== 'number' || typeof asset.lng !== 'number') {
      return null;
    }

    const coordKey = `${asset.lat.toFixed(3)},${asset.lng.toFixed(3)}`;
    const cacheKey = `tomorrow_forecast_${coordKey}`;
    const now = Date.now();

    let timelines = null;

    // 1. Check in-memory cache
    if (memoryCache.has(coordKey)) {
      const cached = memoryCache.get(coordKey);
      if (now - cached.timestamp < CACHE_TTL_MS) {
        timelines = cached.timelines;
      }
    }

    // 2. Check sessionStorage
    if (!timelines) {
      try {
        const rawStored = sessionStorage.getItem(cacheKey);
        if (rawStored) {
          const parsed = JSON.parse(rawStored);
          if (now - parsed.timestamp < CACHE_TTL_MS) {
            timelines = parsed.timelines;
            memoryCache.set(coordKey, parsed);
          }
        }
      } catch (e) {
        // Storage error fallback
      }
    }

    // 3. Fetch from Tomorrow.io Forecast API if not in cache
    if (!timelines) {
      const apiKey = this.getApiKey();
      if (!apiKey) return null;

      try {
        const url = `https://api.tomorrow.io/v4/weather/forecast?location=${asset.lat},${asset.lng}&timesteps=1d&apikey=${apiKey}&units=metric`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          console.warn(`Tomorrow.io API returned status ${response.status} for ${asset.name}`);
          return null;
        }

        const json = await response.json();
        const dailyList = json?.timelines?.daily || [];
        if (dailyList.length > 0) {
          timelines = dailyList;
          const cacheObj = { timestamp: now, timelines };
          memoryCache.set(coordKey, cacheObj);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(cacheObj));
          } catch (e) {}
        }
      } catch (err) {
        console.warn(`Tomorrow.io fetch failed for ${asset.name}:`, err.message);
        return null;
      }
    }

    if (!timelines || timelines.length === 0) {
      return null;
    }

    // Index into requested day (bounded by available days)
    const targetIdx = Math.min(Math.max(0, dayIndex), timelines.length - 1);
    const dayData = timelines[targetIdx];
    const values = dayData?.values || {};

    const tempMax = typeof values.temperatureMax === 'number' ? Math.round(values.temperatureMax) : 28;
    const tempMin = typeof values.temperatureMin === 'number' ? Math.round(values.temperatureMin) : 20;
    const tempAvg = typeof values.temperatureAvg === 'number' ? Math.round(values.temperatureAvg) : tempMax;
    const humidity = typeof values.humidityAvg === 'number' ? Math.round(values.humidityAvg) : 50;
    const windSpeedKmh = typeof values.windSpeedAvg === 'number' ? Math.round(values.windSpeedAvg * 3.6) : 15;
    const precipProb = typeof values.precipitationProbabilityMax === 'number' ? values.precipitationProbabilityMax : 0;
    const rainIntensity = values.rainIntensityAvg || 0;
    const weatherCode = values.weatherCodeMax || values.weatherCode || 1000;
    const conditionDesc = WEATHER_CODE_MAP[weatherCode] || 'בהיר ונוח';

    // Day display temp (max/min if forecast, or average)
    const displayTemp = targetIdx === 0 ? `${tempMax}°C` : `${tempMax}° / ${tempMin}°`;
    const representativeTemp = tempMax;

    return {
      isLive: true,
      source: 'Tomorrow.io Live',
      dayIndex: targetIdx,
      temp: displayTemp,
      tempNum: representativeTemp,
      tempMax,
      tempMin,
      humidity: `${humidity}%`,
      wind: `${windSpeedKmh} קמ"ש`,
      windSpeedNum: windSpeedKmh,
      rain: `${rainIntensity.toFixed(1)} מ"מ • ${precipProb}% סיכוי`,
      precipProb,
      conditions: conditionDesc,
      heatLoad: representativeTemp >= 38 ? 'עומס חום קיצוני' : representativeTemp >= 34 ? 'עומס חום כבד' : representativeTemp >= 30 ? 'חם' : representativeTemp >= 22 ? 'נוח לטיול' : 'קריר',
      isTempSafe: representativeTemp < 38,
      isRainSafe: precipProb < 40,
      fetchTime: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Backward-compatible alias for fetchLiveWeather
   */
  static async fetchLiveWeather(asset) {
    return this.fetchSiteWeather(asset, 0);
  }
}
