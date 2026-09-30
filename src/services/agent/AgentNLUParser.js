/**
 * AgentNLUParser.js - Natural Language Understanding, Intent Extraction & Guardrails
 * 
 * Part of Agent BAAL Architecture.
 * Handles Hebrew linguistic variations, age formats, date parsing,
 * typo corrections, and strict safety guardrails.
 */

import { KNOWN_ORIGIN_CITIES } from './AgentGeoEngine.js';

// Strict Prohibited Topics (Politics, Violence, Weapons, Drugs, Hate, Jailbreak/Prompt Injection)
export const PROHIBITED_KEYWORDS = [
  'פוליטיק', 'בחירות', 'ממשלה', 'ביבי', 'נתניהו', 'לפיד', 'גנץ', 'כנסת', 'מפלג',
  'נשק', 'אקדח', 'רובה', 'טיל', 'פצצה', 'סמים', 'מריחואנה', 'קוקאין', 'סם',
  'אלימות', 'רצח', 'פיגוע', 'מלחמה', 'הרג', 'לפגוע', 'לתקוף',
  'system prompt', 'prompt injection', 'ignore previous instructions', 'architecture', 'api key', 'secret',
  'מי תכנת אותך', 'איזה מודל אתה', 'הדלף', 'קוד מקור'
];

// Foreign countries & abroad keywords
export const FOREIGN_COUNTRIES_KEYWORDS = [
  'חו"ל', 'חול', 'חו״ל', 'בחו"ל', 'בחול', 'בחו״ל', 'חוץ לארץ', 'בחוץ לארץ', 'מחוץ לישראל',
  'מדינה אחרת', 'מדינות אחרות', 'באירופה', 'אירופה', 'ארה"ב', 'ארצות הברית', 'ארה״ב',
  'יוון', 'קפריסין', 'איטליה', 'צרפת', 'ספרד', 'גרמניה', 'שוויץ', 'אוסטריה', 'הולנד', 'לונדון', 'פריז',
  'תאילנד', 'הודו', 'יפן', 'סיני', 'מצרים', 'ירדן', 'פטרה', 'גיאורגיה', 'גאורגיה', 'טורקיה', 'תורכיה',
  'דובאי', 'אבו דאבי', 'מונטנגרו', 'אלפים', 'דולומיטים', 'רומא'
];

// Dog / pet keywords for safety warning (nature reserves prohibit dogs)
export const DOG_KEYWORDS = [
  'כלב', 'כלבה', 'כלבים', 'כלבלב', 'גור כלבים', 'גורים',
  'חיית מחמד', 'חיות מחמד', 'dog', 'dogs', 'pet'
];

// Hebrew month names for calendar date parsing
export const HEBREW_MONTHS = [
  { names: ['ינואר', 'ינו', 'jan'], num: 1 },
  { names: ['פברואר', 'פבר', 'feb'], num: 2 },
  { names: ['מרץ', 'מרס', 'mar'], num: 3 },
  { names: ['אפריל', 'אפר', 'apr'], num: 4 },
  { names: ['מאי', 'may'], num: 5 },
  { names: ['יוני', 'jun'], num: 6 },
  { names: ['יולי', 'jul'], num: 7 },
  { names: ['אוגוסט', 'אוג', 'aug'], num: 8 },
  { names: ['ספטמבר', 'ספט', 'sep'], num: 9 },
  { names: ['אוקטובר', 'אוק', 'oct'], num: 10 },
  { names: ['נובמבר', 'נוב', 'nov'], num: 11 },
  { names: ['דצמבר', 'דצ', 'dec'], num: 12 },
];

// Common typo corrections for region and feature keywords
export const TYPO_CORRECTIONS = {
  // Region typos
  'גלליל': 'גליל', 'גאליל': 'גליל', 'גלייל': 'גליל',
  'ירושליים': 'ירושלים', 'ירושלאים': 'ירושלים',
  'גולאן': 'גולן',
  'כנררת': 'כנרת', 'כינרת': 'כנרת',
  'חרמן': 'חרמון',
  // Feature typos
  'סנפליג': 'סנפלינג', 'סנפאלינג': 'סנפלינג', 'סנפליינג': 'סנפלינג',
  'מוצאל': 'מוצל', 'מצל': 'מוצל', 'מוצלל': 'מוצל',
  'הלחכה': 'הליכה',
  // Site name typos
  'עין גידי': 'עין גדי', 'עין-גידי': 'עין גדי', 'עינגדי': 'עין גדי',
  'מסדה': 'מצדה', 'מאסדה': 'מצדה', 'מסאדה': 'מצדה',
  'תל-דן': 'תל דן', 'תלדן': 'תל דן',
  'בית גוברין': 'בית גוברין', 'בית-גוברין': 'בית גוברין',
};

// Israeli Days of the Week mapping for dynamic date & forecast indexing
export const HEBREW_DAYS = [
  { dayNum: 0, names: ['יום ראשון', 'ראשון הקרוב', 'בראשון', 'יום א\'', 'יום א׳', 'יום א', 'ראשון'], label: 'יום ראשון' },
  { dayNum: 1, names: ['יום שני', 'שני הקרוב', 'בשני', 'יום ב\'', 'יום ב׳', 'יום ב', 'שני'], label: 'יום שני' },
  { dayNum: 2, names: ['יום שלישי', 'שלישי הקרוב', 'בשלישי', 'יום ג\'', 'יום ג׳', 'יום ג', 'שלישי'], label: 'יום שלישי' },
  { dayNum: 3, names: ['יום רביעי', 'רביעי הקרוב', 'ברביעי', 'יום ד\'', 'יום ד׳', 'יום ד', 'רביעי'], label: 'יום רביעי' },
  { dayNum: 4, names: ['יום חמישי', 'חמישי הקרוב', 'בחמישי', 'יום ה\'', 'יום ה׳', 'יום ה', 'חמישי'], label: 'יום חמישי' },
  { dayNum: 5, names: ['יום שישי', 'שישי הקרוב', 'בשישי', 'יום ו\'', 'יום ו׳', 'יום ו', 'שישי', 'סופ"ש', 'סופש', 'סוף השבוע', 'סוף שבוע'], label: 'יום שישי (סופ"ש)' },
  { dayNum: 6, names: ['יום שבת', 'שבת הקרובה', 'שבת הקרוב', 'בשבת', 'שבת'], label: 'יום שבת' },
];

// Hebrew number words mapping for textual age parsing
export const HEBREW_AGE_WORDS = [
  { word: 'שמונה עשרה', age: 18 },
  { word: 'שמונה עשר', age: 18 },
  { word: 'שבע עשרה', age: 17 },
  { word: 'שבעה עשר', age: 17 },
  { word: 'שש עשרה', age: 16 },
  { word: 'שישה עשר', age: 16 },
  { word: 'חמש עשרה', age: 15 },
  { word: 'חמישה עשר', age: 15 },
  { word: 'ארבע עשרה', age: 14 },
  { word: 'ארבעה עשר', age: 14 },
  { word: 'שלוש עשרה', age: 13 },
  { word: 'שלושה עשר', age: 13 },
  { word: 'שתים עשרה', age: 12 },
  { word: 'שנים עשר', age: 12 },
  { word: 'אחת עשרה', age: 11 },
  { word: 'אחד עשר', age: 11 },
  { word: 'שנתיים וחצי', age: 2.5 },
  { word: 'שנתיים', age: 2 },
  { word: 'שנה וחצי', age: 1.5 },
  { word: 'חצי שנה', age: 0.5 },
  { word: 'עשרה', age: 10 },
  { word: 'עשר', age: 10 },
  { word: 'תשעה', age: 9 },
  { word: 'תשע', age: 9 },
  { word: 'שמונה', age: 8 },
  { word: 'שבעה', age: 7 },
  { word: 'שבע', age: 7 },
  { word: 'שישה', age: 6 },
  { word: 'שש', age: 6 },
  { word: 'חמישה', age: 5 },
  { word: 'חמש', age: 5 },
  { word: 'ארבעה', age: 4 },
  { word: 'ארבע', age: 4 },
  { word: 'שלושה', age: 3 },
  { word: 'שלוש', age: 3 },
  { word: 'שתיים', age: 2 },
  { word: 'שניים', age: 2 },
  { word: 'אחת', age: 1 },
  { word: 'אחד', age: 1 },
  { word: 'שנה', age: 1 },
  { word: 'חצי', age: 0.5 },
  { word: 'אפס', age: 0 },
];

/**
 * Apply known typo corrections to Hebrew input
 */
export function applyTypoCorrections(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.toLowerCase();
  for (const [typo, fix] of Object.entries(TYPO_CORRECTIONS)) {
    if (cleaned.includes(typo)) {
      cleaned = cleaned.replaceAll(typo, fix);
    }
  }
  return cleaned;
}

/**
 * Check message against strict safety guardrails, foreign countries, and non-Hebrew languages
 */
export function checkGuardrails(message) {
  if (!message || typeof message !== 'string') return { safe: true };
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Foreign language check
  const hebrewLetters = (trimmed.match(/[\u0590-\u05FF]/g) || []).length;
  const cyrillicLetters = (trimmed.match(/[\u0400-\u04FF]/g) || []).length;
  const arabicLetters = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
  const latinLetters = (trimmed.match(/[a-zA-Z]/g) || []).length;

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
        refusal: 'مرحباً! 🌿 أنا المرشد الذكي למסארות الطبيعة في إسرائيل. أتحدث بالלغة **العبرية** فقط حالياً. يرجى مراسلتي بالלغة العبرية لمساعدتك في العثور על أفضل המסارات والرحلات!',
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
    return {
      safe: false,
      refusal: 'Hello! 🌿 I am the "Where to Hike?" AI guide for nature reserves and hiking trails in Israel. Currently, I only communicate in **Hebrew**. Please write to me in Hebrew so I can help you plan the perfect, safe outdoor adventure!',
    };
  }

  // 2. Foreign countries / travel abroad
  for (const fKw of FOREIGN_COUNTRIES_KEYWORDS) {
    if (lower.includes(fKw)) {
      return {
        safe: false,
        refusal: 'שלום! 🌿 המומחיות שלי כסוכן טיולים ממוקדת כולה בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה המרהיבים **בישראל** 🇮🇱 בלבד.\n\nאינני מספק מידע או המלצות למדינות אחרות או לחו"ל.\n\nאשמח מאוד לעזור לכם לתכנן טיול קסום ובטוח בארץ! לאיזה אזור בישראל תרצו לטייל (צפון, מרכז, ירושלים או דרום) ומתי?',
      };
    }
  }

  // 3. Prohibited sensitive topics
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
 * Parse and extract youngest hiker age from Hebrew text (numeric and textual phrases)
 */
export function parseAgeFromText(text) {
  if (!text || typeof text !== 'string') return null;

  const foundAges = [];

  // 1. Explicit Hebrew age words after age markers
  for (const item of HEBREW_AGE_WORDS) {
    if (item.word === 'שנתיים' && text.includes('שנתיים וחצי')) continue;
    if (item.word === 'שנה' && (text.includes('שנה וחצי') || text.includes('חצי שנה'))) continue;
    const escapedWord = item.word.replace(/\s+/g, '\\s+');
    const prefixRegex = new RegExp(
      `(?:בן|בת|בני|בנות|בגיל|בגילאי|לגיל|לגילאי|גיל|גילאי|כיל|יד|מגיל|ילד\\s+בן|ילדה\\s+בת|ילדים\\s+בני|תינוק\\s+בן|פעוט\\s+בן|הילד(?:\\s+שלי)?\\s+בן|הילדה(?:\\s+שלי)?\\s+בת)\\s+(?:ה-?|ה)?${escapedWord}(?:\\s+וחצי|\\s+שנים|\\s+שנה)?`,
      'gi'
    );
    if (prefixRegex.test(text)) {
      foundAges.push(item.age);
    }
  }

  // Standalone compound age terms
  if (/(?:ילד|ילדה|פעוט|תינוק|מטייל|הילד|הילדה|הילדים)?\s*(?:בן|בת|בני)?\s*(?:שנה וחצי)/i.test(text) && (text.includes('ילד') || text.includes('תינוק') || text.includes('פעוט') || text.includes('בן') || text.includes('בת') || text.includes('גיל'))) {
    foundAges.push(1.5);
  } else if (/(?:ילד|ילדה|פעוט|תינוק|מטייל|הילד|הילדה|הילדים)?\s*(?:בן|בת|בני)?\s*(?:חצי שנה)/i.test(text) && (text.includes('ילד') || text.includes('תינוק') || text.includes('פעוט') || text.includes('בן') || text.includes('בת') || text.includes('גיל'))) {
    foundAges.push(0.5);
  }
  if (/(?:ילד|ילדה|פעוט|תינוק|הילד|הילדה|הילדים)?\s*(?:בן|בת|בני)?\s*(?:שנתיים וחצי)/i.test(text)) {
    foundAges.push(2.5);
  } else if (/(?:ילד|ילדה|פעוט|תינוק|הילד|הילדה|הילדים)?\s*(?:בן|בת|בני)?\s*(?:שנתיים)/i.test(text)) {
    foundAges.push(2);
  }

  // 2. Numeric age matches & compound multiple ages/ranges
  const compoundRegex = /(?:בן|בת|בני|בנות|בגיל|בגילאי|לגיל|לגילאי|גיל|גילאי|כיל|יד|מגיל|ילד\s+בן|ילדה\s+בת|הילד(?:\s+שלי)?\s+בן|הילדה(?:\s+שלי)?\s+בת)\s*(?:של|ה-?|ה)?\s*(\d+(?:\.\d+)?)\s*(?:-|–|עד|ו-|ו\s*|,|\s+וגם\s+)\s*(?:ה-?|ה)?(\d+(?:\.\d+)?)/gi;
  let match;
  while ((match = compoundRegex.exec(text)) !== null) {
    if (match[1]) foundAges.push(parseFloat(match[1]));
    if (match[2]) foundAges.push(parseFloat(match[2]));
  }

  const singleNumericRegex = /(?:בן|בת|בני|בנות|בגיל|בגילאי|לגיל|לגילאי|גיל|גילאי|כיל|יד|מגיל|ילד\s+בן|ילדה\s+בת|הילד(?:\s+שלי)?\s+בן|הילדה(?:\s+שלי)?\s+בת)\s*(?:של|ה-?|ה)?\s*(\d+(?:\.\d+)?)/gi;
  while ((match = singleNumericRegex.exec(text)) !== null) {
    if (match[1]) {
      foundAges.push(parseFloat(match[1]));
    }
  }

  const yearsRegex = /(?:ילד|ילדה|ילדים|פעוט|תינוק|מטייל)\s*(?:שלי|שלנו)?\s*(\d+)\s*(?:שנים|שנה)/gi;
  while ((match = yearsRegex.exec(text)) !== null) {
    if (match[1]) {
      foundAges.push(parseInt(match[1], 10));
    }
  }

  // 3. Categorical age keywords (if no explicit number found)
  if (foundAges.length === 0) {
    if (text.includes('תינוק') || text.includes('תינוקת') || text.includes('תינוקות') || text.includes('פעוט') || text.includes('פעוטות') || text.includes('עגלה') || text.includes('עגלות') || text.includes('0+')) {
      foundAges.push(0);
    } else if (text.includes('קטנים') || text.includes('קטנטנים') || text.includes('גן') || text.includes('ילדי גן')) {
      foundAges.push(4);
    } else if (text.includes('יסודי') || text.includes('ילדי יסודי') || text.includes('בוגרים') || text.includes('ילדים בוגרים')) {
      foundAges.push(7);
    } else if (text.includes('נוער') || text.includes('מתבגרים') || text.includes('מבוגרים') || text.includes('חטיבה') || text.includes('תיכון')) {
      foundAges.push(10);
    }
  }

  if (foundAges.length > 0) {
    return Math.min(...foundAges);
  }

  return null;
}

/**
 * Parse user message and extract any of the 4 mandatory parameters
 */
export function extractParameters(message, currentState) {
  let text = applyTypoCorrections(message);
  const updated = { ...currentState };

  // 0. Non-restrictive phrases
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

  // Surprise Me shortcut
  if (text.includes('הפתע אותי') || text.includes('הפתעה') || text.includes('תפתיע אותי')) {
    updated.timing = updated.timing || 'today';
    updated.timingLabel = updated.timingLabel || 'היום';
    updated.dayIndex = updated.dayIndex !== undefined ? updated.dayIndex : 0;
    updated.region = updated.region || 'all';
    updated.regionLabel = updated.regionLabel || 'כל הארץ';
    updated.feature = updated.feature || 'any';
    updated.featureLabel = updated.featureLabel || 'מסלול מובחר מומלץ';
    if (updated.minAge === null || updated.minAge === undefined) {
      updated.minAge = 4;
      updated.minAgeLabel = '4+';
    }
  }

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

  // 1. Timing extraction
  const currentDayNum = new Date().getDay();

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
    // Calendar date parsing
    let calendarParsed = false;
    const calMatch = text.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/);
    if (calMatch) {
      const day = parseInt(calMatch[1], 10);
      const month = parseInt(calMatch[2], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const now = new Date();
        const targetYear = calMatch[3] ? (calMatch[3].length === 2 ? 2000 + parseInt(calMatch[3], 10) : parseInt(calMatch[3], 10)) : now.getFullYear();
        const target = new Date(targetYear, month - 1, day);
        if (target < now) target.setFullYear(target.getFullYear() + 1);
        const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
        updated.dayIndex = Math.max(0, Math.min(diffDays, 4));
        updated.timing = `calendar_${day}_${month}`;
        updated.timingLabel = `${day}/${month}` + (diffDays === 0 ? ' (היום)' : diffDays === 1 ? ' (מחר)' : ` (בעוד ${diffDays} ימים)`);
        calendarParsed = true;
      }
    }
    if (!calendarParsed) {
      for (const hm of HEBREW_MONTHS) {
        for (const mName of hm.names) {
          const monthRegex = new RegExp(`(?:ה-?)?(\\d{1,2})\\s*(?:ב|ל)${mName}`);
          const mMatch = text.match(monthRegex);
          if (mMatch) {
            const day = parseInt(mMatch[1], 10);
            if (day >= 1 && day <= 31) {
              const now = new Date();
              const target = new Date(now.getFullYear(), hm.num - 1, day);
              if (target < now) target.setFullYear(target.getFullYear() + 1);
              const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
              updated.dayIndex = Math.max(0, Math.min(diffDays, 4));
              updated.timing = `calendar_${day}_${hm.num}`;
              updated.timingLabel = `${day} ב${mName}` + (diffDays === 0 ? ' (היום)' : diffDays === 1 ? ' (מחר)' : ` (בעוד ${diffDays} ימים)`);
              calendarParsed = true;
              break;
            }
          }
        }
        if (calendarParsed) break;
      }
    }
    if (!calendarParsed) {
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
  }

  // 2. Region / Distance extraction
  const distMatch = text.match(/(?:עד|ברדיוס של|בטווח של|במרחק של|מרחק של)?\s*(\d+)\s*(?:ק["״]?מ|קילומטר|קמ|קילומטרים)/);

  let foundCity = null;
  for (const city of KNOWN_ORIGIN_CITIES) {
    if (city.names.some((name) => text.includes(name))) {
      foundCity = city;
      break;
    }
  }

  if (distMatch && distMatch[1]) {
    const distNum = parseInt(distMatch[1], 10);
    if (foundCity) {
      updated.region = 'radius';
      updated.regionLabel = `עד ${distNum} ק"מ מ${foundCity.label}`;
      updated.maxDistanceKm = distNum;
      updated.originCity = foundCity.label;
      updated.originName = foundCity.label;
      updated.originCoords = [foundCity.lat, foundCity.lng];
    } else {
      updated.region = 'radius';
      updated.regionLabel = `עד ${distNum} ק"מ מתל אביב (מרכז)`;
      updated.maxDistanceKm = distNum;
      updated.originCity = 'תל אביב';
      updated.originName = 'תל אביב';
      updated.originCoords = [32.0853, 34.7818];
    }
  } else if (foundCity) {
    updated.originCity = foundCity.label;
    updated.originName = foundCity.label;
    updated.originCoords = [foundCity.lat, foundCity.lng];

    if (text.includes('לצפון') || text.includes('לגליל') || text.includes('לגולן')) {
      updated.region = 'north';
      updated.regionLabel = 'צפון (גליל וגולן)';
      updated.maxDistanceKm = null;
    } else if (text.includes('לדרום') || text.includes('לנגב') || text.includes('למדבר') || text.includes('לים המלח')) {
      updated.region = 'south';
      updated.regionLabel = 'דרום, נגב וים המלח';
      updated.maxDistanceKm = null;
    } else if (text.includes('לירושלים')) {
      updated.region = 'jerusalem';
      updated.regionLabel = 'ירושלים והשפלה';
      updated.maxDistanceKm = null;
    } else {
      updated.region = 'radius';
      updated.regionLabel = `רדיוס 50 ק"מ מ${foundCity.label}`;
      updated.maxDistanceKm = 50;
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
    } else if (
      text.includes('דרום') || text.includes('נגב') || text.includes('ים המלח') || text.includes('מדבר') ||
      text.includes('ערבה') || text.includes('רמון') || text.includes('אילת') ||
      text.includes('מכתש') || text.includes('מכתשים') || text.includes('יהב') || text.includes('עין יהב') ||
      text.includes('ספיר') || text.includes('ירוחם')
    ) {
      updated.region = 'south';
      updated.regionLabel = 'דרום, נגב וים המלח';
    }
  }

  // 3. Feature extraction
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
  } else if (text.includes('כיסא גלגלים') || text.includes('כסא גלגלים') || text.includes('קשיש') || text.includes('קשישים') || text.includes('הליכון') || text.includes('מוגבלות') || text.includes('מוגבל בהליכה')) {
    updated.feature = 'stroller';
    updated.featureLabel = 'שביל סלול / נגיש (כיסא גלגלים)';
    updated.wheelchairNote = true;
  } else if (
    (text.includes('עגלה') || text.includes('עגלות') || text.includes('שביל סלול') || text.includes('סלול ל') || /(?:^|[^\u0590-\u05fe])סלול(?=[^\u0590-\u05fe]|$)/.test(text) || text.includes('נגיש לעגלות')) &&
    !text.includes('בלי עגלה') && !text.includes('ללא עגלה') && !text.includes('בלי עגלות') && !text.includes('ללא עגלות') && !text.includes('אין עגלה') && !text.includes('לא עגלה') && !text.includes('כולל מסלולים עם עגלות') && !text.includes('כולל עגלות') && !text.includes('כוללים עגלות')
  ) {
    updated.feature = 'stroller';
    updated.featureLabel = 'שביל סלול / נגיש לעגלות';
  } else if (text.includes('נוף') || text.includes('תצפית') || text.includes('פריחה') || text.includes('מבצר') || text.includes('עתיקות')) {
    updated.feature = 'view';
    updated.featureLabel = 'תצפיות ונוף';
  }

  // 4. Youngest age extraction
  const extractedAge = parseAgeFromText(text);
  if (extractedAge !== null) {
    if (extractedAge <= 2) {
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
  }

  // 5. Subregion / destination keyword tracking
  if (text.includes('מכתש') || text.includes('מכתשים') || text.includes('רמון') || text.includes('מנסרה')) {
    updated.subRegionKeyword = 'crater';
    if (!updated.region) {
      updated.region = 'south';
      updated.regionLabel = 'מכתש רמון והנגב';
    }
  } else if (text.includes('יהב') || text.includes('עין יהב') || text.includes('ספיר') || text.includes('שיזף')) {
    updated.subRegionKeyword = 'yahav';
    if (!updated.region) {
      updated.region = 'south';
      updated.regionLabel = 'הערבה התיכונה ועין יהב';
    }
  }

  if (updated.timing && updated.feature && (updated.minAge !== null && updated.minAge !== undefined) && !updated.region) {
    updated.region = 'all';
    updated.regionLabel = 'כל הארץ';
  }

  return updated;
}
