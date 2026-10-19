/**
 * AgentNLUParser.js - Natural Language Understanding, Intent Extraction & Guardrails
 * 
 * Part of Agent BAAL Architecture.
 * Handles Hebrew linguistic variations, age formats, date parsing,
 * typo corrections, and strict safety guardrails.
 */

import { KNOWN_ORIGIN_CITIES } from './AgentGeoEngine.js';

// Phrases that legitimately contain a prohibited word (heritage / scenic hiking context) - stripped before matching
export const HERITAGE_ALLOWLIST = [
  'בית כנסת', 'בתי כנסת', 'בית הכנסת', 'מלחמת העצמאות', 'מלחמת ששת הימים', 'מלחמת יום כיפור',
  'מלחמת העולם', 'מלחמת השחרור', 'מוזיאון הנשק', 'נוף נשקף', 'נשקף', 'עוטף עזה', 'דרום אדום'
];

// Stems that may legitimately take a short Hebrew suffix (e.g. פוליטיקה, מפלגה)
const PROHIBITED_STEMS = ['פוליטיק', 'מפלג'];

// Hebrew prompt-injection / role-play / prompt-disclosure patterns
export const INJECTION_PATTERNS = [
  /(?:ת)?התעלם\s+מ(?:כל\s+)?ה?הוראות/, /תתעלם\s+מ(?:כל\s+)?ה?הוראות/, /שכח\s+(?:את\s+)?(?:כל\s+)?ה?הוראות/,
  /הצג\s+(?:לי\s+)?את\s+ה?(?:פרומפט|הנחיות|הוראות)/, /(?:מה|איזה)\s+ה?(?:הנחיות|הוראות)\s+שלך/,
  /שחק\s+תפקיד/, /דבר\s+כמו/, /אתה\s+עכשיו\s+(?!בטיול)/, /התחזה\s+ל/, /מצב\s+מפתח/, /jailbreak/i,
  /ignore\s+(?:all\s+)?(?:previous|prior)/i, /system\s*:/i, /\bDAN\b/, /```/
];

// Hard cap on user message length (anti-abuse / perf)
export const MAX_MESSAGE_CHARS = 500;

// Refusal for topics unrelated to hiking in Israel
export const OFF_TOPIC_REFUSAL = 'שלום! 🌿 אני סוכן הטיולים של "לאן נטייל?" (הסוכן המטייל), ואני עוזר רק בתכנון טיולים, שמורות טבע, גנים לאומיים ומסלולי הליכה בישראל 🇮🇱. בנושא הזה אין לי מה להוסיף... בואו נתכנן טיול! לאיזה אזור בארץ תרצו לטייל?';

export const TOO_LONG_REFUSAL = 'ההודעה ארוכה מדי 🌿. אשמח אם תקצרו ל-2-3 משפטים: לאן, מתי ועם מי תרצו לטייל?';

/** Whole-word (with Hebrew prefix letters) keyword match */
export function matchWord(lower, kw, allowSuffix = false) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffix = allowSuffix ? '[\\u05D0-\\u05EA]{0,3}' : '';
  const pattern = new RegExp('(?:^|[^\\u0590-\\u05FFa-zA-Z0-9])(?:[בלמהוכשד]{1,2})?' + escaped + suffix + '(?:$|[^\\u0590-\\u05FFa-zA-Z0-9])', 'i');
  return pattern.test(lower);
}

// Strict Prohibited Topics (Politics, Violence, Weapons, Drugs, Hate, Jailbreak/Prompt Injection)
export const PROHIBITED_KEYWORDS = [
  'פוליטיק', 'בחירות', 'ממשלה', 'ביבי', 'נתניהו', 'לפיד', 'גנץ', 'כנסת', 'מפלג',
  'נשק', 'נשקים', 'אקדח', 'רובה', 'טיל', 'טילים', 'פצצה', 'סמים', 'מריחואנה', 'קוקאין', 'סם',
  'אלימות', 'רצח', 'פיגוע', 'מלחמה', 'הרג', 'לפגוע', 'לתקוף',
  'system prompt', 'prompt injection', 'ignore previous instructions', 'architecture', 'api key', 'secret',
  'מי תכנת אותך', 'איזה מודל אתה', 'הדלף', 'קוד מקור'
];

// Standard unified refusal for all abroad inquiries
export const ABROAD_STANDARD_REFUSAL = 'שלום! 🌿 אני לא ממליץ על טיולים בחו"ל, בינתיים... 😉✈️ המומחיות שלי כסוכן שטח ממוקדת אך ורק בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה בישראל 🇮🇱 בלבד... בואו נטייל בארץ!';

// Standard unified refusal for all destinations outside safe borders of Israel
export const UNSAFE_BORDER_REFUSAL = 'שלום! 🌿 היעד המבוקש נמצא מחוץ לגבולות ישראל הבטוחים... 😉 המומחיות שלי כסוכן שטח ממוקדת אך ורק בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה הבטוחים והמאושרים בישראל 🇮🇱 בלבד... בואו נטייל בבטחה בארץ!';

// Standard refusal for closed military firing zones and active military areas
export const MILITARY_ZONE_REFUSAL = '⚠️🚫 שטח צבאי סגור / שטח אש פעיל!\n\nהכניסה לשטחי אש, מטווחים צבאיים ואזורי גבול אסורה ומסכנת חיים ללא תיאום צבאי ואישור מוסמך מצה"ל. הסוכן המטייל ממליץ אך ורק על שמורות טבע, גנים לאומיים ויערות פתוחים ובטוחים למטיילים בישראל 🇮🇱.\n\nבאיזה אזור בטוח תרצו לטייל?';

// Unsafe border territories, hostile areas, cross-border heritage, military firing zones, and fictional destinations
export const UNSAFE_BORDER_KEYWORDS = [
  // Gaza Strip
  'עזה', 'בעזה', 'רצועת עזה', 'ברצועת עזה', 'חאן יונס', 'בחאן יונס', 'רפיח', 'ברפיח',
  'דיר אל בלח', 'ג\'באליה', 'גבאליה', 'נוסייראת', 'בית חאנון', 'בית לאהיא',

  // Area A & Unsafe West Bank cities (excluding safe Israeli heritage parks)
  'שטח a', 'בשטח a', 'שטחי a', 'שטח א', 'בשטח א', 'שטחי א',
  'שטח b', 'בשטח b', 'שטחי b', 'שטח ב', 'בשטח ב', 'שטחי ב',
  'בית לחם', 'חברון', 'אבו דיס', 'בית ג\'אלה', 'בית סחור',
  'שכם', 'בשכם', 'ג\'נין', 'בג\'נין', 'גנין', 'בגנין',
  'רמאללה', 'ברמאללה', 'טול כרם', 'בטול כרם', 'קלקיליה', 'בקלקיליה', 'טובאס',
  'יריחו', 'ביריחו', 'ארמונות החשמונאים ביריחו', 'ארמונות החשמונאים', 'קבר יוסף', 'סבסטיה',

  // Cross-Border Biblical / Heritage Sites in Jordan & Sinai
  'נחל ארנון', 'בנחל ארנון', 'הר נבו', 'בהר נבו', 'הר סיני', 'בהר סיני',
  'ואדי ראם', 'בואדי ראם', 'ואדי רם', 'בואדי רם', 'ראס א-שטן', 'בראס א-שטן',

  // Military Closed Firing Zones & Bases
  'שטח אש', 'בשטח אש', 'שטחי אש', 'בשטחי אש', 'שטח אש 918', 'מטווח 24', 'במטווח 24',
  'בסיס צאלים', 'הר דב', 'בהר דב', 'מעבר לגדר המערכת', 'גדר המערכת',

  // Hostile Middle East / Gulf countries
  'תימן', 'בתימן', 'צנעא',

  // Fictional / Fantasy / Mythological / Unapproved locations
  'אטלנטיס', 'באטלנטיס', 'נרניה', 'בנרניה', 'הוגוורטס', 'בהוגוורטס', 'גותהאם', 'בגותהאם',
  'ארץ עוץ', 'אלדורדו', 'שנגרילה', 'ארץ לעולם לא',
  'ארץ האש', 'בארץ האש', 'לארץ האש'
];

// Foreign countries & abroad keywords
export const FOREIGN_COUNTRIES_KEYWORDS = [
  // General abroad terms
  'חו"ל', 'חו״ל', 'בחו"ל', 'בחו״ל', 'לחו"ל', 'לחו״ל', 'מחו"ל', 'מחו״ל', 'חוץ לארץ', 'בחוץ לארץ', 'מחוץ לישראל',
  'מדינה אחרת', 'מדינות אחרות', 'מעבר לים', 'בכל העולם', 'רחבי העולם', 'מסביב לעולם', 'טיסה', 'לטוס', 'טיסות',
  'אירופה', 'אסיה', 'אפריקה', 'אמריקה',
  'דרום אמריקה', 'צפון אמריקה', 'סקנדינביה', 'הבלקן', 'המזרח הרחוק', 'אוקיאניה', 'אנטארקטיקה',

  // Western & Southern Europe
  'יוון', 'קפריסין', 'איטליה', 'צרפת',
  'ספרד', 'פורטוגל', 'גרמניה', 'שוויץ', 'שווייץ',
  'אוסטריה', 'הולנד', 'בלגיה', 'לוקסמבורג',
  'אנגליה', 'בריטניה', 'סקוטלנד', 'אירלנד', 'ויילס',
  'רומא', 'מילאנו', 'פירנצה', 'ונציה', 'נאפולי',
  'סיציליה', 'טוסקנה', 'אמלפי',
  'מדריד', 'ברצלונה', 'ולנסיה', 'סביליה', 'מיורקה', 'איביזה',
  'פריז', 'ניס', 'ליון', 'מרסיי', 'בורדו', 'פרובאנס',
  'לונדון', 'מנצ\'סטר', 'ליברפול', 'אדינבורו',
  'אמסטרדם', 'רוטרדם', 'בריסל', 'ברוז\'',
  'ברלין', 'מינכן', 'פרנקפורט', 'היער השחור', 'בבאריה',
  'וינה', 'זלצבורג', 'טירול',
  'ציריך', 'ז\'נבה', 'לוצרן', 'אינטרלאקן', 'באזל',
  'ליסבון', 'פורטו', 'מדירה', 'האיים האזוריים',

  // Northern & Eastern Europe & Balkans
  'שבדיה', 'שוודיה', 'שטוקהולם',
  'נורבגיה', 'נורווגיה', 'אוסלו', 'פיורדים',
  'דנמרק', 'קופנהגן',
  'פינלנד', 'הלסינקי', 'לפלנד',
  'איסלנד', 'רייקיאוויק',
  'פולין', 'ורשה', 'קרקוב',
  'צ\'כיה', 'פראג',
  'סלובקיה', 'ברטיסלבה', 'הרי הטטרה',
  'הונגריה', 'בודפשט',
  'רומניה', 'בוקרשט', 'טרנסילבניה', 'ברשוב', 'הרי הקרפטים',
  'בולגריה', 'סופיה', 'בנסקו',
  'סלובניה', 'ליובליאנה', 'אגם בלד',
  'קרואטיה', 'זאגרב', 'דוברובניק', 'ספליט', 'פליטביצה',
  'מונטנגרו', 'קוטור', 'בודווה',
  'אלבניה', 'טירנה',
  'סרביה', 'בלגרד',
  'בוסניה', 'סרייבו', 'מוסטר',
  'מקדוניה', 'סקופיה', 'אוחריד',
  'קוסובו', 'מלטה', 'לרנקה', 'פאפוס', 'לימסול', 'איה נאפה',
  'אתונה', 'סלוניקי', 'כרתים', 'רודוס',
  'קורפו', 'סנטוריני', 'מיקונוס', 'זקינטוס', 'לפקדה',
  'רוסיה', 'מוסקבה', 'סנט פטרסבורג', 'אוקראינה', 'קייב',

  // Middle East, Gulf & Central Asia
  'טורקיה', 'תורכיה', 'איסטנבול', 'אנטליה', 'קפדוקיה', 'בודרום', 'מרמריס',
  'דובאי', 'אבו דאבי', 'בחריין', 'קטאר', 'דוחה', 'כווית', 'סעודיה', 'ריאד', 'עומאן', 'מסקט',
  'מצרים', 'קהיר', 'גיזה', 'אלכסנדריה', 'פירמידות', 'הפירמידות',
  'שארם', 'שארם א-שייח', 'טאבה', 'דהב', 'סיני', 'הורגאדה',
  'ירדן', 'פטרה', 'עקבה', 'ואדי רם', 'עמאן',
  'סוריה', 'דמשק', 'לבנון', 'בירות', 'ביירות', 'עיראק', 'עירק', 'בגדד', 'איראן', 'טהרן',
  'גאורגיה', 'גיאורגיה', 'טביליסי', 'בטומי', 'קזבגי',
  'ארמניה', 'ירוואן', 'אזרבייג\'ן', 'באקו',
  'אוזבקיסטן', 'סמרקנד', 'קזחסטן', 'אלמטי',

  // Asia & Far East
  'תאילנד', 'בנגקוק', 'פוקט', 'קוסמוי', 'קופנגן', 'צ\'יאנג מאי', 'פטאיה',
  'הודו', 'דלהי', 'מומבאי', 'גואה', 'רג\'סטאן', 'הימלאיה',
  'יפן', 'טוקיו', 'קיוטו', 'אוסקה', 'הר פוג\'י', 'פוג\'י',
  'סין', 'בייג\'ינג', 'שנחאי', 'הונג קונג', 'טייוואן',
  'קוריאה', 'דרום קוריאה', 'סיאול',
  'וייטנאם', 'ויאטנם', 'האנוי', 'סייגון', 'האלונג ביי',
  'קמבודיה', 'אנגקור ואט', 'לאוס',
  'סינגפור',
  'מלזיה', 'קואלה לומפור',
  'אינדונזיה', 'באלי',
  'פיליפינים', 'מנילה', 'בורקאי',
  'סרי לנקה', 'קולומבו',
  'מלדיביים', 'המלדיביים', 'מאלדיביים',
  'נפאל', 'קטמנדו', 'אנאפורנה', 'אוורסט', 'האוורסט',

  // North America
  'ארה"ב', 'ארצות הברית', 'ארה״ב',
  'ניו יורק', 'לוס אנגלס', 'לוס אנג\'לס', 'מיאמי', 'אורלנדו',
  'לאס וגאס', 'סן פרנסיסקו', 'שיקגו', 'בוסטון', 'וושינגטון', 'הוואי', 'קליפורניה', 'פלורידה', 'טקסס',
  'ילוסטון', 'יוסמיטי', 'קניון אנטילופ', 'גרנד קניון', 'מפלי הניאגרה', 'ניאגרה', 'ביג סור',
  'קנדה', 'טורונטו', 'ונקובר', 'מונטריאול', 'הרי הרוקי', 'באנף',
  'מקסיקו', 'קנקון', 'מקסיקו סיטי',

  // Central & South America
  'גואטמלה', 'קוסטה ריקה', 'פנמה', 'קובה',
  'ברזיל', 'ריו דה ז\'ניירו', 'סאו פאולו', 'אמזונס', 'נהר האמזונס', 'מפלי איגואסו',
  'ארגנטינה', 'בואנוס איירס', 'פטגוניה',
  'ארץ האש', 'לארץ האש', 'בארץ האש', 'טיירה דל פואגו', 'אושואיה', 'tierra del fuego',
  'צ\'ילה', 'סנטיאגו',
  'פרו', 'מאצ\'ו פיצ\'ו', 'לימה', 'קוסקו',
  'קולומביה', 'בוגוטה', 'מדיין',
  'בוליביה', 'סלאר דה אויוני', 'אקוודור', 'גלפגוס',

  // Africa
  'מרוקו', 'מרקש', 'קזבלנקה', 'פאס', 'טנג\'יר',
  'דרום אפריקה', 'קייפטאון', 'יוהנסבורג', 'פארק קרוגר',
  'קניה', 'מסאי מארה', 'ניירובי',
  'טנזניה', 'סרנגטי', 'נגורונגורו', 'זנזיבר', 'קילימנגרו', 'קילימנג\'רו',
  'נמיביה', 'מאוריציוס', 'סיישל', 'מדגסקר',

  // Australia & Pacific
  'אוסטרליה', 'סידני', 'מלבורן', 'בריזבן', 'קיירנס', 'השונית הגדולה',
  'ניו זילנד', 'אוקלנד', 'קווינסטאון',
  'פיג\'י',

  // Rivers & Mountains
  'דנובה', 'נהר הדנובה', 'ריין', 'נהר הריין', 'תמזה', 'נהר התמזה', 'סיין', 'נהר הסיין',
  'האלפים', 'הרי האלפים', 'דולומיטים', 'הדולומיטים', 'פירינאים', 'הפירינאים',
  'מונט בלאן', 'מטרהורן',
  'חידקל', 'החידקל', 'נחל החידקל', 'נהר החידקל',
  'נהר הפרת', 'נהר פרת',
  'נילוס', 'הנילוס', 'נהר הנילוס'
];

// Dog / pet keywords for safety warning (nature reserves prohibit dogs)
export const DOG_KEYWORDS = [
  'כלב', 'כלבה', 'כלבים', 'כלבלב', 'גור כלבים', 'גורים',
  'חיית מחמד', 'חיות מחמד', 'dog', 'dogs', 'pet',
  'חבר על ארבע', 'חברים על ארבע', 'הולך על ארבע', 'הולכים על ארבע', 'ידידותי לכלבים'
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
  'מוצאל': 'מוצל', 'מצל': 'מוצל', 'מוצלל': 'מוצל', 'מוצר': 'מוצל',
  'הלחכה': 'הליכה', 'נליכה': 'הליכה', 'נלכה': 'הליכה', 'שבייל': 'שביל',
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
  { dayNum: 5, names: ['יום שישי', 'שישי הקרוב', 'בשישי', 'יום ו\'', 'יום ו׳', 'יום ו', 'שישי'], label: 'יום שישי' },
  { dayNum: 6, names: ['יום שבת', 'שבת הקרובה', 'שבת הקרוב', 'בשבת', 'שבת'], label: 'יום שבת' },
];

// Hebrew number words mapping for textual age parsing
export const HEBREW_AGE_WORDS = [
  { word: 'מאה', age: 100 },
  { word: 'תשעים וחמש', age: 95 },
  { word: 'תשעים', age: 90 },
  { word: 'שמונים וחמש', age: 85 },
  { word: 'שמונים', age: 80 },
  { word: 'שבעים וחמש', age: 75 },
  { word: 'שבעים', age: 70 },
  { word: 'שישים וחמש', age: 65 },
  { word: 'שישים', age: 60 },
  { word: 'חמישים', age: 50 },
  { word: 'ארבעים', age: 40 },
  { word: 'שלושים', age: 30 },
  { word: 'עשרים', age: 20 },
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
  if (trimmed.length > MAX_MESSAGE_CHARS) {
    return { safe: false, isTooLong: true, refusal: TOO_LONG_REFUSAL };
  }

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
        refusal: 'مرحباً! 🌿 أنا المرشد الذكي لمسارات الطبيعة في إسرائيل. أتحدث باللغة **العبرية** فقط حالياً. يرجى مراسلتي باللغة العبرية لمساعدتك في العثور على أفضل المسارات والرحلات!',
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

  // 1.5 Celestial / Space / Moon travel
  const isLunarColloquialOrIsraeli = (
    lower.includes('ירח דבש') ||
    lower.includes('לאור ירח') ||
    lower.includes('אור ירח') ||
    lower.includes('ליל ירח') ||
    lower.includes('ירח מלא') ||
    lower.includes('נוף ירחי') ||
    lower.includes('בקעת הירח')
  );

  if (!isLunarColloquialOrIsraeli) {
    const mentionsMoon = (
      lower.includes('לירח') || lower.includes('על הירח') || lower.includes('בירח') ||
      /(?:טיול|לנסוע|לטוס|לטייל|חופשה|נופש|טיסה|מזג האוויר|מזג אוויר|תחזית)\s+(?:ל|ב|על)?\s*ירח/.test(lower) ||
      /(?:הירח|ירח)\s+(?:הוא יעד|מחוץ לכדור הארץ)/.test(lower)
    );

    const mentionsMars = (
      lower.includes('למאדים') || lower.includes('במאדים') || lower.includes('על מאדים') ||
      /(?:טיול|לנסוע|לטוס|לטייל|חופשה|נופש|טיסה|מזג האוויר|תחזית)\s+(?:ל|ב|על)?\s*מאדים/.test(lower)
    );

    const mentionsSpace = (
      lower.includes('לחלל') || lower.includes('בחלל') || lower.includes('לטוס לחלל') ||
      lower.includes('טיול בחלל') || lower.includes('תחנת החלל') || lower.includes('שביל החלב') ||
      lower.includes('גלקסיה') || lower.includes('כוכב צדק') || lower.includes('כוכב שבתאי')
    );

    const isSunColloquialOrIsraeli = (
      lower.includes('בית שמש') ||
      lower.includes('שמשון') ||
      lower.includes('זריחת השמש') ||
      lower.includes('שקיעת השמש') ||
      lower.includes('קרני שמש') ||
      lower.includes('קרם שמש') ||
      lower.includes('משקפי שמש') ||
      lower.includes('מכת שמש') ||
      lower.includes('בלי שמש') ||
      lower.includes('ללא שמש') ||
      lower.includes('שלא נלך בשמש') ||
      lower.includes('לא בשמש') ||
      lower.includes('חשיפה לשמש')
    );

    const mentionsSun = !isSunColloquialOrIsraeli && (
      lower.includes('אל השמש') ||
      lower.includes('על פני השמש') ||
      /(?:לנסוע|נוסעים|נוסע|לטוס|טסים|טס|להגיע|מגיעים|מגיע|לטייל|מטיילים|מטייל|לבקר|לצאת ל|נופש|חופשה|טיול|טיסה|מסע|תחזית|מזג האוויר|מזג אוויר|איך מגיעים)\s+(?:.*?\s+)?(?:ל|אל)\s*ה?שמש(?:$|[^\u0590-\u05FFa-zA-Z0-9])/.test(lower) ||
      (/(?:^|[^\u0590-\u05FFa-zA-Z0-9])לשמש(?:$|[^\u0590-\u05FFa-zA-Z0-9])/.test(lower) && (
        /(?:רוצה|בא לי|מתכנן|מעוניין|אפשר|איך|מתי|כדאי|המלצה|ממליץ)/.test(lower) ||
        /(?:לנסוע|לטוס|להגיע|לטייל|לבקר|טיול|טיסה)/.test(lower)
      )) ||
      /(?:^|[^\u0590-\u05FFa-zA-Z0-9])על\s+ה?שמש(?:$|[^\u0590-\u05FFa-zA-Z0-9])/.test(lower)
    );

    if (mentionsMoon) {
      return {
        safe: false,
        isAbroad: true,
        isCelestial: true,
        refusal: 'שלום! 🌕🚀 הירח הוא בהחלט יעד מסקרן, אבל הוא לחלוטין מחוץ לגבולות ישראל... 😉 וזה בעייתי בשבילי להמליץ עליו כי אין לי נתונים על מזג האוויר שם! המומחיות שלי כסוכן שטח ממוקדת אך ורק בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה בישראל 🇮🇱 בלבד... בואו נטייל בארץ! 💡 ואם אתם מחפשים נוף ירחי מרהיב כאן בארץ – מכתש רמון או הרי אילת הם המקום המושלם!',
      };
    }

    if (mentionsMars) {
      return {
        safe: false,
        isAbroad: true,
        isCelestial: true,
        refusal: 'שלום! 🪐🚀 מאדים הוא בהחלט יעד מסקרן, אבל הוא לחלוטין מחוץ לגבולות ישראל... 😉 וזה בעייתי בשבילי להמליץ עליו כי אין לי נתונים על מזג האוויר שם! המומחיות שלי כסוכן שטח ממוקדת אך ורק בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה בישראל 🇮🇱 בלבד... בואו נטייל בארץ! 💡 ואם אתם מחפשים נוף מדברי אדמדם כמו במאדים כאן בארץ – בקעת תמנע והרי אילת הם המקום המושלם!',
      };
    }

    if (mentionsSun) {
      return {
        safe: false,
        isAbroad: true,
        isCelestial: true,
        refusal: 'שלום! ☀️🚀 השמש היא בהחלט יעד "חם" במיוחד (כ-5,500 מעלות!), אבל היא לחלוטין מחוץ לגבולות ישראל... 😉 וזה בעייתי בשבילי להמליץ עליה כי אין לי נתונים על מזג האוויר שם (וגם שום מסלול לא יעמוד בעומס חום כזה)! המומחיות שלי כסוכן שטח ממוקדת אך ורק בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה בישראל 🇮🇱 בלבד... בואו נטייל בארץ! 💡 ואם אתם מחפשים יעד שטוף שמש ומדברי כאן בארץ – בקעת תמנע, ים המלח והרי אילת הם המקום המושלם!',
      };
    }

    if (mentionsSpace) {
      return {
        safe: false,
        isAbroad: true,
        isCelestial: true,
        refusal: 'שלום! 🚀🌌 החלל הוא בהחלט מסע מסקרן, אבל הוא לחלוטין מחוץ לגבולות ישראל... 😉 וזה בעייתי בשבילי להמליץ עליו כי אין לי נתונים על מזג האוויר שם! המומחיות שלי כסוכן שטח ממוקדת אך ורק בשמורות הטבע, הגנים הלאומיים ומסלולי ההליכה בישראל 🇮🇱 בלבד... בואו נטייל בארץ!',
      };
    }
  }

  // 1.8 Unsafe border territories & hostile or fictional destinations
  // Gaza envelope (עוטף עזה) and Darom Adom are legitimate Israeli destinations - neutralize before matching
  const lowerForBorder = lower.replace(/עוטף\s+עזה/g, ' עוטף ').replace(/דרום\s+אדום/g, ' דרוםאדום ');
  for (const uKw of UNSAFE_BORDER_KEYWORDS) {
    const matched = matchWord(lowerForBorder, uKw);

    if (matched) {
      const isMilitary = (
        lower.includes('שטח אש') || lower.includes('שטחי אש') || lower.includes('מטווח 24') ||
        lower.includes('צאלים') || lower.includes('הר דב') || lower.includes('גדר המערכת')
      );
      return {
        safe: false,
        isAbroad: !isMilitary,
        isMilitary,
        refusal: isMilitary ? MILITARY_ZONE_REFUSAL : UNSAFE_BORDER_REFUSAL,
      };
    }
  }

  // 2. Foreign countries / travel abroad
  // Explicit Israeli exceptions that might contain abroad-sounding words
  const isIsraeliException = (
    lower.includes('שוויצריה הקטנה') ||
    lower.includes('פארק בריטניה') ||
    lower.includes('נחל פרת') ||
    lower.includes('עין פרת') ||
    lower.includes('שמורת פרת') ||
    lower.includes('שמורת נחל פרת') ||
    lower.includes('חולות') ||
    lower.includes('דיונות חול') ||
    lower.includes('עמק החולה') ||
    lower.includes('חולדה') ||
    lower.includes('סימון כחול') ||
    lower.includes('שביל כחול')
  );

  // Abroad without gershayim (e.g., "טיול בחול", "לטוס לחול", "נוסעים לחול", "חופשה בחול")
  const isGenericAbroadNoGershayim = (
    !isIsraeliException &&
    /(?:טיול|לטייל|לטוס|טסים|נוסע|נוסעים|חופשה|נופש|מלון|סופ"ש|סופש|חבילת נופש)\s+(?:ב|ל)?חול(?:\b|[^\u0590-\u05FF]|$)/.test(lower)
  );
  if (isGenericAbroadNoGershayim) {
    return {
      safe: false,
      isAbroad: true,
      refusal: ABROAD_STANDARD_REFUSAL,
    };
  }

  for (const fKw of FOREIGN_COUNTRIES_KEYWORDS) {
    let matched = false;
    if (fKw.includes(' ') || fKw.includes('"') || fKw.includes('״') || fKw.includes('-')) {
      matched = lower.includes(fKw);
    } else {
      const pattern = new RegExp('(?:^|[^\\u0590-\\u05FFa-zA-Z0-9])(?:[בלמהוכשבד]{1,2})?' + fKw + '(?:$|[^\\u0590-\\u05FFa-zA-Z0-9])', 'i');
      matched = pattern.test(lower);
    }

    if (matched) {
      if (fKw === 'יוון' && lower.includes('כיוון')) continue;
      if (fKw === 'שוויץ' || fKw === 'שווייץ') {
        if (lower.includes('שוויצריה הקטנה')) continue;
      }
      if (fKw === 'בריטניה') {
        if (lower.includes('פארק בריטניה')) continue;
      }
      if (fKw === 'ירדן') {
        const isJordanRiver = (
          lower.includes('נהר הירדן') ||
          lower.includes('נהר ירדן') ||
          lower.includes('בירדן') ||
          lower.includes('נחל ירדן') ||
          lower.includes('פארק הירדן') ||
          lower.includes('הירדן ההררי') ||
          lower.includes('עמק הירדן') ||
          lower.includes('זיהום') ||
          lower.includes('שייט') ||
          lower.includes('קיאק') ||
          lower.includes('רפטינג')
        );
        if (isJordanRiver) continue;
      }
      return {
        safe: false,
        isAbroad: true,
        refusal: ABROAD_STANDARD_REFUSAL,
      };
    }
  }

  // 2.5 Prompt-injection / role-play / prompt disclosure (Hebrew + English, also in mixed-language text)
  if (INJECTION_PATTERNS.some((p) => p.test(lower))) {
    return { safe: false, isOffTopic: true, refusal: OFF_TOPIC_REFUSAL };
  }

  // 3. Prohibited sensitive topics (whole-word match; heritage phrases exempted)
  let scrubbed = lower;
  for (const phrase of HERITAGE_ALLOWLIST) {
    scrubbed = scrubbed.split(phrase).join(' ');
  }
  for (const kw of PROHIBITED_KEYWORDS) {
    if (matchWord(scrubbed, kw, PROHIBITED_STEMS.includes(kw))) {
      return {
        safe: false,
        refusal: 'שלום! אני סוכן הטיולים החכם של "לאן נטייל?" 🧭, ומטרתי הבלעדית היא לעזור לכם לתכנן טיולים וחוויות בטוחות ומהנות בטבע בישראל 🌿.\n\n💡 **אנא נסחו שוב את שאלתכם** בנושאי מסלולים, שמורות טבע או גנים לאומיים בישראל, ולאיזה אזור בארץ תרצו לטייל ומתי.',
      };
    }
  }
  return { safe: true };
}

/**
 * Detect emergency distress situations in the field (lost, out of water, snake bite, cliff fall, flash flood)
 */
export function detectEmergencyDistress(message) {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase().trim();

  const SOS_PATTERNS = [
    'איבדנו את הדרך', 'הלכנו לאיבוד', 'הלך לאיבוד', 'אבדנו בדרך', 'תעזרו לנו הלכנו לאיבוד',
    'נגמרו לנו המים', 'נגמר לנו המים', 'אין לנו מים ואנחנו', 'מתייבשים', 'סכנת התייבשות',
    'עקיצת עקרב', 'נעקץ מעקרב', 'הכשת נחש', 'הוכש מנחש', 'הכיש אותו נחש',
    'נפילה מצוק', 'נפל ממצוק', 'נפלנו מצוק', 'שבר ברגל', 'שבר את הרגל',
    'מישהו נפצע', 'פציעה קשה', 'זקוקים לחילוץ', 'חילוץ דחוף',
    'תקועים בשטח', 'תקועים על מצוק', 'תקועים בנחל',
    'שיטפון עולה', 'שיטפון מתקרב', 'מים בוציים בנחל', 'זרם חזק בנחל', 'נסחפים בזרם',
    'הצילו אנחנו', 'סכנת חיים בשטח',
    'לא נושם', 'לא נושמת', 'התעלף', 'התעלפה', 'איבד הכרה', 'מכת חום', 'מכת שמש קשה', 'דימום', 'מדמם',
    'איבדנו ילד', 'איבדנו את הילד', 'הילד נעלם', 'הילדה נעלמה', 'ילד נעלם', 'ילד אבד'
  ];

  for (const pat of SOS_PATTERNS) {
    if (lower.includes(pat)) {
      return {
        isEmergency: true,
        text: `🚨🆘 מצב חירום ומצוקה בשטח! 🆘🚨\n\nאם אתם או מישהו מסביבכם נמצא בסכנה — פעלו מיד על פי ההנחיות מצילות החיים הבאות:\n\n📞 מספרי חירום לחיוג מיידי:\n• 🚔 100 — משטרת ישראל ויחידות חילוץ והצלה\n• 🚑 101 — מגן דוד אדום (מד"א)\n• 🚒 102 — כבאות והצלה לישראל\n• 🆘 112 — מוקד חירום כללי (עובד גם ללא כיסוי של הספק)\n\n🧭 הנחיות בטיחות מצילות חיים:\n1. הישארו יחד במקום בטוח ואל תנסו להמשיך ללכת בחושך או בתוואי לא מוכר.\n2. אם מדובר בשיטפון או זרימה עולה — עלו מיד למקום הגבוה ביותר מחוץ לערוץ הנחל! חל איסור מוחלט לחצות זרם מים.\n3. שתפו מיקום GPS מדויק בשיחה עם מוקד 100 של המשטרה.\n4. שמרו על סוללת הטלפון — הנמיכו בהירות, סגרו אפליקציות מיותרות והשאירו קו פנוי לכוחות החילוץ.`,
        options: [
          { label: '📞 חיוג למשטרה ויחידות חילוץ (100)', value: 'tel:100' },
          { label: '🚑 חיוג למד"א (101)', value: 'tel:101' },
          { label: '🚒 חיוג לכבאות והצלה (102)', value: 'tel:102' },
          { label: '🌿 חזרה לצ\'אט הטיולים הרגיל', value: 'התחל מחדש' }
        ],
        toolActivity: '🚨 הפעלת נוהל חירום SOS בשטח • הוצגו מספרי חיוג והנחיות מצילות חיים'
      };
    }
  }

  return null;
}

/**
 * Ages from this value up (and up to SENIOR_MAX_AGE) are treated as senior travelers
 * who need accessible, paved, no-stairs routes - NOT as '10+ youth and adults'.
 */
export const SENIOR_MIN_AGE = 65;
export const SENIOR_MAX_AGE = 120;

/**
 * Parse and extract youngest hiker age from Hebrew text (numeric and textual phrases)
 */
export function parseAgeFromText(text) {
  const ages = collectAgesFromText(text);
  return ages.length > 0 ? Math.min(...ages) : null;
}

/**
 * Returns the oldest plausible senior age mentioned (65-120), or null.
 * e.g. "ילד בן 90" -> 90 (a senior, even if phrased as "child")
 */
export function detectSeniorAge(text) {
  const seniors = collectAgesFromText(text).filter(a => a >= SENIOR_MIN_AGE && a <= SENIOR_MAX_AGE);
  return seniors.length > 0 ? Math.max(...seniors) : null;
}

/**
 * Collect every age mentioned in the text (numeric, textual and categorical)
 */
function collectAgesFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const foundAges = [];

  // Baby / Stroller categorical keywords (detect 0+ unless baby has an attached explicit age or stroller is negated)
  const hasNegativeStroller = (
    text.includes('ללא עגלה') || text.includes('בלי עגלה') ||
    text.includes('ללא עגלות') || text.includes('בלי עגלות') ||
    text.includes('אין עגלה') || text.includes('לא עגלה')
  );
  const isStandaloneBaby = (
    text.includes('0+') || 
    ((text.includes('עגלה') || text.includes('עגלות')) && !hasNegativeStroller) ||
    (/(?:תינוק|תינוקת|פעוט)/.test(text) && !/(?:תינוק|תינוקת|פעוט)\s+(?:בן|בת|בגיל)/.test(text))
  );
  if (isStandaloneBaby) {
    foundAges.push(0);
  }

  // 1. Explicit Hebrew age words after age markers
  for (const item of HEBREW_AGE_WORDS) {
    if (item.word === 'שנתיים' && text.includes('שנתיים וחצי')) continue;
    if (item.word === 'שנה' && (text.includes('שנה וחצי') || text.includes('חצי שנה'))) continue;
    const escapedWord = item.word.replace(/\s+/g, '\\s+');
    const prefixRegex = new RegExp(
      `(?:בן|בת|בני|בנות|בגיל|בגילאי|לגיל|לגילאי|גיל|גילאי|כיל|יד|מגיל|ילד\\s+בן|ילדה\\s+בת|ילדים\\s+בני|תינוק\\s+בן|פעוט\\s+בן|הילד(?:\\s+שלי)?\\s+בן|הילדה(?:\\s+שלי)?\\s+בת)\\s+(?:ה-?|ה)?${escapedWord}(?![\\u0590-\\u05fe])(?:\\s+וחצי|\\s+שנים|\\s+שנה)?`,
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
    if (text.includes('קטנים') || text.includes('קטנטנים') || text.includes('גן') || text.includes('ילדי גן')) {
      foundAges.push(4);
    } else if (text.includes('יסודי') || text.includes('ילדי יסודי') || text.includes('בוגרים') || text.includes('ילדים בוגרים')) {
      foundAges.push(7);
    } else if (text.includes('נוער') || text.includes('מתבגרים') || text.includes('מבוגרים') || text.includes('חטיבה') || text.includes('תיכון')) {
      foundAges.push(10);
    }
  }

  return foundAges;
}

/**
 * Parse user message and extract any of the 4 mandatory parameters
 */
export function extractParameters(message, currentState) {
  let text = applyTypoCorrections(message);
  const updated = { ...currentState };

  const trimmed = (text || '').trim();

  // 0. Non-restrictive phrases
  if (trimmed === 'כל הארץ' || text.includes('לא משנה לי האזור') || text.includes('לא משנה האזור') || text.includes('בכל הארץ') || text.includes('כל הארץ') || text.includes('כל מקום') || text.includes('ללא העדפה לאזור') || text.includes('אין העדפה לאזור')) {
    updated.region = 'all';
    updated.regionLabel = 'כל הארץ';
  }
  if (text.includes('לא משנה לי התאריך') || text.includes('לא משנה התאריך') || text.includes('לא משנה מתי') || text.includes('בימים הקרובים') || text.includes('ללא העדפה לתאריך') || text.includes('אין העדפה לתאריך')) {
    updated.timing = 'today';
    updated.timingLabel = 'היום / בימים הקרובים';
    updated.dayIndex = 0;
  }
  if (text.includes('לכל הגילאים') || text.includes('לא משנה הגיל') || text.includes('מתאים לכולם') || text.includes('ללא מגבלת גיל') || text.includes('כל הגילאים')) {
    updated.minAge = 0;
    updated.minAgeLabel = 'לכל הגילאים (0+)';
  }

  const isFeatureAnyPhrase = (
    trimmed === 'הכל' ||
    trimmed === 'הכול' ||
    trimmed === 'כלום' ||
    trimmed === 'הכל מתאים' ||
    trimmed === 'הכל הולך' ||
    trimmed === 'הכל טוב' ||
    trimmed === 'הכל סבבה' ||
    trimmed === 'הכל זורם' ||
    trimmed === 'זורם' ||
    trimmed === 'זורמת' ||
    trimmed === 'זורמים' ||
    trimmed === 'כל דבר' ||
    trimmed === 'כל סגנון' ||
    trimmed === 'כל הסגנונות' ||
    trimmed === 'כל סוג' ||
    trimmed === 'כל הסוגים' ||
    trimmed === 'מה שבא' ||
    trimmed === 'מה שיש' ||
    trimmed === 'פתוח' ||
    trimmed === 'פתוחה' ||
    trimmed === 'פתוחים' ||
    text.includes('לא משנה לי סגנון') ||
    text.includes('לא משנה הסגנון') ||
    text.includes('לא משנה לי הסגנון') ||
    text.includes('לא משנה סגנון') ||
    text.includes('הכל מתאים') ||
    text.includes('הכל הולך') ||
    text.includes('מה שהכי מומלץ') ||
    text.includes('מה שמומלץ') ||
    text.includes('ללא העדפה לסגנון') ||
    text.includes('אין העדפה לסגנון') ||
    text.includes('כל סגנון') ||
    text.includes('כל הסגנונות') ||
    text.includes('כל סוג') ||
    text.includes('כל הסוגים') ||
    text.includes('פתוח להכל') ||
    text.includes('פתוחים להכל') ||
    text.includes('פתוחה להכל') ||
    text.includes('גם וגם') ||
    text.includes('שניהם') ||
    text.includes('שילוב')
  );

  if (isFeatureAnyPhrase) {
    updated.feature = 'any';
    updated.featureLabel = (text.includes('גם וגם') || text.includes('שילוב')) ? 'גם וגם (שילוב סגנונות)' : 'כל סגנונות המסלול';
  }

  // Surprise Me / Spontaneity shortcut (Scenario 13)
  const isSurpriseIntent = (
    text.includes('הפתע אותי') || text.includes('הפתעה') || text.includes('תפתיע אותי') ||
    text.includes('תחליט אתה') || text.includes('תבחר אתה') || text.includes('תבחר לי') ||
    text.includes('זרוק רעיון') || text.includes('איפה שיפה היום') || text.includes('משהו שווה') ||
    text.includes('מה הכי מומלץ') || (text.includes('לא יודע') && (text.includes('תחליט') || text.includes('תבחר') || text.includes('רעיון')))
  );
  if (isSurpriseIntent) {
    updated.concept = 'surprise';
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
    trimmed === 'הכל' ||
    trimmed === 'הכול' ||
    trimmed === 'לא משנה' || 
    trimmed === 'לא משנה לי' || 
    trimmed === 'גם וגם' ||
    trimmed === 'כלום' ||
    trimmed === 'הכל הולך' ||
    trimmed === 'הכל מתאים' ||
    trimmed === 'הכל טוב' ||
    trimmed === 'הכל סבבה' ||
    trimmed === 'הכל זורם' ||
    trimmed === 'כל דבר' ||
    trimmed === 'זורם' ||
    trimmed === 'זורמת' ||
    trimmed === 'זורמים' ||
    trimmed === 'מה שבא' ||
    trimmed === 'מה שיש' ||
    trimmed === 'פתוח' ||
    trimmed === 'פתוחה' ||
    trimmed === 'פתוחים' ||
    trimmed === 'פתוח להכל' ||
    trimmed === 'פתוחה להכל' ||
    trimmed === 'פתוחים להכל' ||
    text.includes('גם וגם') ||
    text.includes('שניהם') ||
    text.includes('לא משנה לי') || 
    text.includes('לא משנה') || 
    text.includes('אין לי העדפה') || 
    text.includes('אין העדפה') || 
    text.includes('ללא העדפה') ||
    text.includes('לא אכפת לי') ||
    text.includes('לא חשוב') ||
    text.includes('לא קריטי') ||
    text.includes('מה שאתה מציע') ||
    text.includes('מה שאתה רוצה') ||
    text.includes('מה שתבחר') ||
    text.includes('מה שמומלץ') ||
    text.includes('מה שהכי מומלץ') ||
    text.includes('מה שבא לך') ||
    text.includes('הכל פתוח') ||
    text.includes('מצידי הכל')
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

  const isWeekendExplicit = (
    text.includes('סוף השבוע') || 
    text.includes('סוף שבוע') || 
    text.includes('בסוף השבוע') || 
    text.includes('בסוף שבוע') || 
    text.includes('סופ"ש') || 
    text.includes('סופש') || 
    text.includes('בסופש') || 
    text.includes('בסופ"ש')
  );

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
  } else if (isWeekendExplicit) {
    // Weekend in Israel spans Friday (day 5) & Saturday (day 6)
    const diffFriday = (5 - currentDayNum + 7) % 7;
    updated.timing = 'weekend';
    updated.dayIndex = Math.min(diffFriday, 4);
    if (currentDayNum === 5) {
      updated.timingLabel = 'סוף השבוע (היום ומחר - שישי ושבת)';
    } else if (currentDayNum === 6) {
      updated.timingLabel = 'סוף השבוע (היום - שבת)';
    } else if (diffFriday === 1) {
      updated.timingLabel = 'סוף השבוע (מחר ומחרתיים - שישי ושבת)';
    } else if (diffFriday === 2) {
      updated.timingLabel = 'סוף השבוע הקרוב (שישי-שבת, בעוד יומיים)';
    } else {
      updated.timingLabel = `סוף השבוע הקרוב (שישי-שבת, בעוד ${diffFriday} ימים)`;
    }
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
        if (diffDays > 14) {
          updated.isFarFutureDate = true;
          updated.diffDays = diffDays;
          updated.targetMonth = month;
        }
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
              if (diffDays > 14) {
                updated.isFarFutureDate = true;
                updated.diffDays = diffDays;
                updated.targetMonth = hm.num;
              }
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

  // Target Destination Regions detection
  const isJerusalemRegion = (
    text.includes('בירושלים') || text.includes('לירושלים') || text.includes('באזור ירושלים') ||
    text.includes('סביב ירושלים') || text.includes('הרי ירושלים') || text.includes('בהרי ירושלים') ||
    text.includes('ירושלים והסביבה') || text.includes('ירושלים') || text.includes('שפלת יהודה') ||
    text.includes('בשפלה') || text.includes('לשפלה') || text.includes('שפלה') ||
    text.includes('מטה יהודה') || text.includes('גוש עציון') || text.includes('עציון') || text.includes('בית שמש')
  );

  const isWestGalileeRegion = (
    text.includes('גליל מערבי') || text.includes('בגליל המערבי') || text.includes('לגליל המערבי') ||
    text.includes('חוף הגליל') || text.includes('כזיב') || text.includes('חרדלית') ||
    text.includes('מונפורט') || text.includes('ראש הנקרה') || text.includes('פארק גורן') || text.includes('אכזיב')
  );

  const isGolanRegion = (
    text.includes('גולן') || text.includes('בגולן') || text.includes('לגולן') ||
    text.includes('רמת הגולן') || text.includes('חרמון') || text.includes('בחרמון') ||
    text.includes('מג׳רסה') || text.includes('מג\'רסה') || text.includes('מגרסה') ||
    text.includes('גמלא') || text.includes('יהודיה') || text.includes('משושים') || text.includes('בנטל')
  );

  const isUpperGalileeRegion = (
    text.includes('גליל עליון') || text.includes('בגליל העליון') || text.includes('לגליל העליון') ||
    text.includes('אצבע הגליל') || text.includes('עמק החולה') || text.includes('תל דן') ||
    text.includes('שניר') || text.includes('חצבני') || text.includes('ביריה') || text.includes('צפת') || text.includes('מירון')
  );

  const isCarmelRegion = (
    text.includes('כרמל') || text.includes('בכרמל') || text.includes('רכס הכרמל') ||
    text.includes('פארק הכרמל') || text.includes('חוף הכרמל') || text.includes('שוויצריה הקטנה') ||
    text.includes('שווייצריה הקטנה') || text.includes('רמת הנדיב') || text.includes('רמות מנשה') ||
    text.includes('נחל כלח')
  );

  const isNorthRegion = (
    text.includes('בצפון') || text.includes('לצפון') || text.includes('באזור הצפון') ||
    text.includes('צפון') || text.includes('גליל') || text.includes('בגליל') || text.includes('לגליל') ||
    text.includes('גולן') || text.includes('בגולן') || text.includes('לגולן') ||
    text.includes('כנרת') || text.includes('בכנרת') || text.includes('סובב כנרת') ||
    text.includes('כרמל') || text.includes('בכרמל') || text.includes('חרמון') || text.includes('בחרמון') ||
    text.includes('עמקים') || text.includes('בעמקים') || text.includes('חיפה') || text.includes('בחיפה')
  );

  const isCenterRegion = (
    text.includes('במרכז') || text.includes('למרכז') || text.includes('באזור המרכז') ||
    text.includes('מרכז') || text.includes('שרון') || text.includes('בשרון') || text.includes('באזור השרון') ||
    text.includes('תל אביב') || text.includes('בתל אביב') || text.includes('עמק חפר') ||
    text.includes('פולג') || text.includes('ירקון') || text.includes('גוש דן')
  );

  const isSouthRegion = (
    text.includes('בדרום') || text.includes('לדרום') || text.includes('באזור הדרום') ||
    text.includes('דרום') || text.includes('נגב') || text.includes('בנגב') || text.includes('לנגב') ||
    text.includes('מדבר') || text.includes('במדבר') || text.includes('למדבר') ||
    text.includes('ים המלח') || text.includes('בים המלח') || text.includes('ערבה') || text.includes('בערבה') ||
    text.includes('אילת') || text.includes('באילת') || text.includes('מכתש רמון') || text.includes('במכתש רמון') ||
    text.includes('רמון') || text.includes('ברמון') || text.includes('עין יהב') || text.includes('ספיר') || text.includes('ירוחם')
  );

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
  } else if (isJerusalemRegion) {
    updated.region = 'jerusalem';
    updated.regionLabel = 'ירושלים והסביבה';
    updated.maxDistanceKm = null;
    if (foundCity && !['ירושלים', 'בירה', 'מבשרת ציון', 'מעלה אדומים', 'בית שמש', 'גוש עציון'].some(n => foundCity.names.includes(n))) {
      updated.originCity = foundCity.label;
      updated.originName = foundCity.label;
      updated.originCoords = [foundCity.lat, foundCity.lng];
    } else {
      updated.originCity = null;
      updated.originName = null;
      updated.originCoords = null;
    }
  } else if (isWestGalileeRegion) {
    updated.region = 'west_galilee';
    updated.regionLabel = 'גליל מערבי וחוף הגליל';
    updated.maxDistanceKm = null;
    updated.originCity = null;
    updated.originName = null;
    updated.originCoords = null;
  } else if (isGolanRegion) {
    updated.region = 'golan';
    updated.regionLabel = 'רמת הגולן והחרמון';
    updated.maxDistanceKm = null;
    updated.originCity = null;
    updated.originName = null;
    updated.originCoords = null;
  } else if (isUpperGalileeRegion) {
    updated.region = 'upper_galilee';
    updated.regionLabel = 'גליל עליון ואצבע הגליל';
    updated.maxDistanceKm = null;
    updated.originCity = null;
    updated.originName = null;
    updated.originCoords = null;
  } else if (isCarmelRegion) {
    updated.region = 'carmel';
    updated.regionLabel = 'כרמל ורמות מנשה';
    updated.maxDistanceKm = null;
    updated.originCity = null;
    updated.originName = null;
    updated.originCoords = null;
  } else if (isNorthRegion) {
    updated.region = 'north';
    updated.regionLabel = 'צפון (גליל, גולן וכרמל)';
    updated.maxDistanceKm = null;
    if (foundCity) {
      updated.originCity = foundCity.label;
      updated.originName = foundCity.label;
      updated.originCoords = [foundCity.lat, foundCity.lng];
    } else {
      updated.originCity = null;
      updated.originName = null;
      updated.originCoords = null;
    }
  } else if (isCenterRegion) {
    updated.region = 'center';
    updated.regionLabel = 'מרכז והשרון';
    updated.maxDistanceKm = null;
    if (foundCity) {
      updated.originCity = foundCity.label;
      updated.originName = foundCity.label;
      updated.originCoords = [foundCity.lat, foundCity.lng];
    } else {
      updated.originCity = null;
      updated.originName = null;
      updated.originCoords = null;
    }
  } else if (isSouthRegion) {
    updated.region = 'south';
    updated.regionLabel = 'דרום, נגב וים המלח';
    updated.maxDistanceKm = null;
    if (foundCity) {
      updated.originCity = foundCity.label;
      updated.originName = foundCity.label;
      updated.originCoords = [foundCity.lat, foundCity.lng];
    } else {
      updated.originCity = null;
      updated.originName = null;
      updated.originCoords = null;
    }
  } else if (foundCity) {
    updated.originCity = foundCity.label;
    updated.originName = foundCity.label;
    updated.originCoords = [foundCity.lat, foundCity.lng];
    updated.region = 'radius';
    updated.regionLabel = `רדיוס 50 ק"מ מ${foundCity.label}`;
    updated.maxDistanceKm = 50;
  }

  // 3. Feature extraction with negation and dry/land awareness
  const isNoWater = (
    text.includes('בלי מים') ||
    text.includes('ללא מים') ||
    text.includes('לא מים') ||
    text.includes('רק לא מים') ||
    text.includes('לא רוצים מים') ||
    text.includes('לא מעוניינים במים') ||
    text.includes('אין צורך במים') ||
    text.includes('אין מים') ||
    text.includes('שלא יהיה מים') ||
    text.includes('שלא יהיו מים') ||
    text.includes('ללא הליכה במים') ||
    text.includes('בלי הליכה במים') ||
    text.includes('בלי להירטב') ||
    text.includes('בלי להרטב') ||
    text.includes('לא להירטב') ||
    text.includes('לא להרטב') ||
    text.includes('שלא נרטב') ||
    text.includes('שלא נרטבים') ||
    text.includes('ללא שכשוך') ||
    text.includes('בלי שכשוך') ||
    text.includes('ללא טבילה') ||
    text.includes('בלי טבילה') ||
    text.includes('בלי מעיין') ||
    text.includes('ללא מעיין') ||
    text.includes('בלי מעיינות') ||
    text.includes('ללא מעיינות') ||
    text.includes('בלי נחלים') ||
    text.includes('ללא נחלים') ||
    text.includes('בלי בריכות') ||
    text.includes('ללא בריכות') ||
    text.includes('מסלול יבש') ||
    text.includes('טיול יבש') ||
    text.includes('רק יבש') ||
    text.includes('יבש בלבד') ||
    text.includes('מסלולים יבשים') ||
    text.includes('הליכה יבשה') ||
    text.includes('שביל יבש') ||
    text.includes('שבילים יבשים') ||
    text.includes('באדמה') ||
    text.includes('על הקרקע') ||
    text.includes('על האדמה') ||
    text.includes('שביל אדמה') ||
    text.includes('שבילי אדמה') ||
    text.includes('מסלול באדמה') ||
    text.includes('טיול באדמה') ||
    text.includes('ביבשה') ||
    text.includes('הליכה ביבשה') ||
    text.includes('בלי להחליף בגדים') ||
    text.includes('ללא סנדלי שורש') ||
    text.includes('לא להתרטב') ||
    text.includes('יבשה לחלוטין') ||
    /(?:^|[^\u0590-\u05fe])יבש(?=[^\u0590-\u05fe]|$)/.test(text) ||
    /(?:^|[^\u0590-\u05fe])יבשים(?=[^\u0590-\u05fe]|$)/.test(text) ||
    /(?:^|[^\u0590-\u05fe])יבשה(?=[^\u0590-\u05fe]|$)/.test(text) ||
    /(?:^|[^\u0590-\u05fe])באדמה(?=[^\u0590-\u05fe]|$)/.test(text)
  );

  if (isNoWater) {
    updated.excludeWater = true;
  }

  // Negated style phrases: "לא תצפיות", "בלי נוף", "ללא סנפלינג" must NOT select that style.
  // The negated phrase is removed from the text before any feature/concept detection runs.
  const NEGATABLE_FEATURES = [
    { key: 'view', label: 'תצפיות ונוף', words: ['תצפיות', 'תצפית', 'נופים', 'נוף', 'פריחה', 'מבצרים', 'מבצר', 'עתיקות'] },
    { key: 'shade', label: 'יער וצל', words: ['מוצל', 'צל', 'יער', 'חורש', 'עצים'] },
    { key: 'adventure', label: 'אתגר', words: ['סנפלינג', 'אתגרי', 'אתגר', 'סולמות', 'יתדות', 'מצוקים', 'מצוק'] },
  ];
  const negatedFeatures = new Set();
  const negatedLabels = [];
  for (const group of NEGATABLE_FEATURES) {
    const negationRegex = new RegExp(
      `(^|[^\\u0590-\\u05fe])(?:ו)?(?:לא|בלי|ללא)\\s+(?:(?:רוצה|רוצים|צריך|צריכים|מחפש|מחפשים|מעוניין|מעוניינים)\\s+)?(?:ב|ל)?(?:${group.words.join('|')})(?![\\u0590-\\u05fe])`,
      'g'
    );
    const scrubbed = text.replace(negationRegex, '$1 ');
    if (scrubbed !== text) {
      negatedFeatures.add(group.key);
      negatedLabels.push(group.label);
      text = scrubbed;
    }
  }

  // A style carried over from a previous turn is dropped if the user now rejects it
  for (const key of negatedFeatures) {
    if (updated.feature === key) {
      updated.feature = null;
      updated.featureLabel = null;
    }
  }
  if (negatedFeatures.has('view') && ['blooming', 'sunset', 'history', 'quiet', 'wildlife'].includes(updated.concept)) {
    updated.concept = null;
  }

  // Conceptual Intent Mapping (Slang & Metaphors)
  const isPicnicIntent = (
    text.includes('פקל קפה') || text.includes('פק"ל קפה') || text.includes('פק״ל קפה') ||
    text.includes('מחצלת') || text.includes('לשבת עם קפה') || text.includes('פיקניק') ||
    text.includes('על האש') || text.includes('מנגל') || text.includes('שולחנות פיקניק') ||
    text.includes('חניון יום') || text.includes('פינת חמד') || text.includes('לפתוח שולחן') ||
    text.includes('פינג\'אן') || text.includes('פינגאן') || text.includes('קפה שחור') ||
    text.includes('פינת זולה') || text.includes('שולחנות עץ')
  );

  const isCoolHavenIntent = (
    text.includes('שלא נתבשל') || text.includes('שלא נשרף') || text.includes('חם מדי') ||
    text.includes('חם בחוץ') || text.includes('חום אימים') || text.includes('בריחה מהחום') ||
    text.includes('משהו קריר') || text.includes('מערה קרירה') || text.includes('צל כבד') ||
    text.includes('להימלט מהחום') || text.includes('בריחה מהשמש') || text.includes('רק צל') ||
    text.includes('מזגן של הטבע')
  );

  const isIntenseHikeIntent = (
    text.includes('לשרוף שרירים') || text.includes('שרוף שרירים') || text.includes('שובר רגליים') ||
    text.includes('לשבור רגליים') || text.includes('בא לי לטפס') || text.includes('עליות קשות') ||
    text.includes('מיטיבי לכת') || text.includes('טרק קשוח') || text.includes('כושר') ||
    text.includes('סלעים') || text.includes('מסלול שחורים') || text.includes('סכינים ורכסים') ||
    text.includes('כושר קרבי') || text.includes('לתת עבודה') || text.includes('בולדרים')
  );

  const isCasualWalkIntent = (
    text.includes('קליל') || text.includes('קצרצר') || text.includes('סיבוב קצר') ||
    text.includes('לא ללכת הרבה') || text.includes('קצר וקולע') || text.includes('שעה שעתיים') ||
    text.includes('להתאוורר') || text.includes('בלי מאמץ') || text.includes('הליכה רגועה') ||
    text.includes('מישורי') || text.includes('סיבוב של שבת') || text.includes('לנשום אוויר') ||
    text.includes('קרוב לאוטו') || text.includes('קרוב לרכב') || text.includes('בלי מאמץ פיזי')
  );

  // A traveler aged 65-120 is a senior (accessible route needed), even if phrased as "ילד בן 90"
  const seniorAge = detectSeniorAge(text);

  const isSeniorIntent = (
    seniorAge !== null ||
    text.includes('סבא') || text.includes('סבתא') || text.includes('סבים') || text.includes('סבתות') ||
    text.includes('הורים מבוגרים') ||
    text.includes('קשיש') || text.includes('קשישה') || text.includes('קשישים') ||
    text.includes('גיל הזהב') || text.includes('הגיל השלישי') ||
    text.includes('פנסיונר') || text.includes('פנסיונרים') || text.includes('פנסיונרית') ||
    text.includes('קשה ללכת') || text.includes('בלי מדרגות') || text.includes('שביל נוח למבוגרים') ||
    text.includes('ישיבה קרובה לרכב') || text.includes('בלי אבנים')
  );

  const isWildlifeIntent = (
    text.includes('חיות בר') || text.includes('לראות חיות') || text.includes('ציפורים') ||
    text.includes('צפרות') || text.includes('אגמון') || text.includes('עופות') ||
    text.includes('צבאים') || text.includes('יחמורים') || text.includes('ספארי') ||
    text.includes('חי בר') || text.includes('נדידת ציפורים') || text.includes('נשרים') ||
    text.includes('שפני סלע')
  );

  const isBloomingIntent = (
    text.includes('איפה ירוק') || text.includes('איפה יש ירוק') || text.includes('כלניות') ||
    text.includes('רקפות') || text.includes('תורמוסים') || text.includes('אירוסים') ||
    text.includes('שקדיות') || text.includes('מרבדי פריחה') || text.includes('פריחה') ||
    text.includes('ריח של אורנים') || text.includes('ירוק בעיניים') || text.includes('זרימת חורף')
  );

  const isSunsetIntent = (
    text.includes('שקיעה') || text.includes('לתפוס שקיעה') || text.includes('זריחה') ||
    text.includes('לתפוס זריחה') || text.includes('פנורמי') || text.includes('נוף עוצר נשימה') ||
    text.includes('תצפית מטורפת') || text.includes('רואים הכל') || text.includes('תצפית זהב') ||
    text.includes('רואים עד הים') || text.includes('מצפור יפה') || text.includes('נוף הרים')
  );

  const isHistoryIntent = (
    text.includes('היסטוריה') || text.includes('סיפורים מעניינים') || text.includes('תנך') ||
    text.includes('תנ"ך') || text.includes('רומאים') || text.includes('צלבנים') ||
    text.includes('עתיקות') || text.includes('ארכיאולוגיה') || text.includes('מבצר') ||
    text.includes('מבצרים') || text.includes('מערות מסתור') || text.includes('סיפורי קרבות') ||
    text.includes('אתר מורשת')
  );

  const isQuietIntent = (
    text.includes('שקט') || text.includes('בלי הרבה אנשים') || text.includes('בלי המונים') ||
    text.includes('פינה שקטה') || text.includes('רומנטי') || text.includes('שלווה') ||
    text.includes('מבודד') || text.includes('זמן איכות') || text.includes('לברוח מההמונים') ||
    text.includes('להתרחק מהרעש') || text.includes('לנקות את הראש') ||
    text.includes('טעינת מצברים') || text.includes('בלי רעש')
  );

  // BBQ / Picnic Intent
  const isBbqIntent = (
    text.includes('מנגל') || text.includes('על האש') || text.includes('ברביקיו') || text.includes('נפנף')
  );

  // Demographic Indicators & Conflicts: "בוחר את האוכלוסייה עם המגבלות הגדולות ביותר"
  const hasWheelchairOrSenior = (
    isSeniorIntent ||
    text.includes('כיסא גלגלים') || text.includes('כסא גלגלים') || text.includes('קשיש') || text.includes('קשישים') ||
    text.includes('הליכון') || text.includes('מוגבל בהליכה') || text.includes('מוגבלות')
  );
  const hasBabyOrStroller = (
    text.includes('0+') || text.includes('תינוק') || text.includes('תינוקת') || text.includes('פעוט') ||
    ((text.includes('עגלה') || text.includes('עגלות') || text.includes('טיולון')) && !text.includes('בלי עגלה') && !text.includes('ללא עגלה') && !text.includes('בלי עגלות') && !text.includes('ללא עגלות'))
  );
  const hasHighlyRestrictedPopulation = hasWheelchairOrSenior || hasBabyOrStroller;

  const hasAdventureKeywords = (
    text.includes('סולמות') || text.includes('יתדות') || text.includes('סנפלינג') ||
    text.includes('אתגרי') || text.includes('לקרוע את השרירים') || text.includes('לשרוף שרירים') ||
    text.includes('שחורים') || text.includes('מיטיבי לכת') || text.includes('טיפוס בולדרים') || text.includes('מסלול שחור')
  );

  if (hasHighlyRestrictedPopulation && hasAdventureKeywords) {
    // Conflict resolution: The population with the greatest limitations strictly dictates the trail criteria!
    updated.demographicConflictResolved = true;
    updated.feature = 'stroller';
    updated.featureLabel = 'שביל סלול ונגיש (עדיפות בטיחותית למגבלות נגישות)';
    updated.minAge = 0;
    updated.minAgeLabel = '0+ (נגיש ומיושר לכולם)';
    updated.wheelchairNote = true;
  } else if (isBbqIntent) {
    updated.concept = 'bbq';
    updated.feature = 'shade';
    updated.featureLabel = 'חניון נופש ופיקניק (מותר למנגל)';
    updated.bbqDisclaimer = true;
  } else if (isSeniorIntent) {
    updated.isSenior = true;
    if (seniorAge !== null) updated.seniorAge = seniorAge;
    updated.feature = 'stroller';
    updated.featureLabel = 'שביל סלול / נגיש ונוח להליכה (מותאם לקשישים ומבוגרים)';
    updated.minAge = 0;
    updated.minAgeLabel = 'גיל הזהב / קשישים (שבילים נגישים ונוחים)';
    updated.wheelchairNote = true;
  } else if (isIntenseHikeIntent) {
    updated.feature = 'adventure';
    updated.featureLabel = 'מסלול אתגרי למיטיבי לכת';
    if (updated.minAge == null || updated.minAge < 10) {
      updated.minAge = 10;
      updated.minAgeLabel = '10+ (נוער ומבוגרים)';
    }
  } else if (isPicnicIntent) {
    updated.concept = 'picnic';
    updated.feature = 'shade';
    updated.featureLabel = 'פיקניק ופק"ל קפה בחורש מוצל';
  } else if (isCoolHavenIntent) {
    updated.concept = 'cool_haven';
    updated.feature = 'shade';
    updated.featureLabel = isNoWater ? 'בריחה מהחום - מערות ויערות מוצלים' : 'בריחה מהחום - מערות וחורש מוצל';
  } else if (isWildlifeIntent) {
    updated.concept = 'wildlife';
    updated.feature = 'view';
    updated.featureLabel = 'תצפית חיות בר וציפורים';
  } else if (isBloomingIntent) {
    updated.concept = 'blooming';
    updated.feature = 'view';
    updated.featureLabel = 'מרבדי פריחה ונוף ירוק';
  } else if (isSunsetIntent) {
    updated.concept = 'sunset';
    updated.feature = 'view';
    updated.featureLabel = 'מצפורים לשקיעה ונוף פנורמי';
  } else if (isHistoryIntent) {
    updated.concept = 'history';
    updated.feature = 'view';
    updated.featureLabel = 'אתרי מורשת, מבצרים והיסטוריה';
  } else if (isQuietIntent) {
    updated.concept = 'quiet';
    updated.feature = 'view';
    updated.featureLabel = 'פינות חמד שקטות ותצפיות נוף';
  } else if (isCasualWalkIntent) {
    updated.concept = 'easy';
    updated.feature = 'stroller';
    updated.featureLabel = 'מסלול קליל וקצר';
    if (updated.minAge === null) {
      updated.minAge = 0;
      updated.minAgeLabel = 'מתאים לכולם (0+)';
    }
  } else if (
    !isNoWater && (
      text.includes('הליכה במים') || text.includes('הלחכה במים') || text.includes('בתוך המים') ||
      text.includes('מסלול מים') || text.includes('מים') || text.includes('רטוב') || text.includes('נחל זורם') ||
      text.includes('מג\'רסה') || text.includes('מג׳רסה') || text.includes('מגרסה') ||
      text.includes('דליות') || text.includes('זאכי') || text.includes('שניר') || text.includes('תל דן')
    )
  ) {
    updated.feature = 'water';
    updated.featureLabel = 'הליכה בתוך המים';
  } else if (!isNoWater && (text.includes('מעיין') || text.includes('בריכה') || text.includes('שכשוך') || text.includes('טבילה'))) {
    updated.feature = 'spring';
    updated.featureLabel = 'מעיין / בריכת שכשוך';
  } else if (text.includes('סנפלינג') || text.includes('אתגרי') || text.includes('סולמות') || text.includes('יתדות') || text.includes('קניון אתגרי') || text.includes('מצוק')) {
    updated.feature = 'adventure';
    updated.featureLabel = isNoWater ? 'מסלול אתגרי (ללא מים)' : 'סנפלינג / מסלול אתגרי';
  } else if (text.includes('מוצל') || text.includes('צל') || text.includes('יער') || text.includes('חורש') || text.includes('עצים')) {
    updated.feature = 'shade';
    updated.featureLabel = isNoWater ? 'יער וחורש מוצל (ללא מים)' : 'יער וחורש מוצל';
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
    updated.featureLabel = isNoWater ? 'תצפיות ונוף (ללא מים)' : 'תצפיות ונוף';
  } else if (isNoWater) {
    updated.feature = 'dry';
    updated.featureLabel = 'מסלול יבש (ללא מים)';
  }

  // 4. Youngest age extraction
  const extractedAge = parseAgeFromText(text);
  const allParsedAges = collectAgesFromText(text);
  const nonSeniorAges = allParsedAges.filter(a => a < SENIOR_MIN_AGE);
  const youngestChildAge = nonSeniorAges.length > 0 ? Math.min(...nonSeniorAges) : null;

  if (isSeniorIntent || seniorAge !== null) {
    updated.isSenior = true;
    if (seniorAge !== null) updated.seniorAge = seniorAge;
    updated.minAge = 0;
    updated.wheelchairNote = true;
    if (hasBabyOrStroller) {
      updated.minAgeLabel = 'עגלות תינוק וגיל הזהב (נגיש ומישורי לכולם)';
    } else if (youngestChildAge !== null) {
      updated.exactAge = youngestChildAge;
      updated.minAgeLabel = 'משפחה משולבת עם גיל הזהב (שבילים נוחים ונגישים לכולם)';
    } else {
      if (seniorAge !== null) updated.exactAge = seniorAge;
      updated.minAgeLabel = 'גיל הזהב / קשישים (שבילים נגישים ונוחים)';
    }
  } else if (extractedAge !== null) {
    updated.exactAge = extractedAge;
    if (hasHighlyRestrictedPopulation || extractedAge <= 2.5) {
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
  } else if (hasHighlyRestrictedPopulation) {
    updated.minAge = 0;
    updated.minAgeLabel = 'מתאים לכולם (0+)';
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

/**
 * Detect impossible climate or geographic contradictions
 * e.g., Snow in Eilat / Desert, Skiing in the desert, etc.
 */
export function checkClimateContradictions(message) {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase();

  const isIceCanteenOrCooler = (
    lower.includes('מים עם קרח') ||
    lower.includes('צידנית עם קרח') ||
    lower.includes('קרח בבקבוק') ||
    lower.includes('קרח בתרמוס') ||
    lower.includes('ארטיק קרח')
  );

  const mentionsIce = !isIceCanteenOrCooler && (
    lower.includes('טיול קרח') ||
    lower.includes('מסלול קרח') ||
    lower.includes('שביל קרח') ||
    lower.includes('מערת קרח') ||
    lower.includes('מערות קרח') ||
    lower.includes('קרחון') ||
    lower.includes('קרחונים') ||
    lower.includes('החלקה על הקרח') ||
    lower.includes('טיפוס קרח') ||
    lower.includes('על הקרח') ||
    /(?:^|[^\u0590-\u05FFa-zA-Z0-9])קרח(?:$|[^\u0590-\u05FFa-zA-Z0-9])/.test(lower)
  );

  const mentionsSnow = (
    lower.includes('שלג') || lower.includes('סקי') || lower.includes('מזחלות שלג') || lower.includes('בובסליי')
  );

  const mentionsDesertOrEilat = (
    lower.includes('באילת') || lower.includes('לאילת') || lower.includes('אילת') ||
    lower.includes('במדבר') || lower.includes('מדבר') ||
    lower.includes('בערבה') || lower.includes('ערבה') ||
    lower.includes('בים המלח') || lower.includes('ים המלח') ||
    lower.includes('בנגב') || lower.includes('נגב') ||
    lower.includes('בדרום') || lower.includes('דרום')
  );

  // 1. Ice or Snow in Desert / South / Eilat
  if ((mentionsSnow || mentionsIce) && mentionsDesertOrEilat) {
    const isEilat = lower.includes('אילת');
    const regionName = isEilat ? 'אילת' : 'אזור הדרום והמדבר';
    const hazardWord = mentionsIce && !mentionsSnow ? 'קרח' : (mentionsIce && mentionsSnow ? 'שלג או קרח' : 'שלג');

    const hasFifty = lower.includes('50') || lower.includes('חמישים');
    const fiftyNote = hasFifty ? '\n\n💡 בנוסף, גיל 50 הוא גיל בוגר ומנוסה ולא "ילד" 😉 — כל דרגות הקושי פתוחות בפניכם!' : '';

    return {
      contradiction: true,
      text: `❄️🚫 אין ${hazardWord} ב${regionName}!\n\n${regionName} מאופיין באקלים מדברי, חם ויבש לאורך כל ימות השנה. בישראל אין קרחונים או מסלולי קרח כלל, ושלג יורד אך ורק בהר החרמון ובצפון רמת הגולן במהלך חודשי החורף (דצמבר–מרץ).${fiftyNote}\n\n💡 אנא נסחו שוב את שאלתכם:\n• אם אתם מחפשים שלג וקור — כדאי לבחור באזור הצפון (חרמון וגולן) בעונת החורף.\n• אם אתם רוצים לטייל ב${regionName} — נסחו מחדש מסלול מדברי מתאים (למשל: בקעת תמנע, הרי אילת, עין עבדת או מכתש רמון).\n• או בחרו באחת האפשרויות למטה:`,
      options: [
        { label: '🏔️ חפש שלג בצפון (חרמון וגולן)', value: 'מחפש מסלול שלג בחרמון ובצפון' },
        { label: '🏜️ מסלול מדברי באילת והדרום', value: 'מחפש מסלול מדברי יפה באזור אילת והדרום' },
        { label: '🔄 איפוס והתחלה מחדש', value: 'התחל מחדש' },
      ],
    };
  }

  // 1.1 Seasonal Snow Check across Israel (Outside Winter Months)
  const currentMonth = new Date().getMonth() + 1;
  const isWinterSeason = currentMonth === 12 || currentMonth === 1 || currentMonth === 2 || currentMonth === 3;
  const mentionsWinterMonth = lower.includes('ינואר') || lower.includes('פברואר') || lower.includes('מרץ') || lower.includes('דצמבר') || lower.includes('בחורף');

  if (mentionsSnow && !isWinterSeason && !mentionsWinterMonth) {
    const isHermon = lower.includes('חרמון');
    const place = isHermon ? 'בהר החרמון ובארץ' : 'בישראל';
    return {
      contradiction: true,
      text: `❄️🚫 אין שלג ${place} בעונה זו!\n\nשלג בישראל יורד אך ורק בהר החרמון ובצפון רמת הגולן בשיא חודשי החורף (דצמבר–מרץ).\nכעת (עונת הסתיו/הקיץ) אין שלג בארץ כלל, ואתר החרמון פתוח לסיורי קיץ, רכבל ונוף הררי בלבד ללא שלג.\n\n💡 אנא נסחו שוב את שאלתכם או בחרו באחת האפשרויות למטה:\n• מחפשים קרירות ומים? כדאי לבחור במסלול נחלים ומעיינות זורמים בצפון.\n• מעוניינים לבקר בחרמון ובגולן? תוכלו ליהנות מנופי ההרים ומזג אוויר נעים ללא שלג.\n• או בחרו באחת האפשרויות למטה:`,
      options: [
        { label: '💧 מסלול מים מוצל בצפון', value: 'מחפש מסלול מים מוצל בצפון' },
        { label: '🏔️ טיול נוף בהרי הגולן והחרמון', value: 'מחפש טיול נוף ברמת הגולן' },
        { label: '🔄 התחל מחדש', value: 'התחל מחדש' },
      ],
    };
  }

  // 1.2 Forest / Shaded Woodland in Desert / Negev Contradiction Check
  const mentionsForestOrShade = (
    lower.includes('יער') || lower.includes('חורש') || lower.includes('מוצל') || lower.includes('מוצר') ||
    lower.includes('עצי אורן') || lower.includes('אלונים')
  );
  const mentionsDesertSouth = (
    lower.includes('בנגב') || lower.includes('נגב') || lower.includes('בנג') ||
    lower.includes('במדבר') || lower.includes('מדבר') ||
    lower.includes('בערבה') || lower.includes('ערבה') ||
    lower.includes('בדרום') || lower.includes('דרום') ||
    lower.includes('באילת') || lower.includes('אילת')
  );

  if (mentionsForestOrShade && mentionsDesertSouth && !lower.includes('יתיר') && !lower.includes('להב')) {
    const place = lower.includes('אילת') ? 'באילת' : lower.includes('ערבה') ? 'בערבה' : 'בנגב ובדרום המדברי';
    return {
      contradiction: true,
      text: `🌲🚫 לא קיימים יערות מוצלים ${place}!\n\nהנגב, הערבה ואילת מאופיינים באקלים מדברי צחיח ופתוח של מצוקים, מכתשים ודיונות חול — ללא יערות חורש טבעיים או צל עצים (אתרים כמו חולות צבעוניים או מכתש רמון חשופים לשמש לחלוטין).\n\n💡 איפה כדאי לטייל?\n• מחפשים יערות מוצלים? כדאי לבחור בהרי ירושלים (יער עמינדב/סטף), ברכס הכרמל (שוויצריה הקטנה) או בצפון (יער ביריה ואלוני אבא).\n• מעוניינים לטייל בנגב? מומלץ לבחור במסלול מדברי ייחודי (כמו מכתש רמון, עין עבדת או נחל קרקש) בשעות הבוקר הנעימות.\n• יער יתיר ולהב — היערות הנטועים היחידים בצפון הנגב.\n• או בחרו באחת האפשרויות למטה:`,
      options: [
        { label: '🌲 יערות מוצלים בהרי ירושלים', value: 'מחפש יער מוצל בהרי ירושלים' },
        { label: '🌲 יערות מוצלים בכרמל ובצפון', value: 'מחפש יער מוצל בכרמל ובצפון' },
        { label: '🏜️ מסלול מדברי בנגב (מכתש רמון)', value: 'מחפש מסלול מדברי במכתש רמון' },
        { label: '🔄 התחל מחדש', value: 'התחל מחדש' },
      ],
    };
  }

  // 2. Ice or Glaciers anywhere in Israel
  if (mentionsIce) {
    return {
      contradiction: true,
      text: `❄️🚫 בישראל אין קרחונים או מסלולי קרח!\n\nאקלים ישראל הוא ים-תיכוני ומדברי, ולכן לא קיימים בארץ קרחונים, מערות קרח או מסלולי הליכה על קרח. שלג יורד אך ורק בהר החרמון ובצפון רמת הגולן במהלך חודשי החורף (דצמבר–מרץ).\n\n💡 אנא נסחו שוב את שאלתכם:\n• אם אתם מחפשים חוויה חורפית ומושלגת — כדאי לבחור באזור הצפון (אתר החרמון) בעונת החורף.\n• אם אתם מחפשים מקום קריר ומפלט מהחום — מומלץ לבחור במסלול מים זורמים בצפון או במערה קרירה (כמו מערות הפעמון בבית גוברין).\n• או בחרו באחת האפשרויות למטה:`,
      options: [
        { label: '🏔️ חפש שלג בצפון (חרמון וגולן)', value: 'מחפש מסלול שלג בחרמון ובצפון' },
        { label: '💧 מסלול מים קריר בצפון', value: 'מחפש מסלול מים מוצל בצפון' },
        { label: '🏰 מערה קרירה בבית גוברין', value: 'ספר לי על בית גוברין' },
      ],
    };
  }

  // 3. Cherry Picking (קטיף דובדבנים) - Exclusively May-June
  const mentionsCherryPicking = (
    lower.includes('קטיף דובדבנים') || lower.includes('דובדבנים') || lower.includes('קטיף דובדבן')
  );
  const isCherrySeason = currentMonth === 5 || currentMonth === 6;
  const mentionsCherryMonths = lower.includes('מאי') || lower.includes('יוני') || lower.includes('באביב');
  if (mentionsCherryPicking && !isCherrySeason && !mentionsCherryMonths) {
    return {
      contradiction: true,
      text: `🍒🚫 עונת קטיף הדובדבנים בצפון וברמת הגולן מתקיימת בחודשי מאי ויוני בלבד!\n\nכעת המטעים סגורים לקטיף. בעונה הנוכחית מומלץ ליהנות ממסלולי מים זורמים, מעיינות קרירים או יערות מוצלים בצפון.\n\n💡 אנא נסחו שוב את שאלתכם או בחרו באחת האפשרויות למטה:`,
      options: [
        { label: '💧 מסלול מים מוצל בצפון', value: 'מחפש מסלול מים מוצל בצפון' },
        { label: '🌲 יער מוצל ושבילי הליכה', value: 'מחפש יער מוצל בצפון' },
        { label: '🔄 התחל מחדש', value: 'התחל מחדש' },
      ],
    };
  }

  // 4. Red Anemones / Blooming (דרום אדום / כלניות) - Exclusively Winter/Spring (Jan-March)
  const mentionsAnemones = (
    lower.includes('כלניות') || lower.includes('שדה כלניות') || lower.includes('שדות כלניות') ||
    lower.includes('דרום אדום') || lower.includes('מרבדי כלניות') || lower.includes('תורמוסים')
  );
  const isBloomingSeason = currentMonth === 12 || currentMonth === 1 || currentMonth === 2 || currentMonth === 3;
  if (mentionsAnemones && !isBloomingSeason && !mentionsWinterMonth) {
    return {
      contradiction: true,
      text: `🌸🚫 עונת פריחת הכלניות (פסטיבל "דרום אדום") מתרחשת בחודשי החורף והאביב בלבד (ינואר–מרץ)!\n\nבעונה הנוכחית השדות בדרום יבשים וצהובים ואין פריחה כלל. אם אתם מעוניינים לטייל בדרום כעת, מומלץ לבחור במסלולי מדבר וקניונים נעימים (כמו מכתש רמון או עין עבדת), או ליהנות מבריכות ומעיינות בצפון ובמרכז.\n\n💡 אנא נסחו שוב את שאלתכם או בחרו באחת האפשרויות למטה:`,
      options: [
        { label: '🏜️ מסלול מדברי במכתש רמון', value: 'מחפש מסלול במכתש רמון' },
        { label: '💧 מעיין מוצל במרכז או בצפון', value: 'מחפש מעיין מוצל' },
        { label: '🔄 התחל מחדש', value: 'התחל מחדש' },
      ],
    };
  }

  // 5. Autumn Foliage (שלכת) in Spring/Summer
  const mentionsAutumnFoliage = lower.includes('שלכת') && !lower.includes('בשלכת');
  const isAutumnSeason = currentMonth >= 10 && currentMonth <= 12;
  const mentionsSpringOrSummer = lower.includes('בקיץ') || lower.includes('באביב') || lower.includes('יולי') || lower.includes('אוגוסט') || lower.includes('יוני') || lower.includes('אפריל') || lower.includes('מאי');
  if (mentionsAutumnFoliage && (mentionsSpringOrSummer || (!isAutumnSeason && !lower.includes('בסתיו')))) {
    return {
      contradiction: true,
      text: `🍁🚫 עונת השלכת בישראל מתרחשת בסתיו ובחורף בלבד (אוקטובר–דצמבר)!\n\nבעונות האביב והקיץ הטבע בישראל ירוק או יבש, ואין נשירת עלים צבעונית. מומלץ לבחור במסלולי מים קרירים או יערות מוצלים.\n\n💡 אנא נסחו שוב את שאלתכם או בחרו באחת האפשרויות למטה:`,
      options: [
        { label: '💧 מסלול מים מוצל', value: 'מחפש מסלול מים מוצל' },
        { label: '🌲 יער מוצל להליכה', value: 'מחפש יער מוצל להליכה' },
        { label: '🔄 התחל מחדש', value: 'התחל מחדש' },
      ],
    };
  }

  // 6. Night Hiking in Canyon Streams & Cliffs
  const isNightHike = (
    lower.includes('טיול לילה') || lower.includes('בלילה') || lower.includes('אחרי החשיכה') ||
    lower.includes('בחושך') || lower.includes('שעות הלילה')
  );
  const isCanyonOrStream = (
    lower.includes('נחל') || lower.includes('מצוק') || lower.includes('סנפלינג') ||
    lower.includes('דרגה') || lower.includes('ערוגות') || lower.includes('זוויתן') ||
    lower.includes('יהודיה') || lower.includes('עין גדי') || lower.includes('קניון')
  );
  if (isNightHike && isCanyonOrStream) {
    return {
      contradiction: true,
      text: `🌙⚠️ טיול לילה בנחלי מצוקים ושמורות טבע סגורות אסור על פי חוק ומסכן חיים!\n\nשמורות הטבע וערוצי הנחלים בישראל נסגרים עם שקיעת החמה (16:00–17:00). הליכה לילית בנחלי מצוקים ובריכות אסורה בהחלט עקב סכנת נפילה חמורה לתהום ופגיעה בחיי הבר המדבריים.\n\n💡 אם אתם רוצים חוויה לילית בטוחה בטבע:\n• בחרו בחניון לילה מוסדר של קק"ל או רט"ג.\n• לתצפית כוכבים מרהיבה — סעו למצפורי הכוכבים במכתש רמון (שמורת אור כוכבים בינלאומית).`,
      options: [
        { label: '🌌 תצפית כוכבים במכתש רמון', value: 'תצפית כוכבים במכתש רמון' },
        { label: '🏕️ חניון לילה מוסדר', value: 'מחפש חניון לילה מוסדר' },
        { label: '☀️ טיול יום רגיל', value: 'מעדיף טיול ביום' },
      ],
    };
  }

  return null;
}

/**
 * Extract candidate site / stream entity mentioned by user
 * e.g., "לטייל לנחל כזיב" -> "נחל כזיב", "בנחל החידקל" -> "נחל החידקל"
 */
export function extractRequestedSiteEntity(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase().trim();

  // Exclude generic terms / adjectives / regions / dates
  const GENERIC_EXCLUSIONS = [
    'מים', 'זורם', 'יבש', 'קצר', 'מעגלי', 'אתגרי', 'יפה', 'קריר', 'מוצל',
    'טבע', 'הליכה', 'משפחתי', 'עגלות', 'סלול', 'נוף', 'פריחה', 'ארכיאולוגיה',
    'הצפון', 'הדרום', 'המרכז', 'השרון', 'ירושלים', 'מחר', 'היום', 'שבת', 'השבוע',
    'נעים', 'רטוב', 'עתיק', 'עתיקה', 'עתיקים', 'עתיקות', 'מורשת', 'היסטורי', 'היסטורית',
    'רומי', 'צלבני', 'לאומי', 'גדול', 'קטן', 'עמוק', 'ארוך', 'בצפון', 'בדרום', 'במרכז', 'בירושלים',
    'קרוב', 'רחוק', 'קל', 'קשה', 'שקט', 'רגוע', 'פסטורלי',
    'ילד', 'ילדים', 'תינוק', 'תינוקות', 'עגלה', 'עגלות', 'משפחה', 'סבא', 'סבתא', 'הורים', 'נוער', 'מבוגרים',
    'חברים', 'זוג', 'לבד', 'כולם', 'בחוץ', 'שמש', 'צל', 'יער', 'מסלול', 'שביל',
    'סופש', 'סופ"ש', 'מחרתיים', 'הקרוב', 'הבאה', 'הזה', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי',
    'צפון', 'דרום', 'מרכז', 'גליל', 'גולן', 'שרון', 'שפלה', 'נגב', 'ערבה', 'אילת', 'כנרת', 'כרמל',
    'אזור', 'איזור', 'ארץ', 'בארץ', 'ישראל', 'בישראל', 'כל הארץ', 'כל'
  ];

  const isDateOrTimeOrNoise = (c) => {
    if (!c) return true;
    const trimmed = c.trim();
    if (/^\d+([/.-]\d+)?$/.test(trimmed)) return true;
    if (/^\d+$/.test(trimmed)) return true;
    const dateWords = [
      'ינואר', 'פברואר', 'מרץ', 'מרס', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
      'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת',
      'קיץ', 'חורף', 'אביב', 'סתיו', 'עונה',
      'היום', 'מחר', 'מחרתיים', 'סופש', 'סופ"ש', 'השבוע', 'החודש'
    ];
    return dateWords.some((dw) => trimmed === dw || trimmed.startsWith(dw + ' ') || trimmed.endsWith(' ' + dw));
  };

  // 1. Pattern matching with site type prefix: "שמורת טבע X", "גן לאומי X", "נחל X", "תל X", etc.
  const streamMatch = lower.match(/(?:(?:לטייל|טיול|מסלול|לנסוע|ללכת|גשם|תחזית|מזג אוויר|מזג אויר|חם|קר|פתוח|יש גשם|ירד גשם|האם יש גשם|אם יש גשם)\s+(?:ל|ב)?)?\s*(?:ל|ב)?(שמורת טבע|גן לאומי|בית ספר שדה|חניון לילה|נחל|נהר|מעיין|עין|שמורת|יער|מבצר|פארק|תל|הר|מצדה|חורבת)\s+([א-ת"״'-]{3,20}(?:\s+[א-ת"״'-]{3,20})?)/);
  if (streamMatch) {
    let prefix = streamMatch[1];
    const name = streamMatch[2] ? streamMatch[2].trim() : '';
    if (name) {
      let words = name.split(/\s+/).filter(Boolean);
      if (prefix === 'שמורת' && words[0] === 'טבע') {
        prefix = 'שמורת טבע';
        words.shift();
      }
      if (prefix === 'גן' && words[0] === 'לאומי') {
        prefix = 'גן לאומי';
        words.shift();
      }
      while (words.length > 1 && (GENERIC_EXCLUSIONS.includes(words[words.length - 1]) || isDateOrTimeOrNoise(words[words.length - 1]))) {
        words.pop();
      }
      const cleanName = words.join(' ');
      if (cleanName && !words.some((w) => GENERIC_EXCLUSIONS.includes(w)) && !GENERIC_EXCLUSIONS.includes(cleanName)) {
        return `${prefix} ${cleanName}`.trim();
      }
    }
  }

  // 2. Pattern matching general destination: "רוצה לטייל בעזה", "לנסוע לחאן יונס", "טיול בנרניה", "טיול לארץ האש"
  const destMatch = lower.match(/(?:רוצה|בא לי|מחפש|מתכנן|נוסע|נוסעים|הולכים|יוצאים)?\s*(?:לטייל|טיול|לנסוע|ללכת|חופשה|נופש|לטוס|טיסה)\s+(?:ב|ל|אל)\s*([א-תa-zA-Z0-9"״'-]{2,20}(?:\s+[א-תa-zA-Z0-9"״'-]{1,20})?)/);
  if (destMatch) {
    let candidate = destMatch[1].trim();
    let words = candidate.split(/\s+/).filter(Boolean);
    // Strip trailing prepositions (e.g. "מלפפון ב" -> "מלפפון")
    if (words.length > 1 && ['ב', 'ל', 'עם', 'של'].includes(words[words.length - 1])) {
      words.pop();
      candidate = words.join(' ');
    }
    const isGeneric = GENERIC_EXCLUSIONS.includes(candidate) || 
      (words.length > 0 && GENERIC_EXCLUSIONS.includes(words[0]) && words[0] !== 'ארץ');
    if (!isGeneric && !isDateOrTimeOrNoise(candidate) && candidate.length >= 2) {
      return candidate;
    }
  }

  // 3. Direct inquiry matching: "ספר לי על X", "מידע על X", "מכיר את X", "מה יש ב-X"
  const infoMatch = lower.match(/(?:ספר לי על|ספרי לי על|מידע על|מכיר את|מכירה את|תגיד לי על|מה יש ב|איך מגיעים ל|איך להגיע ל)\s+(?:ה)?([א-תa-zA-Z0-9"״'-]{2,25}(?:\s+[א-תa-zA-Z0-9"״'-]{1,25})?)/);
  if (infoMatch) {
    let candidate = infoMatch[1].trim();
    let words = candidate.split(/\s+/).filter(Boolean);
    if (words.length > 1 && ['ב', 'ל', 'עם', 'של'].includes(words[words.length - 1])) {
      words.pop();
      candidate = words.join(' ');
    }
    const isGeneric = GENERIC_EXCLUSIONS.includes(candidate) || 
      (words.length > 0 && GENERIC_EXCLUSIONS.includes(words[0]) && words[0] !== 'ארץ');
    if (!isGeneric && !isDateOrTimeOrNoise(candidate) && candidate.length >= 2) {
      return candidate;
    }
  }

  return null;
}

/**
 * Detect gibberish, symbol spam, emoji noise, or random non-words
 */
export function isGibberishOrNoise(message) {
  if (!message || typeof message !== 'string') return true;
  const trimmed = message.trim();
  if (trimmed.length === 0) return true;

  // Standalone numbers 0-18 (could be an age response)
  if (/^\d{1,2}$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num >= 0 && num <= 18) return false;
  }

  // 1. Punctuation, symbols, emojis, or numbers only (e.g. "????", "😀😀", "!@#$%")
  const textChars = trimmed.replace(/[\s\p{P}\p{S}\p{N}]/gu, '');
  if (textChars.length === 0) {
    return true;
  }

  // 2. Only Latin characters with random consonants / keyboard smash (e.g. "asdfghjkl")
  const latinLetters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const hebrewLetters = (trimmed.match(/[\u0590-\u05FF]/g) || []).length;
  if (hebrewLetters === 0 && latinLetters > 3) {
    const isCommonWord = ['reset', 'restart', 'help', 'start', 'hello', 'hi'].includes(trimmed.toLowerCase());
    if (!isCommonWord) return true;
  }

  // 3. Repeated same character 4+ times (e.g. "ששששששש", "אאאאאאא", "חחחחחחח")
  if (/(.)\1{3,}/.test(trimmed)) {
    return true;
  }

  // 4. Hebrew keyboard rows mashing without vowels/words
  const hebrewSmashPatterns = [
    /^[שדגכעיחלךף,]{4,}$/,
    /^[זסבהנמצתץ.]{4,}$/
  ];
  if (hebrewSmashPatterns.some((p) => p.test(textChars))) {
    return true;
  }

  return false;
}

const SCOPE_SIGNALS = /(?:טיול|טייל|מסלול|שביל|שמור|גן לאומי|נחל|מעיין|עין |מצפ|יער|פיקניק|הליכ|טבע|אתר|פריח|תצפית|שקיעה|מבצר|מערה|קניון|מפל|חוף|פארק|צפון|דרום|מרכז|ירושלים|גליל|גולן|נגב|כנרת|אילת|ים המלח|שרון|שפלה|ערבה|כרמל|היום|מחר|מחרתיים|סופש|סופ"ש|סוף שבוע|שבת|ילד|תינוק|פעוט|עגל|סבא|סבתא|משפחה|הורים|נוער|כלב|גיל|בן \d|בת \d|\d|מים|צל|חם|קר|גשם|מזג|תחזית|קק"ל|רט"ג|חניון|קמפינג|לינה|הפתע|תחליט|תבחר|לא משנה|התחל|אפס|ריסט|reset|restart|עוד|הבא|שנה|מה אם|תרחיש|שיטפון|ספר לי|מידע על|כל הארץ|בארץ|ישראל|הכל|שניהם|גם וגם|כן|לא|תודה|אוקיי|אשמח|בטוח|סכנה|עזרה|הצילו|חירום|נתיב|טרק|סנפלינג|אופניים|רכב|נגיש|קצר|קל|אתגר)/i;

/**
 * Positive scope check. A message is "in scope" if it carries at least one
 * hiking / trip-planning / planning-parameter signal, or mentions a known origin city.
 * One-word messages are given the benefit of the doubt.
 */
export function isInScope(message) {
  if (!message || typeof message !== 'string') return true;
  const lower = message.toLowerCase().trim();
  if (lower.split(/\s+/).length <= 1) return true;
  if (SCOPE_SIGNALS.test(lower)) return true;
  return KNOWN_ORIGIN_CITIES.some((c) => c.names.some((n) => lower.includes(n)));
}

/**
 * Detects whether the user is inquiring about seeing, watching, chasing, or forecasting flash floods in the desert
 * (e.g. "לראות שיטפון במדבר", "לראות שיטפונות", "ציידי שיטפונות", "צפייה בשיטפונות", "יש שיטפון במדבר", "סיכוי לשיטפון")
 * Note: What-If crisis simulation (e.g. "מה אם יש שיטפון בעין גדי") is NOT a flood watch inquiry.
 * @param {string} message 
 * @returns {boolean}
 */
export function isDesertFloodInquiry(message) {
  if (!message || typeof message !== 'string') return false;
  const lower = message.toLowerCase().trim();

  // 1. Exclude What-If crisis scenarios
  if (lower.includes('מה אם') || lower.includes('what if') || lower.includes('תרחיש')) {
    return false;
  }

  // 2. Exclude active emergency distress (drowning, trapped, flood water rising)
  if (
    lower.includes('שיטפון עולה') ||
    lower.includes('שיטפון מתקרב') ||
    lower.includes('מים בוציים בנחל') ||
    lower.includes('זרם חזק בנחל') ||
    lower.includes('נסחפים') ||
    lower.includes('לכודים') ||
    lower.includes('טובעים')
  ) {
    return false;
  }

  // 3. Exclude negative intents (e.g. "בלי שיטפון", "שלא יהיה שיטפון")
  if (lower.includes('בלי שיטפון') || lower.includes('ללא שיטפון') || lower.includes('שלא יהיה שיטפון')) {
    return false;
  }

  // 4. Exact / Key flood-watching and forecast trigger phrases
  const exactTriggers = [
    'לראות שיטפון',
    'לראות שיטפונות',
    'לראות שטפון',
    'לראות שטפונות',
    'לצפות בשיטפון',
    'לצפות בשיטפונות',
    'צפייה בשיטפון',
    'צפייה בשיטפונות',
    'ציידי שיטפונות',
    'צייד שיטפונות',
    'ציד שיטפונות',
    'מרדף שיטפונות',
    'לרדוף אחרי שיטפון',
    'לרדוף אחרי שיטפונות',
    'לתפוס שיטפון',
    'לתפוס שיטפונות',
    'תחזית לשיטפון',
    'תחזית שיטפון',
    'תחזית שיטפונות',
    'אזהרת שיטפון',
    'אזהרות שיטפונות',
    'אזהרת שיטפונות',
    'שיטפון במדבר',
    'שיטפונות במדבר',
    'שטפון במדבר',
    'שטפונות במדבר',
    'שיטפון בים המלח',
    'שיטפונות בים המלח',
    'שיטפון בנגב',
    'שיטפונות בנגב',
    'שיטפון בערבה',
    'שיטפונות בערבה',
    'שיטפון בדרום',
    'שיטפונות בדרום',
    'סיכוי לשיטפון',
    'סיכוי לשיטפונות',
    'יש שיטפון במדבר',
    'האם יש שיטפון במדבר',
    'יש שיטפונות במדבר',
    'האם יש שיטפונות במדבר',
    'יהיה שיטפון במדבר',
    'האם יהיה שיטפון במדבר',
    'צפוי שיטפון במדבר',
    'האם צפוי שיטפון במדבר',
    'אפשרות לשיטפון במדבר',
    'אפשרות לשיטפון'
  ];

  if (exactTriggers.some((t) => lower.includes(t))) return true;

  // 5. Pattern matching
  const watchingFloodRegex = /(?:לראות|לצפות|לתפוס|צייד|ציד|רוצה|רוצים|מחפש|מחפשים|בא לי|אפשר|איפה)\s+(?:את\s+)?(?:ה)?(?:שיטפון|שיטפונות|שטפון|שטפונות)/;
  if (watchingFloodRegex.test(lower)) return true;

  const floodForecastRegex = /(?:יש|יהיה|יהיו|צפוי|צפויים|סיכוי|תחזית|אפשרות)\s+(?:ל|לראות\s+)?(?:שיטפון|שיטפונות|שטפון|שטפונות)/;
  if (floodForecastRegex.test(lower)) return true;

  const floodInDesertRegex = /(?:שיטפון|שיטפונות|שטפון|שטפונות).*?(?:במדבר|במדבר יהודה|בים המלח|בנגב|בדרום|בערבה)/;
  if (floodInDesertRegex.test(lower)) return true;

  return false;
}

