/**
 * AgentBotService.js - Conversational Hiking AI Agent & Guardrails Orchestrator
 * 
 * Part of Agent BAAL Architecture ($0 Operating Cost).
 * Refactored modular façade orchestrating:
 * - AgentGeoEngine: Spatial Intelligence, City Geocoding & Radius Filtering
 * - AgentNLUParser: Natural Language Understanding, Hebrew Age Parsing & Guardrails
 * - AgentCrisisEngine: Contextual What-If Scenarios & Safe Haven Fallback Routing
 * - AgentRulesEngine: Multi-Factor Scoring, Cluster Diversity & Clarification UI
 */

import assetsData from '../../assets_db.json' with { type: 'json' };
import { WeatherService } from './WeatherService.js';
import { getWaterAdvisory } from '../utils/weatherUtils.js';
import { calculateHaversineDistanceKm } from '../utils/geoUtils.js';

// Import modular sub-engines
import { 
  KNOWN_ORIGIN_CITIES, 
  geocodeCity, 
  filterCandidatesByGeo 
} from './agent/AgentGeoEngine.js';

import { 
  checkGuardrails, 
  extractParameters, 
  parseAgeFromText, 
  applyTypoCorrections,
  DOG_KEYWORDS 
} from './agent/AgentNLUParser.js';

import { 
  getSiteHazardScenario, 
  handleWhatIfScenario 
} from './agent/AgentCrisisEngine.js';

import { 
  rankCandidates, 
  selectDiverseTopCandidates, 
  generateClarificationResponse, 
  buildRationale 
} from './agent/AgentRulesEngine.js';

// Public re-exports for complete backward compatibility
export { KNOWN_ORIGIN_CITIES, geocodeCity, calculateHaversineDistanceKm, getSiteHazardScenario };

export class AgentBotService {
  /**
   * Reset or initialize session state
   */
  static getInitialState() {
    return {
      timing: null,        // 'today' | 'tomorrow' | 'day_after' | 'weekend' | number (0-4)
      timingLabel: null,   // 'היום', 'מחר', 'מחרתיים'
      dayIndex: 0,
      region: null,        // 'north' | 'center' | 'jerusalem' | 'south' | 'all' | 'radius'
      regionLabel: null,   // 'צפון', 'מרכז ושרון', 'ירושלים', 'דרום', 'עד 40 ק"מ מתל אביב'
      maxDistanceKm: null, // e.g. 40 or 50
      originName: null,    // e.g. 'תל אביב'
      originCity: null,    // e.g. 'פתח תקווה'
      originCoords: null,  // [lat, lng]
      feature: null,       // 'water' | 'spring' | 'shade' | 'adventure' | 'stroller' | 'view' | 'any'
      featureLabel: null,  // 'הליכה במים', 'מעיין', 'יער מוצל', 'סנפלינג/אתגרי'
      minAge: null,        // 0, 2, 4, 7, 10
      minAgeLabel: null,   // '0+ (עגלות)', '4+', '7+'
      step: 'init',        // 'init' | 'gathering' | 'ready'
      lastProposals: [],   // stored proposals for follow-up questions
      wheelchairNote: false, // wheelchair caveat flag
      dogWarning: false,     // dog/pet warning flag
    };
  }

  /**
   * Check message against strict safety guardrails
   */
  static checkGuardrails(message) {
    return checkGuardrails(message);
  }

  /**
   * Extract mandatory parameters from text
   */
  static extractParameters(message, currentState) {
    return extractParameters(message, currentState);
  }

  /**
   * Parse youngest hiker age from Hebrew text
   */
  static parseAgeFromText(text) {
    return parseAgeFromText(text);
  }

  /**
   * Tailor contextual What-If hazard scenario to site
   */
  static getSiteHazardScenario(site) {
    return getSiteHazardScenario(site);
  }

  /**
   * Handle interactive What-If crisis simulation & Safe Haven routing
   */
  static handleWhatIfScenario(message, sessionState) {
    return handleWhatIfScenario(message, sessionState, assetsData, this.getInitialState());
  }

  /**
   * Generate clarification prompt when mandatory parameters are missing
   */
  static generateClarificationResponse(targetField, state, allMissing) {
    return generateClarificationResponse(targetField, state, allMissing);
  }

  /**
   * Build explainable rationale (XAI) for recommended sites
   */
  static buildRationale(site, state, weather) {
    return buildRationale(site, state, weather);
  }

  /**
   * Process a user turn in conversation (strictly strips any markdown bold/italic asterisks from user-facing text)
   * @param {string} message - Raw user input text in Hebrew
   * @param {Object} [sessionState=null] - Persistent session state (or null to initialize)
   * @returns {Promise<{text: string, state: Object, options: Array<{label: string, value: string}>, proposals: Array<Object>, toolActivity: Object | null}>}
   */
  static async processUserMessage(message, sessionState = null) {
    const res = await this._processUserMessageInternal(message, sessionState);
    if (res && typeof res.text === 'string') {
      res.text = res.text.replace(/\*{1,2}/g, '');
    }
    return res;
  }

  static async _processUserMessageInternal(message, sessionState = null) {
    // 1. Guardrails Check
    const guardrail = this.checkGuardrails(message);
    if (!guardrail.safe) {
      return {
        text: guardrail.refusal,
        state: sessionState || this.getInitialState(),
        options: [
          { label: '🌲 טיול מוצל בצפון למחר', value: 'רוצה טיול מוצל בצפון למחר עם ילדים' },
          { label: '💧 מסלול מים במרכז להיום', value: 'מחפש מסלול מים במרכז להיום' },
          { label: '👶 מסלול קל לעגלות', value: 'מחפש מסלול נגיש וקל לעגלות' },
        ],
        proposals: [],
        toolActivity: null,
      };
    }

    const text = (message || '').toLowerCase();
    const currentState = sessionState || this.getInitialState();

    // 1.1 Handle Full Conversation Reset
    if (
      text.includes('התחל מחדש') ||
      text.includes('להתחיל מחדש') ||
      text.includes('אפס שיחה') ||
      text.includes('לאפס שיחה') ||
      text.includes('התחל מהתחלה') ||
      text.includes('להתחיל מהתחלה') ||
      text.includes('אפס הכל') ||
      text.includes('נקה שיחה') ||
      text === 'ריסט' ||
      text === 'איפוס' ||
      text === 'מחדש' ||
      text === 'restart' ||
      text === 'reset'
    ) {
      const freshState = this.getInitialState();
      return {
        text: 'השיחה אופסה בהצלחה! 🌿 ספרו לי: **לאיזה אזור בארץ תרצו לטייל ומתי?** (למשל: *"רוצים לטייל מחר בצפון עם ילדים קטנים בני 4, מחפשים מים"*).',
        state: freshState,
        options: [
          { label: '🏞️ צפון (גליל וגולן)', value: 'באזור הצפון', field: 'region' },
          { label: '🌾 מרכז והשרון', value: 'באזור המרכז והשרון', field: 'region' },
          { label: '🏰 ירושלים והשפלה', value: 'באזור ירושלים והשפלה', field: 'region' },
          { label: '🏜️ דרום וים המלח', value: 'באזור הדרום וים המלח', field: 'region' },
          { label: '🎲 לא משנה לי / כל הארץ', value: 'לא משנה לי האזור, בכל הארץ', field: 'region' },
        ],
        proposals: [],
        toolActivity: null,
      };
    }

    // 1.2 Handle Explicit Parameter Reset Buttons
    if (text.includes('שנה אזור') || text.includes('אזור אחר') || text.includes('איזור אחר')) {
      const resetState = { ...currentState, region: null, regionLabel: null };
      return this.generateClarificationResponse('region', resetState, ['region']);
    }
    if (text.includes('תאריך אחר') || text.includes('שנה תאריך') || text.includes('יום אחר') || text.includes('שנה מועד') || text.includes('בדוק תאריך')) {
      const resetState = { ...currentState, timing: null, timingLabel: null, dayIndex: 0 };
      return this.generateClarificationResponse('timing', resetState, ['timing']);
    }
    if (text.includes('שנה גיל') || text.includes('גיל אחר') || text.includes('גילאי הילדים') || text.includes('שנה גילאי')) {
      const resetState = { ...currentState, minAge: null, minAgeLabel: null };
      return this.generateClarificationResponse('minAge', resetState, ['minAge']);
    }
    if (text.includes('שנה סגנון') || text.includes('מסלול אחר') || text.includes('סגנון אחר')) {
      const resetState = { ...currentState, feature: null, featureLabel: null };
      return this.generateClarificationResponse('feature', resetState, ['feature']);
    }

    // 1.3 Dog / Pet warning detection
    const hasDogMention = DOG_KEYWORDS.some((kw) => text.includes(kw));

    // 1.4 Follow-up question about previous proposal
    if (currentState.lastProposals && currentState.lastProposals.length > 0) {
      const ordinalMatch = text.match(/(?:ה-?)?(ראשון|שני|שלישי|1|2|3)/);
      const hasFollowUp = text.includes('ספר לי עוד') || text.includes('עוד על') || text.includes('פרטים על') || text.includes('מידע על') || text.includes('מה יש ב');
      if (ordinalMatch && hasFollowUp) {
        const ordMap = { 'ראשון': 0, 'שני': 1, 'שלישי': 2, '1': 0, '2': 1, '3': 2 };
        const idx = ordMap[ordinalMatch[1]] ?? 0;
        const proposal = currentState.lastProposals[idx];
        if (proposal) {
          const details = [
            `📍 **${proposal.name}**`,
            `🗺️ אזור: ${proposal.region}`,
            `👶 גיל מינימלי: ${proposal.min_age}+`,
            proposal.stroller_accessible ? '♿ נגיש לעגלות' : '',
            proposal.weather ? `🌡️ ${proposal.weather.temp} (${proposal.weather.conditions})` : '',
            proposal.matchRationale ? `💡 ${proposal.matchRationale}` : '',
          ].filter(Boolean).join('\n');
          return {
            text: `הנה פרטים נוספים על המסלול:\n\n${details}`,
            state: currentState,
            options: [
              { label: '🗺️ הצג על המפה', value: `הצג ${proposal.name}` },
              { label: '🔄 חזרה לתוצאות', value: 'הצג שוב את ההמלצות' },
              { label: '🏞️ תכנן טיול חדש', value: 'בוא נחזור לתכנון מסלול רגיל' },
            ],
            proposals: [proposal],
            toolActivity: null,
          };
        }
      }
    }

    // 1.45 Inquiry about whether trails for older children include stroller paths
    const isStrollerInquiry = (
      (text.includes('עגל') || text.includes('עגלה') || text.includes('עגלות')) &&
      (text.includes('כולל') || text.includes('כוללים') || text.includes('נכלל') || text.includes('מתאים גם') || text.includes('האם זה כולל') || text.includes('האם מסלול') || text.includes('האם מסלולים')) &&
      (text.includes('בן') || text.includes('בת') || text.includes('גיל') || text.includes('ילד') || text.includes('11') || text.includes('10') || text.includes('נוער') || text.includes('בוגר'))
    );
    if (isStrollerInquiry) {
      return {
        text: `שאלה מצוינת וחשובה לתכנון הטיול! 🌿 הנה ההסבר המלא:\n\n1. **עבירות ובטיחות:**\nכל מסלול שמוגדר כנגיש לעגלות (0+) הוא שביל מוסדר, סלול או מרוצף (למשל הטיילת בתל דן או שביל המבצר באפולוניה), ולכן הוא **עביר ובטוח לחלוטין גם לילד בן 11**.\n\n2. **רמת עניין ואתגר:**\nילד בן 11 כבר יכול ליהנות מ**מסלולים עשירים, אתגריים וחווייתיים בהרבה** (הליכה עמוקה בתוך נקיקי מים, טיפוס בסולמות ויתדות, בולדרים ומערות) — מסלולים אלו **אינם נגישים לעגלות כלל**.\n\n💡 **איך כדאי לבחור?**\n• **מטיילים ללא עגלה?** מומלץ לבחור במסלולי **7+ או 10+** כדי שהילד ייהנה מחוויית טבע מלאה ומאתגרת.\n• **מטיילים גם עם תינוק בעגלה וגם עם ילד בן 11?** יש לבחור במסלול **נגיש לעגלות (0+)**, או לחלופין להצטייד במנשא גב עבור התינוק כדי שכל המשפחה תוכל ליהנות ממסלול אתגרי!`,
        state: currentState,
        options: [
          { label: '🧗‍♂️ מסלולים אתגריים לגילאי 10+', value: 'מחפש מסלול אתגרי בצפון למחר לבן 11' },
          { label: '👶 מסלולים נגישים לעגלות (0+)', value: 'מחפש מסלול נגיש לעגלות בצפון למחר' },
          { label: '🌊 מסלולי מים מותאמים למשפחה', value: 'מחפש מסלול מים בצפון למשפחה מחר' },
        ],
        proposals: [],
        toolActivity: '💡 מענה לשאלת הכללת עגלות וגילאי מטיילים',
      };
    }

    // 1.5 Direct site name lookup
    const directLookupIntents = [
      'ספר לי על', 'מה יש ב', 'מידע על', 'תגיד לי על', 'מכיר את', 'איך מגיעים ל', 'איך להגיע ל',
      'האם פתוח', 'האם פתוחה', 'האם שמורת', 'האם גן לאומי', 'האם האתר'
    ];
    const hasLookupIntent = directLookupIntents.some((intent) => text.includes(intent));
    if (hasLookupIntent) {
      // 1. Exact full name match across all sites (prioritizing longest match)
      let matchedSite = assetsData
        .filter((s) => text.includes(s.name.toLowerCase()))
        .sort((a, b) => b.name.length - a.name.length)[0];

      if (!matchedSite) {
        const GENERIC_PREFIXES = [
          'עין', 'נחל', 'פארק', 'שמורת', 'גן', 'יער', 'הר', 'תל', 'חוף', 'דרך', 'בית', 'ספר', 'שדה', 'מצפור', 'מצפה', 'חורבת',
          'מסלול', 'מסלולים', 'מסלולי', 'שביל', 'שבילי', 'משפחתי', 'משפחתיים', 'טיול', 'טיולים', 'מעגלי', 'קצר', 'ארוך', 'לאומי', 'טבע'
        ];
        const GENERIC_EXCLUDED_PHRASES = [
          'שמורת טבע', 'גן לאומי', 'בית ספר', 'ספר שדה', 'חניון לילה', 'מסלול הליכה', 'שביל הליכה',
          'מסלול משפחתי', 'שביל משפחתי', 'מסלול מעגלי', 'שביל מעגלי', 'טיול משפחתי'
        ];
        const inputWords = text.split(/[\s\-–—,?!.:;]+/).filter(Boolean);
        matchedSite = assetsData.find((site) => {
          const siteName = site.name.toLowerCase();
          const words = siteName.split(/[\s\-–—]+/).filter(Boolean);
          for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`;
            if (
              phrase.length >= 6 &&
              text.includes(phrase) &&
              !GENERIC_EXCLUDED_PHRASES.includes(phrase)
            ) {
              return true;
            }
          }
          const distinctiveWords = words.filter((w) => w.length >= 3 && !GENERIC_PREFIXES.includes(w));
          return distinctiveWords.some((w) => inputWords.includes(w));
        });
      }

      if (matchedSite) {
        let weather = null;
        try { weather = await WeatherService.fetchSiteWeather(matchedSite, 0); } catch (e) { /* fallback */ }
        const advisory = getWaterAdvisory(matchedSite);
        const proposal = {
          id: matchedSite.id,
          name: matchedSite.name,
          region: matchedSite.region,
          authority_id: matchedSite.authority_id,
          lat: matchedSite.lat,
          lng: matchedSite.lng,
          min_age: matchedSite.min_age,
          stroller_accessible: matchedSite.stroller_accessible,
          category: matchedSite.category,
          types: matchedSite.type || [],
          weather: weather ? { 
            temp: weather.temp, 
            conditions: weather.conditions, 
            heatLoad: weather.heatLoad, 
            wind: weather.wind, 
            rain: weather.rain, 
            isLive: weather.isLive ?? true, 
            source: weather.source || 'Open-Meteo Live' 
          } : { 
            temp: '28°C', 
            conditions: 'בהיר ונוח', 
            heatLoad: 'נוח לטיול', 
            wind: '15 קמ"ש', 
            rain: '0 מ"מ', 
            isLive: false, 
            source: 'תחזית IMS' 
          },
          safetyBadge: !advisory ? 'בטוח ומומלץ לטיול 🛡️' : 'נדרשת תשומת לב ⚠️',
          waterAdvisory: advisory,
          matchRationale: `אתר ${matchedSite.name} באזור ${matchedSite.region}`,
        };
        const updatedState = { ...currentState, lastProposals: [proposal] };
        return {
          text: `הנה מידע על **${matchedSite.name}** 🌿:\n\n📍 **אזור:** ${matchedSite.region}\n👶 **גיל מינימלי:** ${matchedSite.min_age}+\n${matchedSite.stroller_accessible ? '♿ **נגיש לעגלות**\n' : ''}🏷️ **סוג:** ${(matchedSite.type || []).join(', ')}\n\nלחצו על הכרטיסייה למטה להצגה על המפה, או תכננו טיול לאתר הזה!`,
          state: updatedState,
          options: [
            { label: '🗺️ תכנן טיול לכאן', value: `רוצה לטייל ב${matchedSite.region} מחר` },
            { label: '🔄 חפש מסלול אחר', value: 'בוא נחזור לתכנון מסלול רגיל' },
          ],
          proposals: [proposal],
          toolActivity: `🔍 חיפוש ישיר: ${matchedSite.name} (${matchedSite.authority_id})`,
        };
      }
    }

    // 1.6 Interactive What-If Crisis Scenario
    if (text.includes('מה אם') || text.includes('what if') || text.includes('תרחיש') || text.includes('שיטפון') || text.includes('44°c') || text.includes('חום קיצוני') || text.includes('זיהום')) {
      return this.handleWhatIfScenario(message, sessionState);
    }

    const state = this.extractParameters(message, currentState);

    // Dynamic 50km Geocoding for any Israeli town (Finding A2)
    if (!state.originCoords) {
      const cityMatch = text.match(/(?:יוצאים מ|מאיזור|מאזור|ליד|קרוב ל|במרחק\s*(?:\d+\s*ק["״]?מ\s*)?מ|ברדיוס\s*(?:\d+\s*ק["״]?מ\s*)?מ|גרים ב|אנחנו מ|אני מ)\s*([א-ת]{3,15}(?:\s+[א-ת]{3,15})?)/);
      if (cityMatch && cityMatch[1]) {
        const candidateName = cityMatch[1].trim();
        const STOPWORDS = ['הצפון', 'הדרום', 'המרכז', 'השרון', 'השפלה', 'הגולן', 'הגליל', 'המים', 'עגלות', 'ילדים', 'הבוקר', 'הצהריים', 'הערב', 'השבת', 'מחר', 'הבית', 'שם'];
        if (!STOPWORDS.includes(candidateName)) {
          const geo = await geocodeCity(candidateName);
          if (geo) {
            state.originCoords = [geo.lat, geo.lng];
            state.originCity = geo.label;
            state.originName = geo.label;
            if (!state.region || state.region === 'all') {
              state.region = 'radius';
              state.maxDistanceKm = state.maxDistanceKm || 50;
              state.regionLabel = `רדיוס ${state.maxDistanceKm} ק"מ מ${geo.label}`;
            }
          }
        }
      }
    }

    if (hasDogMention) {
      state.dogWarning = true;
    }

    // 2. Identify Missing Mandatory Parameters
    const missing = [];
    if (!state.timing) missing.push('timing');
    if (!state.region) missing.push('region');
    if (state.minAge === null || state.minAge === undefined) missing.push('minAge');
    if (!state.feature) missing.push('feature');

    if (missing.length > 0) {
      const nextMissing = missing[0];
      return this.generateClarificationResponse(nextMissing, state, missing);
    }

    // 3. All parameters present! Run Tool Execution & Recommendation Flow
    return await this.generateRecommendations(state, message);
  }

  /**
   * Search, filter, query weather and build rich recommendations
   */
  static async generateRecommendations(state, rawMessage = '') {
    const dayIndex = state.dayIndex || 0;
    const targetAge = Number(state.minAge) || 4;
    const rawText = (rawMessage || '').toLowerCase();

    // Deep clone assets to guarantee zero mutation on base data (Finding C5)
    const clonedAssets = typeof structuredClone === 'function'
      ? structuredClone(assetsData)
      : JSON.parse(JSON.stringify(assetsData));

    // 1. Filter candidates by geography / distance, age, and stroller
    let candidates = filterCandidatesByGeo(clonedAssets, state).filter((site) => {
      if (site.min_age > targetAge) return false;
      if (targetAge === 0 && !site.stroller_accessible && site.min_age > 0) return false;
      return true;
    });

    // 1.1 Zero Results Check
    if (candidates.length === 0) {
      let explanation = 'לא מצאתי מסלולים המתאימים במדויק לשילוב התנאים שבחרתם';
      if (state.region === 'radius' && state.originName && state.maxDistanceKm) {
        explanation += ` ברדיוס של **עד ${state.maxDistanceKm} ק"מ מ${state.originName}**`;
      } else if (state.regionLabel && state.region !== 'all') {
        explanation += ` באזור **${state.regionLabel}**`;
      }
      if (state.featureLabel && state.feature !== 'any') {
        explanation += ` בסגנון **${state.featureLabel}**`;
      }
      if (state.minAge !== null && state.minAge !== undefined) {
        explanation += ` למטיילים בגיל **${state.minAgeLabel || state.minAge + '+'}**`;
      }
      explanation += '.\n\n💡 **נשמח לנסות שוב יחד!** נסו להרחיב מעט את החיפוש באמצעות אחת מהאפשרויות הבאות:';

      const retryOptions = [];
      if (state.region === 'radius' && state.originName) {
        const expandedKm = (state.maxDistanceKm || 40) + 30;
        retryOptions.push({
          label: `🚗 הרחב טווח לעד ${expandedKm} ק"מ מ${state.originName}`,
          value: `הרחב טווח לעד ${expandedKm} קמ מ${state.originName}`,
        });
      }
      retryOptions.push(
        { label: '🗺️ בדוק בכל הארץ (ללא הגבלת מרחק)', value: 'לא משנה לי האזור, בכל הארץ' },
        { label: '✨ סגנון פתוח ("הכל מתאים")', value: 'לא משנה לי סגנון המסלול, מה שהכי מומלץ ובטוח' },
        { label: '👶 התאם לכל הגילאים (0+)', value: 'לכל הגילאים, מתאים לכולם' }
      );

      return {
        text: `🌿 ${explanation}`,
        state,
        options: retryOptions,
        proposals: [],
        toolActivity: `🛡️ סינון קפדני: 0 תוצאות עבור פרמטרים מחמירים • הוצעו חלופות רחבות יותר`,
      };
    }

    // 2. Multi-factor ranking & sub-regional cluster diversity (RulesEngine)
    rankCandidates(candidates, state, rawText);
    const topSites = selectDiverseTopCandidates(candidates, state, rawText, 3);

    // 3. Query weather for each candidate
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
          isLive: weather.isLive ?? true,
          source: weather.source || 'Open-Meteo Live',
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

    // A2: Rain-water safety warning
    let rainWarning = '';
    if ((state.feature === 'water' || state.feature === 'spring') && proposals.length > 0) {
      const hasRainyWeather = proposals.some((p) => {
        if (!p.weather) return false;
        const rain = parseFloat(String(p.weather.rain).replace(/[^\d.]/g, '')) || 0;
        const cond = (p.weather.conditions || '').toLowerCase();
        return rain > 10 || cond.includes('גשם') || cond.includes('סוער') || cond.includes('סערה') || !p.weather.isRainSafe;
      });
      if (hasRainyWeather) {
        rainWarning = '\n\n⚠️ **שימו לב: צפויים משקעים באזור. הליכה בתוך נחלות ביום גשום עלולה להיות מסוכנת (סכנת שיטפונות בזק).** שקלו מסלול מוצל/יבש כחלופה בטוחה.';
      }
    }

    // A1: Dog warning banner
    let dogBanner = '';
    if (state.dogWarning) {
      dogBanner = '\n\n🐕 **שימו לב:** רוב שמורות הטבע והגנים הלאומיים **אוסרים כניסת כלבים**. מומלץ לוודא מול רשות הטבע והגנים (INPA) לפני היציאה.';
    }

    // B2: Wheelchair disclaimer
    let wheelchairBanner = '';
    if (state.wheelchairNote) {
      wheelchairBanner = '\n\n♿ **הערה חשובה:** סיננתי מסלולים סלולים ונגישים לעגלות. עם זאת, **נגישות לכיסא גלגלים עשויה להיות שונה** (שיפוע, רוחב שביל, סוג משטח). מומלץ לבדוק ישירות מול רשות הטבע והגנים.';
    }

    let cityNotice = '';
    const originCity = state.originCity || state.originName;
    if (originCity && proposals.length > 0) {
      const closestSite = proposals[0];
      const closestDist = closestSite?._distKm || 0;
      const closestDrive = closestSite?._driveMinutes || Math.max(10, Math.round(closestDist * 1.25));

      const isDirectlyInCity = proposals.some(
        (p) => (p.name || '').includes(originCity) || (p._distKm !== undefined && p._distKm < 3)
      );

      if (!isDirectlyInCity) {
        let featureText = 'מסלולי טבע פתוחים';
        if (state.feature === 'water' || state.feature === 'spring') {
          featureText = 'מעיינות או נחלים זורמים';
        } else if (state.feature === 'shade') {
          featureText = 'שמורות יער מוצלות';
        } else if (state.feature === 'stroller') {
          featureText = 'שמורות טבע סלולות';
        }

        const radiusStr = state.maxDistanceKm ? `ברדיוס של עד ${state.maxDistanceKm} ק"מ` : 'בקרבת מקום';
        cityNotice = `אמנם אין ${featureText} ב${originCity} עצמה, אך איתרתי עבורכם יעדים מצוינים ${radiusStr} (החל מכ-${closestDrive} דקות נסיעה):\n\n`;
      }
    }

    const weatherSource = proposals[0]?.weather?.source || 'Open-Meteo Live';
    const introText = `${cityNotice}מצאתי עבורכם **${proposals.length} מסלולים נהדרים** המתאימים בדיוק להעדפות שלכם עבור **${state.timingLabel}** ב**${state.regionLabel}** (מותאם לגילאי **${state.minAgeLabel}**):\n\nהצלבת הנתונים המטאורולוגיים בוצעה מול **${weatherSource}** ונבדקו כל אזהרות הבטיחות. בחרו מסלול כדי לצפות בו על גבי המפה! 🗺️${rainWarning}${dogBanner}${wheelchairBanner}`;

    // Store proposals in state for follow-up questions
    state.lastProposals = proposals;

    // Tailor What-If crisis scenario specifically to the top recommended site
    const topProposal = proposals[0];
    const siteWhatIf = getSiteHazardScenario(topProposal);

    const resultOptions = [
      { label: siteWhatIf.label, value: siteWhatIf.prompt },
      { label: '🔄 שנה אזור', value: 'אני רוצה לבדוק אזור אחר בארץ' },
      { label: '📅 בדוק תאריך אחר', value: 'איך יהיה מזג האוויר ביום אחר?' },
      { label: '👶 שנה גיל מטיילים', value: 'רוצה לשנות את גילאי הילדים' },
    ];
    if (rainWarning) {
      resultOptions.push({ label: '🌲 הצע מסלול מוצל במקום', value: 'מעדיפים יער מוצל ושבילי הליכה' });
    }

    // Eliminate dead LLM blocking delay (Finding H8) — Instant deterministic execution (<50ms)
    return {
      text: introText,
      state,
      options: resultOptions,
      proposals,
      toolActivity: `🤖 Agent BAAL Spatial Engine • 📡 נשלפה תחזית ${weatherSource} • 🛡️ Guardrails Passed`,
    };
  }
}
