import React from 'react';
import { Shield, AlertTriangle, CheckCircle, CloudSun, Navigation, Baby } from 'lucide-react';
import { getSiteWeather, getWaterAdvisory } from '../utils/weatherUtils';

export default function SiteChunkyCard({
  asset,
  isSelected = false,
  onSelect,
}) {
  const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
  const isAlert = asset.status === 'CRITICAL' || asset.status === 'REROUTED';

  const weather = getSiteWeather(asset, 'NORMAL', 0); // basic fallback
  const advisory = getWaterAdvisory(asset);

  return (
    <div
      onClick={() => onSelect?.(asset.id)}
      className={`rounded-xl p-3 mb-3 border transition cursor-pointer select-none flex flex-col gap-2.5 ${
        isSelected
          ? 'bg-slate-800 border-accent shadow-[0_0_15px_rgba(45,212,191,0.2)]'
          : isAlert
          ? 'bg-red-950/20 border-red-900/50 hover:border-red-500/50'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      {/* Contingency Banner if Alert */}
      {isAlert && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={14} />
          <span>סכנה: תנאי מזג אוויר או שטח מסוכנים. מומלץ מקלט.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAlert ? 'bg-red-500/20 text-red-500' : isSafeHaven ? 'bg-sky-500/20 text-sky-500' : 'bg-emerald-500/20 text-emerald-500'
          }`}>
            {isAlert ? <AlertTriangle size={16} /> : isSafeHaven ? <Shield size={16} /> : <CheckCircle size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">{asset.name}</h3>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{asset.type?.join(' • ') || 'שמורת טבע'}</span>
          </div>
        </div>
      </div>

      {/* Micro-Indicators (Safe/Safe Haven Mode) */}
      {!isAlert && (
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-full px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
            <CloudSun size={12} className="text-amber-400" />
            <span>{weather.tempNum}°C</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-full px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
            <span className="text-blue-400">💧</span>
            <span>{advisory?.level === 'danger' ? 'סכנה' : advisory?.level === 'warning' ? 'אזהרה' : 'בטוח'}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-full px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
            <Baby size={12} className="text-emerald-400" />
            <span>{asset.min_age === 0 ? '0+ (עגלות)' : `${asset.min_age}+ שנים`}</span>
          </div>
        </div>
      )}

      {/* Inline Plan B (Contingency Mode) */}
      {isAlert && asset.rerouteTarget && (
        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-2.5 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">חלופה בטוחה (Plan B):</span>
          <div className="flex items-center gap-2">
            <div className="bg-accent/20 text-accent w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield size={12} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">{asset.rerouteTarget.name}</div>
              <div className="text-[10px] text-slate-400">מרחק בטוח מגורם הסיכון</div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
        isAlert 
          ? 'bg-red-600 hover:bg-red-500 text-white' 
          : 'bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20'
      }`}>
        {isAlert ? (
          <>
            <Navigation size={14} />
            <span>שינוי מסלול לתוכנית ב'</span>
          </>
        ) : (
          <>
            <Navigation size={14} />
            <span>ניווט בטוח במסלול</span>
          </>
        )}
      </button>
    </div>
  );
}
