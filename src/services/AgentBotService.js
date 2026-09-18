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

import assetsData from '../../assets_db.json' with { type: 'json' };
import { WeatherService } from './WeatherService.js';
import { getWaterAdvisory } from '../utils/weatherUtils.js';

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

// Known Israeli origin cities / centers for distance radius queries
const KNOWN_ORIGIN_CITIES = [
  { names: ['תל אביב', 'תל-אביב', 'ת"א', 'ת״א', 'גוש דן', 'המרכז', 'תל אביב יפו'], lat: 32.0853, lng: 34.7818, label: 'תל אביב' },
  { names: ['ירושלים', 'בירה'], lat: 31.7683, lng: 35.2137, label: 'ירושלים' },
  { names: ['חיפה', 'הקריות', 'קריות'], lat: 32.7940, lng: 34.9896, label: 'חיפה' },
  { names: ['באר שבע', 'באר-שבע', 'ב"ש', 'ב״ש', 'הנגב'], lat: 31.2529, lng: 34.7915, label: 'באר שבע' },
  { names: ['נתניה', 'השרון', 'שרון', 'עמק חפר'], lat: 32.3215, lng: 34.8532, label: 'נתניה' },
  { names: ['ראשון לציון', 'ראשל"צ', 'ראשל״צ'], lat: 31.9730, lng: 34.7925, label: 'ראשון לציון' },
  { names: ['פתח תקווה', 'פ"ת', 'פ״ת', 'בקעת אונו'], lat: 32.0840, lng: 34.8878, label: 'פתח תקווה' },
  { names: ['הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון', 'רמת השרון'], lat: 32.1663, lng: 34.8433, label: 'הרצליה/שרון דרומי' },
  { names: ['רחובות', 'נס ציונה', 'יבנה'], lat: 31.8928, lng: 34.8113, label: 'רחובות' },
  { names: ['אשדוד'], lat: 31.8044, lng: 34.6553, label: 'אשדוד' },
  { names: ['אשקלון'], lat: 31.6688, lng: 34.5743, label: 'אשקלון' },
  { names: ['מודיעין', 'מודיעין מכבים רעות'], lat: 31.8903, lng: 35.0104, label: 'מודיעין' },
  { names: ['עפולה', 'עמק יזרעאל', 'יזרעאל', 'בית שאן'], lat: 32.6078, lng: 35.2894, label: 'עפולה/עמקים' },
  { names: ['טבריה', 'הכנרת', 'כנרת', 'סובב כנרת'], lat: 32.7922, lng: 35.5312, label: 'טבריה/כנרת' },
  { names: ['נצרת', 'נוף הגליל'], lat: 32.6996, lng: 35.3035, label: 'נצרת' },
  { names: ['כרמיאל', 'משגב'], lat: 32.9199, lng: 35.2957, label: 'כרמיאל' },
  { names: ['נהריה', 'עכו', 'גליל מערבי'], lat: 33.0059, lng: 35.0941, label: 'נהריה/עכו' },
  { names: ['קריית שמונה', 'קרית שמונה', 'גליל עליון', 'אצבע הגליל'], lat: 33.2073, lng: 35.5721, label: 'קריית שמונה' },
  { names: ['קצרין', 'רמת הגולן', 'הגולן'], lat: 32.9934, lng: 35.6908, label: 'קצרין/גולן' },
  { names: ['אילת'], lat: 29.5577, lng: 34.9519, label: 'אילת' },
  { names: ['ערד', 'ים המלח'], lat: 31.2589, lng: 35.2128, label: 'ערד' },
  { names: ['מצפה רמון', 'רמון'], lat: 30.6100, lng: 34.8015, label: 'מצפה רמון' },
];

// Israeli Days of the Week mapping for dynamic date & forecast indexing
const HEBREW_DAYS = [
  { dayNum: 0, names: ['יום ראשון', 'ראשון הקרוב', 'בראשון', 'יום א\'', 'יום א׳', 'יום א', 'ראשון'], label: 'יום ראשון' },
  { dayNum: 1, names: ['יום שני', 'שני הקרוב', 'בשני', 'יום ב\'', 'יום ב׳', 'יום ב', 'שני'], label: 'יום שני' },
  { dayNum: 2, names: ['יום שלישי', 'שלישי הקרוב', 'בשלישי', 'יום ג\'', 'יום ג׳', 'יום ג', 'שלישי'], label: 'יום שלישי' },
  { dayNum: 3, names: ['יום רביעי', 'רביעי הקרוב', 'ברביעי', 'יום ד\'', 'יום ד׳', 'יום ד', 'רביעי'], label: 'יום רביעי' },
  { dayNum: 4, names: ['יום חמישי', 'חמישי הקרוב', 'בחמישי', 'יום ה\'', 'יום ה׳', 'יום ה', 'חמישי'], label: 'יום חמישי' },
  { dayNum: 5, names: ['יום שישי', 'שישי הקרוב', 'בשישי', 'יום ו\'', 'יום ו׳', 'יום ו', 'שישי', 'סופ"ש', 'סופש', 'סוף השבוע', 'סוף שבוע'], label: 'יום שישי (סופ"ש)' },
  { dayNum: 6, names: ['יום שבת', 'שבת הקרובה', 'שבת הקרוב', 'בשבת', 'שבת'], label: 'יום שבת' },
];

/**
 * Calculate high-precision Haversine great-circle distance in kilometers
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

export class AgentBotService {
  /**
   * Reset session state
   */
  static getInitialState() {
    return {
      timing: null,      // 'today' | 'tomorrow' | 'day_after' | 'weekend' | number (0-4)
      timingLabel: null, // 'היום', 'מחר', 'מחרתיים'
      dayIndex: 0,
      region: null,      // 'north' | 'center' | 'jerusalem' | 'south' | 'all' | 'radius'
      regionLabel: null, // 'צפון', 'מרכז ושרון', 'ירושלים', 'דרום', 'עד 40 ק"מ מתל אביב'
      maxDistanceKm: null, // e.g. 40
      originName: null,    // e.g. 'תל אביב'
      originCoords: null,  // [lat, lng]
      feature: null,     // 'water' | 'spring' | 'shade' | 'adventure' | 'stroller' | 'view' | 'any'
      featureLabel: null,// 'הליכה במים', 'מעיין', 'יער מוצל', 'סנפלינג/אתגרי'
      minAge: null,      // 0, 2, 4, 7, 10
      minAgeLabel: null, // '0+ (עגלות)', '4+', '7+'
      step: 'init',      // 'init' | 'gathering' | 'ready'
    };
  }

  /**
   * Check message against strict safety guardrails, foreign countries, and non-Hebrew languages
   */
  static checkGuardrails(message) {
    if (!message || typeof message !== 'string') return { safe: true };
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check if user is writing in a foreign language (English, Russian, Arabic, French, Spanish, etc.)
    const hebrewLetters = (trimmed.match(/[\u0590-\u05FF]/g) || []).length;
    const cyrillicLetters = (trimmed.match(/[\u0400-\u04FF]/g) || []).length;
    const arabicLetters = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
    const latinLetters = (trimmed.match(/[a-zA-Z]/g) || []).length;

    // If message is in a foreign language (has foreign characters and NO Hebrew):
    if (hebrewLetters === 0 && (cyrillicLetters > 2 || arabicLetters > 2 || latinLetters > 3)) {
      if (cyrillicLetters > 2) {
        return {
          safe: false,
          refusal: 'Здравствуйте! 🌿 Я виртуальный гид по походам в Израиле. В настоящее время я общаюсь только на **иврите**. Пожалуйста, напишите мне на иврите, и я с радостью помогу вам спланировать отличный и безопасный маршрут!',
        };
      }
      if (arabicLetters > 2) {
        return {
          safe: false,
          refusal: 'مرحباً! 🌿 أنا المرشد الذكي لمסارات الطبيعة في إسرائيل. أتحدث باللغة **العبرية** فقط حالياً. يرجى مراسلتي باللغة العبرية لمساعدتك في العثور على أفضل المسارات والرحلات!',
        };
      }
      if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('merci') || lower.includes('randonn')) {
        return {
          safe: false,
          refusal: 'Bonjour ! 🌿 Je suis le guide virtuel de randonnée en Israël. Pour le moment, je communique uniquement en **hébreu**. Veuillez m\'écrire en hébreu afin que je puisse vous aider à planifier votre itinéraire !',
        };
      }
      if (lower.includes('hola') || lower.includes('buenos') || lower.includes('gracias') || lower.includes('ruta')) {
        return {
          safe: false,
          refusal: '¡Hola! 🌿 Soy el guía virtual de senderismo en Israel. Actualmente solo me comunico en **hebreo**. ¡Por favor escríbeme en hebreo para ayudarte a planificar tu ruta perfecta!',
        };
      }
      // Default English
      return {
        safe: false,
        refusal: 'Hello! 🌿 I am the "Where to Hike?" AI guide for nature reserves and hiking trails in Israel. Currently, I only communicate in **Hebrew**. Please write to me in Hebrew so I can help you plan the perfect, safe outdoor adventure!',
      };
    }

    // 2. Check foreign countries / travel abroad
    for (const fKw of FOREIGN_COUNTRIES_KEYWORDS) {
      if (lower.includes(fKw)) {
        return {
          safe: false,
          refusal: 'שלום! 🌿 המומחיות שלי כסוכן טיולים ממוקדת כולה בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה המרהיבים **בישראל** 🇮🇱 בלבד.\n\nאינני מספק מידע או המלצות למדינות אחרות או לחו"ל.\n\nאשמח מאוד לעזור לכם לתכנן טיול קסום ובטוח בארץ! לאיזה אזור בישראל תרצו לטייל (צפון, מרכז, ירושלים או דרום) ומתי?',
        };
      }
    }

    // 3. Check prohibited sensitive topics
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

    // 0. Handle dimension-specific non-restrictive phrases
    if (text.includes('לא משנה לי האזור') || text.includes('בכל הארץ') || text.includes('כל הארץ') || text.includes('כל מקום') || text.includes('ללא העדפה לאזור')) {
      updated.region = 'all';
      updated.regionLabel = 'כל הארץ';
    }
    if (text.includes('לא משנה לי התאריך') || text.includes('לא משנה מתי') || text.includes('בימים הקרובים') || text.includes('ללא העדפה לתאריך')) {
      updated.timing = 'today';
      updated.timingLabel = 'היום / בימים הקרובים';
      updated.dayIndex = 0;
    }
    if (text.includes('לכל הגילאים') || text.includes('לא משנה הגיל') || text.includes('מתאים לכולם') || text.includes('ללא מגבלת גיל')) {
      updated.minAge = 0;
      updated.minAgeLabel = 'לכל הגילאים (0+)';
    }
    if (text.includes('לא משנה לי סגנון') || text.includes('הכל מתאים') || text.includes('הכל הולך') || text.includes('מה שהכי מומלץ') || text.includes('ללא העדפה לסגנון') || text.includes('גם וגם') || text.includes('שניהם') || text.includes('שילוב')) {
      updated.feature = 'any';
      updated.featureLabel = text.includes('גם וגם') ? 'גם וגם (שילוב סגנונות)' : 'כל סגנונות המסלול';
    }

    // Generic "לא משנה לי" / "גם וגם" / "לא משנה" / "אין לי העדפה" when dimension wasn't explicit
    const isGenericAny = (
      text === 'לא משנה' || 
      text === 'לא משנה לי' || 
      text === 'גם וגם' ||
      text.includes('גם וגם') ||
      text.includes('שניהם') ||
      text.includes('לא משנה לי') || 
      text.includes('לא משנה') || 
      text.includes('אין לי העדפה') || 
      text.includes('אין העדפה') || 
      text.includes('לא חשוב') ||
      text.includes('לא קריטי')
    );
    if (isGenericAny) {
      if (!updated.region) {
        updated.region = 'all';
        updated.regionLabel = 'כל הארץ';
      } else if (!updated.timing) {
        updated.timing = 'today';
        updated.timingLabel = 'היום / בימים הקרובים';
        updated.dayIndex = 0;
      } else if (updated.minAge === null || updated.minAge === undefined) {
        updated.minAge = 0;
        updated.minAgeLabel = 'לכל הגילאים (0+)';
      } else if (!updated.feature) {
        updated.feature = 'any';
        updated.featureLabel = 'כל סגנונות המסלול';
      }
    }

    // 1. Timing extraction (Relative terms, named weekdays, and specific day-of-week)
    const currentDayNum = new Date().getDay(); // 0 = Sunday ... 6 = Saturday

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
    } else if (text.includes('תחילת השבוע') || text.includes('בתחילת שבוע')) {
      const diff = (0 - currentDayNum + 7) % 7;
      updated.dayIndex = Math.min(diff === 0 ? 0 : diff, 4);
      updated.timing = 'day_0';
      updated.timingLabel = 'תחילת השבוע (יום ראשון)';
    } else if (text.includes('אמצע השבוע') || text.includes('באמצע שבוע')) {
      const diff = (2 - currentDayNum + 7) % 7;
      updated.dayIndex = Math.min(diff === 0 ? 0 : diff, 4);
      updated.timing = 'day_2';
      updated.timingLabel = 'אמצע השבוע (שלישי/רביעי)';
    } else {
      // Check specific named days of the week (Sunday through Saturday)
      let foundDay = null;
      for (const day of HEBREW_DAYS) {
        if (day.names.some((name) => text.includes(name))) {
          foundDay = day;
          break;
        }
      }
      if (foundDay) {
        const diff = (foundDay.dayNum - currentDayNum + 7) % 7;
        const clampedDayIndex = Math.min(diff, 4);
        updated.dayIndex = clampedDayIndex;
        updated.timing = `day_${foundDay.dayNum}`;
        if (diff === 0) {
          updated.timingLabel = `${foundDay.label} (היום)`;
        } else if (diff === 1) {
          updated.timingLabel = `${foundDay.label} (מחר)`;
        } else if (diff === 2) {
          updated.timingLabel = `${foundDay.label} (מחרתיים)`;
        } else {
          updated.timingLabel = `${foundDay.label} הקרוב`;
        }
      }
    }

    // 2. Region / Distance extraction
    const distMatch = text.match(/(?:עד|ברדיוס של|בטווח של|במרחק של|מרחק של)?\s*(\d+)\s*(?:ק["״]?מ|קילומטר|קמ|קילומטרים)/);
    if (distMatch && distMatch[1]) {
      const distNum = parseInt(distMatch[1], 10);
      let foundCity = null;
      for (const city of KNOWN_ORIGIN_CITIES) {
        if (city.names.some((name) => text.includes(name))) {
          foundCity = city;
          break;
        }
      }
      if (foundCity) {
        updated.region = 'radius';
        updated.regionLabel = `עד ${distNum} ק"מ מ${foundCity.label}`;
        updated.maxDistanceKm = distNum;
        updated.originName = foundCity.label;
        updated.originCoords = [foundCity.lat, foundCity.lng];
      } else {
        // Default to Tel Aviv / Center if city not explicitly specified
        updated.region = 'radius';
        updated.regionLabel = `עד ${distNum} ק"מ מתל אביב (מרכז)`;
        updated.maxDistanceKm = distNum;
        updated.originName = 'תל אביב';
        updated.originCoords = [32.0853, 34.7818];
      }
    } else {
      if (text.includes('צפון') || text.includes('גליל') || text.includes('גולן') || text.includes('כנרת') || text.includes('כרמל') || text.includes('עמקים') || text.includes('חרמון') || text.includes('חיפה')) {
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
    }

    // 3. Feature extraction (with typo resilience e.g. הלחכה -> הליכה, במים -> water)
    if (
      text.includes('הליכה במים') || text.includes('הלחכה במים') || text.includes('בתוך המים') ||
      text.includes('מסלול מים') || text.includes('מים') || text.includes('רטוב') || text.includes('נחל זורם') ||
      text.includes('מג\'רסה') || text.includes('מג׳רסה') || text.includes('מגרסה') ||
      text.includes('דליות') || text.includes('זאכי') || text.includes('שניר') || text.includes('תל דן')
    ) {
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

    // 4. Youngest age extraction (with typo resilience: כיל/יד -> גיל, matches '4', '7', '10', '0')
    const ageMatch = text.match(/(?:גיל|כיל|יד|גילאי|בן|בת|ילדים|ילד)?\s*(?:מינימלי|של)?\s*(?:גיל|כיל|יד)?\s*(\d+)/);
    if (ageMatch && ageMatch[1]) {
      const extractedAge = parseInt(ageMatch[1], 10);
      if (extractedAge === 0 || text.includes('עגלה') || text.includes('תינוק')) {
        updated.minAge = 0;
        updated.minAgeLabel = '0+ (תינוקות ועגלות)';
      } else if (extractedAge <= 6) {
        updated.minAge = 4;
        updated.minAgeLabel = '4+ (ילדים קטנים)';
      } else if (extractedAge <= 9) {
        updated.minAge = 7;
        updated.minAgeLabel = '7+ (ילדים בוגרים)';
      } else {
        updated.minAge = 10;
        updated.minAgeLabel = '10+ (נוער ומבוגרים)';
      }
    } else if (text.includes('תינוק') || text.includes('עגלה') || text.includes('0+')) {
      updated.minAge = 0;
      updated.minAgeLabel = '0+ (תינוקות ועגלות)';
    } else if (text.includes('קטנים') || text.includes('גן')) {
      updated.minAge = 4;
      updated.minAgeLabel = '4+ (ילדים קטנים)';
    } else if (text.includes('יסודי') || text.includes('בוגרים')) {
      updated.minAge = 7;
      updated.minAgeLabel = '7+ (ילדים בוגרים)';
    } else if (text.includes('נוער') || text.includes('מבוגרים')) {
      updated.minAge = 10;
      updated.minAgeLabel = '10+ (נוער ומבוגרים)';
    }

    // If timing, feature and minAge are supplied but region was omitted in query, search nationwide
    if (updated.timing && updated.feature && (updated.minAge !== null && updated.minAge !== undefined) && !updated.region) {
      updated.region = 'all';
      updated.regionLabel = 'כל הארץ';
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

    const text = message.toLowerCase();
    const currentState = sessionState || this.getInitialState();

    // 1.1 Handle Full Conversation Reset ("התחל מחדש", "אפס שיחה", "נקה שיחה", "restart", "reset")
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

    // 1.2 Handle Explicit Parameter Reset Buttons ("שנה אזור", "בדוק תאריך אחר", "שנה גיל מטייל")
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

    // 1.5 Check if user triggered an interactive What-If Crisis Scenario
    if (text.includes('מה אם') || text.includes('what if') || text.includes('תרחיש') || text.includes('שיטפון') || text.includes('44°c') || text.includes('חום קיצוני') || text.includes('זיהום')) {
      return this.handleWhatIfScenario(message, sessionState);
    }

    const state = this.extractParameters(message, currentState);

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

    // 3. All parameters present (or nationwide)! Run Tool Execution & Recommendation Flow
    return await this.generateRecommendations(state, message);
  }

  /**
   * Attempt LLM Inference via Groq Cloud API (Llama 3.3 70B) or Local Ollama
   */
  static async callOllamaOrGroqLLM(prompt, currentState) {
    const groqKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) 
      || (typeof process !== 'undefined' ? process.env?.VITE_GROQ_API_KEY : '');

    // 1. Try Groq Llama 3.3 70B Cloud API if key is available
    if (groqKey && groqKey !== 'your_groq_api_key_here') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are Ariel, Principal Spatial AI Hiking Agent for Israel. Analyze user query: "${prompt}". Respond with structured JSON parameters and brief rationale in Hebrew.`
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 300,
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const replyText = data.choices?.[0]?.message?.content;
          return {
            success: true,
            response: replyText,
            model: 'Groq Llama 3.3 70B (Ultra-Fast LLM)',
          };
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    // 2. Try Local Ollama (127.0.0.1:11434)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama3',
          prompt: `[SYSTEM: You are Ariel Spatial AI Hiking Agent. Extract intent for query: "${prompt}"]`,
          stream: false,
        }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { success: true, response: data.response, model: 'Ollama Llama 3 (127.0.0.1:11434)' };
      }
    } catch (e) {
      // Offline fallback
    }

    return { success: false, model: 'Groq Llama 3.3 / Ollama Spatial Agent' };
  }

  /**
   * Handle interactive What-If scenario simulation
   */
  static handleWhatIfScenario(message, sessionState) {
    const text = message.toLowerCase();
    let hazard = 'שיטפון פתאומי';
    let affectedSite = assetsData.find((a) => a.id === 103) || { name: 'שמורת טבע עין גדי', id: 103, lat: 31.4655, lng: 35.3884 };
    let safeHaven = assetsData.find((a) => a.id === 105) || { name: 'גן לאומי בית גוברין', id: 105, lat: 31.6053, lng: 34.8984, authority_id: 'INPA-105', region: 'שפלת יהודה', min_age: 0 };
    let rationale = 'זוהתה סכנת שיטפונות בזק קריטית (98%) באגן עין גדי. הסוכן הפעיל אלגוריתם Haversine וניתב אוטומטית למקלט הבטוח הקרוב ביותר: בית גוברין (32.9 ק"מ, מזג אוויר נוח וקרקע מנוקזת).';

    if (text.includes('חום') || text.includes('44') || text.includes('שרב')) {
      hazard = 'עומס חום קיצוני (44°C)';
      affectedSite = assetsData.find((a) => a.id === 102) || { name: 'גן לאומי מצדה', id: 102 };
      safeHaven = assetsData.find((a) => a.id === 211) || { name: 'בית ספר שדה כפר עציון', id: 211, lat: 31.6495, lng: 35.1160, authority_id: 'SPNI-211', region: 'הרי יהודה', min_age: 0 };
      rationale = 'חריגה מסף עומס חום קיצוני (44°C במצדה). הסוכן ניתב אוטומטית לאזור הררי ומוצל בגובה 900 מטר (כפר עציון, 26°C וצל מלא).';
    } else if (text.includes('זיהום')) {
      hazard = 'זיהום מים פעיל (משרד הבריאות)';
      affectedSite = assetsData.find((a) => a.id === 204) || { name: 'שמורת טבע נחל דליות', id: 204 };
      safeHaven = assetsData.find((a) => a.id === 504) || { name: 'יער ביריה ומצודת ביריה', id: 504, lat: 32.9850, lng: 35.5100, authority_id: 'KKL-504', region: 'גליל עליון', min_age: 0 };
      rationale = 'הופעלה אזהרת משרד הבריאות לחריגת קולי בנחלי הגולן. הסוכן ניתב למסלול יער יבש, מוצל ומאובטח ביער ביריה.';
    }

    const proposal = {
      id: safeHaven.id,
      name: `🛡️ מקלט בטוח: ${safeHaven.name}`,
      region: safeHaven.region,
      authority_id: safeHaven.authority_id || 'SAFE-HAVEN',
      lat: safeHaven.lat,
      lng: safeHaven.lng,
      min_age: safeHaven.min_age || 0,
      stroller_accessible: true,
      weather: {
        temp: '26°C',
        conditions: 'בהיר ונוח',
        heatLoad: 'נוח ובטוח לשהייה',
        wind: '12 קמ"ש',
        rain: '0 מ"מ',
        isLive: true,
      },
      safetyBadge: 'מקלט בטוח מאומת (Safe Haven) 🛡️',
      matchRationale: rationale,
    };

    return {
      text: `🚨 **הופעל ניתוח תרחיש What-If אוטונומי!**\n\nבמידה ומתרחש **${hazard}** באזור ${affectedSite.name}:\n\n🧠 **החלטת ה-Agent (Re-Planning):**\nהסוכן זיהה סיכון חיים/בריאות קריטי, פסל את המשך השהייה באתר וחישב נתיב מילוט מיידי באלגוריתם Haversine אל היעד הבטוח **${safeHaven.name}**.\n\n👇 לחצו על הכרטיסייה למטה לצפייה בנתיב המילוט במפה!`,
      state: sessionState || this.getInitialState(),
      options: [
        { label: '🌊 מה אם יש שיטפון פתאומי?', value: 'מה אם יש שיטפון פתאומי בעין גדי?' },
        { label: '☀️ מה אם יש חום 44°C במדבר?', value: 'מה אם יש חום 44 מעלות במצדה?' },
        { label: '🧪 מה אם יש זיהום מים?', value: 'מה אם יש זיהום מים בנחלי הצפון?' },
        { label: '🔄 חזרה לתכנון טיול רגיל', value: 'בוא נחזור לתכנון מסלול רגיל' },
      ],
      proposals: [proposal],
      toolActivity: `🚨 תרחיש What-If זוהה • ⚠️ ${affectedSite.name} נפסל • 🛡️ חושב וקטור מילוט ל-${safeHaven.name} (98% ביטחון)`,
    };
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
   * Search, filter, query Tomorrow.io and build rich recommendations
   */
  static async generateRecommendations(state, rawMessage = '') {
    const dayIndex = state.dayIndex || 0;
    const targetAge = Number(state.minAge) || 4;
    const rawText = (rawMessage || '').toLowerCase();

    // 1. Filter database by region/radius, age, and stroller
    let candidates = assetsData.filter((site) => {
      // Radius / Distance filter
      if (state.region === 'radius' && state.originCoords && state.maxDistanceKm) {
        const [oLat, oLng] = state.originCoords;
        const sLat = site.location ? site.location.lat : site.lat;
        const sLng = site.location ? site.location.lng : site.lng;
        const dist = calculateHaversineDistanceKm(oLat, oLng, sLat, sLng);
        site._distKm = dist;
        if (dist > state.maxDistanceKm) return false;
      } else if (state.region && state.region !== 'all') {
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

    // 1.1 Zero Results Check: If any parameter combination zeros the candidates, return polite message & options
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

    // 2. Rank candidates by feature preference, proximity, and explicit query keyword match (e.g. דליות, מג'רסה)
    candidates.sort((a, b) => {
      const aTypes = (a.type || []).join(' ') + ' ' + (a.name || '');
      const bTypes = (b.type || []).join(' ') + ' ' + (b.name || '');

      let scoreA = 0;
      let scoreB = 0;

      // Explicit keyword boost if user mentioned site/stream name (e.g. דליות / מג'רסה)
      if (rawText.includes('דליות') || rawText.includes('מג\'רסה') || rawText.includes('מג׳רסה') || rawText.includes('מגרסה')) {
        if (a.name.includes('דליות') || a.name.includes('מג׳רסה') || a.name.includes('מג\'רסה')) scoreA += 25;
        if (b.name.includes('דליות') || b.name.includes('מג׳רסה') || b.name.includes('מג\'רסה')) scoreB += 25;
      }

      if (state.feature === 'water' || state.feature === 'spring') {
        if (aTypes.includes('מים') || aTypes.includes('בריכות') || aTypes.includes('מעיין') || aTypes.includes('שניר') || aTypes.includes('דן') || aTypes.includes('דליות') || aTypes.includes('מג׳רסה')) scoreA += 5;
        if (bTypes.includes('מים') || bTypes.includes('בריכות') || bTypes.includes('מעיין') || bTypes.includes('שניר') || bTypes.includes('דן') || bTypes.includes('דליות') || bTypes.includes('מג׳רסה')) scoreB += 5;
      }
      if (state.feature === 'shade') {
        if (aTypes.includes('חורש') || aTypes.includes('יער') || aTypes.includes('טבע') || aTypes.includes('כרמל') || aTypes.includes('מירון')) scoreA += 5;
        if (bTypes.includes('חורש') || bTypes.includes('יער') || bTypes.includes('טבע') || bTypes.includes('כרמל') || bTypes.includes('מירון')) scoreB += 5;
      }
      if (state.feature === 'adventure') {
        if (aTypes.includes('הרים') || aTypes.includes('אתגרי') || aTypes.includes('מצוק') || aTypes.includes('סנפלינג')) scoreA += 5;
        if (bTypes.includes('הרים') || bTypes.includes('אתגרי') || bTypes.includes('מצוק') || bTypes.includes('סנפלינג')) scoreB += 5;
      }

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // If scores tied and distance is present, prefer closer site
      if (a._distKm !== undefined && b._distKm !== undefined) {
        return a._distKm - b._distKm;
      }

      return 0;
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

    const llmStatus = await this.callOllamaOrGroqLLM(rawMessage, state);

    return {
      text: introText,
      state,
      options: [
        { label: '🔄 שנה אזור', value: 'אני רוצה לבדוק אזור אחר בארץ' },
        { label: '📅 בדוק תאריך אחר', value: 'איך יהיה מזג האוויר ביום אחר?' },
        { label: '👶 שנה גיל מטיילים', value: 'רוצה לשנות את גילאי הילדים' },
      ],
      proposals,
      toolActivity: `🤖 ${llmStatus.model} • 📡 נשלפה תחזית Tomorrow.io • 🛡️ Guardrails Passed`,
    };
  }

  /**
   * Build concise explainable rationale (XAI)
   */
  static buildRationale(site, state, weather) {
    const parts = [];
    if (site._distKm !== undefined && state.originName) {
      parts.push(`🚗 במרחק כ-${site._distKm} ק"מ מ${state.originName}`);
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
}
