/**
 * WeatherService.js - Multi-Tier Zero-Cost Meteorological Service
 * 
 * Provides real-time and 5-day daily forecast microclimate weather telemetry
 * under a strict $0 operating policy:
 * 1. Tier 1: Tomorrow.io (only if custom VITE_TOMORROW_IO_API_KEY is supplied)
 * 2. Tier 2: Open-Meteo Live API (100% Free, NO API Key needed, 0$ cost, live Israeli weather)
 * 3. Tier 3: Deterministic Regional Simulation (Offline bunker fallback, 100% uptime)
 * 
 * Includes 30-min in-memory and sessionStorage caching.
 * Full transparency: provides `isLive`, `isSimulated`, `source`, and `badgeText`.
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache per coordinate
const memoryCache = new Map();

// Tomorrow.io Weather Codes mapping to Hebrew human-readable conditions
const TOMORROW_CODE_MAP = {
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

// WMO Weather interpretation codes (used by Open-Meteo)
const WMO_CODE_MAP = {
  0: 'בהיר ושמשי',
  1: 'בהיר ברובו',
  2: 'מעונן חלקית',
  3: 'מעונן',
  45: 'ערפל קל',
  48: 'ערפל כבד',
  51: 'טפטוף קל',
  53: 'טפטוף מתון',
  55: 'טפטוף צפוף',
  61: 'גשם קל',
  63: 'גשם מקומי',
  65: 'גשם כבד',
  71: 'שלג קל',
  73: 'שלג בינוני',
  75: 'שלג כבד',
  80: 'ממטרים קלים',
  81: 'ממטרים מתונים',
  82: 'ממטרים עזים',
  95: 'סופת רעמים וברקים',
  96: 'סופת רעמים עם ברד',
  99: 'סופת רעמים עזה',
};

export class WeatherService {
  /**
   * Get Tomorrow.io API Key from environment if explicitly provided
   */
  static getTomorrowApiKey() {
    try {
      const key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TOMORROW_IO_API_KEY) ||
                  (typeof process !== 'undefined' ? process.env?.VITE_TOMORROW_IO_API_KEY : '');
      if (key && key !== 'your_tomorrow_io_api_key_here' && key.trim().length > 10) {
        return key.trim();
      }
    } catch (e) {}
    return null;
  }

  /**
   * Fetch weather forecast using Open-Meteo (100% Free, No API Key, $0 Cost)
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<Array|null>} daily array of forecast items
   */
  static async fetchOpenMeteoForecast(lat, lng) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) return null;
      const data = await response.json();
      const daily = data?.daily;
      if (!daily || !daily.time || daily.time.length === 0) return null;

      const days = [];
      for (let i = 0; i < daily.time.length; i++) {
        days.push({
          source: 'Open-Meteo Live',
          tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 26),
          tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 18),
          precipProb: daily.precipitation_probability_max?.[i] ?? 0,
          windSpeedKmh: Math.round(daily.wind_speed_10m_max?.[i] ?? 15),
          weatherCode: daily.weather_code?.[i] ?? 0,
          conditionDesc: WMO_CODE_MAP[daily.weather_code?.[i]] || 'בהיר ונעים',
          humidity: 50,
        });
      }
      return days;
    } catch (err) {
      console.warn('Open-Meteo live fetch failed, using fallback:', err.message);
      return null;
    }
  }

  /**
   * Fetch from Tomorrow.io if custom key is present
   */
  static async fetchTomorrowForecast(lat, lng, apiKey) {
    try {
      const url = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lng}&timesteps=1d&apikey=${apiKey}&units=metric`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) return null;
      const json = await response.json();
      const dailyList = json?.timelines?.daily || [];
      if (dailyList.length === 0) return null;

      return dailyList.map(day => {
        const val = day.values || {};
        return {
          source: 'Tomorrow.io Live',
          tempMax: Math.round(val.temperatureMax ?? 28),
          tempMin: Math.round(val.temperatureMin ?? 20),
          precipProb: val.precipitationProbabilityMax ?? 0,
          windSpeedKmh: Math.round((val.windSpeedAvg ?? 4) * 3.6),
          weatherCode: val.weatherCodeMax || val.weatherCode || 1000,
          conditionDesc: TOMORROW_CODE_MAP[val.weatherCodeMax || val.weatherCode] || 'בהיר ונוח',
          humidity: Math.round(val.humidityAvg ?? 50),
        };
      });
    } catch (err) {
      console.warn('Tomorrow.io fetch failed:', err.message);
      return null;
    }
  }

  /**
   * Deterministic local fallback simulation when offline or disconnected
   */
  static getSimulatedForecast(asset, dayIndex = 0) {
    const lat = asset?.lat || 32.0;
    const lng = asset?.lng || 35.0;

    let baseTemp = 26;
    let precipProb = 10;
    let conditionDesc = 'בהיר ונוח';

    if (31.0 <= lat && lat <= 31.8 && 35.2 <= lng && lng <= 35.6) {
      // Dead sea / Judean desert
      baseTemp = 32;
      precipProb = 5;
    } else if (lat >= 33.0) {
      // Upper Galilee / Hermon
      baseTemp = 21;
      precipProb = 20;
    } else if (lat < 30.5) {
      // Eilat / Arava
      baseTemp = 35;
      precipProb = 0;
    }

    // Day variation
    const tempMax = baseTemp + (dayIndex * 1);
    const tempMin = Math.max(14, tempMax - 8);

    return {
      isLive: false,
      isSimulated: true,
      source: 'סימולציה דטרמיניסטית',
      badgeText: 'נתוני הדמיה (Offline Mode)',
      dayIndex,
      temp: dayIndex === 0 ? `${tempMax}°C` : `${tempMax}° / ${tempMin}°`,
      tempNum: tempMax,
      tempMax,
      tempMin,
      humidity: '50%',
      wind: '14 קמ"ש',
      windSpeedNum: 14,
      rain: `0.0 מ"מ • ${precipProb}% סיכוי`,
      precipProb,
      conditions: conditionDesc,
      heatLoad: tempMax >= 38 ? 'עומס חום קיצוני' : tempMax >= 34 ? 'עומס חום כבד' : tempMax >= 30 ? 'חם' : 'נוח לטיול',
      isTempSafe: tempMax < 38,
      isRainSafe: precipProb < 40,
      fetchTime: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Fetch 5-day forecast + realtime data for an asset
   * @param {Object} asset - Asset with lat and lng
   * @param {number} dayIndex - 0 for today, 1 for tomorrow, etc.
   * @returns {Promise<Object>}
   */
  static async fetchSiteWeather(asset, dayIndex = 0) {
    if (!asset || typeof asset.lat !== 'number' || typeof asset.lng !== 'number') {
      return this.getSimulatedForecast(asset, dayIndex);
    }

    const coordKey = `${asset.lat.toFixed(3)},${asset.lng.toFixed(3)}`;
    const cacheKey = `weather_forecast_${coordKey}`;
    const now = Date.now();

    let forecastDays = null;

    // 1. Check in-memory cache
    if (memoryCache.has(coordKey)) {
      const cached = memoryCache.get(coordKey);
      if (now - cached.timestamp < CACHE_TTL_MS) {
        forecastDays = cached.days;
      }
    }

    // 2. Check sessionStorage
    if (!forecastDays) {
      try {
        const rawStored = sessionStorage.getItem(cacheKey);
        if (rawStored) {
          const parsed = JSON.parse(rawStored);
          if (now - parsed.timestamp < CACHE_TTL_MS) {
            forecastDays = parsed.days;
            memoryCache.set(coordKey, parsed);
          }
        }
      } catch (e) {}
    }

    // 3. Fetch live data
    if (!forecastDays) {
      const tomorrowKey = this.getTomorrowApiKey();
      if (tomorrowKey) {
        forecastDays = await this.fetchTomorrowForecast(asset.lat, asset.lng, tomorrowKey);
      }

      // If no Tomorrow.io or it failed, use Open-Meteo Free Tier ($0 cost)
      if (!forecastDays) {
        forecastDays = await this.fetchOpenMeteoForecast(asset.lat, asset.lng);
      }

      if (forecastDays && forecastDays.length > 0) {
        const cacheObj = { timestamp: now, days: forecastDays };
        memoryCache.set(coordKey, cacheObj);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheObj));
        } catch (e) {}
      }
    }

    // 4. Return formatted data or fallback
    if (!forecastDays || forecastDays.length === 0) {
      return this.getSimulatedForecast(asset, dayIndex);
    }

    const targetIdx = Math.min(Math.max(0, dayIndex), forecastDays.length - 1);
    const dayData = forecastDays[targetIdx];

    const displayTemp = targetIdx === 0 ? `${dayData.tempMax}°C` : `${dayData.tempMax}° / ${dayData.tempMin}°`;
    const representativeTemp = dayData.tempMax;

    return {
      isLive: true,
      isSimulated: false,
      source: dayData.source || 'Open-Meteo Live',
      badgeText: `🟢 מזג אוויר חי (${dayData.source || 'Open-Meteo'})`,
      dayIndex: targetIdx,
      temp: displayTemp,
      tempNum: representativeTemp,
      tempMax: dayData.tempMax,
      tempMin: dayData.tempMin,
      humidity: `${dayData.humidity}%`,
      wind: `${dayData.windSpeedKmh} קמ"ש`,
      windSpeedNum: dayData.windSpeedKmh,
      rain: `${dayData.precipProb}% סיכוי למשקעים`,
      precipProb: dayData.precipProb,
      conditions: dayData.conditionDesc,
      heatLoad: representativeTemp >= 38 ? 'עומס חום קיצוני' : representativeTemp >= 34 ? 'עומס חום כבד' : representativeTemp >= 30 ? 'חם' : representativeTemp >= 22 ? 'נוח לטיול' : 'קריר',
      isTempSafe: representativeTemp < 38,
      isRainSafe: dayData.precipProb < 40,
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
