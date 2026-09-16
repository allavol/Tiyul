import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Calendar, CloudSun, Radio } from 'lucide-react';

export default function SiteChunkyCard({
  asset,
  isSelected = false,
  onSelect,
}) {
  const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
  const isAlert = asset.status === 'CRITICAL' || asset.status === 'REROUTED';

  // 1. Classification text
  const classification = asset.type?.join(' • ') || 'שמורת טבע';

  // 2. Busy Days
  const busyDays = asset.busy_days || 'עומס שיא: סופי שבוע וחגים (Peak: Weekends)';

  // 3. Status Banner Config
  let bannerBg = 'bg-emerald-600 text-white';
  let bannerText = 'SAFE (בטוח לביקור)';
  let bannerIcon = <CheckCircle size={14} className="flex-shrink-0" />;

  if (isAlert) {
    bannerBg = 'bg-red-600 text-white';
    bannerText = 'ALERT (סכנת פגיעה - הופנה למקלט)';
    bannerIcon = <AlertTriangle size={14} className="flex-shrink-0" />;
  } else if (isSafeHaven) {
    bannerBg = 'bg-sky-600 text-white';
    bannerText = 'SAFE HAVEN (מקלט חירום מוגן)';
    bannerIcon = <Shield size={14} className="flex-shrink-0" />;
  }

  // 4. Agent Logic Matrix
  const weatherStatus = isAlert ? 'ALERT (סכנה)' : 'OK (תקין)';
  const weatherBg = isAlert ? 'bg-red-950/80 text-red-300 border-red-800' : 'bg-slate-900 text-slate-300 border-slate-700';

  const fieldAlertsStatus = isAlert ? 'ALERT (פעיל)' : 'OK (אין)';
  const fieldAlertsBg = isAlert ? 'bg-red-950/80 text-red-300 border-red-800' : 'bg-slate-900 text-slate-300 border-slate-700';

  const summarySentence = asset.agentSummary || (
    isAlert
      ? `זוהה איום בסמיכות לאתר. מפנה אוטונומית אל ${asset.rerouteTarget?.name || 'מקלט בטוח'}.`
      : isSafeHaven
      ? 'מוגדר כמקלט בטוח מבוצר עם נגישות מלאה לצוותי חירום.'
      : 'כל מדדי מזג האוויר וה-OSINT תקינים. פתוח לפעילות מלאה.'
  );

  return (
    <div
      onClick={() => onSelect?.(asset.id)}
      className={`bg-slate-800 rounded-lg p-4 mb-3 border transition cursor-pointer select-none ${
        isSelected
          ? 'border-sky-500 shadow-md ring-1 ring-sky-500'
          : isAlert
          ? 'border-red-600/80 hover:border-red-500'
          : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      {/* 1. Header: Site Name & Classification */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-100 leading-snug">{asset.name}</h3>
          <span className="text-[11px] text-slate-400 font-medium">{classification}</span>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-mono flex-shrink-0">
          #{asset.id}
        </span>
      </div>

      {/* 2. Busy Days */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
        <Calendar size={12} className="text-slate-500 flex-shrink-0" />
        <span className="truncate">{busyDays}</span>
      </div>

      {/* 3. Status Banner */}
      <div className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded font-bold text-xs tracking-wide uppercase mb-3 ${bannerBg}`}>
        {bannerIcon}
        <span>{bannerText}</span>
      </div>

      {/* 4. Agent Logic Matrix */}
      <div className="bg-slate-900/90 rounded border border-slate-700/80 p-2.5 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1">
          <span>Agent Logic Matrix</span>
          <span className="text-[9px] font-mono text-sky-400">BAAL-v2</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-1.5 rounded border flex flex-col gap-0.5 ${weatherStatus.includes('ALERT') ? 'bg-red-950/70 border-red-800 text-red-200' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <CloudSun size={11} />
              <span>Weather Data</span>
            </span>
            <span className="font-mono font-bold text-[11px]">{weatherStatus}</span>
          </div>

          <div className={`p-1.5 rounded border flex flex-col gap-0.5 ${fieldAlertsStatus.includes('ALERT') ? 'bg-red-950/70 border-red-800 text-red-200' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Radio size={11} />
              <span>Field Alerts</span>
            </span>
            <span className="font-mono font-bold text-[11px]">{fieldAlertsStatus}</span>
          </div>
        </div>

        {/* Summary sentence */}
        <div className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1 border-t border-slate-800/80">
          <span className="text-slate-400 font-semibold">סיכום סוכן: </span>
          <span>{summarySentence}</span>
        </div>
      </div>
    </div>
  );
}
