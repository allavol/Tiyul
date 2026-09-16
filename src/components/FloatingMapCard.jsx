import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  Droplets, 
  Sun, 
  Trees, 
  Baby, 
  Wind,
  Radio
} from 'lucide-react';
import { getSiteWeather, getWaterAdvisory, getAgeBadge, getCategoryIconChar } from '../utils/weatherUtils';
import { WeatherService } from '../services/WeatherService';

export default function FloatingMapCard({
  asset,
  activeScenario = 'NORMAL',
  selectedDayIndex = 0,
  onClose,
}) {
  if (!asset) return null;

  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const fallbackWeather = getSiteWeather(asset, activeScenario, selectedDayIndex);
  const waterAdvisory = getWaterAdvisory(asset);
  const ageBadge = getAgeBadge(asset.min_age);
  const categoryIcon = getCategoryIconChar(asset);

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

  return (
    <div className="absolute top-5 left-5 z-[1000] w-[360px] max-w-[calc(100vw-30px)] bg-[#0e0f14]/96 border border-white/[0.12] p-4 rounded-3xl shadow-2xl backdrop-blur-2xl text-zinc-100 animate-floating-card font-sans select-none space-y-3">
      {/* 1. Header with Site Name & Authority Badge */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/70 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
            {categoryIcon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-black text-white truncate leading-tight tracking-tight">
                {asset.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-zinc-400">
              <span>{asset.region}</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                {asset.authority_id || 'VERIFIED'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. Water Advisory Banner (if active) */}
      {waterAdvisory && (
        <div className={`p-2.5 rounded-2xl text-xs flex items-center gap-2 border ${
          waterAdvisory.level === 'danger'
            ? 'bg-red-950/80 text-red-200 border-red-800/80'
            : 'bg-amber-950/80 text-amber-200 border-amber-800/80'
        }`}>
          <AlertTriangle size={16} className="flex-shrink-0" />
          <div className="min-w-0">
            <strong className="block text-[11px] font-bold">{waterAdvisory.title}</strong>
            <span className="text-[10px] opacity-90">{waterAdvisory.desc}</span>
          </div>
        </div>
      )}

      {/* 3. Four Large Visual Indicator Tiles (More Icons, Minimal Text) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Tile 1: Temp & Heat Load */}
        <div className="bg-zinc-900/90 p-2.5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">עומס חום</span>
            <Sun size={16} className="text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-zinc-100">{effectiveWeather.temp}</span>
            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
              effectiveWeather.isTempSafe ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-red-950/80 text-red-300 border border-red-800/60'
            }`}>
              {effectiveWeather.isTempSafe ? '✓ תקין' : '✗ שרב'}
            </span>
          </div>
        </div>

        {/* Tile 2: Basin Rain & Flood Safety */}
        <div className="bg-zinc-900/90 p-2.5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">סכנת שיטפון</span>
            <Droplets size={16} className="text-blue-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-zinc-100">{effectiveWeather.rain.split('•')[0].trim()}</span>
            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
              effectiveWeather.isRainSafe ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-red-950/80 text-red-300 border border-red-800/60'
            }`}>
              {effectiveWeather.isRainSafe ? '✓ אגן בטוח' : '✗ סכנה'}
            </span>
          </div>
        </div>

        {/* Tile 3: Shade Canopy */}
        <div className="bg-zinc-900/90 p-2.5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">כיסוי צל</span>
            <Trees size={16} className="text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-zinc-200 truncate">{effectiveWeather.shadeType}</span>
            <span className="text-[9.5px] text-zinc-400 font-mono">
              {effectiveWeather.isSafeHaven ? '🛡️ מקלט' : 'חורש'}
            </span>
          </div>
        </div>

        {/* Tile 4: Age & Stroller Suitability */}
        <div className="bg-zinc-900/90 p-2.5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">גיל מומלץ</span>
            <Baby size={16} className="text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-black text-zinc-100 flex items-center gap-1">
              <span>{ageBadge.icon}</span>
              <span>{ageBadge.label}</span>
            </span>
            <span className="text-[9.5px] text-zinc-400">
              {asset.stroller_accessible ? 'עגלות ✓' : 'רגלי'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. One-Sentence Agent Verdict */}
      <div className="bg-zinc-950/90 p-2.5 rounded-2xl border border-zinc-800/90 flex items-start gap-2 text-xs">
        <Sparkles size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-zinc-200 text-[11px] leading-snug">
          {asset.agentSummary || (
            effectiveWeather.alertLevel === 'danger'
              ? `[הסוכן המטייל] אתר ${asset.name} אינו מומלץ כעת. רמת סיכון חריגה.`
              : `[הסוכן המטייל] תנאי השטח ב${asset.name} מצוינים (${effectiveWeather.temp}, ${effectiveWeather.conditions}). מתאים לבילוי משפחתי בטוח ומהנה.`
          )}
        </p>
      </div>

      {/* 5. Minimal Footer with Live Tomorrow.io Indicator */}
      <div className="pt-1 border-t border-zinc-800/70 text-[9.5px] text-zinc-400 text-center flex items-center justify-between px-1">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <Radio size={11} className={effectiveWeather.isLive ? 'animate-pulse' : ''} />
          <span>{effectiveWeather.sourceLabel}</span>
        </span>
        <span className="text-zinc-500">{asset.org || 'רט"ג ומשרד הבריאות'}</span>
      </div>
    </div>
  );
}
