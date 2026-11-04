/**
 * AgentTaxonomy.js - Unified Domain Taxonomy & Semantic Grounding
 * Part of Agent BAAL Architecture ($0 Operating Cost).
 * 
 * Single source of truth for:
 * 1. Concepts, user intent keywords, and corresponding asset tags
 * 2. Geographic regions, subregions, and alias keywords
 * 3. Origin vs. Destination disambiguation (prevents destination sites from triggering origin city)
 * 4. Grounded entity and alias resolution against the assets database
 */

export const TAXONOMY_CONCEPTS = {
  history: {
    key: 'history',
    label: 'אתרי מורשת, מבצרים ועתיקות',
    featureKey: 'view',
    chip: '🏛️ עתיקות ומורשת',
    queryKeywords: [
      'עתיקות', 'ארכיאולוגיה', 'היסטוריה', 'תנך', 'תנ"ך', 'תל מקראי',
      'מבצר', 'מבצרים', 'עיר עתיקה', 'אתר מורשת', 'רומאים', 'צלבנים',
      'מערות מסתור', 'סיפורי קרבות', 'מצודה', 'תל'
    ],
    siteTags: [
      'עתיקות', 'ארכיאולוגיה', 'תל מקראי', 'מבצר', 'אתר מורשת',
      'עיר נבטית', 'עיר כנענית', 'מצודה ישראלית', 'אתר מורשת עולמית',
      'מפעל מים קדום', 'שער עיר קדום', 'מורשת'
    ]
  },
  water: {
    key: 'water',
    label: 'מסלולי מים, נחלים ומעיינות',
    featureKey: 'water',
    chip: '💧 נחל/מים',
    queryKeywords: [
      'מים', 'נחל', 'מעיין', 'מעין', 'בריכה', 'שכשוך', 'מפל', 'זורם', 'רטוב',
      'פלג מים', 'בריכות שכשוך', 'נביעה'
    ],
    siteTags: [
      'מים', 'נחל זורם', 'מעיין', 'בריכות שכשוך', 'מפל', 'בריכה',
      'מעיין פועם', 'קניון מים'
    ]
  },
  shade: {
    key: 'shade',
    label: 'יערות מוצלים ושבילי חורש',
    featureKey: 'shade',
    chip: '🌲 יער מוצל',
    queryKeywords: [
      'צל', 'מוצל', 'מוצלים', 'יער', 'חורש', 'אלונים', 'עצים', 'מוצלת',
      'חורשה', 'חורשות'
    ],
    siteTags: [
      'צל', 'מוצל', 'יער', 'חורש', 'אלונים', 'חניון מוצל'
    ]
  },
  cool_haven: {
    key: 'cool_haven',
    label: 'מערות קרירות ומקלטים טבעיים',
    featureKey: 'shade',
    chip: '❄️ מערה קרירה',
    queryKeywords: [
      'קריר', 'מערה', 'מערות', 'בריחה מהחום', 'להתקרר', 'מערת'
    ],
    siteTags: [
      'מערה', 'מערות', 'מערת פעמון', 'מחילות מסתור', 'קריר'
    ]
  },
  adventure: {
    key: 'adventure',
    label: 'מסלולים אתגריים למיטיבי לכת',
    featureKey: 'adventure',
    chip: '🧗 מסלול אתגרי',
    queryKeywords: [
      'אתגרי', 'מיטיבי לכת', 'סולמות', 'יתדות', 'סנפלינג', 'טיפוס',
      'בולדרים', 'מסלול שחור', 'קניון עמוק', 'לשרוף שרירים'
    ],
    siteTags: [
      'אתגרי', 'מיטיבי לכת', 'סולמות', 'יתדות', 'סנפלינג', 'טיפוס בולדרים'
    ]
  },
  view: {
    key: 'view',
    label: 'תצפיות נוף ומצפורים',
    featureKey: 'view',
    chip: '🌅 תצפית נוף',
    queryKeywords: [
      'תצפית', 'מצפור', 'נוף', 'פנורמי', 'שקיעה', 'לתפוס שקיעה', 'רואים הכל'
    ],
    siteTags: [
      'תצפית', 'מצפור', 'נוף', 'פנורמי', 'תצפית נוף'
    ]
  },
  wildlife: {
    key: 'wildlife',
    label: 'צפרות וחיות בר',
    featureKey: 'view',
    chip: '🦅 צפרות וטבע',
    queryKeywords: [
      'חיות', 'חיות בר', 'ציפורים', 'צפרות', 'בעלי חיים', 'עופות', 'צבאים'
    ],
    siteTags: [
      'צפרות', 'עופות', 'בעלי חיים', 'אגם', 'עופות מים', 'חיות בר'
    ]
  },
  picnic: {
    key: 'picnic',
    label: 'פיקניק ופק"ל קפה בחורש מוצל',
    featureKey: 'shade',
    chip: '☕ פיקניק וקפה',
    queryKeywords: [
      'פיקניק', 'קפה', 'פקל', 'פק"ל', 'מחצלת', 'פקל קפה', 'פק"ל קפה'
    ],
    siteTags: [
      'חניון', 'פיקניק', 'יער', 'שולחנות פיקניק', 'חניון לילה'
    ]
  }
};

export const TAXONOMY_REGIONS = {
  north: {
    key: 'north',
    label: 'צפון (גליל, גולן וכרמל)',
    keywords: [
      'צפון', 'בצפון', 'לצפון', 'באזור הצפון', 'גליל', 'בגליל', 'לגליל',
      'גולן', 'בגולן', 'לגולן', 'רמת הגולן', 'כנרת', 'בכנרת', 'סובב כנרת',
      'חרמון', 'בחרמון', 'עמקים', 'בעמקים', 'עמק החולה'
    ]
  },
  haifa_carmel: {
    key: 'haifa_carmel',
    label: 'כרמל ורמות מנשה',
    keywords: [
      'כרמל', 'בכרמל', 'רכס הכרמל', 'פארק הכרמל', 'חוף הכרמל',
      'שוויצריה הקטנה', 'שווייצריה הקטנה', 'רמת הנדיב', 'רמות מנשה'
    ]
  },
  center: {
    key: 'center',
    label: 'מרכז והשרון',
    keywords: [
      'מרכז', 'במרכז', 'למרכז', 'באזור המרכז', 'שרון', 'בשרון', 'באזור השרון',
      'תל אביב', 'בתל אביב', 'עמק חפר', 'פולג', 'ירקון', 'גוש דן'
    ]
  },
  jerusalem: {
    key: 'jerusalem',
    label: 'ירושלים, מדבר יהודה וים המלח',
    keywords: [
      'ירושלים', 'בירושלים', 'לירושלים', 'הרי ירושלים', 'בהרי ירושלים',
      'ירושלים והסביבה', 'שפלת יהודה', 'בשפלה', 'לשפלה', 'שפלה',
      'מטה יהודה', 'גוש עציון', 'בית שמש',
      'מדבר יהודה', 'במדבר יהודה', 'למדבר יהודה',
      'ים המלח', 'בים המלח', 'לים המלח',
      'עין גדי', 'בעין גדי', 'לעין גדי',
      'עינות צוקים', 'נחל פרת', 'עין מבוע', 'עין פוואר', 'עין בוקק', 'מצדה'
    ]
  },
  south: {
    key: 'south',
    label: 'דרום והנגב',
    keywords: [
      'דרום', 'בדרום', 'לדרום', 'באזור הדרום',
      'נגב', 'בנגב', 'לנגב',
      'ערבה', 'בערבה', 'לערבה',
      'אילת', 'באילת', 'לאילת',
      'מכתש רמון', 'במכתש רמון', 'למכתש רמון', 'רמון', 'ברמון',
      'המכתש הגדול', 'עין יהב', 'ספיר', 'ירוחם', 'דימונה',
      'ערד', 'באר שבע', 'תל שבע', 'תל ערד', 'עבדת', 'שבטה', 'ממשית'
    ]
  }
};

/**
 * Disambiguates whether a city name mentioned in user text is genuinely an ORIGIN city
 * (e.g., "מתל אביב", "יוצאים מבאר שבע", "גרים בערד")
 * or actually part of a destination / site name (e.g., "בתל ערד", "עתיקות בבאר שבע", "גן לאומי ערד").
 *
 * @param {Object} city - City descriptor with .names array and .label
 * @param {string} rawText - Full raw user input text
 * @returns {boolean} True if and only if the city is used as an origin point
 */
export function isGenuineOriginMention(city, rawText) {
  if (!city || !rawText) return false;
  const lower = rawText.toLowerCase().trim();

  // If the city name appears immediately after a site / geological / nature marker,
  // it is referring to a destination entity (e.g. "תל ערד", "בתל ערד", "הר מירון", "מכתש רמון", "נחל אפק", "גן לאומי ערד"):
  const sitePrefixes = [
    'תל', 'בתל', 'לתל', 'מהתל',
    'הר', 'בהר', 'להר', 'מהר',
    'נחל', 'בנחל', 'לנחל', 'מנחל',
    'עין', 'בעין', 'לעין', 'מעין',
    'מעיין', 'במעיין', 'למעיין',
    'מכתש', 'במכתש', 'למכתש',
    'חורבת', 'בחורבת', 'לחורבת',
    'מבצר', 'במבצר', 'למבצר',
    'מצודת', 'במצודת', 'למצודת',
    'שמורת', 'בשמורת', 'לשמורת',
    'גן לאומי', 'בגן לאומי', 'לגן לאומי',
    'פארק לאומי', 'בפארק לאומי'
  ];

  for (const name of city.names) {
    for (const prefix of sitePrefixes) {
      if (lower.includes(`${prefix} ${name}`) || lower.includes(`${prefix}-${name}`)) {
        return false;
      }
    }
  }

  // 1. Departure / Residence verbs:
  const verbRegex = new RegExp(`(?:יוצאים|יוצא|יוצאת|נוסעים|נוסע|נוסעת|מגיעים|מגיע|מגיעה|גרים|גר|גרה|מאיזור|מאזור|איזור|אזור|בסביבת|מסביבת)\\s+(?:מ|ב|מ-|ב-)?(?:${city.names.join('|')})`, 'i');
  if (verbRegex.test(lower)) return true;

  // 2. Distance radius phrasing:
  const distRegex = new RegExp(`(?:עד|ברדיוס|במרחק|טווח של)?\\s*\\d*\\s*(?:ק["״]?מ|קילומטר)?\\s*(?:מ|ב|מ-|ב-|מאת)?(?:${city.names.join('|')})`, 'i');
  if (distRegex.test(lower)) {
    // If it mentions distance explicitly, check for radius
    if (/(?:עד|ברדיוס|במרחק|טווח של|\d+\s*ק["״]?מ)/i.test(lower)) {
      return true;
    }
  }

  // 3. Prefix "מ" (from) or "ב" (in) directly attached or preceded by whitespace:
  // e.g. "מפתח תקווה", "בפתח תקווה", "מתל אביב", "בתל אביב", "מחיפה", "מערד"
  const prepRegex = new RegExp(`(?:^|[\\s.,!?])(?:מ|ב|מ-|ב-)?(?:${city.names.join('|')})(?:$|[\\s.,!?])`, 'i');
  return prepRegex.test(lower);
}

/**
 * Resolve direct site entity from the database or known aliases
 * @param {string} text - User message
 * @param {Array<Object>} assets - Full assets_db collection
 * @returns {Object|null} Matched asset or null
 */
export function resolveTargetEntity(text, assets = []) {
  if (!text || !Array.isArray(assets) || assets.length === 0) return null;
  const lower = text.toLowerCase().trim();

  // Known direct alias mappings:
  const ALIAS_MAP = [
    { aliases: ['תל ערד', 'בתל ערד', 'לתל ערד', 'מצודת ערד'], matchName: 'גן לאומי תל ערד' },
    { aliases: ['תל שבע', 'בתל שבע', 'לתל שבע', 'תל באר שבע', 'באר אברהם'], matchName: 'גן לאומי תל באר שבע' },
    { aliases: ['עבדת', 'בעבדת', 'עיר נבטית עבדת'], matchName: 'גן לאומי עבדת' },
    { aliases: ['שבטה', 'בשבטה', 'שבטה העתיקה'], matchName: 'גן לאומי שבטה' },
    { aliases: ['ממשית', 'בממשית', 'עיר ממשית'], matchName: 'גן לאומי ממשית' },
    { aliases: ['עין גדי', 'בעין גדי', 'לעין גדי', 'שמורת עין גדי'], matchName: 'שמורת טבע עין גדי' },
    { aliases: ['עינות צוקים', 'עין פשחה', 'עינות פשחה'], matchName: 'שמורת טבע עינות צוקים' },
    { aliases: ['עין בוקק', 'נחל בוקק'], matchName: 'שמורת טבע עין בוקק' },
    { aliases: ['עין מבוע', 'עין פוואר'], matchName: 'עין מבוע' },
    { aliases: ['עין פרת', 'עין פארה', 'נחל פרת', 'ואדי קלט'], matchName: 'עין פרת' },
    { aliases: ['מצדה', 'במצדה', 'למצדה', 'הר מצדה'], matchName: 'גן לאומי מצדה' },
    { aliases: ['בית גוברין', 'מערות בית גוברין', 'מערות פעמון'], matchName: 'גן לאומי בית גוברין' },
    { aliases: ['ציפורי', 'בציפורי', 'פסיפס ציפורי'], matchName: 'גן לאומי ציפורי' }
  ];

  for (const item of ALIAS_MAP) {
    if (item.aliases.some((alias) => lower.includes(alias))) {
      const found = assets.find((a) => a.name.includes(item.matchName));
      if (found) return found;
    }
  }

  // Exact or high-confidence substring match on asset names:
  for (const asset of assets) {
    const aName = asset.name.toLowerCase();
    // Exclude single generic words
    if (lower.includes(aName)) return asset;
  }

  return null;
}
