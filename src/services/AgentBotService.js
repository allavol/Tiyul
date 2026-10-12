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
  checkClimateContradictions,
  detectEmergencyDistress,
  extractRequestedSiteEntity,
  isGibberishOrNoise,
  DOG_KEYWORDS,
  ABROAD_STANDARD_REFUSAL,
  UNSAFE_BORDER_REFUSAL,
  MILITARY_ZONE_REFUSAL
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

import { AgentTelemetryService } from './agent/AgentTelemetryService.js';

// Public re-exports for complete backward compatibility
export { KNOWN_ORIGIN_CITIES, geocodeCity, calculateHaversineDistanceKm, getSiteHazardScenario, AgentTelemetryService };

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
      isFarFutureDate: false,
      farFutureConfirmed: false,
      diffDays: null,
      targetMonth: null,
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
   * @returns {Promise<{text: string, state: Object, options: Array<{label: string, value: string}>, proposals: Array<Object>, toolActivity: Object | null, traceId?: string}>}
   */
  static async processUserMessage(message, sessionState = null) {
    const { traceId, rootSpanId } = AgentTelemetryService.startTrace('invoke_agent', {
      query: message,
      sessionStep: sessionState?.step || 'init'
    });

    try {
      const res = await this._processUserMessageInternal(message, sessionState, { traceId, rootSpanId });
      if (res && typeof res.text === 'string') {
        res.text = res.text.replace(/\*{1,2}/g, '');
      }
      if (res) {
        res.traceId = traceId;
      }

      const promptTokens = Math.max(1, Math.round((message || '').length / 3));
      const completionTokens = Math.max(1, Math.round((res?.text || '').length / 3));

      AgentTelemetryService.endSpan(rootSpanId, 'OK', {
        output: res?.text,
        attributes: {
          'agent.proposals.count': (res?.proposals || []).length,
          'agent.options.count': (res?.options || []).length,
          'agent.step': res?.state?.step || 'unknown'
        },
        tokens: { promptTokens, completionTokens }
      });

      return res;
    } catch (err) {
      AgentTelemetryService.endSpan(rootSpanId, 'ERROR', {
        statusMessage: err.message,
      });
      throw err;
    }
  }

  static async _processUserMessageInternal(message, sessionState = null, traceContext = {}) {
    const { traceId, rootSpanId } = traceContext;

    // 0. SOS Emergency Distress Trapdoor (Immediate safety bypass)
    const emergencySos = detectEmergencyDistress(message);
    if (emergencySos && emergencySos.isEmergency) {
      return {
        text: emergencySos.text,
        state: sessionState || this.getInitialState(),
        options: emergencySos.options,
        proposals: [],
        toolActivity: emergencySos.toolActivity,
        isEmergency: true,
      };
    }

    // 1. Guardrails Check
    let guardrailSpanId = null;
    if (traceId) {
      guardrailSpanId = AgentTelemetryService.startSpan('guardrails_check', traceId, rootSpanId, 'internal', { input: message });
    }
    const guardrail = this.checkGuardrails(message);
    if (guardrailSpanId) {
      AgentTelemetryService.endSpan(guardrailSpanId, guardrail.safe ? 'OK' : 'ERROR', {
        statusMessage: guardrail.safe ? 'Passed guardrails' : 'Guardrail refusal triggered',
        output: guardrail.safe ? 'PASSED' : guardrail.refusal
      });
    }

    if (!guardrail.safe) {
      return {
        text: guardrail.refusal,
        state: sessionState || this.getInitialState(),
        options: guardrail.isCelestial ? [
          { label: '☀️ בקעת תמנע שטופת שמש', value: 'מחפש מסלול מדברי שטוף שמש בבקעת תמנע' },
          { label: '🏜️ נוף ירחי במכתש רמון', value: 'מחפש מסלול עם נוף ירחי מיוחד במכתש רמון' },
          { label: '🌲 טיול מוצל בצפון למחר', value: 'רוצה טיול מוצל בצפון למחר עם ילדים' },
        ] : guardrail.isMilitary ? [
          { label: '🏞️ שמורות טבע בצפון', value: 'באזור הצפון', field: 'region' },
          { label: '🌾 יערות במרכז', value: 'באזור המרכז והשרון', field: 'region' },
          { label: '🏰 אתרים בירושלים', value: 'באזור ירושלים והשפלה', field: 'region' },
          { label: '🏜️ פארקים בדרום', value: 'באזור הדרום וים המלח', field: 'region' },
        ] : [
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

    // 1.03 Gibberish & Noise Check
    if (isGibberishOrNoise(message)) {
      return {
        text: 'לא הצלחתי לפענח את ההודעה (נראה כמו טקסט לא ברור או ג\'יבריש) 🌿.\n\n💡 **אנא נסחו שוב את שאלתכם בצורה ברורה:**\nספרו לי לאיזה אזור בארץ תרצו לטייל ומתי (לדוגמה: *"רוצים טיול מים בצפון למחר עם ילד בן 4"*), או בחרו באחת האפשרויות למטה:',
        state: currentState,
        options: [
          { label: '🏞️ צפון (גליל וגולן)', value: 'באזור הצפון', field: 'region' },
          { label: '🌾 מרכז והשרון', value: 'באזור המרכז והשרון', field: 'region' },
          { label: '🏰 ירושלים והשפלה', value: 'באזור ירושלים והשפלה', field: 'region' },
          { label: '🏜️ דרום וים המלח', value: 'באזור הדרום וים המלח', field: 'region' },
          { label: '🎲 כל הארץ', value: 'לא משנה לי האזור, בכל הארץ', field: 'region' },
        ],
        proposals: [],
        toolActivity: '❓ זיהוי ג\'יבריש / טקסט לא קריא • בקשת הבהרה מפורשת',
      };
    }

    // 1.05 Climate & Geographic Contradiction Check (e.g. Snow in Eilat / Desert)
    const climateCheck = checkClimateContradictions(message);
    if (climateCheck && climateCheck.contradiction) {
      return {
        text: climateCheck.text,
        state: currentState,
        options: climateCheck.options,
        proposals: [],
        toolActivity: '❄️ זיהוי סתירה אקלימית: אין שלג באילת/במדבר • הוצגו הנחיות לניסוח מחדש',
      };
    }

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
      const resetState = { 
        ...currentState, 
        timing: null, 
        timingLabel: null, 
        dayIndex: 0,
        isFarFutureDate: false,
        farFutureConfirmed: false,
        diffDays: null,
        targetMonth: null,
      };
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

    // 1.48 Check for explicit requested site / stream entity
    const requestedEntity = extractRequestedSiteEntity(message);
    if (requestedEntity) {
      const matchedByEntity = assetsData.find((s) => 
        text.includes(s.name.toLowerCase()) || 
        s.name.toLowerCase().includes(requestedEntity.toLowerCase()) ||
        requestedEntity.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedByEntity) {
        if (!currentState.region) {
          currentState.region = matchedByEntity.region_group;
          currentState.regionLabel = matchedByEntity.region;
        }
      } else {
        const matchesCity = KNOWN_ORIGIN_CITIES.some((c) => c.names.some((n) => text.includes(n)));
        const lookupIntents = [
          'ספר לי על', 'מה יש ב', 'מידע על', 'תגיד לי על', 'מכיר את', 'איך מגיעים ל', 'איך להגיע ל',
          'האם פתוח', 'האם פתוחה', 'האם שמורת', 'האם גן לאומי', 'האם האתר',
          'מה מזג האוויר', 'מה מזג האויר', 'איך מזג האוויר', 'איך מזג האויר',
          'מה התחזית', 'תחזית ב', 'מזג אוויר ב', 'מזג אויר ב',
          'יש גשם', 'ירד גשם', 'יורד גשם', 'צפוי גשם', 'גשם ב', 'גשם', 'גשום'
        ];
        const hasLookup = lookupIntents.some((intent) => text.includes(intent));
        if (!matchesCity && !hasLookup) {
          return {
            text: UNSAFE_BORDER_REFUSAL,
            state: currentState,
            options: [
              { label: '🌲 טיול מוצל בצפון למחר', value: 'רוצה טיול מוצל בצפון למחר עם ילדים' },
              { label: '💧 מסלול מים במרכז להיום', value: 'מחפש מסלול מים במרכז להיום' },
              { label: '👶 מסלול קל לעגלות', value: 'מחפש מסלול נגיש וקל לעגלות' },
            ],
            proposals: [],
            toolActivity: `🛡️ יעד מחוץ לגבולות ישראל הבטוחים: ${requestedEntity} • סירוב תקני`,
          };
        }
      }
    }

    // 1.5 Direct site name lookup & Weather/Rain inquiries
    const isRainInquiry = (
      text.includes('האם יש גשם') || text.includes('אם יש גשם') || text.includes('יש גשם') ||
      text.includes('יהיה גשם') || text.includes('ירד גשם') || text.includes('יורד גשם') ||
      text.includes('צפוי גשם') || text.includes('סיכוי לגשם') || text.includes('סיכוי למשקעים') ||
      text.includes('גשם ב') || text.includes('גשם ל') || text.includes('האם גשום') ||
      text.includes('גשום ב') || text.includes('גשום') || text.includes('סוער ב') ||
      text.includes('מבול') || text.includes('תחזית גשם') ||
      /\bגשם\b/.test(text)
    );
    const isWeatherInquiry = (
      isRainInquiry ||
      text.includes('מה מזג האוויר') || text.includes('מה מזג האויר') ||
      text.includes('איך מזג האוויר') || text.includes('איך מזג האויר') ||
      text.includes('איך המזג אוויר') || text.includes('איך המזג אויר') ||
      text.includes('מה התחזית') || text.includes('תחזית ב') || text.includes('תחזית ל') ||
      text.includes('מזג אוויר ב') || text.includes('מזג אויר ב') ||
      text.includes('מזג האוויר ב') || text.includes('מזג האויר ב') ||
      text.includes('מזג אוויר ל') || text.includes('מזג אויר ל') ||
      text.includes('האם חם') || text.includes('כמה חם ב') || text.includes('האם חם ב') || (text.includes('חם ב') && !text.includes('חם בחוץ')) || text.includes('טמפרטורה ב') || text.includes('מה הטמפרטורה')
    );
    const isInfoLookupIntent = [
      'ספר לי על', 'ספרי לי על', 'מה יש ב', 'מידע על', 'תגיד לי על', 'מכיר את', 'מכירה את',
      'איך מגיעים ל', 'איך להגיע ל', 'האם פתוח', 'האם פתוחה', 'האם שמורת', 'האם גן לאומי', 'האם האתר'
    ].some((intent) => text.includes(intent));

    const hasLookupIntent = isWeatherInquiry || isInfoLookupIntent;
    if (hasLookupIntent) {
      // 1. First check if requestedEntity directly mapped to an asset
      let matchedSite = null;
      if (requestedEntity && !['שמורת טבע', 'גן לאומי', 'בית ספר שדה', 'חניון לילה', 'מסלול הליכה', 'שביל הליכה'].includes(requestedEntity.trim())) {
        matchedSite = assetsData.find((s) => 
          s.name.toLowerCase() === requestedEntity.toLowerCase() ||
          s.name.toLowerCase().startsWith(requestedEntity.toLowerCase()) ||
          s.name.toLowerCase().includes(requestedEntity.toLowerCase())
        );
      }

      // 2. Exact full name match across all sites (prioritizing longest match)
      if (!matchedSite) {
        matchedSite = assetsData
          .filter((s) => text.includes(s.name.toLowerCase()))
          .sort((a, b) => b.name.length - a.name.length)[0];
      }

      // 3. Fallback distinctive phrase and words matching
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
          return distinctiveWords.some((w) => inputWords.includes(w) || inputWords.some((iw) => iw.endsWith(w) || iw.includes(w)));
        });
      }

      if (matchedSite) {
        let lookupSpanId = null;
        if (traceId) {
          lookupSpanId = AgentTelemetryService.startSpan('execute_tool:directSiteLookup', traceId, rootSpanId, 'execute_tool', {
            input: { query: text, site: matchedSite.name, id: matchedSite.id }
          });
        }

        const timingParams = extractParameters(message, currentState);
        const dayIdx = timingParams.dayIndex || 0;
        const dayLabel = timingParams.timingLabel || 'היום';

        let weather = null;
        try {
          if (timingParams.isFarFutureDate) {
            weather = WeatherService.getSeasonalHistoricalForecast(matchedSite, timingParams.targetMonth || 12);
          } else {
            weather = await WeatherService.fetchSiteWeather(matchedSite, dayIdx);
          }
        } catch (e) { /* fallback */ }

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
            isEstimateOnly: weather.isEstimateOnly ?? !weather.isLive,
            source: weather.source || (weather.isLive ? 'Open-Meteo Live' : 'הערכה בלבד (Offline)') 
          } : { 
            temp: '28°C', 
            conditions: 'בהיר ונוח', 
            heatLoad: 'נוח לטיול', 
            wind: '15 קמ"ש', 
            rain: '0 מ"מ', 
            isLive: false, 
            isEstimateOnly: true, 
            source: 'הערכה בלבד (Offline)' 
          },
          safetyBadge: !advisory ? 'בטוח ומומלץ לטיול 🛡️' : 'נדרשת תשומת לב ⚠️',
          waterAdvisory: advisory,
          matchRationale: `אתר ${matchedSite.name} באזור ${matchedSite.region}`,
        };
        if (lookupSpanId) {
          AgentTelemetryService.endSpan(lookupSpanId, 'OK', {
            attributes: { 'site.name': matchedSite.name, 'site.authority_id': matchedSite.authority_id }
          });
        }

        let responseText = '';
        if (isRainInquiry) {
          const precipNum = weather?.precipProb !== undefined 
            ? weather.precipProb 
            : (parseFloat(String(weather?.rain).replace(/[^\d.]/g, '')) || 0);

          if (precipNum < 20) {
            responseText = `☀️ לא, לא צפוי גשם ב${matchedSite.name} עבור ${dayLabel} (סיכוי למשקעים: ${precipNum}%).\n\n🌡️ מזג האוויר הצפוי: ${weather.temp}, ${weather.conditions}.\n💨 רוח: ${weather.wind}\n🛡️ עומס חום: ${weather.heatLoad}\n\nהתנאים מצוינים ובטוחים לטיול! לחצו על הכרטיסייה למטה לצפייה באתר על גבי המפה 🗺️.`;
          } else if (precipNum < 50) {
            responseText = `🌦️ ייתכן גשם מקומי/קל ב${matchedSite.name} עבור ${dayLabel} (סיכוי למשקעים: ${precipNum}%).\n\n🌡️ טמפרטורה ומצב: ${weather.temp}, ${weather.conditions}.\n💨 רוח: ${weather.wind}\n\nמומלץ להצטייד במטריה או עליונית מתאימה. לחצו על הכרטיסייה למטה לצפייה באתר על גבי המפה 🗺️.`;
          } else {
            responseText = `🌧️ כן, צפוי גשם ב${matchedSite.name} עבור ${dayLabel} (סיכוי למשקעים: ${precipNum}%, ${weather.conditions}).\n\n🌡️ טמפרטורה: ${weather.temp}\n⚠️ שימו לב: יש להיערך למזג אוויר רטוב ולהיזהר מהחלקה בשבילים! לחצו על הכרטיסייה למטה לצפייה באתר על גבי המפה 🗺️.`;
          }
        } else if (isWeatherInquiry) {
          responseText = `הנה תחזית מזג האוויר עבור ${matchedSite.name} ל${dayLabel} 🌤️:\n\n🌡️ טמפרטורה: ${weather.temp} (${weather.conditions})\n💧 משקעים: ${weather.rain}\n💨 רוח: ${weather.wind}\n🛡️ עומס חום: ${weather.heatLoad}\n\nלחצו על הכרטיסייה למטה להצגה על המפה! 🗺️`;
        } else {
          responseText = `הנה מידע על ${matchedSite.name} 🌿:\n\n📍 אזור: ${matchedSite.region}\n👶 גיל מינימלי: ${matchedSite.min_age}+\n${matchedSite.stroller_accessible ? '♿ נגיש לעגלות\n' : ''}🏷️ סוג: ${(matchedSite.type || []).join(', ')}\n\nלחצו על הכרטיסייה למטה להצגה על המפה, או תכננו טיול לאתר הזה!`;
        }

        const updatedState = { ...currentState, lastProposals: [proposal] };
        return {
          text: responseText,
          state: updatedState,
          options: [
            { label: '🗺️ תכנן טיול לכאן', value: `רוצה לטייל ב${matchedSite.region} מחר` },
            { label: '🔄 בדוק יום אחר', value: `מה מזג האוויר ב${matchedSite.name} ביום אחר?` },
            { label: '🏞️ חפש מסלול אחר באזור', value: `מחפש מסלולים ב${matchedSite.region}` },
          ],
          proposals: [proposal],
          toolActivity: `🔍 ${isWeatherInquiry ? 'בדיקת מזג אוויר וגשם' : 'חיפוש ישיר'}: ${matchedSite.name} (${dayLabel})`,
        };
      } else {
        // Direct lookup intent present but site not matched in Israel database
        const hasIsraeliRegion = (
          text.includes('צפון') || text.includes('גליל') || text.includes('גולן') ||
          text.includes('מרכז') || text.includes('שרון') || text.includes('ירושלים') ||
          text.includes('שפלה') || text.includes('דרום') || text.includes('נגב') ||
          text.includes('ערבה') || text.includes('אילת') || text.includes('ים המלח')
        );
        const matchedCity = KNOWN_ORIGIN_CITIES.find((c) => c.names.some((n) => text.includes(n)));

        if (matchedCity && isWeatherInquiry) {
          const timingParams = extractParameters(message, currentState);
          const dayIdx = timingParams.dayIndex || 0;
          const dayLabel = timingParams.timingLabel || 'היום';
          let cityWeather = null;
          try {
            cityWeather = await WeatherService.fetchSiteWeather({ lat: matchedCity.lat, lng: matchedCity.lng, name: matchedCity.label }, dayIdx);
          } catch (e) {}

          const precipNum = cityWeather?.precipProb !== undefined 
            ? cityWeather.precipProb 
            : (parseFloat(String(cityWeather?.rain).replace(/[^\d.]/g, '')) || 0);

          let cityText = '';
          if (isRainInquiry) {
            if (precipNum < 20) {
              cityText = `☀️ לא, לא צפוי גשם ב${matchedCity.label} עבור ${dayLabel} (סיכוי למשקעים: ${precipNum}%).\n\n🌡️ מזג האוויר הצפוי: ${cityWeather?.temp || '24°C'}, ${cityWeather?.conditions || 'בהיר ונוח'}.`;
            } else {
              cityText = `🌧️ צפוי גשם ב${matchedCity.label} עבור ${dayLabel} (סיכוי למשקעים: ${precipNum}%).\n\n🌡️ מזג האוויר: ${cityWeather?.temp || '20°C'}, ${cityWeather?.conditions || 'גשום'}.`;
            }
          } else {
            cityText = `הנה תחזית מזג האוויר ב${matchedCity.label} ל${dayLabel} 🌤️:\n\n🌡️ טמפרטורה: ${cityWeather?.temp} (${cityWeather?.conditions})\n💧 משקעים: ${cityWeather?.rain}\n💨 רוח: ${cityWeather?.wind}`;
          }

          return {
            text: cityText,
            state: currentState,
            options: [
              { label: `🏞️ מסלולים ליד ${matchedCity.label}`, value: `רוצה מסלול ליד ${matchedCity.label} ${dayLabel}` },
              { label: '🌲 טיול מוצל בצפון', value: 'רוצה טיול מוצל בצפון למחר עם ילדים' },
              { label: '👶 מסלול קל לעגלות', value: 'מחפש מסלול נגיש וקל לעגלות' },
            ],
            proposals: [],
            toolActivity: `📡 בדיקת מזג אוויר עירוני: ${matchedCity.label} (${dayLabel})`,
          };
        }

        if (isWeatherInquiry && !hasIsraeliRegion && !matchedCity) {
          return {
            text: ABROAD_STANDARD_REFUSAL,
            state: currentState,
            options: [
              { label: '🌲 טיול מוצל בצפון למחר', value: 'רוצה טיול מוצל בצפון למחר עם ילדים' },
              { label: '💧 מסלול מים במרכז להיום', value: 'מחפש מסלול מים במרכז להיום' },
              { label: '👶 מסלול קל לעגלות', value: 'מחפש מסלול נגיש וקל לעגלות' },
            ],
            proposals: [],
            toolActivity: '🌍 בדיקת מזג אוויר מחוץ לישראל • סירוב חו"ל תקני',
          };
        }

        const isExplicitSiteQuery = (
          text.includes('ספר לי על') || text.includes('ספרי לי על') ||
          text.includes('מידע על') || text.includes('מכיר את') || text.includes('מכירה את') ||
          text.includes('תגיד לי על') || text.includes('מה יש ב') ||
          text.includes('איך מגיעים ל') || text.includes('איך להגיע ל') ||
          text.includes('האם פתוח') || text.includes('האם פתוחה')
        );

        if (isExplicitSiteQuery && !hasIsraeliRegion && !matchedCity) {
          const entity = extractRequestedSiteEntity(text) || '';
          const siteDisplay = entity ? `האתר "${entity}"` : 'האתר שציינתם';
          return {
            text: `איני מכיר את ${siteDisplay} במאגר שמורות הטבע, הגנים הלאומיים ומסלולי הטיול המאומתים של ישראל 🌿.\n\n💡 ייתכן שמדובר באתר שאינו שייך לרשות הטבע והגנים או לקק"ל, או בשם שנכתב עם שגיאה. בואו נמשיך לחפש מסלול באחד מאזורי הארץ:`,
            state: currentState,
            options: [
              { label: '🏞️ צפון (גליל וגולן)', value: 'באזור הצפון', field: 'region' },
              { label: '🌾 מרכז והשרון', value: 'באזור המרכז והשרון', field: 'region' },
              { label: '🏰 ירושלים והשפלה', value: 'באזור ירושלים והשפלה', field: 'region' },
              { label: '🏜️ דרום וים המלח', value: 'באזור הדרום וים המלח', field: 'region' },
            ],
            proposals: [],
            toolActivity: `❓ חיפוש ישיר נכשל: ${siteDisplay} אינו מוכר במאגר`,
          };
        }
      }
    }

    // 1.6 Interactive What-If Crisis Scenario
    if (text.includes('מה אם') || text.includes('what if') || text.includes('תרחיש') || text.includes('שיטפון') || text.includes('44°c') || text.includes('חום קיצוני') || text.includes('זיהום')) {
      let whatIfSpanId = null;
      if (traceId) {
        whatIfSpanId = AgentTelemetryService.startSpan('execute_tool:handleWhatIfScenario', traceId, rootSpanId, 'execute_tool', { input: message });
      }
      const whatIfRes = this.handleWhatIfScenario(message, sessionState);
      if (whatIfSpanId) {
        AgentTelemetryService.endSpan(whatIfSpanId, 'OK', { output: whatIfRes.toolActivity || 'What-If Crisis Handled' });
      }
      return whatIfRes;
    }

    let nluSpanId = null;
    if (traceId) {
      nluSpanId = AgentTelemetryService.startSpan('parse_nlu', traceId, rootSpanId, 'parse_nlu', { input: message });
    }
    const state = this.extractParameters(message, currentState);
    if (nluSpanId) {
      AgentTelemetryService.endSpan(nluSpanId, 'OK', {
        attributes: {
          'nlu.timing': state.timing || 'unset',
          'nlu.region': state.region || 'unset',
          'nlu.minAge': state.minAge !== null && state.minAge !== undefined ? state.minAge : 'unset',
          'nlu.feature': state.feature || 'unset',
          'nlu.excludeWater': Boolean(state.excludeWater),
        }
      });
    }

    // 1.95 Check Far-Future Date (>14 days) confirmation & historical weather disclaimer
    const isFarFutureConfirm = (
      text === 'כן' ||
      text === 'כן תודה' ||
      text === 'כן בטח' ||
      text === 'בטח' ||
      text === 'אחלה' ||
      text === 'יאללה' ||
      text === 'אשמח' ||
      text === 'מעוניין' ||
      text.includes('כן, אני רוצה הצעות') ||
      text.includes('כן אני רוצה הצעות') ||
      text.includes('כן, אשמח להצעות') ||
      text.includes('כן אשמח להצעות') ||
      text.includes('אשמח להצעות') ||
      text.includes('הצעות בכל מקרה') ||
      text.includes('בכל מקרה') ||
      text.includes('רוצה הצעות') ||
      text.includes('תן הצעות') ||
      text.includes('תציע בכל מקרה')
    );

    if (state.isFarFutureDate && isFarFutureConfirm) {
      state.farFutureConfirmed = true;
    }

    if (state.isFarFutureDate && !state.farFutureConfirmed) {
      const daysText = state.diffDays ? `בעוד ${state.diffDays} ימים` : 'מעבר ל-14 ימים מהיום';
      const dateText = state.timingLabel || 'התאריך המבוקש';
      return {
        text: `שימו לב: התאריך המבוקש (${dateText}) הוא ${daysText}, מעבר לטווח של תחזית מזג אוויר חיה (עד 14 ימים) 📅.\n\nנתוני מזג האוויר למועד זה אינם תחזית חיה אלא מבוססים על נתונים היסטוריים וממוצעים עונתיים (בגדול ובערבון מוגבל ⚠️).\n\nהאם תרצו הצעות למסלולים בכל מקרה?`,
        state,
        options: [
          { label: '☀️ כן, אשמח להצעות בכל מקרה', value: 'כן, אני רוצה הצעות למסלולים בכל מקרה' },
          { label: '📅 בחר תאריך קרוב יותר', value: 'שנה תאריך' },
        ],
        proposals: [],
        toolActivity: '📅 בדיקת טווח תחזית: תאריך עתידי מעבר ל-14 ימים • מבוסס על נתונים היסטוריים וממוצעים עונתיים • ממתין לאישור המשתמש',
      };
    }

    // Dynamic 50km Geocoding for any Israeli town (Finding A2)
    if (!state.originCoords) {
      const cityMatch = text.match(/(?:יוצאים מ|מאיזור|מאזור|ליד|קרוב ל|במרחק\s*(?:\d+\s*ק["״]?מ\s*)?מ|ברדיוס\s*(?:\d+\s*ק["״]?מ\s*)?מ|גרים ב|אנחנו מ|אני מ)\s*([א-ת]{3,15}(?:\s+[א-ת]{3,15})?)/);
      if (cityMatch && cityMatch[1]) {
        const candidateName = cityMatch[1].trim();
        const STOPWORDS = ['הצפון', 'הדרום', 'המרכז', 'השרון', 'השפלה', 'הגולן', 'הגליל', 'המים', 'עגלות', 'ילדים', 'הבוקר', 'הצהריים', 'הערב', 'השבת', 'מחר', 'הבית', 'שם', 'אוטו', 'האוטו', 'רכב', 'הרכב', 'חניה', 'החניה'];
        if (!STOPWORDS.includes(candidateName)) {
          let geoSpanId = null;
          if (traceId) {
            geoSpanId = AgentTelemetryService.startSpan('geocode_city', traceId, rootSpanId, 'execute_tool', { input: candidateName });
          }
          const geo = await geocodeCity(candidateName);
          if (geoSpanId) {
            AgentTelemetryService.endSpan(geoSpanId, geo ? 'OK' : 'ERROR', {
              output: geo ? `${geo.label} (${geo.lat}, ${geo.lng})` : 'Not found'
            });
          }
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

    // Smart Defaults Strategy for Rich Experiential Concepts (Table ג'):
    // When the user specifies an experiential concept, feature, water negation, dog, or age constraint,
    // do not stall with multi-turn interrogations! Apply intelligent defaults:
    // - Default timing: 'today' (current weather)
    // - Default region: 'all' (all of Israel)
    // - Default minAge: appropriate for the concept
    // And immediately return 3 top proposals on the map with follow-up filter pills!
    const isCityOriginQuery = Boolean(state.originCity || state.originCoords);
    const hasRichIntent = Boolean(
      state.concept ||
      state.excludeWater ||
      state.dogWarning ||
      (state.feature && !isCityOriginQuery)
    );

    if (hasRichIntent && !isCityOriginQuery && missing.length > 0) {
      if (!state.timing) {
        state.timing = 'today';
        state.timingLabel = 'היום';
        state.dayIndex = 0;
      }
      if (!state.region) {
        state.region = 'all';
        state.regionLabel = 'כל הארץ';
      }
      if (state.minAge === null || state.minAge === undefined) {
        if (state.concept === 'picnic' || state.concept === 'senior' || state.concept === 'easy' || state.feature === 'stroller') {
          state.minAge = 0;
          state.minAgeLabel = 'מתאים לכולם (0+)';
        } else if (state.feature === 'adventure' || state.concept === 'adventure') {
          state.minAge = 10;
          state.minAgeLabel = '10+ (נוער ומבוגרים)';
        } else {
          state.minAge = 4;
          state.minAgeLabel = '4+ (ילדים קטנים)';
        }
      }
      if (!state.feature) {
        state.feature = 'any';
        state.featureLabel = 'כל הסגנונות';
      }
      missing.length = 0; // Fulfilled by Smart Defaults!
    }

    if (missing.length > 0) {
      const nextMissing = missing[0];
      if (traceId) {
        AgentTelemetryService.log('INFO', `Clarification requested for parameter: ${nextMissing}`, { traceId, missing });
      }
      return this.generateClarificationResponse(nextMissing, state, missing);
    }

    // Multi-turn State Stagnation Guard:
    // If the conversation already had recommendations delivered in previous turn,
    // and this turn's message did NOT provide any updated parameter or navigation intent,
    // do not blindly repeat previous proposals. Prompt for clarification or parameter update!
    const hadProposalsBefore = Boolean(currentState.lastProposals && currentState.lastProposals.length > 0);
    if (hadProposalsBefore) {
      const freshExtraction = extractParameters(message, this.getInitialState());
      const hasAnyNewParameter = Boolean(
        freshExtraction.timing ||
        freshExtraction.region ||
        (freshExtraction.minAge !== null && freshExtraction.minAge !== undefined) ||
        freshExtraction.feature ||
        freshExtraction.concept ||
        freshExtraction.excludeWater ||
        (state.originCoords && state.originCoords !== currentState.originCoords)
      );
      const hasMoreIntent = (
        text.includes('עוד') || text.includes('הבא') || text.includes('נוספים') ||
        text.includes('אחרים') || text.includes('החלף') || text.includes('רענן') ||
        text.includes('אפשרויות נוספות')
      );
      if (!hasAnyNewParameter && !hasMoreIntent) {
        return {
          text: 'המסלולים שהוצעו למעלה מותאמים להעדפות שבחרתם 🌿.\n\nהאם תרצו לשנות משהו בהעדפות (אזור, מועד, גילאי הילדים או סגנון המסלול), או שתרצו שאציג אפשרויות נוספות?',
          state: currentState,
          options: [
            { label: '🔄 עוד אפשרויות למסלול זה', value: 'עוד אפשרויות' },
            { label: '🏞️ שנה אזור בארץ', value: 'שנה אזור' },
            { label: '📅 שנה מועד / תאריך', value: 'שנה תאריך' },
            { label: '👶 שנה גיל מטיילים', value: 'רוצה לשנות את גילאי הילדים' },
            { label: '🔄 התחל מחדש', value: 'התחל מחדש' },
          ],
          proposals: currentState.lastProposals || [],
          toolActivity: '💡 שיחה מתמשכת: נדרש עדכון פרמטרים או בקשה להצעות נוספות',
        };
      }
    }

    // 3. All parameters present! Run Tool Execution & Recommendation Flow
    return await this.generateRecommendations(state, message, traceContext);
  }

  /**
   * Search, filter, query weather and build rich recommendations
   */
  static async generateRecommendations(state, rawMessage = '', traceContext = {}) {
    const { traceId, rootSpanId } = traceContext;
    const dayIndex = state.dayIndex || 0;
    const targetAge = Number(state.minAge) || 4;
    const rawText = (rawMessage || '').toLowerCase();

    // Deep clone assets to guarantee zero mutation on base data (Finding C5)
    const clonedAssets = typeof structuredClone === 'function'
      ? structuredClone(assetsData)
      : JSON.parse(JSON.stringify(assetsData));

    // 1. Filter candidates by geography / distance, age, stroller, and water exclusion
    let filterSpanId = null;
    if (traceId) {
      filterSpanId = AgentTelemetryService.startSpan('geo_filter', traceId, rootSpanId, 'execute_tool', {
        input: {
          region: state.region,
          originName: state.originName,
          maxDistanceKm: state.maxDistanceKm,
          targetAge,
          excludeWater: Boolean(state.excludeWater)
        }
      });
    }

    let candidates = filterCandidatesByGeo(clonedAssets, state).filter((site) => {
      if (site.min_age > targetAge) return false;
      if (targetAge === 0 && !site.stroller_accessible && site.min_age > 0) return false;
      if (state.excludeWater || state.feature === 'dry') {
        const types = (site.type || []).join(' ') + ' ' + (site.name || '');
        if (
          types.includes('מים') ||
          types.includes('שכשוך') ||
          types.includes('מעיין') ||
          types.includes('בריכ') ||
          site.name.includes('עין ') ||
          site.name.includes('מעיין') ||
          site.name.includes('נחל')
        ) {
          return false;
        }
      }
      return true;
    });

    if (filterSpanId) {
      AgentTelemetryService.endSpan(filterSpanId, 'OK', {
        attributes: { 'geo.matched_candidates_count': candidates.length }
      });
    }

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
        if (state.isSenior || state.minAgeLabel?.includes('קשיש') || state.minAgeLabel?.includes('גיל הזהב')) {
          explanation += ` עבור **${state.minAgeLabel}**`;
        } else {
          explanation += ` למטיילים בגיל **${state.minAgeLabel || state.minAge + '+'}**`;
        }
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
    let rankSpanId = null;
    if (traceId) {
      rankSpanId = AgentTelemetryService.startSpan('rank_candidates', traceId, rootSpanId, 'internal', {
        input: { candidatesPoolSize: candidates.length }
      });
    }
    rankCandidates(candidates, state, rawText);
    const topSites = selectDiverseTopCandidates(candidates, state, rawText, 3);
    if (rankSpanId) {
      AgentTelemetryService.endSpan(rankSpanId, 'OK', {
        attributes: { 'ranking.top_sites': topSites.map((s) => s.name).join(', ') }
      });
    }

    // 3. Query weather for each candidate
    let weatherSpanId = null;
    if (traceId) {
      weatherSpanId = AgentTelemetryService.startSpan('fetch_weather_batch', traceId, rootSpanId, 'execute_tool', {
        input: { sites: topSites.map((s) => s.name), dayIndex }
      });
    }

    const proposals = [];
    for (const site of topSites) {
      let weather = null;
      try {
        if (state.isFarFutureDate) {
          weather = WeatherService.getSeasonalHistoricalForecast(site, state.targetMonth || 12);
        } else {
          weather = await WeatherService.fetchSiteWeather(site, dayIndex);
        }
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
          isEstimateOnly: weather.isEstimateOnly ?? !weather.isLive,
          source: weather.source || (weather.isLive ? 'Open-Meteo Live' : 'הערכה בלבד (Offline)'),
        } : {
          temp: '28°C',
          conditions: 'בהיר ונוח',
          heatLoad: 'נוח לטיול',
          wind: '15 קמ"ש',
          rain: '0 מ"מ',
          isLive: false,
          isEstimateOnly: true,
          source: 'הערכה בלבד (Offline)',
        },
        safetyBadge: isSafe ? 'בטוח ומומלץ לטיול 🛡️' : 'נדרשת תשומת לב ⚠️',
        waterAdvisory: advisory,
        matchRationale: this.buildRationale(site, state, weather),
      });
    }

    if (weatherSpanId) {
      AgentTelemetryService.endSpan(weatherSpanId, 'OK', {
        attributes: { 'weather.proposals_count': proposals.length }
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

    // B2: Wheelchair / Senior disclaimer
    let wheelchairBanner = '';
    if (state.wheelchairNote) {
      if (state.isSenior) {
        wheelchairBanner = '\n\n♿ **הערה חשובה:** סיננתי מסלולים סלולים ונוחים להליכה, המותאמים במיוחד לגיל הזהב וקשישים (ללא מדרגות, ללא סולמות, ועם תוואי מישורי ונוח).';
      } else {
        wheelchairBanner = '\n\n♿ **הערה חשובה:** סיננתי מסלולים סלולים ונגישים לעגלות. עם זאת, **נגישות לכיסא גלגלים עשויה להיות שונה** (שיפוע, רוחב שביל, סוג משטח). מומלץ לבדוק ישירות מול רשות הטבע והגנים.';
      }
    }

    let cityNotice = '';
    const originCity = state.originCity || state.originName;
    if (state.region === 'radius' && originCity && proposals.length > 0) {
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

    const weatherSource = proposals[0]?.weather?.source || (state.isFarFutureDate ? 'ממוצע היסטורי עונתי ⚠️' : 'Open-Meteo Live');
    const conflictBanner = state.demographicConflictResolved
      ? '\n\n💡 **התחשבות בבטיחות:** זוהה שילוב בין מטיילים עם צרכי נגישות (סבתא/עגלה/כיסא גלגלים) לרצון באתגר. בהתאם לכללי הבטיחות, נבחרה האוכלוסייה עם המגבלות הגדולות ביותר והוצעו שבילים סלולים, מישוריים ובטוחים לכולם (ללא סולמות, מצוקים או סכנת החלקה).'
      : '';
    const bbqBanner = state.bbqDisclaimer
      ? '\n\n🥩🔥 **הנחיית מנגל ובטיחות אש:** הבערת אש ומנגל אסורה בהחלט בתוך שמורות טבע סגורות ונחלים! האתרים שהוצעו כוללים חניוני נופש ופיקניק מוסדרים של קק"ל המאפשרים הדלקת אש במתקנים ייעודיים בלבד.'
      : '';
    const audienceAdapted = state.isSenior || state.minAgeLabel?.includes('קשיש') || state.minAgeLabel?.includes('גיל הזהב')
      ? `מותאם עבור **${state.minAgeLabel}**`
      : `מותאם לגילאי **${state.minAgeLabel}**`;

    const weatherNotice = state.isFarFutureDate
      ? `📅 **שימו לב:** מועד הטיול הוא ${state.diffDays ? `בעוד ${state.diffDays} ימים` : 'מעבר ל-14 ימים'}, מעבר לטווח תחזית חיה. נתוני מזג האוויר המוצגים מבוססים על ממוצעים עונתיים ונתונים היסטוריים (**הערכה עונתית בערבון מוגבל ⚠️** ולא על תחזית חיה). מומלץ להתעדכן בתחזית חיה בימים הסמוכים ליציאה! 🗺️`
      : `הצלבת הנתונים המטאורולוגיים בוצעה מול **${weatherSource}** ונבדקו כל אזהרות הבטיחות. בחרו מסלול כדי לצפות בו על גבי המפה! 🗺️`;

    const introText = `${cityNotice}מצאתי עבורכם **${proposals.length} מסלולים נהדרים** המתאימים בדיוק להעדפות שלכם עבור **${state.timingLabel}** ב**${state.regionLabel}** (${audienceAdapted}):\n\n${weatherNotice}${rainWarning}${dogBanner}${wheelchairBanner}${conflictBanner}${bbqBanner}`;

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
    if (state.region === 'all') {
      resultOptions.unshift(
        { label: '🏞️ בצפון', value: 'באזור הצפון', field: 'region' },
        { label: '🌾 במרכז', value: 'באזור המרכז והשרון', field: 'region' },
        { label: '🏰 בירושלים', value: 'באזור ירושלים והשפלה', field: 'region' },
        { label: '🏜️ בדרום', value: 'באזור הדרום וים המלח', field: 'region' }
      );
    }
    if (rainWarning) {
      resultOptions.push({ label: '🌲 הצע מסלול מוצל במקום', value: 'מעדיפים יער מוצל ושבילי הליכה' });
    }

    // Eliminate dead LLM blocking delay (Finding H8) — Instant deterministic execution (<50ms)
    return {
      text: introText,
      state,
      options: resultOptions,
      proposals,
      toolActivity: state.isFarFutureDate
        ? `🤖 Agent BAAL Spatial Engine • 📡 הערכת מזג אוויר עונתית (היסטורית) • 🛡️ Guardrails Passed`
        : `🤖 Agent BAAL Spatial Engine • 📡 נשלפה תחזית ${weatherSource} • 🛡️ Guardrails Passed`,
    };
  }
}
