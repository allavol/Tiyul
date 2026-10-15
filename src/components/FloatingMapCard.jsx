import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck,
  ShieldAlert,
  Radio,
  Baby,
  Users,
  Navigation,
  Clock,
  Car,
  Footprints,
  Droplets,
  Sun,
  MapPin
} from 'lucide-react';
import { getSiteWeather, getWaterAdvisory, getAgeBadge, getCategoryIconChar, getSafeAlternatives } from '../utils/weatherUtils';
import { WeatherService } from '../services/WeatherService';
import { getDriveTimeFromTelAviv } from '../services/osrmService';
import assetsData from '../../assets_db.json';

/**
 * Maps Hebrew type keywords to emoji icons for the site features.
 */
const TYPE_ICON_MAP = [
  { keywords: ['מים', 'מעיין', 'נחל', 'בריכ', 'מפל', 'אגם'], icon: '💧', label: 'מים' },
  { keywords: ['חוף ים', 'ימי', 'שמורה ימית'], icon: '🏖️', label: 'ים' },
  { keywords: ['חורש', 'יער', 'אלונים'], icon: '🌲', label: 'חורש/יער' },
  { keywords: ['מדבר', 'דיונ', 'חולות', 'נווה מדבר'], icon: '🏜️', label: 'מדבר' },
  { keywords: ['הרים', 'רכס', 'מכתש', 'פסגת', 'מצוק'], icon: '⛰️', label: 'הרים' },
  { keywords: ['מצפור', 'תצפית', 'נוף', 'דרך נוף'], icon: '👁️', label: 'נוף/תצפית' },
  { keywords: ['צפרות', 'עופות', 'אגמון'], icon: '🦅', label: 'צפרות' },
  { keywords: ['ארכיאולוגיה', 'עתיקות', 'מורשת', 'מבצר', 'נבטית', 'כנסיות', 'תל'], icon: '🏛️', label: 'מורשת' },
  { keywords: ['מערה', 'מערות', 'מחילות'], icon: '🕳️', label: 'מערות' },
  { keywords: ['פריחה', 'פרחי בר'], icon: '🌸', label: 'פריחה' },
  { keywords: ['שביל ישראל'], icon: '🥾', label: 'שביל ישראל' },
  { keywords: ['עגלות', 'מונגש', 'נגיש'], icon: '♿', label: 'נגישות' },
];

function getFeaturePills(types) {
  if (!types || types.length === 0) return [];
  const matched = new Set();
  const pills = [];

  for (const typeStr of types) {
    const lower = typeStr.toLowerCase();
    for (const mapping of TYPE_ICON_MAP) {
      if (matched.has(mapping.label)) continue;
      if (mapping.keywords.some(kw => lower.includes(kw))) {
        matched.add(mapping.label);
        pills.push({ icon: mapping.icon, label: mapping.label });
        break;
      }
    }
  }
  return pills.slice(0, 4);
}

/**
 * FloatingMapCard - Proposal 3: Parent Sentinel & Logistics Dashboard
 * Zero-scroll, dark/light theme, high-density parent overview.
 */
export default function FloatingMapCard({
  asset,
  onClose,
  activeScenario = 'NORMAL',
  selectedDayIndex = 0,
  onSelectAlternative,
  isLightMode = false,
}) {
  if (!asset) return null;

  const [activeDay, setActiveDay] = useState(selectedDayIndex);
  const [liveWeather, setLiveWeather] = useState(null);
  const [driveTime, setDriveTime] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState('noon'); // 'morning', 'noon', 'evening'

  // Build 4-day forecast data
  const fourDaysForecast = useMemo(() => {
    const days = [];
    const now = new Date();
    const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];

    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const label = i === 0 ? 'היום' : i === 1 ? 'מחר' : `יום ${dayNames[d.getDay()]}`;
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      const weather = getSiteWeather(asset, activeScenario, i);
      const waterAdv = getWaterAdvisory(asset);
      const isDaySafe = weather.isTempSafe && weather.isRainSafe && (!waterAdv || waterAdv.level !== 'danger');
      const isDayWarning = waterAdv && waterAdv.level === 'warning';
      const isFloodRisk = activeScenario === 'FLOOD' && weather.isFloodVulnerable;

      const rainStr = (weather.rain || '').split('•')[0].trim();
      const rainMatch = rainStr.match(/(\d+)/);
      const rainMmVal = rainMatch ? Number(rainMatch[1]) : 0;
      const rainText = rainMmVal > 0 ? `${rainMmVal} מ"מ` : '0 מ"מ';

      let weatherIcon = '☀️';
      if (isFloodRisk) weatherIcon = '🌊';
      else if (activeScenario === 'FLOOD' || rainMmVal > 0) weatherIcon = '🌧️';
      else if (activeScenario === 'HEATWAVE' || !weather.isTempSafe) weatherIcon = '🌡️';
      else if (weather.tempVal < 23) weatherIcon = '🌤️';

      days.push({
        index: i,
        label,
        dateStr,
        weather,
        weatherIcon,
        isFloodRisk,
        rainMmVal,
        rainText,
        isSafe: isDaySafe,
        isWarning: isDayWarning,
      });
    }
    return days;
  }, [asset, activeScenario]);

  const fallbackWeather = getSiteWeather(asset, activeScenario, activeDay);
  const waterAdvisory = getWaterAdvisory(asset);
  const ageBadge = getAgeBadge(asset.min_age);
  const categoryIcon = getCategoryIconChar(asset);
  const featurePills = getFeaturePills(asset.type);

  // Fetch live Tomorrow.io weather when viewing "today"
  useEffect(() => {
    let isMounted = true;
    if (activeDay === 0 && activeScenario === 'NORMAL') {
      WeatherService.fetchLiveWeather(asset)
        .then((data) => {
          if (isMounted && data) setLiveWeather(data);
        })
        .catch(() => {});
    } else {
      setLiveWeather(null);
    }
    return () => { isMounted = false; };
  }, [asset?.id, activeDay, activeScenario]);

  // Fetch OSRM Drive Time from Tel Aviv
  useEffect(() => {
    let isMounted = true;
    if (asset?.lat && asset?.lng) {
      setDriveTime(null);
      getDriveTimeFromTelAviv(asset.lat, asset.lng).then(data => {
        if (isMounted && data) setDriveTime(data);
      });
    }
    return () => { isMounted = false; };
  }, [asset?.id, asset?.lat, asset?.lng]);

  // Base weather calculation
  const effectiveWeather = (liveWeather && activeDay === 0 && activeScenario === 'NORMAL')
    ? {
        ...fallbackWeather,
        temp: liveWeather.temp,
        tempVal: parseInt(liveWeather.temp, 10) || fallbackWeather.tempVal,
        isTempSafe: liveWeather.isTempSafe,
        rain: liveWeather.rain,
        isRainSafe: liveWeather.isRainSafe,
        wind: liveWeather.wind,
        conditions: liveWeather.conditions,
        isLive: liveWeather.isLive ?? true,
        sourceLabel: liveWeather.badgeText || `${liveWeather.source || 'Live Weather'} (${liveWeather.fetchTime})`,
      }
    : {
        ...fallbackWeather,
        isLive: false,
        isEstimateOnly: true,
        sourceLabel: activeDay === 0 ? 'מודל מקומי (Open-Meteo / Offline)' : `תחזית ליום ${activeDay + 1}`,
      };

  // Diurnal temperature adjustment based on selected time of day
  let displayTemp = effectiveWeather.tempVal;
  let periodNotice = '';
  if (timeOfDay === 'morning') {
    displayTemp -= 3;
    periodNotice = 'בוקר קריר ונעים';
  } else if (timeOfDay === 'evening') {
    displayTemp -= 4;
    periodNotice = 'ערב נוח ונעים';
  } else {
    periodNotice = displayTemp >= 32 ? 'שעות שיא החום' : 'צהריים נוחים';
  }

  const isPeriodTempSafe = displayTemp < 37;
  const isSafe = isPeriodTempSafe && effectiveWeather.isRainSafe && (!waterAdvisory || waterAdvisory.level !== 'danger');
  const isWarning = waterAdvisory && waterAdvisory.level === 'warning';

  // Compute alternatives if unsafe
  useEffect(() => {
    if (!isSafe && asset) {
      setAlternatives(getSafeAlternatives(asset, assetsData, activeScenario, activeDay, 3));
    } else {
      setAlternatives([]);
      setShowAlternatives(false);
    }
  }, [isSafe, asset, activeScenario, activeDay]);

  // Dynamic Theme Palette Tokens
  const theme = {
    cardBg: isLightMode 
      ? 'bg-white/95 text-slate-800 border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.15)]' 
      : 'bg-[#0f172a]/95 text-zinc-100 border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.55)]',
    boxBg: isLightMode 
      ? 'bg-slate-50 border-slate-200/80' 
      : 'bg-slate-900/80 border-slate-800/80',
    innerBoxBg: isLightMode 
      ? 'bg-white border-slate-200 shadow-sm' 
      : 'bg-slate-950/60 border-slate-800',
    titleColor: isLightMode ? 'text-slate-900' : 'text-white',
    subTextColor: isLightMode ? 'text-slate-500' : 'text-zinc-400',
    accentText: isLightMode ? 'text-teal-700' : 'text-teal-400',
    dividerBorder: isLightMode ? 'border-slate-200/80' : 'border-white/[0.08]',
    pillBg: isLightMode 
      ? 'bg-slate-100 text-slate-700 border-slate-200' 
      : 'bg-slate-800/80 text-zinc-300 border-white/[0.06]',
    activeDayBorder: isLightMode 
      ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm' 
      : 'bg-teal-950/40 border-teal-400 text-white shadow-[0_0_12px_rgba(45,212,191,0.25)]',
    inactiveDayBg: isLightMode 
      ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200' 
      : 'bg-slate-900/60 hover:bg-slate-800/80 text-zinc-400 border-white/[0.06]',
  };

  return (
    <div 
      className={`fixed top-20 left-3 right-3 sm:absolute sm:top-20 sm:left-5 sm:right-auto sm:w-[380px] z-[1300] backdrop-blur-xl p-3.5 rounded-3xl border animate-floating-card font-body select-none pointer-events-auto max-h-[88vh] overflow-y-auto no-scrollbar transition-colors duration-200 ${theme.cardBg}`}
      style={{ direction: 'rtl' }}
    >
      {/* ── 1. Top Header: Title, Waze CTA & Close Button ────────────────────── */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b mb-2.5" style={{ borderColor: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
        {/* Site Avatar & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-sm" style={{
            background: isLightMode ? '#f0fdf4' : 'rgba(45,212,191,0.15)',
            borderColor: isLightMode ? '#bbf7d0' : 'rgba(45,212,191,0.3)',
          }}>
            <span>{categoryIcon}</span>
          </div>
          <div className="min-w-0">
            <h3 className={`text-base font-black truncate leading-tight font-display ${theme.titleColor}`}>
              {asset.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full border" style={{
                background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                color: isLightMode ? '#475569' : '#94a3b8',
                borderColor: isLightMode ? '#cbd5e1' : 'rgba(255,255,255,0.1)'
              }}>
                {asset.authority_id || 'מאומת רט"ג'}
              </span>
              <span className={`text-[10px] font-bold ${theme.accentText}`}>
                {asset.region}
              </span>
            </div>
          </div>
        </div>

        {/* Action Header: Waze Button & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`https://waze.com/ul?ll=${asset.lat},${asset.lng}&navigate=yes`}
            target="_blank"
            rel="noopener noreferrer"
            title="נווט עם Waze ישירות לשטח"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition shadow-md active:scale-95 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
          >
            <Car size={13} />
            <span>Waze</span>
          </a>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full border transition ${
              isLightMode 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-zinc-300 border-white/10'
            }`}
            title="סגור"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── 2. Upper Section: Suitability Trio (למי מתאים?) ────────────────── */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {/* Col 1: Min Age */}
        <div className={`p-2 rounded-2xl border flex flex-col items-center justify-center text-center ${theme.boxBg}`}>
          <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: isLightMode ? '#475569' : '#94a3b8' }}>
            <Baby size={12} />
            <span>סף גיל</span>
          </div>
          <span className={`text-xs font-black mt-0.5 px-2 py-0.5 rounded-lg border leading-tight ${ageBadge.color}`}>
            {ageBadge.label}
          </span>
        </div>

        {/* Col 2: Strollers */}
        <div className={`p-2 rounded-2xl border flex flex-col items-center justify-center text-center ${theme.boxBg}`}>
          <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: isLightMode ? '#475569' : '#94a3b8' }}>
            <span>♿</span>
            <span>עגלות</span>
          </div>
          <span className={`text-[11px] font-bold mt-0.5 ${asset.stroller_accessible ? 'text-emerald-500 font-black' : isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            {asset.stroller_accessible ? 'נגיש ✓' : 'ללא עגלות'}
          </span>
        </div>

        {/* Col 3: Drive Time from Tel Aviv */}
        <div className={`p-2 rounded-2xl border flex flex-col items-center justify-center text-center ${theme.boxBg}`}>
          <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: isLightMode ? '#475569' : '#94a3b8' }}>
            <Clock size={12} />
            <span>נסיעה מת"א</span>
          </div>
          <span className={`text-[11px] font-black mt-0.5 ${theme.titleColor}`}>
            {driveTime ? `${driveTime.durationMins} דק'` : 'מחשב...'}
          </span>
        </div>
      </div>

      {/* ── 3. Water Advisory Banner (if active) ───────────────────────────── */}
      {waterAdvisory && (
        <div className={`p-2 rounded-2xl text-xs flex items-center gap-2 border mb-2.5 ${
          waterAdvisory.level === 'danger'
            ? 'bg-red-500/10 text-red-700 dark:text-red-200 border-red-500/30'
            : 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30'
        }`}>
          <AlertTriangle size={15} className="shrink-0 text-red-500" />
          <div className="min-w-0">
            <strong className="block text-[10.5px] font-bold">{waterAdvisory.title}</strong>
            <span className="text-[9.5px] opacity-90">{waterAdvisory.desc}</span>
          </div>
        </div>
      )}

      {/* ── 4. 4-Day Forecast Strip (Today + 3 Days) ────────────────────────── */}
      <div className={`p-2.5 rounded-2xl border mb-2.5 ${theme.boxBg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.subTextColor}`}>
            תחזית 4 ימים • בחר יום לבדיקה
          </span>
          <span className={`text-[10.5px] font-mono font-bold ${theme.accentText}`}>
            {fourDaysForecast[activeDay]?.label} ({fourDaysForecast[activeDay]?.dateStr})
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {fourDaysForecast.map((day) => {
            const isSelected = activeDay === day.index;
            return (
              <button
                key={day.index}
                onClick={() => setActiveDay(day.index)}
                className={`p-1.5 rounded-xl flex flex-col items-center justify-between border transition-all text-center relative ${
                  isSelected ? theme.activeDayBorder : theme.inactiveDayBg
                }`}
              >
                <span className={`text-[10px] font-bold leading-tight ${isSelected ? theme.accentText : ''}`}>
                  {day.label}
                </span>
                <span className={`text-[8.5px] font-mono -mt-0.5 ${theme.subTextColor}`}>
                  {day.dateStr}
                </span>

                <div className="text-base my-0.5">
                  {day.weatherIcon}
                </div>

                <span className={`text-xs font-black font-mono leading-none ${isSelected ? theme.titleColor : theme.subTextColor}`}>
                  {day.weather.tempVal}°
                </span>

                <div className="mt-1 w-full">
                  {day.isFloodRisk ? (
                    <span className="block text-[7.5px] font-black px-0.5 py-0.2 rounded bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30">
                      שיטפון! ⚠️
                    </span>
                  ) : (
                    <span className={`block text-[7.5px] font-bold px-0.5 py-0.2 rounded font-mono ${
                      day.rainMmVal > 0 
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30' 
                        : isLightMode ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-800 text-zinc-400'
                    }`}>
                      {day.rainText}
                    </span>
                  )}
                </div>

                <span className={`text-[7.5px] font-bold px-0.5 py-0.2 mt-1 rounded leading-tight w-full truncate ${
                  day.isSafe && !day.isWarning
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    : day.isWarning
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    : 'bg-red-500/20 text-red-600 dark:text-red-300'
                }`}>
                  {day.isSafe && !day.isWarning ? '✓ בטוח' : day.isWarning ? '⚠️ זהירות' : '✗ סגור'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Diurnal Temperature Scrubber (בוקר, צהריים, ערב) ─────────────── */}
      <div className={`p-2.5 rounded-2xl border mb-2.5 ${theme.boxBg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.subTextColor}`}>
            טמפרטורה שעתית (בוקר / צהריים / ערב)
          </span>
          <span className={`text-[11px] font-mono font-black ${theme.titleColor}`}>
            {displayTemp}°C <span className="text-[9.5px] font-normal text-teal-500">({periodNotice})</span>
          </span>
        </div>

        {/* 3-way Segmented Scrubber */}
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl border bg-slate-950/20 border-slate-700/30">
          {[
            { id: 'morning', label: 'בוקר (08:00)', tempDiff: '-3°' },
            { id: 'noon', label: 'צהריים (14:00)', tempDiff: 'שיא' },
            { id: 'evening', label: 'ערב (19:00)', tempDiff: '-4°' },
          ].map((period) => {
            const isPeriodActive = timeOfDay === period.id;
            return (
              <button
                key={period.id}
                onClick={() => setTimeOfDay(period.id)}
                className={`py-1.5 px-2 rounded-lg text-center transition font-bold text-[10px] flex flex-col items-center justify-center ${
                  isPeriodActive
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : isLightMode 
                      ? 'text-slate-600 hover:bg-slate-200/60' 
                      : 'text-zinc-400 hover:bg-slate-800/60'
                }`}
              >
                <span>{period.label}</span>
                <span className={`text-[8.5px] font-mono opacity-80`}>{period.tempDiff}</span>
              </button>
            );
          })}
        </div>

        {/* Live Safety Status Banner updating dynamically */}
        <div className={`mt-2 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black border ${
          isSafe && !isWarning
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
            : isWarning
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30'
        }`}>
          {isSafe && !isWarning ? (
            <>
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>בטוח לטיול ב{timeOfDay === 'morning' ? 'בוקר' : timeOfDay === 'evening' ? 'ערב' : 'צהריים'} ✓ ({displayTemp}°C)</span>
            </>
          ) : isWarning ? (
            <>
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <span>זהירות — עומס שטח או אזהרת מים ({displayTemp}°C)</span>
            </>
          ) : (
            <>
              <ShieldAlert size={16} className="text-red-500 shrink-0" />
              <span>עומס חום חריג — מומלץ להקדים לשעות הבוקר ({displayTemp}°C)</span>
            </>
          )}
        </div>
      </div>

      {/* ── 6. Bottom Specs & Features ────────────────────────────────────── */}
      <div className={`p-2.5 rounded-2xl border mb-2.5 ${theme.boxBg}`}>
        <div className="flex items-center justify-between text-[11px] font-medium">
          {/* Trail Length */}
          <div className="flex items-center gap-1">
            <span className="text-teal-500">📏</span>
            <span className={theme.titleColor}>
              {asset.trail_length_km ? `${asset.trail_length_km} ק"מ` : 'מסלול מעגלי קל'}
            </span>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1">
            <span>🥾</span>
            <span className={theme.subTextColor}>
              {asset.difficulty || 'קל למשפחות'}
            </span>
          </div>

          {/* Entry Fee */}
          <div className="flex items-center gap-1">
            <span>🎟️</span>
            <span className={`font-bold ${
              !asset.entry_fee || asset.entry_fee.includes('חינם') 
                ? 'text-emerald-500' 
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {asset.entry_fee || 'חינם'}
            </span>
          </div>
        </div>

        {/* Feature Pills */}
        {featurePills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t" style={{ borderColor: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.06)' }}>
            {featurePills.map((pill, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${theme.pillBg}`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 7. Safe Alternatives Drawer (if conditions are unsafe) ─────────── */}
      {!isSafe && alternatives.length > 0 && (
        <div className="mb-2.5">
          {!showAlternatives ? (
            <button 
              onClick={() => setShowAlternatives(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold py-2 rounded-xl border border-emerald-500/30 transition text-xs shadow-sm"
            >
              <Sparkles size={14} />
              <span>הצג {alternatives.length} חלופות בטוחות באזור</span>
            </button>
          ) : (
            <div className={`p-2 rounded-2xl border space-y-1.5 ${theme.boxBg}`}>
              <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                חלופות מאובטחות (מרחק אווירי)
              </h5>
              {alternatives.map((alt) => (
                <div 
                  key={alt.id}
                  onClick={() => onSelectAlternative && onSelectAlternative(alt)}
                  className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition ${
                    isLightMode 
                      ? 'bg-white hover:bg-emerald-50 border-slate-200' 
                      : 'bg-slate-950/60 hover:bg-slate-900 border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{getCategoryIconChar(alt)}</span>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[10.5px] font-bold truncate ${theme.titleColor}`}>{alt.name}</span>
                      <span className={`text-[8.5px] truncate ${theme.subTextColor}`}>{alt.region}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[9.5px] font-mono ${theme.subTextColor}`}>{alt.distanceKm.toFixed(1)} ק"מ</span>
                    <span className="text-[7.5px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded font-bold">בטוח ✓</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 8. Compact Non-Dismissible Safety Notice ──────────────────────── */}
      <div className={`p-2 rounded-xl text-[9px] leading-relaxed flex items-start gap-1.5 border mb-2 ${
        isLightMode 
          ? 'bg-amber-50 text-amber-900 border-amber-200' 
          : 'bg-amber-950/20 text-amber-200/90 border-amber-500/25'
      }`}>
        <ShieldAlert size={12} className="text-amber-500 shrink-0 mt-0.5" />
        <p>
          <strong className="font-bold">אחריות ובטיחות:</strong> הנתונים מבוססים על מודלים ואומדנים ואינם מחליפים בדיקה עצמאית. חובה לוודא אישורי פתיחה והתרעות באתר רט״ג טרם היציאה.
        </p>
      </div>

      {/* ── 9. Live Source & Attribution Footer ────────────────────────────── */}
      <div className="pt-1.5 border-t text-[8.5px] flex items-center justify-between" style={{ borderColor: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.06)' }}>
        <span className={`flex items-center gap-1 font-medium ${effectiveWeather.isLive ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
          <Radio size={9} className={effectiveWeather.isLive ? 'animate-pulse' : ''} />
          <span>{effectiveWeather.sourceLabel}</span>
        </span>
        <span className={theme.subTextColor}>{asset.org || 'רט"ג ומשרד הבריאות'}</span>
      </div>
    </div>
  );
}
