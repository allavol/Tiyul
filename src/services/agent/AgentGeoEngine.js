/**
 * AgentGeoEngine.js - Spatial Intelligence, Israeli City Geocoding & Distance Engine
 * 
 * Part of Agent BAAL Architecture ($0 Operating Cost).
 * Handles Israeli origin cities, coordinates, distance radius calculations,
 * and zero-cost OpenStreetMap Nominatim geocoding.
 */

import { calculateHaversineDistanceKm } from '../../utils/geoUtils.js';

export { calculateHaversineDistanceKm } from '../../utils/geoUtils.js';

// Known Israeli origin cities / centers for distance radius queries
export const KNOWN_ORIGIN_CITIES = [
  // Gush Dan & Center
  { names: ['פתח תקווה', 'פתח תקוה', 'פתח תיקווה', 'פתח תיקוה', 'פ"ת', 'פ״ת', 'בקעת אונו'], lat: 32.0840, lng: 34.8878, label: 'פתח תקווה', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['תל אביב', 'תל-אביב', 'ת"א', 'ת״א', 'גוש דן', 'תל אביב יפו'], lat: 32.0853, lng: 34.7818, label: 'תל אביב', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['רמת גן', 'גבעתיים', 'בני ברק', 'קריית אונו', 'גני תקווה'], lat: 32.0684, lng: 34.8248, label: 'רמת גן/גוש דן', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['חולון', 'בת ים'], lat: 32.0158, lng: 34.7874, label: 'חולון/בת ים', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['היישוב אזור', 'מועצה מקומית אזור', 'צומת אזור'], lat: 32.0242, lng: 34.8056, label: 'אזור', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['ראשון לציון', 'ראשל"צ', 'ראשל״צ'], lat: 31.9730, lng: 34.7925, label: 'ראשון לציון', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון', 'רמת השרון'], lat: 32.1663, lng: 34.8433, label: 'הרצליה/שרון דרומי', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['ראש העין', 'אפק', 'מגדל צדק'], lat: 32.0956, lng: 34.9566, label: 'ראש העין', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['רחובות', 'נס ציונה', 'יבנה'], lat: 31.8928, lng: 34.8113, label: 'רחובות', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['לוד', 'רמלה', 'שוהם', 'בן שמן'], lat: 31.9514, lng: 34.8881, label: 'לוד/רמלה/שפלה', region: 'center', regionLabel: 'מרכז והשפלה' },
  { names: ['מודיעין', 'מודיעין מכבים רעות', 'מכבים', 'רעות'], lat: 31.8903, lng: 35.0104, label: 'מודיעין', region: 'jerusalem', regionLabel: 'ירושלים והשפלה' },

  // Sharon & Coastal Plain
  { names: ['נתניה', 'עמק חפר', 'כפר יונה'], lat: 32.3215, lng: 34.8532, label: 'נתניה', region: 'center', regionLabel: 'מרכז והשרון' },
  { names: ['חדרה', 'אור עקיבא', 'פרדס חנה', 'כרכור'], lat: 32.4340, lng: 34.9197, label: 'חדרה/פרדס חנה', region: 'center', regionLabel: 'השרון הצפוני' },
  { names: ['קיסריה'], lat: 32.5000, lng: 34.9000, label: 'קיסריה', region: 'haifa_carmel', regionLabel: 'חוף הכרמל' },
  { names: ['זכרון יעקב', 'זיכרון יעקב', 'זכרון', 'בנימינה', 'גבעת עדה'], lat: 32.5707, lng: 34.9525, label: 'זכרון יעקב/בנימינה', region: 'haifa_carmel', regionLabel: 'חוף הכרמל ורמת מנשה' },

  // Haifa & North
  { names: ['חיפה', 'הקריות', 'קריות', 'נשר', 'טירת כרמל'], lat: 32.7940, lng: 34.9896, label: 'חיפה', region: 'north', regionLabel: 'צפון (חיפה והכרמל)' },
  { names: ['עכו', 'נהריה', 'שלומי', 'גליל מערבי'], lat: 33.0059, lng: 35.0941, label: 'נהריה/עכו', region: 'north', regionLabel: 'צפון (גליל מערבי)' },
  { names: ['כרמיאל', 'משגב', 'סכנין', 'מעלות'], lat: 32.9199, lng: 35.2957, label: 'כרמיאל', region: 'north', regionLabel: 'צפון (גליל מרכזי)' },
  { names: ['נצרת', 'נוף הגליל', 'מגדל העמק'], lat: 32.6996, lng: 35.3035, label: 'נצרת', region: 'north', regionLabel: 'צפון (עמקים וגליל תחתון)' },
  { names: ['עפולה', 'עמק יזרעאל', 'יזרעאל', 'בית שאן'], lat: 32.6078, lng: 35.2894, label: 'עפולה/עמקים', region: 'north', regionLabel: 'צפון (עמק יזרעאל ובית שאן)' },
  { names: ['טבריה', 'סובב כנרת'], lat: 32.7922, lng: 35.5312, label: 'טבריה/כנרת', region: 'north', regionLabel: 'צפון (טבריה וסובב כנרת)' },
  { names: ['צפת', 'ראש פינה', 'חצור הגלילית', 'מירון'], lat: 32.9646, lng: 35.4960, label: 'צפת/גליל עליון', region: 'north', regionLabel: 'צפון (גליל עליון)' },
  { names: ['קריית שמונה', 'קרית שמונה', 'אצבע הגליל', 'מטולה', 'דפנה'], lat: 33.2073, lng: 35.5721, label: 'קריית שמונה', region: 'north', regionLabel: 'צפון (אצבע הגליל)' },
  { names: ['קצרין', 'מג\'דל שמס', 'מגדל שמס'], lat: 32.9934, lng: 35.6908, label: 'קצרין', region: 'north', regionLabel: 'צפון (רמת הגולן)' },

  // Jerusalem & Judea
  { names: ['ירושלים', 'בירה', 'מבשרת ציון', 'מעלה אדומים'], lat: 31.7683, lng: 35.2137, label: 'ירושלים', region: 'jerusalem', regionLabel: 'ירושלים והסביבה' },
  { names: ['בית שמש', 'מטה יהודה', 'שפלת יהודה'], lat: 31.7470, lng: 34.9881, label: 'בית שמש/שפלה', region: 'jerusalem', regionLabel: 'ירושלים ושפלת יהודה' },
  { names: ['אריאל'], lat: 32.1044, lng: 35.1744, label: 'אריאל', region: 'center', regionLabel: 'מרכז ושומרון' },
  { names: ['גוש עציון', 'אפרת'], lat: 31.6500, lng: 35.1500, label: 'גוש עציון', region: 'jerusalem', regionLabel: 'ירושלים וגוש עציון' },

  // South & Negev
  { names: ['אשדוד'], lat: 31.8044, lng: 34.6553, label: 'אשדוד', region: 'center', regionLabel: 'מישור החוף הדרומי' },
  { names: ['אשקלון'], lat: 31.6688, lng: 34.5743, label: 'אשקלון', region: 'south', regionLabel: 'דרום (מישור החוף הדרומי)' },
  { names: ['קריית גת', 'קרית גת', 'שדרות', 'נתיבות', 'אופקים', 'עוטף עזה'], lat: 31.6100, lng: 34.7600, label: 'קריית גת/צפון הנגב', region: 'south', regionLabel: 'דרום (צפון הנגב)' },
  { names: ['באר שבע', 'באר-שבע', 'ב"ש', 'ב״ש'], lat: 31.2529, lng: 34.7915, label: 'באר שבע', region: 'south', regionLabel: 'דרום ומרכז הנגב' },
  { names: ['דימונה', 'ירוחם'], lat: 31.0700, lng: 35.0300, label: 'דימונה/ירוחם', region: 'south', regionLabel: 'דרום (מרכז הנגב)' },
  { names: ['ערד'], lat: 31.2589, lng: 35.2128, label: 'ערד', region: 'south', regionLabel: 'דרום (ערד וים המלח)' },
  { names: ['מצפה רמון', 'רמון'], lat: 30.6100, lng: 34.8015, label: 'מצפה רמון', region: 'south', regionLabel: 'דרום (הר הנגב ומכתש רמון)' },
  { names: ['אילת'], lat: 29.5577, lng: 34.9519, label: 'אילת', region: 'south', regionLabel: 'דרום (אילת והערבה הדרומית)' },
];

export const DYNAMIC_CITY_CACHE = new Map();

/**
 * Resolve city coordinates with $0 open fallback (Nominatim OpenStreetMap)
 * @param {string} name - City or location name in Hebrew
 * @returns {Promise<{label: string, lat: number, lng: number, region: string, regionLabel: string} | null>}
 */
export async function geocodeCity(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim().toLowerCase().replace(/^(ב|מ|ל|מאיזור|מאזור|באזור|באיזור|ליד|קרוב ל)\s*/, '');
  
  if (DYNAMIC_CITY_CACHE.has(clean)) {
    return DYNAMIC_CITY_CACHE.get(clean);
  }
  
  for (const c of KNOWN_ORIGIN_CITIES) {
    if (c.names.some((n) => clean.includes(n) || n.includes(clean))) {
      const res = { label: c.label, lat: c.lat, lng: c.lng, region: c.region, regionLabel: c.regionLabel };
      DYNAMIC_CITY_CACHE.set(clean, res);
      return res;
    }
  }

  // OpenStreetMap Nominatim Free Geocoder fallback ($0 Cost, Open Data)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=il&accept-language=he&limit=1&q=${encodeURIComponent(clean)}`;
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Tiyul-Spatial-Agent/1.0' },
    });
    clearTimeout(timeout);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        let region = 'center';
        let regionLabel = 'מרכז והשרון';
        if (lat >= 32.5) { region = 'north'; regionLabel = 'צפון (גליל וגולן)'; }
        else if (lat >= 31.7 && lat <= 31.95 && lng >= 34.95) { region = 'jerusalem'; regionLabel = 'ירושלים והשפלה'; }
        else if (lat < 31.6) { region = 'south'; regionLabel = 'דרום ונגב'; }
        
        const res = {
          label: item.display_name?.split(',')[0]?.trim() || clean,
          lat,
          lng,
          region,
          regionLabel,
        };
        DYNAMIC_CITY_CACHE.set(clean, res);
        return res;
      }
    }
  } catch (e) {
    // Non-blocking fallback
  }

  return null;
}

/**
 * Filter candidates by geographic boundaries or distance radius
 * @param {Array<Object>} candidates - Candidate hiking site assets
 * @param {Object} state - Current conversational session state
 * @returns {Array<Object>} Filtered candidate assets
 */
export function filterCandidatesByGeo(candidates, state) {
  return candidates.filter((site) => {
    // 1. Strict regional boundary check
    if (state.region && state.region !== 'all' && state.region !== 'radius') {
      if (state.region === 'north' && site.region_group !== 'north' && site.region_group !== 'haifa_carmel') return false;
      if (state.region === 'center' && site.region_group !== 'center') return false;
      if (state.region === 'jerusalem' && site.region_group !== 'jerusalem') return false;
      if (state.region === 'south' && site.region_group !== 'south') return false;
    }

    // 2. Distance radius calculation and filter
    if (state.originCoords) {
      const [oLat, oLng] = state.originCoords;
      const sLat = site.location ? site.location.lat : site.lat;
      const sLng = site.location ? site.location.lng : site.lng;
      const dist = calculateHaversineDistanceKm(oLat, oLng, sLat, sLng);
      site._distKm = dist;
      site._driveMinutes = Math.max(10, Math.round(dist * 1.25));

      if (state.region === 'radius' && state.maxDistanceKm && dist > state.maxDistanceKm) {
        return false;
      }
    }
    return true;
  });
}
