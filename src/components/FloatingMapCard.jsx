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
    <div className="fixed top-3 left-3 right-3 sm:absolute sm:top-5 sm:left-5 sm:right-auto sm:w-[370px] z-[1300] glass-panel p-4 sm:p-5 rounded-3xl shadow-2xl text-zinc-100 animate-floating-card font-body select-none space-y-3.5 sm:space-y-4 pointer-events-auto max-h-[85vh] overflow-y-auto no-scrollbar" style={{ borderColor: 'var(--border-accent)' }}>
      {/* ── 1. Editorial Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="data-badge teal flex-shrink-0">
            <span className="text-lg">{categoryIcon}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-white truncate leading-tight tracking-tight font-display">
              {asset.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider">{asset.region}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[9px] font-mono font-bold text-accent/70 bg-accent/[0.08] px-1.5 py-0.5 rounded border border-accent/20">
                {asset.authority_id || 'VERIFIED'}
              </span>
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

      {/* ── 2. Water Advisory Banner ────────────────────────────── */}
      {waterAdvisory && (
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
      )}

      {/* ── 3. Circular Data Badges (Surfline Style) ────────────── */}
      <div className="flex items-center justify-between px-2">
        {/* Temp Badge */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={`data-badge ${effectiveWeather.isTempSafe ? 'teal' : 'alert'}`}>
            <span className="text-[12px]">{effectiveWeather.temp.replace('°C', '°')}</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-semibold uppercase">חום</span>
        </div>

        {/* Rain Badge */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={`data-badge ${effectiveWeather.isRainSafe ? 'teal' : 'alert'}`}>
            <Droplets size={14} />
          </div>
          <span className="text-[9px] text-zinc-500 font-semibold uppercase">גשם</span>
        </div>

        {/* Shade Badge */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="data-badge teal">
            <Trees size={14} />
          </div>
          <span className="text-[9px] text-zinc-500 font-semibold uppercase">צל</span>
        </div>

        {/* Age Badge */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="data-badge dark">
            <span className="text-[12px]">{ageBadge.icon}</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-semibold uppercase">{ageBadge.label}</span>
        </div>
      </div>

      {/* ── 4. Detail Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-brand-card p-2.5 rounded-xl border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">עומס חום</span>
            <Sun size={14} className="text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-black font-mono text-zinc-100">{effectiveWeather.temp}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
              effectiveWeather.isTempSafe ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
            }`}>
              {effectiveWeather.isTempSafe ? '✓ תקין' : '✗ שרב'}
            </span>
          </div>
        </div>

        <div className="bg-brand-card p-2.5 rounded-xl border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">שיטפון</span>
            <Droplets size={14} className="text-blue-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-black font-mono text-zinc-100">{effectiveWeather.rain.split('•')[0].trim()}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
              effectiveWeather.isRainSafe ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
            }`}>
              {effectiveWeather.isRainSafe ? '✓ בטוח' : '✗ סכנה'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 5. Agent Verdict ─────────────────────────────────────── */}
      <div className="bg-brand-card p-3 rounded-xl border border-white/[0.06] flex items-start gap-2 text-xs">
        <Sparkles size={14} className="text-accent mt-0.5 flex-shrink-0" />
        <p className="text-zinc-300 text-[11px] leading-snug">
          {asset.agentSummary || (
            effectiveWeather.alertLevel === 'danger'
              ? `[הסוכן המטייל] אתר ${asset.name} אינו מומלץ כעת. רמת סיכון חריגה.`
              : `[הסוכן המטייל] תנאי השטח ב${asset.name} מצוינים (${effectiveWeather.temp}, ${effectiveWeather.conditions}). מתאים לבילוי משפחתי בטוח ומהנה.`
          )}
        </p>
      </div>

      {/* ── 6. Live Source Footer ────────────────────────────────── */}
      <div className="pt-1 border-t border-white/[0.04] text-[9px] text-zinc-500 text-center flex items-center justify-between px-1">
        <span className="flex items-center gap-1 text-accent/80 font-medium">
          <Radio size={10} className={effectiveWeather.isLive ? 'animate-pulse' : ''} />
          <span>{effectiveWeather.sourceLabel}</span>
        </span>
        <span className="text-zinc-600">{asset.org || 'רט"ג ומשרד הבריאות'}</span>
      </div>
    </div>
  );
}
