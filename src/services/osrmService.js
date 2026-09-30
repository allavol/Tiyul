/**
 * osrmService.js - Zero-cost open source routing
 * Uses the public OSRM Free API to calculate real drive times and distances
 * with memory caching, timeout safeguards, and Haversine fallback ($0 Cost).
 */

import { calculateHaversineDistanceKm, estimateDriveMinutes } from '../utils/geoUtils.js';

const TEL_AVIV_COORDS = { lat: 32.0853, lng: 34.7818 };
const OSRM_CACHE = new Map();

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
