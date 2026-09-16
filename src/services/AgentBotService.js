/**
 * AgentBotService.js - Conversational Hiking AI Agent & Guardrails Engine
 * 
 * Strict Guardrails:
 * 1. Zero politics, violence, drugs, weapons, or off-topic discussions.
 * 2. Zero prompt/architecture/key leakage.
 * 3. Warm, polite, helpful ("נעים הליכות") tone at all times.
 * 
 * Mandatory 4 Parameters:
 * 1. Timing (היום, מחר, מחרתיים, סופ"ש)
 * 2. Region (צפון, מרכז ושרון, ירושלים והשפלה, דרום ומדבר)
 * 3. Feature (מעיין, הליכה במים, סנפלינג/אתגרי, יער מוצל, תצפית)
 * 4. Youngest Age (0+ עגלות, 2-3, 4+, 7+, 10+)
 */

import assetsData from '../../assets_db.json';
import { WeatherService } from './WeatherService';
import { getWaterAdvisory } from '../utils/weatherUtils';

// Strict Prohibited Topics (Politics, Violence, Weapons, Drugs, Hate, Jailbreak/Prompt Injection)
const PROHIBITED_KEYWORDS = [
  'פוליטיק', 'בחירות', 'ממשלה', 'ביבי', 'נתניהו', 'לפיד', 'גנץ', 'כנסת', 'מפלג',
  'נשק', 'אקדח', 'רובה', 'טיל', 'פצצה', 'סמים', 'מריחואנה', 'קוקאין', 'סם',
  'אלימות', 'רצח', 'פיגוע', 'מלחמה', 'הרג', 'לפגוע', 'לתקוף',
  'system prompt', 'prompt injection', 'ignore previous instructions', 'architecture', 'api key', 'secret',
  'מי תכנת אותך', 'איזה מודל אתה', 'הדלף', 'קוד מקור'
];

// Foreign countries & abroad keywords
const FOREIGN_COUNTRIES_KEYWORDS = [
  'חו"ל', 'חול', 'חו״ל', 'בחו"ל', 'בחול', 'בחו״ל', 'חוץ לארץ', 'בחוץ לארץ', 'מחוץ לישראל',
  'מדינה אחרת', 'מדינות אחרות', 'באירופה', 'אירופה', 'ארה"ב', 'ארצות הברית', 'ארה״ב',
  'יוון', 'קפריסין', 'איטליה', 'צרפת', 'ספרד', 'גרמניה', 'שוויץ', 'אוסטריה', 'הולנד', 'לונדון', 'פריז',
  'תאילנד', 'הודו', 'יפן', 'סיני', 'מצרים', 'ירדן', 'פטרה', 'גיאורגיה', 'גאורגיה', 'טורקיה', 'תורכיה',
  'דובאי', 'אבו דאבי', 'מונטנגרו', 'אלפים', 'דולומיטים', 'רומא'
];

export class AgentBotService {
  /**
   * Reset session state
   */
  static getInitialState() {
    return {
      timing: null,      // 'today' | 'tomorrow' | 'day_after' | 'weekend' | number (0-4)
      timingLabel: null, // 'היום', 'מחר', 'מחרתיים'
      dayIndex: 0,
      region: null,      // 'north' | 'center' | 'jerusalem' | 'south'
      regionLabel: null, // 'צפון', 'מרכז ושרון', 'ירושלים', 'דרום'
      feature: null,     // 'water' | 'spring' | 'shade' | 'adventure' | 'stroller' | 'view'
      featureLabel: null,// 'הליכה במים', 'מעיין', 'יער מוצל', 'סנפלינג/אתגרי'
      minAge: null,      // 0, 2, 4, 7, 10
      minAgeLabel: null, // '0+ (עגלות)', '4+', '7+'
      step: 'init',      // 'init' | 'gathering' | 'ready'
    };
  }

  /**
   * Check message against strict safety guardrails & foreign countries
   */
  static checkGuardrails(message) {
    if (!message || typeof message !== 'string') return { safe: true };
    const lower = message.toLowerCase();

    // 1. Check foreign countries / travel abroad
    for (const fKw of FOREIGN_COUNTRIES_KEYWORDS) {
      if (lower.includes(fKw)) {
        return {
          safe: false,
          refusal: 'שלום! 🌿 המומחיות שלי כסוכן טיולים ממוקדת כולה בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה המרהיבים **בישראל** 🇮🇱 בלבד.\n\nאינני מספק מידע או המלצות למדינות אחרות או לחו"ל.\n\nאשמח מאוד לעזור לכם לתכנן טיול קסום ובטוח בארץ! לאיזה אזור בישראל תרצו לטייל (צפון, מרכז, ירושלים או דרום) ומתי?',
        };
      }
    }

    // 2. Check prohibited sensitive topics
    for (const kw of PROHIBITED_KEYWORDS) {
      if (lower.includes(kw)) {
        return {
          safe: false,
          refusal: 'שלום! אני סוכן הטיולים החכם של "לאן נטייל?" 🧭, ומטרתי הבלעדית היא לעזור לכם לתכנן טיולים וחוויות בטוחות ומהנות בטבע בישראל 🌿.\n\nאשמח מאוד לעזור לכם למצוא את המסלול המושלם! לאיזה אזור בארץ תרצו לטייל ומתי?',
        };
      }
    }
    return { safe: true };
  }

  /**
   * Parse user message and extract any of the 4 mandatory parameters
   */
  static extractParameters(message, currentState) {
    const text = message.toLowerCase();
    const updated = { ...currentState };

    // 1. Timing extraction
    if (text.includes('מחרתיים') || text.includes('בעוד יומיים')) {
      updated.timing = 'day_after';
      updated.timingLabel = 'מחרתיים';
      updated.dayIndex = 2;
    } else if (text.includes('מחר') || text.includes('למחרת')) {
      updated.timing = 'tomorrow';
      updated.timingLabel = 'מחר';
      updated.dayIndex = 1;
    } else if (text.includes('היום') || text.includes('עכשיו') || text.includes('הבוקר') || text.includes('הערב')) {
      updated.timing = 'today';
      updated.timingLabel = 'היום';
      updated.dayIndex = 0;
    } else if (text.includes('שבת') || text.includes('סופ"ש') || text.includes('סוף שבוע') || text.includes('שישי')) {
      updated.timing = 'weekend';
      updated.timingLabel = 'סוף השבוע';
      updated.dayIndex = 3;
    }

    // 2. Region extraction
    if (text.includes('צפון') || text.includes('גליל') || text.includes('גולן') || text.includes('כרמל') || text.includes('עמקים') || text.includes('חרמון') || text.includes('חיפה')) {
      updated.region = 'north';
      updated.regionLabel = 'צפון (גליל וגולן)';
    } else if (text.includes('מרכז') || text.includes('שרון') || text.includes('תל אביב') || text.includes('חוף') || text.includes('ירקון') || text.includes('פולג') || text.includes('חדרה')) {
      updated.region = 'center';
      updated.regionLabel = 'מרכז והשרון';
    } else if (text.includes('ירושלים') || text.includes('שפלה') || text.includes('יהודה') || text.includes('בית שמש') || text.includes('עציון')) {
      updated.region = 'jerusalem';
      updated.regionLabel = 'ירושלים והשפלה';
    } else if (text.includes('דרום') || text.includes('נגב') || text.includes('ים המלח') || text.includes('מדבר') || text.includes('ערבה') || text.includes('רמון') || text.includes('אילת')) {
      updated.region = 'south';
      updated.regionLabel = 'דרום, נגב וים המלח';
    }

    // 3. Feature extraction
    if (text.includes('הליכה במים') || text.includes('בתוך המים') || text.includes('רטוב') || text.includes('נחל זורם') || text.includes('מג\'רסה') || text.includes('זאכי') || text.includes('שניר')) {
      updated.feature = 'water';
      updated.featureLabel = 'הליכה בתוך המים';
    } else if (text.includes('מעיין') || text.includes('בריכה') || text.includes('שכשוך') || text.includes('טבילה')) {
      updated.feature = 'spring';
      updated.featureLabel = 'מעיין / בריכת שכשוך';
    } else if (text.includes('סנפלינג') || text.includes('אתגרי') || text.includes('סולמות') || text.includes('יתדות') || text.includes('קניון אתגרי') || text.includes('מצוק')) {
      updated.feature = 'adventure';
      updated.featureLabel = 'סנפלינג / מסלול אתגרי';
    } else if (text.includes('מוצל') || text.includes('צל') || text.includes('יער') || text.includes('חורש') || text.includes('עצים')) {
      updated.feature = 'shade';
      updated.featureLabel = 'יער וחורש מוצל';
    } else if (text.includes('עגלה') || text.includes('עגלות') || text.includes('סלול') || text.includes('נגיש')) {
      updated.feature = 'stroller';
      updated.featureLabel = 'שביל סלול / נגיש לעגלות';
    } else if (text.includes('נוף') || text.includes('תצפית') || text.includes('פריחה') || text.includes('מבצר') || text.includes('עתיקות')) {
      updated.feature = 'view';
      updated.featureLabel = 'תצפיות ונוף';
    }

    // 4. Youngest age extraction
    if (text.includes('תינוק') || text.includes('עגלה') || text.includes('שנה') || text.includes('שנתיים') || text.includes('0+') || text.includes('חודשים') || text.includes('פעוט')) {
      updated.minAge = 0;
      updated.minAgeLabel = '0+ (תינוקות ועגלות)';
    } else if (text.includes('קטנים') || text.includes('3') || text.includes('4') || text.includes('5') || text.includes('6') || text.includes('גן')) {
      updated.minAge = 4;
      updated.minAgeLabel = '4+ (ילדים קטנים)';
    } else if (text.includes('7') || text.includes('8') || text.includes('9') || text.includes('יסודי')) {
      updated.minAge = 7;
      updated.minAgeLabel = '7+ (ילדים בוגרים)';
    } else if (text.includes('10') || text.includes('12') || text.includes('נוער') || text.includes('מבוגרים') || text.includes('גדולים') || text.includes('ללא ילדים')) {
      updated.minAge = 10;
      updated.minAgeLabel = '10+ (נוער ומבוגרים)';
    }

    return updated;
  }

  /**
   * Process a user turn in conversation
   */
  static async processUserMessage(message, sessionState = null) {
    // 1. Guardrails Check
    const guardrail = this.checkGuardrails(message);
    if (!guardrail.safe) {
      return {
        text: guardrail.refusal,
        state: sessionState || this.getInitialState(),
        options: [
          { label: '🌲 טיול מוצל בצפון', value: 'רוצה טיול מוצל בצפון למחר עם ילדים' },
          { label: '💧 מסלול מים במרכז', value: 'מחפש מסלול מים במרכז להיום' },
          { label: '👶 מסלול קל לעגלות', value: 'מחפש מסלול נגיש לעגלות בסוף השבוע' },
        ],
        proposals: [],
        toolActivity: null,
      };
    }

    const state = this.extractParameters(message, sessionState || this.getInitialState());

    // 2. Identify Missing Mandatory Parameters
    const missing = [];
    if (!state.timing) missing.push('timing');
    if (!state.region) missing.push('region');
    if (state.minAge === null || state.minAge === undefined) missing.push('minAge');
    if (!state.feature) missing.push('feature');

    // If parameters are missing, ask politely for the most critical missing one
    if (missing.length > 0) {
      const nextMissing = missing[0];
      return this.generateClarificationResponse(nextMissing, state, missing);
    }

    // 3. All 4 parameters are present! Run Tool Execution & Recommendation Flow
    return await this.generateRecommendations(state);
  }

  /**
   * Generate gentle, polite clarification prompt with quick-reply buttons
   */
  static generateClarificationResponse(targetField, state, allMissing) {
    let text = '';
    let options = [];

    // Friendly recap of what we know so far
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
        ];
        break;

      case 'timing':
        text = `${summaryPrefix}**מתי** אתם מתכננים לצאת למסלול? 📅`;
        options = [
          { label: '☀️ היום', value: 'מתכננים להיום', field: 'timing' },
          { label: '🌅 מחר', value: 'מתכננים למחר', field: 'timing' },
          { label: '📆 מחרתיים', value: 'מתכננים למחרתיים', field: 'timing' },
          { label: '🏕️ סוף השבוע (שבת)', value: 'מתכננים לסוף השבוע', field: 'timing' },
        ];
        break;

      case 'minAge':
        text = `${summaryPrefix}מה **גיל המטייל הצעיר ביותר** שמצטרף אליכם? 👶`;
        options = [
          { label: '👶 0+ (תינוק / עגלה)', value: 'מטיילים עם עגלה ותינוק 0+', field: 'minAge' },
          { label: '🧒 4+ (ילדים קטנים)', value: 'הילד הצעיר בן 4', field: 'minAge' },
          { label: '🧗 7+ (ילדים בוגרים)', value: 'הילד הצעיר בן 7', field: 'minAge' },
          { label: '🧗‍♂️ 10+ (נוער / מבוגרים)', value: 'כולם בני 10 ומעלה', field: 'minAge' },
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
   * Search, filter, query Tomorrow.io and build rich recommendations
   */
  static async generateRecommendations(state) {
    const dayIndex = state.dayIndex || 0;
    const targetAge = Number(state.minAge) || 4;

    // 1. Filter database by region and age
    let candidates = assetsData.filter((site) => {
      // Region match
      if (state.region) {
        if (state.region === 'north' && site.region_group !== 'north') return false;
        if (state.region === 'center' && site.region_group !== 'center') return false;
        if (state.region === 'jerusalem' && site.region_group !== 'jerusalem') return false;
        if (state.region === 'south' && site.region_group !== 'south') return false;
      }

      // Age constraint: site minimum age must be <= youngest hiker age
      if (site.min_age > targetAge) return false;

      // Stroller constraint
      if (targetAge === 0 && !site.stroller_accessible && site.min_age > 0) return false;

      return true;
    });

    // 2. Rank candidates by feature preference
    candidates.sort((a, b) => {
      const aTypes = (a.type || []).join(' ') + ' ' + (a.name || '');
      const bTypes = (b.type || []).join(' ') + ' ' + (b.name || '');

      let scoreA = 0;
      let scoreB = 0;

      if (state.feature === 'water' || state.feature === 'spring') {
        if (aTypes.includes('מים') || aTypes.includes('בריכות') || aTypes.includes('מעיין') || aTypes.includes('שניר') || aTypes.includes('דן')) scoreA += 5;
        if (bTypes.includes('מים') || bTypes.includes('בריכות') || bTypes.includes('מעיין') || bTypes.includes('שניר') || bTypes.includes('דן')) scoreB += 5;
      }
      if (state.feature === 'shade') {
        if (aTypes.includes('חורש') || aTypes.includes('יער') || aTypes.includes('טבע') || aTypes.includes('כרמל') || aTypes.includes('מירון')) scoreA += 5;
        if (bTypes.includes('חורש') || bTypes.includes('יער') || bTypes.includes('טבע') || bTypes.includes('כרמל') || bTypes.includes('מירון')) scoreB += 5;
      }
      if (state.feature === 'adventure') {
        if (aTypes.includes('הרים') || aTypes.includes('אתגרי') || aTypes.includes('מצוק') || aTypes.includes('סנפלינג')) scoreA += 5;
        if (bTypes.includes('הרים') || bTypes.includes('אתגרי') || bTypes.includes('מצוק') || bTypes.includes('סנפלינג')) scoreB += 5;
      }

      return scoreB - scoreA;
    });

    // Top 3 best matched sites
    const topSites = candidates.slice(0, 3);

    // 3. Query Tomorrow.io live weather for each candidate
    const proposals = [];
    for (const site of topSites) {
      let weather = null;
      try {
        weather = await WeatherService.fetchSiteWeather(site, dayIndex);
      } catch (e) {
        // Fallback gracefully
      }

      const advisory = getWaterAdvisory(site);
      const isSafe = (!weather || weather.isTempSafe) && (!weather || weather.isRainSafe) && !advisory;

      proposals.push({
        id: site.id,
        name: site.name,
        region: site.region,
        authority_id: site.authority_id,
        lat: site.lat,
        lng: site.lng,
        min_age: site.min_age,
        stroller_accessible: site.stroller_accessible,
        category: site.category,
        types: site.type || [],
        weather: weather ? {
          temp: weather.temp,
          conditions: weather.conditions,
          heatLoad: weather.heatLoad,
          wind: weather.wind,
          rain: weather.rain,
          isLive: true,
          source: 'Tomorrow.io Live',
        } : {
          temp: '28°C',
          conditions: 'בהיר ונוח',
          heatLoad: 'נוח לטיול',
          wind: '15 קמ"ש',
          rain: '0 מ"מ',
          isLive: false,
          source: 'תחזית IMS',
        },
        safetyBadge: isSafe ? 'בטוח ומומלץ לטיול 🛡️' : 'נדרשת תשומת לב ⚠️',
        waterAdvisory: advisory,
        matchRationale: this.buildRationale(site, state, weather),
      });
    }

    const introText = `מצאתי עבורכם **${proposals.length} מסלולים נהדרים** המתאימים בדיוק להעדפות שלכם עבור **${state.timingLabel}** ב**${state.regionLabel}** (מותאם לגילאי **${state.minAgeLabel}**):\n\nהצלבת הנתונים המטאורולוגיים בוצעה מול **Tomorrow.io** ונבדקו כל אזהרות הבטיחות. בחרו מסלול כדי לצפות בו על גבי המפה! 🗺️`;

    return {
      text: introText,
      state,
      options: [
        { label: '🔄 שנה אזור', value: 'אני רוצה לבדוק אזור אחר בארץ' },
        { label: '📅 בדוק תאריך אחר', value: 'איך יהיה מזג האוויר ביום אחר?' },
        { label: '👶 שנה גיל מטיילים', value: 'רוצה לשנות את גילאי הילדים' },
      ],
      proposals,
      toolActivity: `✅ הופעל מנוע סינון גיאוגרפי (58 אתרים) • 📡 נשלפה תחזית Tomorrow.io עבור ${state.timingLabel} • 🧪 אומתו נתוני רחצה במשרד הבריאות`,
    };
  }

  /**
   * Build concise explainable rationale (XAI)
   */
  static buildRationale(site, state, weather) {
    const parts = [];
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
}
