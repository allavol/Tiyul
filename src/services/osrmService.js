/**
 * osrmService.js - Zero-cost open source routing
 * Uses the public OSRM Free API to calculate real drive times and distances
 * with memory caching, timeout safeguards, and Haversine fallback ($0 Cost).
 */

import { calculateHaversineDistanceKm, estimateDriveMinutes } from '../utils/geoUtils.js';

const TEL_AVIV_COORDS = { lat: 32.0853, lng: 34.7818, name: 'תל אביב' };
const OSRM_CACHE = new Map();

export const KNOWN_CITIES = {
  'תל אביב': { lat: 32.0853, lng: 34.7818, name: 'תל אביב' },
  'ירושלים': { lat: 31.7683, lng: 35.2137, name: 'ירושלים' },
  'חיפה': { lat: 32.7940, lng: 34.9896, name: 'חיפה' },
  'באר שבע': { lat: 31.2529, lng: 34.7915, name: 'באר שבע' },
  'ראשון לציון': { lat: 31.9730, lng: 34.7925, name: 'ראשון לציון' },
  'פתח תקווה': { lat: 32.0840, lng: 34.8878, name: 'פתח תקווה' },
  'נתניה': { lat: 32.3215, lng: 34.8532, name: 'נתניה' },
  'אשדוד': { lat: 31.8044, lng: 34.6553, name: 'אשדוד' },
  'רחובות': { lat: 31.8928, lng: 34.8113, name: 'רחובות' },
  'מודיעין': { lat: 31.8903, lng: 35.0104, name: 'מודיעין' },
  'הרצליה': { lat: 32.1663, lng: 34.8433, name: 'הרצליה' },
  'כפר סבא': { lat: 32.1750, lng: 34.9069, name: 'כפר סבא' },
  'רעננה': { lat: 32.1848, lng: 34.8708, name: 'רעננה' },
  'עפולה': { lat: 32.6078, lng: 35.2897, name: 'עפולה' },
  'טבריה': { lat: 32.7944, lng: 35.5312, name: 'טבריה' },
  'קריית שמונה': { lat: 33.2073, lng: 35.5721, name: 'קריית שמונה' },
  'אילת': { lat: 29.5577, lng: 34.9519, name: 'אילת' },
};

/**
 * Get current configured origin city name (defaults to 'תל אביב')
 */
export function getOriginCity() {
  try {
    return localStorage.getItem('tiyuli_origin_city') || 'תל אביב';
  } catch (e) {
    return 'תל אביב';
  }
}

/**
 * Persist origin city choice
 */
/**
 * Persist origin city choice and dispatch update event across components
 */
export function setOriginCity(city) {
  try {
    if (city) {
      localStorage.setItem('tiyuli_origin_city', city.trim());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tiyuli_origin_city_changed', { detail: { city: city.trim() } }));
      }
    }
  } catch (e) {}
}

/**
 * Calculate traffic multiplier based on hour of day in Israel
 * Reflects authentic Israeli peak congestion (Rush Hours)
 * @param {number|null} hour - 0 to 23 (or null for current hour)
 * @returns {{ multiplier: number, trafficStatus: string, trafficIcon: string, isPeak: boolean }}
 */
export function getTrafficFactor(hour = null) {
  const h = typeof hour === 'number' ? hour : new Date().getHours();

  // Peak morning rush: 07:00 - 09:30 (commuters into employment centers, Highways 1, 2, 4, 6, Ayalon)
  if (h >= 7 && h <= 9) {
    return {
      multiplier: 1.45, // +45% travel time
      trafficStatus: 'עומסי בוקר כבדים',
      trafficIcon: '🚗🚗',
      isPeak: true,
    };
  }

  // Peak evening rush: 16:00 - 19:30 (commuters heading home)
  if (h >= 16 && h <= 19) {
    return {
      multiplier: 1.40, // +40% travel time
      trafficStatus: 'עומסי תנועה של אחה״צ',
      trafficIcon: '🚗🚗',
      isPeak: true,
    };
  }

  // Midday: 10:00 - 15:30 (moderate/flowing traffic)
  if (h >= 10 && h <= 15) {
    return {
      multiplier: 1.05, // +5% standard traffic
      trafficStatus: 'תנועה זורמת',
      trafficIcon: '🟢',
      isPeak: false,
    };
  }

  // Early morning / night: 20:00 - 06:00 (free-flow highways)
  return {
    multiplier: 0.95, // fast highway flow
    trafficStatus: 'כבישים פנויים',
    trafficIcon: '🌙',
    isPeak: false,
  };
}

/**
 * Geocode origin city with local Israeli dictionary first, OSM Nominatim fallback ($0 Cost)
 */
export async function getOriginCoords(cityName) {
  const city = (cityName || getOriginCity()).trim();
  for (const [key, val] of Object.entries(KNOWN_CITIES)) {
    if (city.includes(key) || key.includes(city)) {
      return val;
    }
  }

  // Fallback to OSM Nominatim public free search
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', ישראל')}&limit=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: city };
      }
    }
  } catch (e) {}

  return TEL_AVIV_COORDS;
}

/**
 * Get drive time between any two points (origin -> destination)
 * @param {number} originLat 
 * @param {number} originLng 
 * @param {number} destLat 
 * @param {number} destLng 
 * @returns {Promise<{durationMins: number, distanceKm: number, source: string}>}
 */
export const getDriveTime = async (originLat, originLng, destLat, destLng) => {
  if (!originLat || !originLng || !destLat || !destLng) return null;

  const cacheKey = `${originLat.toFixed(3)},${originLng.toFixed(3)}->${destLat.toFixed(3)},${destLng.toFixed(3)}`;
  if (OSRM_CACHE.has(cacheKey)) {
    return OSRM_CACHE.get(cacheKey);
  }

  // OSRM coordinates format: longitude,latitude
  const coords = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const result = {
          durationMins: Math.round(route.duration / 60),
          distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
          source: 'OSRM Live Routing ($0)',
        };
        OSRM_CACHE.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Non-blocking fallback to mathematical road model
  }

  // Graceful deterministic fallback using Haversine * 1.25 winding factor
  const dist = calculateHaversineDistanceKm(originLat, originLng, destLat, destLng);
  const fallback = {
    durationMins: estimateDriveMinutes(dist),
    distanceKm: parseFloat(dist.toFixed(1)),
    source: 'חישוב מודל גיאוגרפי משוער',
  };
  OSRM_CACHE.set(cacheKey, fallback);
  return fallback;
};

/**
 * Get drive time from central Tel Aviv to any destination
 */
export const getDriveTimeFromTelAviv = async (destLat, destLng) => {
  return getDriveTime(TEL_AVIV_COORDS.lat, TEL_AVIV_COORDS.lng, destLat, destLng);
};

/**
 * Get drive time from configured origin city with hour-based traffic adjustment
 * @param {number} destLat
 * @param {number} destLng
 * @param {number|null} [targetHour=null] - hour of day (0-23) for diurnal traffic modeling
 */
export const getDriveTimeFromOrigin = async (destLat, destLng, targetHour = null) => {
  const origin = await getOriginCoords();
  const res = await getDriveTime(origin.lat, origin.lng, destLat, destLng);
  if (!res) return null;

  const traffic = getTrafficFactor(targetHour);
  const adjustedMins = Math.round(res.durationMins * traffic.multiplier);
  const trafficSuffix = traffic.isPeak ? ` (${traffic.trafficStatus} ${traffic.trafficIcon})` : '';

  return {
    ...res,
    baseDurationMins: res.durationMins,
    durationMins: adjustedMins,
    originName: origin.name,
    trafficStatus: traffic.trafficStatus,
    trafficIcon: traffic.trafficIcon,
    isPeak: traffic.isPeak,
    label: `~${adjustedMins} דק׳ מ${origin.name}${trafficSuffix}`,
    shortLabel: `~${adjustedMins} דק׳ מ${origin.name}`,
  };
};
