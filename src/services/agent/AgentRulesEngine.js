/**
 * AgentRulesEngine.js - Candidate Ranking, Diversity Selection & Clarification Rules
 * 
 * Part of Agent BAAL Architecture.
 * Applies multi-factor scoring (age safety, heat load, stroller check,
 * subregion keywords, attraction type bonus), cluster diversity selection,
 * and user clarification prompts.
 */

/**
 * Rank candidates by feature preference, proximity, age suitability, and keyword boosts
 * @param {Array<Object>} candidates - List of candidate hiking site assets
 * @param {Object} state - Current conversational session state
 * @param {string} [rawText=''] - Raw user message text
 * @returns {Array<Object>} Sorted list of ranked candidates
 */
export function rankCandidates(candidates, state, rawText = '') {
  const targetAge = Number(state.minAge) || 4;
  const activeSubRegion = state.subRegionKeyword || (
    (rawText.includes('מכתש') || rawText.includes('מכתשים') || rawText.includes('רמון') || rawText.includes('מנסרה')) ? 'crater' :
    (rawText.includes('יהב') || rawText.includes('עין יהב') || rawText.includes('ספיר') || rawText.includes('שיזף')) ? 'yahav' : null
  );

  return candidates.sort((a, b) => {
    const aTypes = (a.type || []).join(' ') + ' ' + (a.name || '');
    const bTypes = (b.type || []).join(' ') + ' ' + (b.name || '');

    let scoreA = 0;
    let scoreB = 0;

    // Primary nature attraction bonus vs facility / field school / base / night campground
    if (a.name.includes('בית ספר שדה') || aTypes.includes('חניון לילה')) scoreA -= 20;
    if (b.name.includes('בית ספר שדה') || bTypes.includes('חניון לילה')) scoreB -= 20;

    // Targeted subregion boosts
    if (activeSubRegion === 'crater') {
      if (aTypes.includes('מכתש') || a.name.includes('מכתש') || a.name.includes('רמון') || a.name.includes('מנסרה') || a.name.includes('יורקעם')) scoreA += 40;
      if (bTypes.includes('מכתש') || b.name.includes('מכתש') || b.name.includes('רמון') || b.name.includes('מנסרה') || b.name.includes('יורקעם')) scoreB += 40;
    } else if (activeSubRegion === 'yahav') {
      if (aTypes.includes('עין יהב') || a.name.includes('יהב') || a.name.includes('ספיר') || a.name.includes('שיזף')) scoreA += 40;
      if (bTypes.includes('עין יהב') || b.name.includes('יהב') || b.name.includes('ספיר') || b.name.includes('שיזף')) scoreB += 40;
    }

    // Explicit keyword boost if user mentioned site/stream/region name in current message
    if (rawText.includes('דליות') || rawText.includes('מג\'רסה') || rawText.includes('מג׳רסה') || rawText.includes('מגרסה')) {
      if (a.name.includes('דליות') || a.name.includes('מג׳רסה') || a.name.includes('מג\'רסה')) scoreA += 25;
      if (b.name.includes('דליות') || b.name.includes('מג׳רסה') || b.name.includes('מג\'רסה')) scoreB += 25;
    }
    if (rawText.includes('מכתש') || rawText.includes('מכתשים') || rawText.includes('רמון') || rawText.includes('מנסרה')) {
      if (aTypes.includes('מכתש') || a.name.includes('מכתש') || a.name.includes('רמון') || a.name.includes('מנסרה')) scoreA += 30;
      if (bTypes.includes('מכתש') || b.name.includes('מכתש') || b.name.includes('רמון') || b.name.includes('מנסרה')) scoreB += 30;
    }
    if (rawText.includes('יהב') || rawText.includes('עין יהב') || rawText.includes('ספיר') || rawText.includes('שיזף')) {
      if (aTypes.includes('עין יהב') || a.name.includes('יהב') || a.name.includes('ספיר')) scoreA += 30;
      if (bTypes.includes('עין יהב') || b.name.includes('יהב') || b.name.includes('ספיר')) scoreB += 30;
    }

    // Flagship regional nature pillars (when general South is selected without a specific subregion)
    if (state.region === 'south' && !activeSubRegion) {
      const isFlagshipSouth = (types, name) => (
        types.includes('מכתש') || types.includes('מכתשים') || name.includes('מכתש') || name.includes('רמון') || name.includes('המנסרה') ||
        types.includes('עין יהב') || types.includes('ערבה') || name.includes('יהב') || name.includes('ספיר') || name.includes('שיזף') ||
        name.includes('עין גדי')
      );
      if (isFlagshipSouth(aTypes, a.name)) scoreA += 15;
      if (isFlagshipSouth(bTypes, b.name)) scoreB += 15;
    }

    // Kid-friendly bonus for young kids (targetAge <= 5)
    if (targetAge <= 5) {
      if (a.stroller_accessible || aTypes.includes('חולות') || aTypes.includes('גשר עץ') || aTypes.includes('אגם') || aTypes.includes('מונגש') || a.min_age === 0) scoreA += 10;
      if (b.stroller_accessible || bTypes.includes('חולות') || bTypes.includes('גשר עץ') || bTypes.includes('אגם') || bTypes.includes('מונגש') || b.min_age === 0) scoreB += 10;
    }

    if (state.feature === 'water' || state.feature === 'spring') {
      if (aTypes.includes('מים') || aTypes.includes('בריכות') || aTypes.includes('מעיין') || aTypes.includes('שניר') || aTypes.includes('דן') || aTypes.includes('דליות') || aTypes.includes('מג׳רסה')) scoreA += 10;
      if (bTypes.includes('מים') || bTypes.includes('בריכות') || bTypes.includes('מעיין') || bTypes.includes('שניר') || bTypes.includes('דן') || bTypes.includes('דליות') || bTypes.includes('מג׳רסה')) scoreB += 10;
    }
    if (state.feature === 'shade') {
      if (aTypes.includes('חורש') || aTypes.includes('יער') || aTypes.includes('טבע') || aTypes.includes('כרמל') || aTypes.includes('מירון')) scoreA += 10;
      if (bTypes.includes('חורש') || bTypes.includes('יער') || bTypes.includes('טבע') || bTypes.includes('כרמל') || bTypes.includes('מירון')) scoreB += 10;
    }
    if (state.feature === 'adventure') {
      if (aTypes.includes('הרים') || aTypes.includes('אתגרי') || aTypes.includes('מצוק') || aTypes.includes('סנפלינג')) scoreA += 10;
      if (bTypes.includes('הרים') || bTypes.includes('אתגרי') || bTypes.includes('מצוק') || bTypes.includes('סנפלינג')) scoreB += 10;
    }
    if (state.feature === 'stroller') {
      if (a.stroller_accessible) scoreA += 15;
      if (b.stroller_accessible) scoreB += 15;
    }

    // Semantic Conceptual Boosts
    if (state.concept === 'picnic') {
      if (aTypes.includes('יער') || aTypes.includes('חניון') || aTypes.includes('פארק') || aTypes.includes('חורש')) scoreA += 15;
      if (bTypes.includes('יער') || bTypes.includes('חניון') || bTypes.includes('פארק') || bTypes.includes('חורש')) scoreB += 15;
    }
    if (state.concept === 'cool_haven') {
      if (aTypes.includes('מער') || aTypes.includes('גוברין') || aTypes.includes('חורש') || aTypes.includes('אלונים') || aTypes.includes('מוצל')) scoreA += 25;
      if (bTypes.includes('מער') || bTypes.includes('גוברין') || bTypes.includes('חורש') || bTypes.includes('אלונים') || bTypes.includes('מוצל')) scoreB += 25;
    }
    if (state.concept === 'wildlife') {
      if (aTypes.includes('צפרות') || aTypes.includes('אגם') || aTypes.includes('עופות') || a.name.includes('צבאים') || a.name.includes('גמלא') || a.name.includes('ציפורי ירושלים')) scoreA += 20;
      if (bTypes.includes('צפרות') || bTypes.includes('אגם') || bTypes.includes('עופות') || b.name.includes('צבאים') || b.name.includes('גמלא') || b.name.includes('ציפורי ירושלים')) scoreB += 20;
    }
    if (state.concept === 'sunset') {
      if (aTypes.includes('מצפור') || aTypes.includes('תצפית') || a.name.includes('שלום') || a.name.includes('בנטל') || a.name.includes('מונפורט') || a.name.includes('אפולוניה')) scoreA += 20;
      if (bTypes.includes('מצפור') || bTypes.includes('תצפית') || b.name.includes('שלום') || b.name.includes('בנטל') || b.name.includes('מונפורט') || b.name.includes('אפולוניה')) scoreB += 20;
    }
    if (state.concept === 'history') {
      if (aTypes.includes('ארכיאולוגיה') || aTypes.includes('עתיקות') || aTypes.includes('מבצר') || a.name.includes('בית גוברין') || a.name.includes('ציפורי') || a.name.includes('מצדה') || a.name.includes('נמרוד')) scoreA += 20;
      if (bTypes.includes('ארכיאולוגיה') || bTypes.includes('עתיקות') || bTypes.includes('מבצר') || b.name.includes('בית גוברין') || b.name.includes('ציפורי') || b.name.includes('מצדה') || b.name.includes('נמרוד')) scoreB += 20;
    }
    if (state.concept === 'blooming') {
      if (aTypes.includes('פריחה') || aTypes.includes('חורש') || aTypes.includes('אלונים') || a.name.includes('גמלא') || a.name.includes('אלוני אבא') || a.name.includes('גורן')) scoreA += 15;
      if (bTypes.includes('פריחה') || bTypes.includes('חורש') || bTypes.includes('אלונים') || b.name.includes('גמלא') || b.name.includes('אלוני אבא') || b.name.includes('גורן')) scoreB += 15;
    }
    if (state.concept === 'quiet') {
      if (aTypes.includes('מצפור') || aTypes.includes('חורש') || aTypes.includes('נוף') || a.name.includes('שלום') || a.name.includes('אודם') || a.name.includes('גמלא')) scoreA += 15;
      if (bTypes.includes('מצפור') || bTypes.includes('חורש') || bTypes.includes('נוף') || b.name.includes('שלום') || b.name.includes('אודם') || b.name.includes('גמלא')) scoreB += 15;
    }

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Distance tie-breaker
    if (a._distKm !== undefined && b._distKm !== undefined) {
      return a._distKm - b._distKm;
    }

    return 0;
  });
}

/**
 * Select diverse top candidates preventing repetitive single-cluster recommendations
 * @param {Array<Object>} candidates - Ranked candidate sites
 * @param {Object} state - Current conversational session state
 * @param {string} [rawText=''] - Raw user message text
 * @param {number} [limit=3] - Maximum number of diverse proposals to return
 * @returns {Array<Object>} Diverse selection of top candidate sites
 */
export function selectDiverseTopCandidates(candidates, state, rawText = '', limit = 3) {
  const activeSubRegion = state.subRegionKeyword || (
    (rawText.includes('מכתש') || rawText.includes('מכתשים') || rawText.includes('רמון') || rawText.includes('מנסרה')) ? 'crater' :
    (rawText.includes('יהב') || rawText.includes('עין יהב') || rawText.includes('ספיר') || rawText.includes('שיזף')) ? 'yahav' : null
  );

  const topSites = [];
  const seenClusters = new Set();

  for (const site of candidates) {
    const aTypes = (site.type || []).join(' ') + ' ' + (site.name || '');
    let clusterKey = site.name;

    if (!activeSubRegion) {
      if (site.name.includes('עין גדי') || aTypes.includes('מדבר יהודה') || aTypes.includes('ים המלח')) {
        clusterKey = 'dead_sea_oasis';
      } else if (site.name.includes('רמון') || aTypes.includes('מכתש') || aTypes.includes('מכתשים') || site.name.includes('המנסרה') || site.name.includes('יורקעם')) {
        clusterKey = 'crater_region';
      } else if (site.name.includes('יהב') || site.name.includes('ספיר') || aTypes.includes('ערבה') || aTypes.includes('עין יהב')) {
        clusterKey = 'arava_yahav';
      }
    } else {
      if (site.name.includes('עין גדי')) clusterKey = 'ein_gedi';
      else if (site.name.includes('מנסרה') || site.name.includes('צבעי מכתש רמון')) clusterKey = 'ramon_boardwalk';
      else if (site.name.includes('סהרונים')) clusterKey = 'ramon_saharonim';
      else if (site.name.includes('המכתש הגדול')) clusterKey = 'great_crater';
      else if (site.name.includes('ספיר')) clusterKey = 'sapir';
      else if (site.name.includes('שיזף') || site.name.includes('מצפור השלום')) clusterKey = 'shizaf';
    }

    if (site.name.includes('דן')) clusterKey = 'tel_dan';
    if (site.name.includes('שניר')) clusterKey = 'snir';
    
    if (!seenClusters.has(clusterKey)) {
      seenClusters.add(clusterKey);
      topSites.push(site);
    }
    if (topSites.length === limit) break;
  }

  if (topSites.length < limit) {
    for (const site of candidates) {
      if (!topSites.some((s) => s.id === site.id)) {
        topSites.push(site);
      }
      if (topSites.length === limit) break;
    }
  }

  return topSites;
}

/**
 * Generate gentle, polite clarification prompt with quick-reply buttons
 * @param {string} targetField - Target missing parameter ('region' | 'timing' | 'minAge' | 'feature')
 * @param {Object} state - Current conversational session state
 * @param {Array<string>} allMissing - All missing mandatory parameters
 * @returns {{text: string, state: Object, options: Array<{label: string, value: string, field: string}>, proposals: Array, toolActivity: null}}
 */
export function generateClarificationResponse(targetField, state, allMissing) {
  let text = '';
  let options = [];

  const knownParts = [];
  if (state.timingLabel) knownParts.push(`📅 **מועד:** ${state.timingLabel}`);
  if (state.regionLabel) knownParts.push(`📍 **אזור:** ${state.regionLabel}`);
  if (state.minAgeLabel) knownParts.push(`👶 **גיל צעיר:** ${state.minAgeLabel}`);
  if (state.featureLabel) knownParts.push(`💧 **סגנון:** ${state.featureLabel}`);

  const summaryPrefix = knownParts.length > 0 
    ? `מעולה, רשמתי לפניי:\n${knownParts.join(' • ')}\n\n` 
    : '';

  switch (targetField) {
    case 'region':
      text = `${summaryPrefix}באיזה **אזור בארץ** תרצו לטייל? 🗺️`;
      options = [
        { label: '🏞️ צפון (גליל וגולן)', value: 'באזור הצפון', field: 'region' },
        { label: '🌾 מרכז והשרון', value: 'באזור המרכז והשרון', field: 'region' },
        { label: '🏰 ירושלים והשפלה', value: 'באזור ירושלים והשפלה', field: 'region' },
        { label: '🏜️ דרום וים המלח', value: 'באזור הדרום וים המלח', field: 'region' },
        { label: '🎲 לא משנה לי / כל הארץ', value: 'לא משנה לי האזור, בכל הארץ', field: 'region' },
      ];
      break;

    case 'timing':
      text = `${summaryPrefix}**מתי** אתם מתכננים לצאת למסלול? 📅`;
      options = [
        { label: '☀️ היום', value: 'מתכננים להיום', field: 'timing' },
        { label: '🌅 מחר', value: 'מתכננים למחר', field: 'timing' },
        { label: '📆 מחרתיים', value: 'מתכננים למחרתיים', field: 'timing' },
        { label: '🏕️ סוף השבוע (שבת)', value: 'מתכננים לסוף השבוע', field: 'timing' },
        { label: '🎲 לא משנה לי התאריך', value: 'לא משנה לי התאריך, בימים הקרובים', field: 'timing' },
      ];
      break;

    case 'minAge':
      text = `${summaryPrefix}מה **גיל המטייל הצעיר ביותר** שמצטרף אליכם? 👶`;
      options = [
        { label: '👶 0+ (תינוק / עגלה)', value: 'מטיילים עם עגלה ותינוק 0+', field: 'minAge' },
        { label: '🧒 4+ (ילדים קטנים)', value: 'הילד הצעיר בן 4', field: 'minAge' },
        { label: '🧗 7+ (ילדים בוגרים)', value: 'הילד הצעיר בן 7', field: 'minAge' },
        { label: '🧗‍♂️ 10+ (נוער / מבוגרים)', value: 'כולם בני 10 ומעלה', field: 'minAge' },
        { label: '🎲 לכל הגילאים / לא משנה', value: 'לכל הגילאים, מתאים לכולם', field: 'minAge' },
      ];
      break;

    case 'feature':
      text = `${summaryPrefix}איזה **סגנון מסלול** הכי מתאים לכם? 🌿`;
      options = [
        { label: '💧 הליכה בתוך המים', value: 'רוצים מסלול רטוב עם הליכה במים', field: 'feature' },
        { label: '🏊‍♂️ מעיין / בריכת שכשוך', value: 'מחפשים מעיין או בריכה נעימה', field: 'feature' },
        { label: '🌲 יער מוצל וקריר', value: 'מעדיפים יער מוצל ושבילי הליכה', field: 'feature' },
        { label: '🧗 סנפלינג / מסלול אתגרי', value: 'מחפשים סנפלינג או מסלול אתגרי', field: 'feature' },
        { label: '🏰 תצפית ועתיקות', value: 'מעוניינים בתצפית נוף ואתר היסטורי', field: 'feature' },
        { label: '✨ גם וגם / שילוב סגנונות', value: 'מעדיפים שילוב של מים, צל ונוף - גם וגם', field: 'feature' },
        { label: '🎲 לא משנה לי / הכל מתאים', value: 'לא משנה לי סגנון המסלול, מה שהכי מומלץ ובטוח', field: 'feature' },
      ];
      break;
  }

  return {
    text,
    state,
    options,
    proposals: [],
    toolActivity: null,
  };
}

/**
 * Build explainable rationale (XAI) for site cards
 * @param {Object} site - Candidate site asset
 * @param {Object} state - Current conversational session state
 * @param {Object} [weather] - Weather telemetry object
 * @returns {string} Human-readable Hebrew explainable rationale string
 */
export function buildRationale(site, state, weather) {
  const parts = [];
  const city = state.originCity || state.originName;
  if (site._distKm !== undefined && city) {
    const driveMins = site._driveMinutes || Math.max(10, Math.round(site._distKm * 1.25));
    if (driveMins >= 60) {
      const hours = Math.floor(driveMins / 60);
      const mins = driveMins % 60;
      parts.push(`🚗 כ-${hours} שע' ו-${mins} דק' נסיעה מ${city} (${site._distKm} ק"מ)`);
    } else {
      parts.push(`🚗 כ-${driveMins} דק' נסיעה מ${city} (${site._distKm} ק"מ)`);
    }
  }

  if (site.stroller_accessible || site.min_age === 0) {
    parts.push('נגיש לעגלות ושביל סלול ובטוח');
  } else {
    parts.push(`מתאים בול לגילאי ${site.min_age}+`);
  }

  if (weather) {
    parts.push(`${weather.temp} (${weather.conditions}) ב-Tomorrow.io`);
  }

  if (site.type?.includes('מים') || site.type?.includes('בריכות')) {
    parts.push('כולל גישה נוחה למים ושכשוך');
  } else if (site.type?.includes('חורש') || site.type?.includes('יער')) {
    parts.push('מסלול עשיר בצל טבעי');
  }

  return parts.join(' • ');
}
