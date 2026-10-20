import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { getSiteWeather, getWaterAdvisory, getAgeBadge, getCategoryIconChar, getSafeAlternatives } from '../utils/weatherUtils';
import { WeatherService } from '../services/WeatherService';
import assetsData from '../../assets_db.json';

/**
 * FloatingMapCard - Simplified, High-Clarity Parent Sentinel Card
 * Features:
 * - Waze as an icon-only button (swapped with X on the far edge)
 * - 4 universal, site-intrinsic metrics (no irrelevant Tel Aviv distance)
 * - Specific hour timeline slider (06:00 - 20:00) with dynamic diurnal temperature & safety indicator
 * - Clean 4-day forecast
 * - Clean text-only trail specs
 * - Subtle, elegant legal disclaimer
 * - 100% theme support (Dark / Light mode)
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
  const [selectedHour, setSelectedHour] = useState(14); // 06 to 20
  const [liveWeather, setLiveWeather] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState([]);

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

  // Base weather calculation
  const effectiveWeather = (liveWeather && activeDay === 0 && activeScenario === 'NORMAL')
    ? {
        ...fallbackWeather,
        tempVal: parseInt(liveWeather.temp, 10) || fallbackWeather.tempVal,
        isTempSafe: liveWeather.isTempSafe,
        isRainSafe: liveWeather.isRainSafe,
        isLive: liveWeather.isLive ?? true,
        sourceLabel: liveWeather.badgeText || `${liveWeather.source || 'Live Weather'} (${liveWeather.fetchTime})`,
      }
    : {
        ...fallbackWeather,
        isLive: false,
        sourceLabel: activeDay === 0 ? 'מודל מקומי (Open-Meteo)' : `תחזית ליום ${activeDay + 1}`,
      };

  // Diurnal hourly calculation based on selectedHour (06:00 to 20:00)
  // Peak at 14:00, coolest at 06:00
  const hourDelta = useMemo(() => {
    if (selectedHour <= 8) return -6;
    if (selectedHour <= 11) return -3;
    if (selectedHour <= 15) return 0;
    if (selectedHour <= 18) return -3;
    return -5;
  }, [selectedHour]);

  const displayTemp = effectiveWeather.tempVal + hourDelta;
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

  // Entry fee label
  const isFree = !asset.entry_fee || asset.entry_fee.includes('חינם') || asset.entry_fee.toLowerCase().includes('free');
  const entryFeeLabel = isFree ? 'חינם' : 'בתשלום';

  // Format hour label
  const hourString = `${selectedHour < 10 ? '0' : ''}${selectedHour}:00`;

  // Dynamic Theme Palette Tokens
  const theme = {
    cardBg: isLightMode 
      ? 'bg-white/95 text-slate-800 border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.18)]' 
      : 'bg-[#0f172a]/95 text-zinc-100 border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.55)]',
    boxBg: isLightMode 
      ? 'bg-slate-50 border-slate-200/80' 
      : 'bg-slate-900/80 border-slate-800/80',
    titleColor: isLightMode ? 'text-slate-900' : 'text-white',
    subTextColor: isLightMode ? 'text-slate-500' : 'text-zinc-400',
    accentText: isLightMode ? 'text-teal-700' : 'text-teal-400',
    activeDayBorder: isLightMode 
      ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm' 
      : 'bg-teal-950/40 border-teal-400 text-white shadow-[0_0_12px_rgba(45,212,191,0.25)]',
    inactiveDayBg: isLightMode 
      ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200' 
      : 'bg-slate-900/60 hover:bg-slate-800/80 text-zinc-400 border-white/[0.06]',
  };

  return (
    <div 
      className={`fixed top-20 left-3 right-3 sm:absolute sm:top-20 sm:left-5 sm:right-auto sm:w-[380px] z-[1300] backdrop-blur-xl p-3.5 rounded-3xl border animate-floating-card font-body select-none pointer-events-auto max-h-[88vh] overflow-y-auto no-scrollbar transition-colors duration-200 ${theme.cardBg}`}
      style={{ direction: 'rtl' }}
    >
      {/* ── 1. Top Header: Title, Waze (Icon Only) & Close X (Swapped) ──────── */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b mb-2.5" style={{ borderColor: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
        
        {/* Right side: Site Avatar & Title */}
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

        {/* Left side: Waze (Icon Only) & Close X (X on far edge, Waze next to it) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Waze Navigation Button — Authentic Waze Icon */}
          <a
            href={`https://waze.com/ul?ll=${asset.lat},${asset.lng}&navigate=yes`}
            target="_blank"
            rel="noopener noreferrer"
            title="נווט עם Waze לשטח"
            aria-label="נווט עם Waze"
            className="w-8 h-8 rounded-full bg-[#33ccff] hover:bg-[#28b8eb] flex items-center justify-center shadow-md transition active:scale-95 border border-[#1cb8e8]/30"
          >
            {/* Authentic Waze Vector (White body, wheels, eyes, smile) */}
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              {/* Black Wheels */}
              <circle cx="10" cy="24" r="2.2" fill="#0f172a" />
              <circle cx="22" cy="24" r="2.2" fill="#0f172a" />
              
              {/* White Waze Car Body */}
              <path 
                d="M26 15c0-5.523-4.477-10-10-10S6 9.477 6 15c0 2.2.71 4.23 1.92 5.88L6.5 24.5l4.15-1.12C12.18 24.36 14.04 25 16 25c5.523 0 10-4.477 10-10z" 
                fill="#ffffff" 
                stroke="#0f172a" 
                strokeWidth="1.6" 
                strokeLinejoin="round"
              />
              
              {/* Left Eye */}
              <circle cx="12" cy="14" r="1.5" fill="#0f172a" />
              
              {/* Right Eye */}
              <circle cx="20" cy="14" r="1.5" fill="#0f172a" />
              
              {/* Smile */}
              <path 
                d="M12.5 17.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" 
                stroke="#0f172a" 
                strokeWidth="1.6" 
                strokeLinecap="round" 
              />
            </svg>
          </a>

          {/* Close Button (X on far-left edge) */}
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full border transition flex items-center justify-center active:scale-95 ${
              isLightMode 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-zinc-300 border-white/10'
            }`}
            title="סגור"
            aria-label="סגור חלון"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── 2. Upper Metrics: 4 Clean Universal Status Chips ────────────────── */}
      {/* No redundant icons, no Tel Aviv assumptions */}
      <div className="grid grid-cols-4 gap-1.5 mb-2.5">
        
        {/* Metric 1: Min Age */}
        <div className={`p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center ${theme.boxBg}`}>
          <span className="text-[9.5px] font-bold text-slate-400">גיל מומלץ</span>
          <span className={`text-xs font-black mt-0.5 px-2 py-0.5 rounded-lg border leading-tight ${ageBadge.color}`}>
            {ageBadge.label}
          </span>
        </div>

        {/* Metric 2: Strollers (Text only) */}
        <div className={`p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center ${theme.boxBg}`}>
          <span className="text-[9.5px] font-bold text-slate-400">עגלות</span>
          <span className={`text-[11px] font-bold mt-0.5 ${asset.stroller_accessible ? 'text-emerald-500 font-black' : isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
            {asset.stroller_accessible ? 'נגיש ✓' : 'ללא עגלות'}
          </span>
        </div>

        {/* Metric 3: Trail Distance / Difficulty (Universal metric, no Tel Aviv) */}
        <div className={`p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center ${theme.boxBg}`}>
          <span className="text-[9.5px] font-bold text-slate-400">מסלול</span>
          <span className={`text-[11px] font-black mt-0.5 ${theme.titleColor}`}>
            {asset.trail_length_km ? `${asset.trail_length_km} ק״מ` : asset.difficulty || 'קל'}
          </span>
        </div>

        {/* Metric 4: Entry Fee Status */}
        <div className={`p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center ${theme.boxBg}`}>
          <span className="text-[9.5px] font-bold text-slate-400">כניסה</span>
          <span className={`text-[11px] font-bold mt-0.5 px-1 py-0.2 rounded ${
            isFree 
              ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-300' 
              : 'text-amber-700 bg-amber-500/15 dark:text-amber-300 font-black'
          }`}>
            {entryFeeLabel}
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

      {/* ── 4. 4-Day Forecast Strip ────────────────────────────────────────── */}
      <div className={`p-2 rounded-2xl border mb-2.5 ${theme.boxBg}`}>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.subTextColor}`}>
            תחזית 4 ימים
          </span>
          <span className={`text-[10px] font-mono font-bold ${theme.accentText}`}>
            {fourDaysForecast[activeDay]?.label} ({fourDaysForecast[activeDay]?.dateStr})
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center">
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

                <div className="text-base my-0.5">
                  {day.weatherIcon}
                </div>

                <span className={`text-xs font-black font-mono leading-none ${isSelected ? theme.titleColor : theme.subTextColor}`}>
                  {day.weather.tempVal}°
                </span>

                <span className={`text-[7.5px] font-bold px-1 py-0.2 mt-1 rounded leading-tight w-full truncate ${
                  day.isSafe && !day.isWarning
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                    : day.isWarning
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-red-500/15 text-red-600 dark:text-red-300'
                }`}>
                  {day.isSafe && !day.isWarning ? 'בטוח' : day.isWarning ? 'זהירות' : 'סגור'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Hourly Slider Widget (06:00 to 20:00) ───────────────────────── */}
      <div className={`p-2.5 rounded-2xl border mb-2.5 ${theme.boxBg}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.subTextColor}`}>
            סליידר שעות (בדיקת שעה ספציפית)
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black font-mono ${theme.titleColor}`}>
              {hourString}
            </span>
            <span className="text-xs font-black font-mono text-teal-500">
              {displayTemp}°C
            </span>
          </div>
        </div>

        {/* Slider Input */}
        <div className="py-1">
          <input
            type="range"
            min="6"
            max="20"
            step="1"
            value={selectedHour}
            onChange={(e) => setSelectedHour(Number(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer accent-teal-500"
            aria-label="סליידר בחירת שעה"
          />
        </div>

        {/* Time tick labels */}
        <div className="flex justify-between text-[8.5px] font-mono font-bold text-slate-400 -mt-0.5 px-0.5">
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>20:00</span>
        </div>

        {/* Dynamic Safety Pill based on selected hour & temp */}
        <div className={`mt-2 py-1.5 px-2.5 rounded-xl text-center text-[11px] font-black border transition-all flex items-center justify-center gap-1.5 ${
          isSafe && !isWarning
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
            : isWarning
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
            : 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30'
        }`}>
          {isSafe && !isWarning ? (
            <>
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>
                {displayTemp >= 33 
                  ? `בטוח לטיול ב-${hourString} (${displayTemp}°C) — שעות חמות, חובה כובע ומים רבים` 
                  : `בטוח ומומלץ לטיול ב-${hourString} (${displayTemp}°C) ✓`}
              </span>
            </>
          ) : isWarning ? (
            <>
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <span>זהירות — עומס שטח או אזהרת מים ב-${hourString} ({displayTemp}°C)</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} className="text-red-500 shrink-0" />
              <span>עומס חום כבד ב-${hourString} (${displayTemp}°C) — מומלץ להקדים לבוקר</span>
            </>
          )}
        </div>
      </div>

      {/* ── 6. Bottom Specs & Features (Pure Text, No Emojis Next to Words) ─── */}
      <div className={`p-2 rounded-2xl border mb-2 flex items-center justify-between text-[11px] font-bold ${theme.boxBg}`}>
        <span className={theme.titleColor}>
          {asset.trail_length_km ? `${asset.trail_length_km} ק״מ` : 'מסלול מעגלי'}
        </span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className={theme.accentText}>
          {asset.type?.includes('מים') ? 'מעיינות ומים זורמים' : asset.type?.[0] || 'שמורת טבע'}
        </span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className={theme.subTextColor}>
          {asset.difficulty || 'קל למשפחות'}
        </span>
      </div>

      {/* ── 7. Safe Alternatives Drawer (if conditions are unsafe) ─────────── */}
      {!isSafe && alternatives.length > 0 && (
        <div className="mb-2">
          {!showAlternatives ? (
            <button 
              onClick={() => setShowAlternatives(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold py-1.5 rounded-xl border border-emerald-500/30 transition text-xs shadow-sm"
            >
              <Sparkles size={13} />
              <span>הצג {alternatives.length} חלופות בטוחות באזור</span>
            </button>
          ) : (
            <div className={`p-2 rounded-2xl border space-y-1.5 ${theme.boxBg}`}>
              <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                חלופות מאובטחות
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

      {/* ── 8. Compact Safety Disclaimer (Subtle 1-Line Text) ──────────────── */}
      <div className={`text-[9.5px] leading-relaxed text-center pt-1.5 pb-0.5 border-t ${theme.subTextColor}`} style={{ borderColor: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
        הנתונים מבוססים על מודלים ואומדנים. חובה לוודא אישור פתיחה והתרעות באתר רט״ג טרם היציאה.
      </div>

      {/* ── 9. Live Source & Attribution Footer ────────────────────────────── */}
      <div className="pt-1 text-[8px] flex items-center justify-between opacity-70" style={{ color: isLightMode ? '#64748b' : '#94a3b8' }}>
        <span className={`flex items-center gap-1 ${effectiveWeather.isLive ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`}>
          <Radio size={8} className={effectiveWeather.isLive ? 'animate-pulse' : ''} />
          <span>{effectiveWeather.sourceLabel}</span>
        </span>
        <span>{asset.org || 'רט"ג ומשרד הבריאות'}</span>
      </div>
    </div>
  );
}
