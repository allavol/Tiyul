import React from 'react';
import { Sparkles, X } from 'lucide-react';

export default function NationalRadarCard({
  activeScenario = 'NORMAL',
  selectedDay = 'today',
  totalAssetsCount = 32,
  onClose,
}) {
  const safetyIndex = activeScenario === 'FLOOD' ? 68 : activeScenario === 'HEATWAVE' ? 62 : 94;

  return (
    <div className="absolute top-5 left-5 z-[1000] w-[390px] max-w-[calc(100vw-30px)] max-h-[calc(100vh-40px)] overflow-y-auto no-scrollbar bg-zinc-900/95 border border-zinc-700/80 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-zinc-100 animate-floating-card font-sans space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-base shadow-sm flex-shrink-0">
            🛰️
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-white text-xs block truncate leading-tight">
              מכ"ם אקלימי וסטטוס שטח ארצי
            </span>
            <span className="text-[10.5px] text-emerald-400 font-medium block truncate">
              הסוכן המטייל • תמונת מצב סינרגטית ({selectedDay === 'tomorrow' ? 'תחזית למחר' : 'מצב שטח חי'})
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-xs p-1 rounded-lg hover:bg-zinc-800 transition flex-shrink-0"
          title="סגור"
        >
          <X size={16} />
        </button>
      </div>

      {/* National Hiking Index Card */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-zinc-950 p-2.5 rounded-xl border border-emerald-800/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">מדד טיולים ובטיחות ארצי</div>
          <div className="text-white font-extrabold text-sm mt-0.5">
            {activeScenario === 'FLOOD' ? '68/100 • זהירות מוגברת בנחלים' : activeScenario === 'HEATWAVE' ? '62/100 • עומס חום כבד במדבר' : '94/100 • תנאים מצוינים למטיילים'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {totalAssetsCount} שמורות ומסלולים מנוטרים • 0 כשלים קריטיים
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center font-mono font-black text-emerald-400 text-sm">
          {safetyIndex}%
        </div>
      </div>

      {/* 4 Regional Breakdown */}
      <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
        <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-300 font-bold">
            <span>🌲 צפון והגולן</span>
            <span className="text-emerald-400 font-mono">21°C</span>
          </div>
          <p className="text-[9.5px] text-zinc-400 mt-1 leading-snug">
            זרימת מים מצוינת, רוח הרים נעימה. אידיאלי למשפחות.
          </p>
        </div>

        <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-300 font-bold">
            <span>🌊 חוף ושפלה</span>
            <span className="text-sky-400 font-mono">26°C</span>
          </div>
          <p className="text-[9.5px] text-zinc-400 mt-1 leading-snug">
            בריזה ימית נוחה, עומס חום מתון, אתרי עתיקות נגישים.
          </p>
        </div>

        <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-300 font-bold">
            <span>⛰️ ירושלים וההרים</span>
            <span className="text-amber-400 font-mono">23°C</span>
          </div>
          <p className="text-[9.5px] text-zinc-400 mt-1 leading-snug">
            לחות נמוכה, ראות גבוהה, מושלם לשבילי חורש ומורשת.
          </p>
        </div>

        <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-300 font-bold">
            <span>☀️ דרום ומדבר</span>
            <span className="text-orange-400 font-mono">32°C</span>
          </div>
          <p className="text-[9.5px] text-zinc-400 mt-1 leading-snug">
            יבש וחם. חובת הצטיידות ב-3 ליטר מים וטיול בשעות הבוקר.
          </p>
        </div>
      </div>

      {/* Active Incident & Pollution Radar */}
      <div className="bg-zinc-950/90 p-2 rounded-xl border border-zinc-800 flex items-center justify-between text-[10.5px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-zinc-300 font-medium">התרעות וזיהומים פעילים:</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-zinc-400 font-mono">שיטפונות: 0</span>
          <span>•</span>
          <span className="text-zinc-400 font-mono">שריפות: 0</span>
          <span>•</span>
          <span className="text-emerald-400 font-mono font-bold">מים: תקין ✓</span>
        </div>
      </div>

      {/* Top Pick for Day */}
      <div className="bg-zinc-950/90 p-2.5 rounded-xl border border-zinc-800 text-[10.5px] leading-relaxed">
        <div className="flex items-center justify-between mb-1 text-zinc-400">
          <span className="font-semibold flex items-center gap-1 text-[10px]">
            <Sparkles size={11} className="text-emerald-400" />
            המלצת העל של הסוכן המטייל {selectedDay === 'tomorrow' ? 'למחר' : 'להיום'}:
          </span>
          <span className="text-[9px] text-emerald-400 font-mono">נבחר מוביל</span>
        </div>
        <p className="text-zinc-200 text-[10.5px]">
          <strong>שמורת טבע תל דן (הצפון)</strong> ו<strong>גן לאומי בית גוברין (המרכז)</strong> מעניקים היום את התנאים הבטוחים והנוחים ביותר בישראל (מסלולים מוצלים, מים זורמים והגנה מרוחות).
        </p>
      </div>

      {/* Sources Footer */}
      <div className="pt-0.5 border-t border-zinc-800/80 text-[9.5px] text-zinc-500 text-center flex items-center justify-center gap-1.5">
        <span>📡 נתונים מסונכרנים:</span>
        <span className="text-zinc-400">שירות מטאורולוגי</span>
        <span>•</span>
        <span className="text-zinc-400">משרד הבריאות</span>
        <span>•</span>
        <span className="text-zinc-400">רט"ג</span>
        <span>•</span>
        <span className="text-zinc-400">כבאות 102</span>
      </div>
    </div>
  );
}
