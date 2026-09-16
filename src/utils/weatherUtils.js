/**
 * weatherUtils.js - Shared Weather, Environmental & Age Suitability Utilities
 */

export const AGE_TIERS_CONFIG = [
  { id: 'all', label: 'הכל' },
  { id: '0', label: '👶 0+ עגלות' },
  { id: '4', label: '🧒 4+' },
  { id: '7', label: '🧗 7+' },
  { id: '10', label: '🧗‍♂️ 10+' },
];

export const getAgeBadge = (minAge) => {
  switch (Number(minAge)) {
    case 0:
      return { label: '0+ עגלות', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60', icon: '👶' };
    case 4:
      return { label: '4+', color: 'bg-blue-950/80 text-blue-300 border-blue-700/60', icon: '🧒' };
    case 7:
      return { label: '7+', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60', icon: '🧗' };
    case 10:
      return { label: '10+', color: 'bg-purple-950/80 text-purple-300 border-purple-700/60', icon: '🧗‍♂️' };
    default:
      return { label: '4+', color: 'bg-blue-950/80 text-blue-300 border-blue-700/60', icon: '🧒' };
  }
};

export const getCategoryIconChar = (asset) => {
  if (!asset) return '🌿';
  const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
  const types = (asset.type || []).join(' ');
  if (isSafeHaven) return '🛡️';
  if (types.includes('מים') || types.includes('חוף') || types.includes('בריכות')) return '💧';
  if (types.includes('הרים') || types.includes('שלג') || types.includes('מכתש')) return '⛰️';
  if (types.includes('חורש') || types.includes('טבע') || types.includes('יער')) return '🌲';
  if (types.includes('מדבר') || types.includes('דיונות')) return '☀️';
  if (asset.category === 'spni') return '🦅';
  return '🌿';
};

export const getWaterAdvisory = (asset) => {
  if (!asset) return null;
  const name = asset.name || '';
  if (name.includes('דליות') || name.includes('זכי') || name.includes('זאכי') || name.includes('מג\'רסה') || name.includes('מג׳רסה')) {
    return {
      level: 'warning',
      title: 'אזהרת רחצה זמנית (משרד הבריאות)',
      desc: 'חריגה בקולי צואתי בדיגום אחרון. מומלץ להימנע מכניסה למים.'
    };
  }
  if (name.includes('צלמון')) {
    return {
      level: 'danger',
      title: 'סגור לרחצה (משרד הבריאות)',
      desc: 'זיהום מים פעיל - הכניסה לנחל אסורה בהחלט.'
    };
  }
  return null;
};

export const getFiveDaysList = () => {
  const days = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    let label = '';
    if (i === 0) label = 'היום';
    else if (i === 1) label = 'מחר';
    else {
      label = d.toLocaleDateString('he-IL', { weekday: 'short' });
    }

    const dateStr = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });

    days.push({
      index: i,
      id: `day-${i}`,
      label,
      dateStr,
      fullDate: d,
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }

  return days;
};

export const getDefaultDayIndex = () => {
  const currentHour = new Date().getHours();
  // If after 16:00 (4:00 PM), default to tomorrow (index 1)
  return currentHour >= 16 ? 1 : 0;
};

export const getSiteWeather = (asset, scenario = 'NORMAL', dayIndex = 0) => {
  if (!asset) return null;

  const dayOffset = typeof dayIndex === 'number' ? dayIndex : (dayIndex === 'tomorrow' ? 1 : 0);
  const name = asset.name || '';
  const region = asset.region || '';
  const vulns = asset.vulnerabilities || [];
  const isSafeHaven = vulns.includes('Safe Haven') || asset.category === 'safe_haven';

  // Regional geographic characteristics
  const isDeadSea = region.includes('ים המלח') || name.includes('מצדה') || name.includes('עין גדי');
  const isAravaEilat = region.includes('אילת') || region.includes('ערבה');
  const isNegev = region.includes('נגב') || region.includes('מכתש') || name.includes('רמון') || name.includes('בוקר') || name.includes('יורקעם') || name.includes('עבדת') || name.includes('ממשית') || name.includes('לוץ') || name.includes('שבטה') || name.includes('עזוז');
  const isHighNorth = region.includes('חרמון') || region.includes('גולן') || region.includes('מירון') || name.includes('חרמון') || name.includes('דן') || name.includes('ביריה') || name.includes('שניר');
  const isCoast = region.includes('חוף') || region.includes('שרון') || asset.category === 'coast' || name.includes('קיסריה') || name.includes('פלמחים') || name.includes('מיכאל') || name.includes('ניצנים') || name.includes('פולג') || name.includes('חדרה') || name.includes('חפר');
  const isJerusalemHills = region.includes('ירושלים') || region.includes('יהודה') || name.includes('ירושלים') || name.includes('עציון') || name.includes('גוברין') || name.includes('ספיר');

  // Deterministic variation based on asset ID for distinct per-site metrics
  const delta = (Number(asset.id) % 7) - 3; // -3 to +3
  const dayShift = (dayOffset * 2 + delta) % 3; // slight drift per day

  let baseTemp = 26 + dayShift;
  let humidity = 50;
  let wind = 14 + (dayOffset % 3);
  let conditions = dayOffset === 0 ? 'בהיר ונוח לטיול' : `תחזית ליום ${dayOffset + 1}: בהיר ונעים`;
  let heatLoad = 'נוח';

  if (isDeadSea) {
    baseTemp = 33 + (delta % 3) + dayShift;
    humidity = 28;
    wind = 12 + Math.abs(delta);
    heatLoad = 'חם עד בינוני';
    conditions = dayOffset === 0 ? 'שמשי ויבש • נווה מדבר' : `תחזית: שמשי וחם בים המלח`;
  } else if (isAravaEilat) {
    baseTemp = 34 + (delta % 2) + dayShift;
    humidity = 22;
    wind = 16;
    heatLoad = 'חם ויבש';
    conditions = dayOffset === 0 ? 'בהיר וחם בערבה' : `תחזית: שמשי ויבש בערבה`;
  } else if (isNegev) {
    baseTemp = 28 + delta + dayShift;
    humidity = 24;
    wind = 18 + Math.abs(delta);
    heatLoad = 'נוח-יבש';
    conditions = dayOffset === 0 ? 'אוויר מדברי צלול' : `תחזית: אוויר פסגות מדברי`;
  } else if (isHighNorth) {
    baseTemp = 21 + delta + dayShift;
    humidity = 42;
    wind = 17 + Math.abs(delta);
    heatLoad = 'קריר ונעים';
    conditions = dayOffset === 0 ? 'רוח הרים קרירה וצלולה' : `תחזית: קריר ונעים בהרים`;
  } else if (isCoast) {
    baseTemp = 27 + (delta % 2) + dayShift;
    humidity = 64 + delta * 2;
    wind = 15 + Math.abs(delta);
    heatLoad = 'הביל במקצת';
    conditions = dayOffset === 0 ? 'בריזה ימית נוחה' : `תחזית: בריזה מתונה בחוף`;
  } else if (isJerusalemHills) {
    baseTemp = 23 + delta + dayShift;
    humidity = 45;
    wind = 16 + Math.abs(delta);
    heatLoad = 'נוח מאוד';
    conditions = dayOffset === 0 ? 'אוויר הרים יבש' : `תחזית: רוח הרים צלולה`;
  }

  // Scenario Modifiers
  if (scenario === 'HEATWAVE') {
    baseTemp += 8;
    humidity = Math.max(12, humidity - 25);
    wind = Math.min(30, wind + 6);
    conditions = 'שרב כבד • יבש ולוהט';
    heatLoad = 'עומס חום קיצוני';
  } else if (scenario === 'FLOOD') {
    baseTemp -= 5;
    humidity = Math.min(95, humidity + 35);
    wind = Math.min(45, wind + 14);
    conditions = 'גשמים עזים • סכנת שיטפונות באפיקים';
    heatLoad = 'קריר וגשום';
  }

  // Vulnerability & Threat Logic
  const isFloodVulnerable = vulns.includes('שיטפונות') || vulns.includes('שיטפונות בזק') || vulns.includes('הצפות') || vulns.includes('Flash Floods') || vulns.includes('Floods');
  const isHeatVulnerable = vulns.includes('עומס חום') || vulns.includes('עומס חום קיצוני') || vulns.includes('Extreme Heat');

  let alertTitle = 'אין התרעות — האתר פתוח ובטוח';
  let alertDesc = `תנאי מזג האוויר ב${name} מעולים. כל המסלולים פתוחים לפעילות.`;
  let alertLevel = 'safe'; // 'safe' | 'warning' | 'danger'

  if (isSafeHaven) {
    alertTitle = '🛡️ מקלט בטוח ומאושר (Safe Haven)';
    alertDesc = `אתר מקורה/מוצל המספק הגנה מלאה מרוחות, גשמים ועומסי חום קיצוניים.`;
    alertLevel = 'safe';
  } else if (scenario === 'FLOOD') {
    if (isFloodVulnerable) {
      alertTitle = day === 'tomorrow' ? `🌧️ מחר: סכנת שיטפונות ב${name}` : `⚠️ סכנת שיטפון בזק באגן נחל ${name}`;
      alertDesc = `זרימות נגר חזקות וסכנת חסימת מעברים. המסלול מסוכן ואינו מומלץ לכניסה.`;
      alertLevel = 'danger';
    } else {
      alertTitle = `גשמים מקומיים באזור ${region}`;
      alertDesc = `מזג אוויר חורפי ומשקעים. מומלץ להצטייד במעיל גשם ולבדוק דרכי גישה.`;
      alertLevel = 'warning';
    }
  } else if (scenario === 'HEATWAVE') {
    if (isHeatVulnerable || isDeadSea || isAravaEilat) {
      alertTitle = day === 'tomorrow' ? `🔥 מחר: שיא עומס החום ב${name} (${baseTemp}°C)` : `🔥 עומס חום קיצוני ב${name} (${baseTemp}°C)`;
      alertDesc = `חריגה מסף עומס חום מותר. סכנת התייבשות ומכת חום במסלולים חשופים.`;
      alertLevel = 'danger';
    } else {
      alertTitle = `עומס חום בינוני באזור ${region}`;
      alertDesc = `מומלץ לטייל בשעות הבוקר המוקדמות, להצטייד בכובע ובהרבה מים.`;
      alertLevel = 'warning';
    }
  }

  // Decision Thresholds Matrix
  const tempThreshold = isHeatVulnerable ? 38 : 42;
  const isTempSafe = baseTemp < tempThreshold;
  const isRainSafe = (scenario !== 'FLOOD') || (day === 'tomorrow') || !isFloodVulnerable;
  const isWindSafe = wind < 35;
  const shadeType = isSafeHaven 
    ? 'מוצל וממוזג (מערות/מבנה)' 
    : (asset.type?.includes('חורש') || asset.type?.includes('מים') ? 'חלקי (עצים/מצוקים)' : 'חשוף לשמש');
  const overallScore = alertLevel === 'danger' ? 35 : alertLevel === 'warning' ? 75 : isSafeHaven ? 100 : 98;

  return {
    temp: `${baseTemp}°C`,
    tempVal: baseTemp,
    tempDesc: conditions,
    heatIndex: heatLoad,
    rain: scenario === 'FLOOD' ? (day === 'tomorrow' ? `5 מ"מ • לחות ${humidity}%` : `${25 + Math.abs(delta * 3)} מ"מ • לחות ${humidity}%`) : `0 מ"מ • לחות ${humidity}%`,
    wind: `${wind} קמ"ש`,
    alertTitle,
    alertDesc,
    alertLevel,
    isSafeHaven,
    tempThreshold,
    isTempSafe,
    isRainSafe,
    isWindSafe,
    isFloodVulnerable,
    isHeatVulnerable,
    shadeType,
    overallScore,
  };
};
