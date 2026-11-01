/**
 * AgentService: Autonomous Agent Brain & What-If Re-Planning Engine
 *
 * Crisis simulations:
 *   SIMULATE_FLOOD    — detects the selected (or first) flood-vulnerable site,
 *                       then routes to the nearest safe_haven by Haversine distance.
 *   SIMULATE_HEATWAVE — detects the selected (or first) heat-exposed site → nearest haven.
 *   SIMULATE_POLLUTION — water contamination → nearest dry safe haven.
 *   SIMULATE_STROLLER  — inaccessible site → nearest stroller-friendly site.
 */

import { calculateHaversineDistanceKm } from '../utils/geoUtils';

export class AgentService {
  /**
   * Evaluates a threat event. Fully deterministic, $0 cost, <5ms.
   * @param {string}     triggerEvent
   * @param {Array}      assetsDb    — full assets_db array
   * @param {number|null} selectedId — currently selected asset id (optional context)
   */
  static async evaluateThreat(triggerEvent, assetsDb, selectedId = null, onProgressLog = () => {}) {
    onProgressLog('[סוכן הטיולים] מנתח תרחיש... בודק מרחקים ואגני ניקוז.', 'info');
    return AgentService.evaluateLocalFailsafe(triggerEvent, assetsDb, selectedId);
  }

  /**
   * Returns the nearest safe_haven asset to fromAsset, with Haversine distance.
   * @returns {{ haven: object, distKm: number } | null}
   */
  static _findNearestSafeHaven(fromAsset, assetsDb) {
    const safeHavens = assetsDb.filter(
      (a) => a.category === 'safe_haven' || a.vulnerabilities?.includes('Safe Haven')
    );
    if (!safeHavens.length) return null;

    let nearest = null;
    let minDist = Infinity;
    for (const haven of safeHavens) {
      const dist = calculateHaversineDistanceKm(fromAsset.lat, fromAsset.lng, haven.lat, haven.lng);
      if (dist < minDist) { minDist = dist; nearest = haven; }
    }
    return nearest ? { haven: nearest, distKm: Math.round(minDist * 10) / 10 } : null;
  }

  /**
   * Deterministic local rule-based engine — all scenarios pick the affected site
   * dynamically: prefers the currently-selected asset if it matches the threat profile,
   * otherwise falls back to the first matching vulnerable site in the DB.
   */
  static evaluateLocalFailsafe(triggerEvent, assetsDb, selectedId = null) {

    // ── FLOOD / RAIN ──────────────────────────────────────────────────────────
    if (triggerEvent === 'SIMULATE_FLOOD') {
      const floodVulnerable = assetsDb.filter((a) =>
        a.vulnerabilities?.some((v) => v.includes('שיטפון') || v.includes('גשם'))
      );

      const selected = floodVulnerable.find((a) => a.id === selectedId);
      const affected = selected || floodVulnerable[0];
      if (!affected) return { error: true, reasoning_log: 'לא נמצאו אתרים עם חשיפה לשיטפונות במאגר.' };

      const result = AgentService._findNearestSafeHaven(affected, assetsDb);
      if (!result) return { error: true, reasoning_log: 'לא נמצא מקלט בטוח במאגר.' };

      const { haven, distKm } = result;
      const driveMin = Math.max(10, Math.round(distKm * 1.25));
      const res = {
        affected_trip_id: affected.id,
        new_status: 'REROUTED',
        fallback_asset_id: haven.id,
        confidence_score: 98,
        threat_type: 'Flash Flood Warning',
        hazard_label: 'גשם כבד — סכנת שיטפון בזק באגן הניקוז',
        distance_km: distKm,
        reasoning_log: `[סוכן הטיולים] זוהה גשם כבד באגן הניקוז של ${affected.name}. האתר נחסם אוטומטית. המקלט הבטוח הקרוב: ${haven.name} (${distKm} ק"מ, ~${driveMin} דקות נסיעה).`,
      };
      return { error: false, ...res, rawOutput: JSON.stringify(res, null, 2) };
    }

    // ── HEATWAVE ──────────────────────────────────────────────────────────────
    if (triggerEvent === 'SIMULATE_HEATWAVE') {
      const heatVulnerable = assetsDb.filter((a) =>
        a.vulnerabilities?.some((v) => v.includes('חום') || v.includes('שרב'))
      );
      const selected = heatVulnerable.find((a) => a.id === selectedId);
      const affected = selected || heatVulnerable[0] || assetsDb[0];

      const result = AgentService._findNearestSafeHaven(affected, assetsDb);
      const haven = result?.haven;
      const distKm = result?.distKm ?? 0;
      const driveMin = Math.max(10, Math.round(distKm * 1.25));
      const res = {
        affected_trip_id: affected.id,
        new_status: 'REROUTED',
        fallback_asset_id: haven?.id,
        confidence_score: 96,
        threat_type: 'Extreme Heatwave',
        hazard_label: 'עומס חום קיצוני — מעל 38°C ללא צל',
        distance_km: distKm,
        reasoning_log: `[סוכן הטיולים] טמפרטורה באתר ${affected.name} חורגת מסף עומס חום (38°C+). האתר נחסם. מקלט מוצל: ${haven?.name ?? 'לא נמצא'} (${distKm} ק"מ, ~${driveMin} דקות).`,
      };
      return { error: false, ...res, rawOutput: JSON.stringify(res, null, 2) };
    }

    // ── POLLUTION ─────────────────────────────────────────────────────────────
    if (triggerEvent === 'SIMULATE_POLLUTION') {
      const waterSites = assetsDb.filter((a) =>
        a.category === 'water' || a.type?.includes('מים')
      );
      const selected = waterSites.find((a) => a.id === selectedId);
      const affected = selected || waterSites[0] || assetsDb[0];

      const result = AgentService._findNearestSafeHaven(affected, assetsDb);
      const haven = result?.haven;
      const distKm = result?.distKm ?? 0;
      const res = {
        affected_trip_id: affected.id,
        new_status: 'REROUTED',
        fallback_asset_id: haven?.id,
        confidence_score: 95,
        threat_type: 'Water Contamination Advisory',
        hazard_label: 'זיהום מים פעיל (אזהרת משרד הבריאות)',
        distance_km: distKm,
        reasoning_log: `[סוכן הטיולים] אזהרת זיהום מים פעילה ב${affected.name}. האתר נחסם. מסלול יבש חלופי: ${haven?.name ?? 'לא נמצא'} (${distKm} ק"מ).`,
      };
      return { error: false, ...res, rawOutput: JSON.stringify(res, null, 2) };
    }

    // ── STROLLER (default) ────────────────────────────────────────────────────
    const nonAccessible = assetsDb.filter(
      (a) => !a.stroller_accessible && a.category !== 'safe_haven'
    );
    const selected = nonAccessible.find((a) => a.id === selectedId);
    const affected = selected || nonAccessible[0] || assetsDb[0];

    const strollerFriendly = assetsDb.filter((a) => a.stroller_accessible);
    const nearest = strollerFriendly.reduce((best, a) => {
      const d = calculateHaversineDistanceKm(affected.lat, affected.lng, a.lat, a.lng);
      return (!best || d < best.dist) ? { asset: a, dist: d } : best;
    }, null);

    const haven = nearest?.asset;
    const distKm = nearest ? Math.round(nearest.dist * 10) / 10 : 0;
    const res = {
      affected_trip_id: affected.id,
      new_status: 'REROUTED',
      fallback_asset_id: haven?.id,
      confidence_score: 97,
      threat_type: 'Stroller Accessibility Constraint',
      hazard_label: 'מסלול סלעי — לא מתאים לעגלות',
      distance_km: distKm,
      reasoning_log: `[סוכן הטיולים] ${affected.name} אינו נגיש לעגלות. הופנה למסלול הנגיש הקרוב: ${haven?.name ?? 'לא נמצא'} (${distKm} ק"מ).`,
    };
    return { error: false, ...res, rawOutput: JSON.stringify(res, null, 2) };
  }
}
