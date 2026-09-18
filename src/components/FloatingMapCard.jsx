import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  Droplets, 
  Sun, 
  ShieldCheck,
  ShieldAlert,
  Radio,
  Baby,
  Users,
  Thermometer,
  CloudRain
} from 'lucide-react';
import { getSiteWeather, getWaterAdvisory, getAgeBadge, getCategoryIconChar, getSafeAlternatives } from '../utils/weatherUtils';
import { WeatherService } from '../services/WeatherService';
import { getDriveTimeFromTelAviv } from '../services/osrmService';
import assetsData from '../../assets_db.json';

/**
 * Maps Hebrew type keywords to emoji icons for the "מה יש באתר?" section.
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
  { keywords: ['כרמי', 'כרמים', 'חקלאות', 'מטע', 'זיתים'], icon: '🍇', label: 'חקלאות' },
  { keywords: ['שביל ישראל'], icon: '🥾', label: 'שביל ישראל' },
  { keywords: ['עגלות', 'מונגש', 'נגיש'], icon: '♿', label: 'נגישות' },
  { keywords: ['חניון לילה'], icon: '⛺', label: 'לינת שטח' },
  { keywords: ['קניון'], icon: '🪨', label: 'קניון' },
  { keywords: ['שלג'], icon: '❄️', label: 'שלג' },
];

/**
 * Extracts the unique feature pills from asset.type array.
 * Returns up to 5 most relevant features with icons.
 */
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

  return pills.slice(0, 5);
}

/**
 * Generates the "who is it for" summary line.
 */
function getSuitabilitySummary(asset) {
  const parts = [];
  
  if (asset.stroller_accessible) {
    parts.push('נגיש לעגלות ✓');
  }
  
  if (asset.min_age === 0) {
    parts.push('מתאים לכל המשפחה');
  } else if (asset.min_age <= 4) {
    parts.push('מתאים למשפחות עם ילדים');
  } else if (asset.min_age <= 7) {
    parts.push('מתאים לילדים מנוסים');
  } else {
    parts.push('למטיילים מנוסים');
  }

  return { parts };
}

export default function FloatingMapCard({
  asset,
  onClose,
  activeScenario = 'NORMAL',
  selectedDayIndex = 0,
  onSelectAlternative,
}) {
  if (!asset) return null;

  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [driveTime, setDriveTime] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState('noon'); // 'morning', 'noon', 'evening'

  const fallbackWeather = getSiteWeather(asset, activeScenario, selectedDayIndex);
  const waterAdvisory = getWaterAdvisory(asset);
  const ageBadge = getAgeBadge(asset.min_age);
  const categoryIcon = getCategoryIconChar(asset);
  const featurePills = getFeaturePills(asset.type);
  const suitability = getSuitabilitySummary(asset);

  // Fetch live Tomorrow.io weather when viewing "today" (index 0)
  useEffect(() => {
    let isMounted = true;

    if (selectedDayIndex === 0 && activeScenario === 'NORMAL') {
      setIsLoadingLive(true);
      WeatherService.fetchLiveWeather(asset)
        .then((data) => {
          if (isMounted && data) {
            setLiveWeather(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingLive(false);
        });
    } else {
      setLiveWeather(null);
      setIsLoadingLive(false);
    }

    return () => {
      isMounted = false;
    };
  }, [asset?.id, selectedDayIndex, activeScenario]);

  // Fetch OSRM Drive Time from Tel Aviv
  useEffect(() => {
    let isMounted = true;
    if (asset?.lat && asset?.lng) {
      setDriveTime(null);
      getDriveTimeFromTelAviv(asset.lat, asset.lng).then(data => {
        if (isMounted && data) {
          setDriveTime(data);
        }
      });
    }
    return () => { isMounted = false; };
  }, [asset?.id, asset?.lat, asset?.lng]);

  // Use live data if available, otherwise fallback to forecast model
  const effectiveWeather = (liveWeather && selectedDayIndex === 0 && activeScenario === 'NORMAL')
    ? {
        ...fallbackWeather,
        temp: liveWeather.temp,
        isTempSafe: liveWeather.isTempSafe,
        rain: liveWeather.rain,
        isRainSafe: liveWeather.isRainSafe,
        wind: liveWeather.wind,
        conditions: liveWeather.conditions,
        isLive: true,
        sourceLabel: `Tomorrow.io Live (${liveWeather.fetchTime})`,
      }
    : {
        ...fallbackWeather,
        isLive: false,
        sourceLabel: selectedDayIndex === 0 ? 'תחזית IMS' : `תחזית ליום ${selectedDayIndex + 1}`,
      };

  // Adjust temperature based on time of day
  if (timeOfDay === 'morning') {
    effectiveWeather.tempVal -= 3;
    effectiveWeather.heatIndex = effectiveWeather.tempVal >= 30 ? 'חם' : effectiveWeather.tempVal >= 22 ? 'נוח לטיול' : 'קריר';
    effectiveWeather.isTempSafe = effectiveWeather.tempVal < 38;
  } else if (timeOfDay === 'evening') {
    effectiveWeather.tempVal -= 4;
    effectiveWeather.heatIndex = effectiveWeather.tempVal >= 30 ? 'חם' : effectiveWeather.tempVal >= 22 ? 'נוח לטיול' : 'קריר';
    effectiveWeather.isTempSafe = effectiveWeather.tempVal < 38;
  }
  
  effectiveWeather.temp = `${effectiveWeather.tempVal}°C`;

  const isSafe = effectiveWeather.isTempSafe && effectiveWeather.isRainSafe && (!waterAdvisory || waterAdvisory.level !== 'danger');
  const isWarning = waterAdvisory && waterAdvisory.level === 'warning';

  useEffect(() => {
    if (!isSafe && asset) {
      setAlternatives(getSafeAlternatives(asset, assetsData, activeScenario, selectedDayIndex, 3));
    } else {
      setAlternatives([]);
      setShowAlternatives(false);
    }
  }, [isSafe, asset, activeScenario, selectedDayIndex]);

  return (
    <div className="fixed top-24 left-3 right-3 sm:absolute sm:top-24 sm:left-5 sm:right-auto sm:w-[370px] z-[1300] glass-panel p-0 rounded-3xl shadow-2xl text-zinc-100 animate-floating-card font-body select-none pointer-events-auto max-h-[85vh] overflow-y-auto no-scrollbar" style={{ borderColor: 'var(--border-accent)' }}>

      {/* ── Header: Name + Region + Close ────────────────────── */}
      <div className="p-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="data-badge teal flex-shrink-0">
            <span className="text-lg">{categoryIcon}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-white truncate leading-tight tracking-tight font-display">
              {asset.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider">{asset.region}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[10px] font-mono font-bold text-accent/70 bg-accent/[0.08] px-1.5 py-0.5 rounded border border-accent/20">
                {asset.authority_id || 'VERIFIED'}
              </span>
              {driveTime && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[10px] text-zinc-300 font-medium">
                    🚗 מת"א: <span className="font-bold text-white">{driveTime.durationMins} דק'</span> <span className="text-[9px] text-zinc-500">({driveTime.distanceKm} ק"מ)</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-200 transition flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Water Advisory Banner (if exists) ─────────────────── */}
      {waterAdvisory && (
        <div className="mx-4 mb-3">
          <div className={`p-2.5 rounded-2xl text-xs flex items-center gap-2 border ${
            waterAdvisory.level === 'danger'
              ? 'bg-red-500/10 text-red-200 border-red-500/30'
              : 'bg-amber-500/10 text-amber-200 border-amber-500/30'
          }`}>
            <AlertTriangle size={16} className="flex-shrink-0" />
            <div className="min-w-0">
              <strong className="block text-[11px] font-bold">{waterAdvisory.title}</strong>
              <span className="text-[10px] opacity-90">{waterAdvisory.desc}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 1: האם בטוח?                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="mx-4 mb-3 bg-brand-card rounded-2xl border border-white/[0.06] p-3.5 space-y-3">
        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">האם בטוח?</h4>
        
        {/* Big Status Badge */}
        <div className={`w-full py-3 rounded-xl flex items-center justify-center gap-2.5 text-sm font-black border ${
          isSafe && !isWarning
            ? 'status-safe'
            : isWarning
              ? 'status-warning'
              : 'status-danger'
        }`}>
          {isSafe && !isWarning ? (
            <><ShieldCheck size={20} /><span>בטוח לטיול ✓</span></>
          ) : isWarning ? (
            <><AlertTriangle size={20} /><span>זהירות — בדקו אזהרות</span></>
          ) : (
            <><ShieldAlert size={20} /><span>לא מומלץ כעת ✗</span></>
          )}
        </div>

        {/* Time of Day Slider */}
        <div className="bg-brand-deep/40 rounded-xl p-3 border border-white/[0.04]">
          <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-2">
            <span className={timeOfDay === 'morning' ? 'text-accent' : ''} onClick={() => setTimeOfDay('morning')} style={{cursor: 'pointer'}}>בוקר (08:00)</span>
            <span className={timeOfDay === 'noon' ? 'text-accent' : ''} onClick={() => setTimeOfDay('noon')} style={{cursor: 'pointer'}}>צהריים (14:00)</span>
            <span className={timeOfDay === 'evening' ? 'text-accent' : ''} onClick={() => setTimeOfDay('evening')} style={{cursor: 'pointer'}}>ערב (19:00)</span>
          </div>
          <input 
            type="range" 
            min="0" max="2" 
            step="1"
            value={timeOfDay === 'morning' ? 0 : timeOfDay === 'noon' ? 1 : 2}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val === 0) setTimeOfDay('morning');
              else if (val === 1) setTimeOfDay('noon');
              else setTimeOfDay('evening');
            }}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Mini Metrics Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-brand-deep/60 rounded-xl p-2.5 border border-white/[0.04]">
            <Thermometer size={14} className="text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 font-medium">חום</div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-mono text-zinc-100">{effectiveWeather.temp}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                  effectiveWeather.isTempSafe 
                    ? 'status-safe' 
                    : 'status-danger'
                }`}>
                  {effectiveWeather.isTempSafe ? '✓ תקין' : '✗ שרב'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-brand-deep/60 rounded-xl p-2.5 border border-white/[0.04]">
            <CloudRain size={14} className="text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 font-medium">משקעים / גשם</div>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black font-mono text-zinc-100 leading-none">
                    {effectiveWeather.rain.includes('•') ? effectiveWeather.rain.split('•')[0].trim() : effectiveWeather.rain}
                  </span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none ${
                    effectiveWeather.isRainSafe 
                      ? 'status-safe' 
                      : 'status-warning'
                  }`}>
                    {effectiveWeather.isRainSafe ? '✓ יבש' : '🌂 גשם אפשרי'}
                  </span>
                </div>
                {effectiveWeather.rain.includes('•') && (
                  <span className="text-[9px] text-zinc-400 font-medium">
                    {effectiveWeather.rain.split('•')[1].trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Alternatives Button & List (if unsafe) ── */}
        {!isSafe && alternatives.length > 0 && (
          <div className="mt-4 border-t border-white/[0.06] pt-3">
            {!showAlternatives ? (
              <button 
                onClick={() => setShowAlternatives(true)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold py-2.5 rounded-xl border border-emerald-500/30 transition text-xs"
              >
                <Sparkles size={16} />
                <span>הצג {alternatives.length} חלופות בטוחות באזור</span>
              </button>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">חלופות מאובטחות (מרחק אווירי)</h5>
                {alternatives.map((alt) => (
                  <div 
                    key={alt.id}
                    onClick={() => onSelectAlternative && onSelectAlternative(alt)}
                    className="flex items-center justify-between bg-black/40 hover:bg-white/5 p-2 rounded-lg border border-white/[0.04] cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getCategoryIconChar(alt)}</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-zinc-200 group-hover:text-emerald-300 transition">{alt.name}</span>
                        <span className="text-[9px] text-zinc-500">{alt.region}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-zinc-400">{alt.distanceKm.toFixed(1)} ק"מ</span>
                      <span className="text-[8px] text-emerald-400/80 bg-emerald-400/10 px-1.5 py-0.5 rounded">בטוח ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 2: מה יש באתר?                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="mx-4 mb-3 bg-brand-card rounded-2xl border border-white/[0.06] p-3.5 space-y-2.5">
        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">מה יש באתר?</h4>
        
        <div className="flex flex-wrap gap-2">
          {featurePills.length > 0 ? (
            featurePills.map((pill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 bg-brand-deep/80 text-zinc-200 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/[0.08] hover:border-accent/30 transition"
              >
                <span className="text-sm">{pill.icon}</span>
                <span>{pill.label}</span>
              </span>
            ))
          ) : (
            /* Fallback: show raw type tags */
            (asset.type || []).slice(0, 4).map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-brand-deep/80 text-zinc-300 text-[11px] font-medium px-2.5 py-1.5 rounded-full border border-white/[0.06]"
              >
                {t}
              </span>
            ))
          )}
        </div>

        {/* Description snippet if available */}
        {asset.description && (
          <p className="text-[10px] text-zinc-500 leading-snug mt-1 line-clamp-2">
            {asset.description}
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 3: למי מתאים?                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="mx-4 mb-3 bg-brand-card rounded-2xl border border-white/[0.06] p-3.5 space-y-2.5">
        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">למי מתאים?</h4>

        {/* Age Badge — Large */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-black badge-age-${Number(asset.min_age) || 0}`}>
            <span className="text-xl">{ageBadge.icon}</span>
            <span className="text-sm">מגיל {ageBadge.label}</span>
          </div>
        </div>

        {/* Suitability Pills */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {asset.stroller_accessible && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold status-safe">
              <Baby size={13} />
              נגיש לעגלות ✓
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 bg-accent/[0.08] text-accent px-3 py-1.5 rounded-full border border-accent/20 font-semibold">
            <Users size={13} />
            <span>{suitability.parts[suitability.parts.length - 1]}</span>
          </span>
        </div>
      </div>

      {/* ── Agent Verdict ─────────────────────────────────────── */}
      <div className="mx-4 mb-3 bg-brand-card p-3 rounded-xl border border-white/[0.06] flex items-start gap-2 text-xs">
        <Sparkles size={14} className="text-accent mt-0.5 flex-shrink-0" />
        <p className="text-zinc-300 text-[11px] leading-snug">
          {asset.agentSummary || (
            effectiveWeather.alertLevel === 'danger'
              ? `[הסוכן המטייל] אתר ${asset.name} אינו מומלץ כעת. רמת סיכון חריגה.`
              : `[הסוכן המטייל] תנאי השטח ב${asset.name} מצוינים (${effectiveWeather.temp}, ${effectiveWeather.conditions}). מתאים לבילוי משפחתי בטוח ומהנה.`
          )}
        </p>
      </div>

      {/* ── Live Source Footer ────────────────────────────────── */}
      <div className="px-4 pb-3 pt-1 border-t border-white/[0.04] text-[9px] text-zinc-500 text-center flex items-center justify-between">
        <span className="flex items-center gap-1 text-accent/80 font-medium">
          <Radio size={10} className={effectiveWeather.isLive ? 'animate-pulse' : ''} />
          <span>{effectiveWeather.sourceLabel}</span>
        </span>
        <span className="text-zinc-600">{asset.org || 'רט"ג ומשרד הבריאות'}</span>
      </div>
    </div>
  );
}
