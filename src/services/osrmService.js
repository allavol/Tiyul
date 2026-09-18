/**
 * OSRM Service - Zero-cost open source routing
 * Uses the public OSRM API to calculate real drive times.
 */

const TEL_AVIV_COORDS = { lat: 32.0853, lng: 34.7818 };

export const getDriveTimeFromTelAviv = async (destLat, destLng) => {
  if (!destLat || !destLng) return null;
  
  // OSRM coordinates are expected in longitude,latitude order
  const coords = `${TEL_AVIV_COORDS.lng},${TEL_AVIV_COORDS.lat};${destLng},${destLat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        durationMins: Math.round(route.duration / 60),
        distanceKm: (route.distance / 1000).toFixed(1)
      };
    }
  } catch (err) {
    console.error("OSRM Route Error:", err);
  }
  return null;
};
