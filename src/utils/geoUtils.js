/**
 * geoUtils.js - Canonical Geospatial & Haversine Distance Calculations
 * 
 * Strict DRY implementation for great-circle spherical calculations in Israel grid.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate high-precision Haversine distance in kilometers between two coordinates.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in km rounded to 1 decimal place
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
      typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return 0;
  }

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((EARTH_RADIUS_KM * c) * 10) / 10;
}

/**
 * Backward-compatible alias for calculateHaversineDistanceKm
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  return calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
}

/**
 * Heuristic driving time estimation in minutes based on distance
 * @param {number} distKm 
 * @returns {number} estimated driving minutes
 */
export function estimateDriveMinutes(distKm) {
  if (!distKm || distKm <= 0) return 0;
  // Local Israeli roads factor (~48 km/h avg including urban exits / twists)
  return Math.max(10, Math.round(distKm * 1.25));
}
