import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Radio, 
  CloudRain, 
  ThermometerSun, 
  Baby, 
  Sparkles, 
  X, 
  Activity, 
  AlertTriangle,
  Flame,
  Waves,
  RotateCcw
} from 'lucide-react';

export default function AgentOperationsModal({
  isOpen = false,
  onClose,
  agentStatus = 'ONLINE',
  onSimulateFlood,
  onSimulateHeatwave,
  onSimulatePollution,
  onSimulateStroller,
  onClear,
  isProcessing = false,
  agentLastDecision = ''
}) {
  if (!isOpen) return null;

  const isAlertState = agentStatus === 'ALERT_REROUTED';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="w-full max-w-xl bg-[#0c0d12]/98 border border-white/[0.12] rounded-3xl p-6 shadow-2xl text-zinc-100 relative overflow-hidden space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar"
        dir="rtl"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Row */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black shadow-inner">
              <Cpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  מוח הסוכן המטייל (C4I Brain)
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE 100%
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                מערכת היתוך נתונים רב-מקורית ותמיכה בהחלטות בטיחות מטיילים
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. What the Agent Does & Data Feeds */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Radio size={14} className="text-emerald-400" />
            מקורות המידע הרשמיים המסונכרנים בזמן אמת:
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11.5px]">
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2">
              <span className="text-base">📡</span>
              <div>
                <strong className="block text-zinc-200">Tomorrow.io & IMS</strong>
                <span className="text-[10px] text-zinc-400">תחזית מיקרו-אקלים, עומס חום וגשם</span>
              </div>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2">
              <span className="text-base">🏞️</span>
              <div>
                <strong className="block text-zinc-200">רט"ג וקק"ל</strong>
                <span className="text-[10px] text-zinc-400">58 שמורות ומקלטים בטוחים (Safe Havens)</span>
              </div>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2">
              <span className="text-base">🌊</span>
              <div>
                <strong className="block text-zinc-200">רשות המים ומשרד הבריאות</strong>
                <span className="text-[10px] text-zinc-400">דיגומי קולי ועכירות נחלים</span>
              </div>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <div>
                <strong className="block text-zinc-200">רשות העתיקות ושבילי ישראל</strong>
                <span className="text-[10px] text-zinc-400">סימון שבילים, תוואי שטח ועגלות</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Decision Matrix & Thresholds */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            ספי הבטיחות ומנגנון קבלת ההחלטות (XAI):
          </h3>
          <div className="bg-zinc-950/90 p-3 rounded-2xl border border-zinc-800/90 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <ThermometerSun size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200">סף עומס חום (38°C+):</strong>
                <p className="text-[11px] text-zinc-400">
                  מעל 38°C מנותב אוטומטית למקלט בטוח מוצל/ממוזג (Safe Haven).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CloudRain size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200">משקעים ושיטפונות באגן:</strong>
                <p className="text-[11px] text-zinc-400">
                  זיהוי גשם באגן ניקוז קניוני מפעיל וקטור פינוי מיידי באלגוריתם Haversine.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Baby size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200">מדרג גילאים (0+, 4+, 7+, 10+):</strong>
                <p className="text-[11px] text-zinc-400">
                  הערכת מכשולים פיזיים (סולמות, יתדות, מדרגות סלע ועגלות) בצימוד לתנאי מזג האוויר.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Decision Log */}
        <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" />
              החלטת הסוכן האחרונה:
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Real-Time</span>
          </div>
          <p className="text-[11.5px] text-zinc-300 leading-relaxed font-mono bg-black/40 p-2 rounded-xl border border-white/[0.05]">
            {agentLastDecision}
          </p>
        </div>

        {/* 5. Trigger What-If Simulations (Interactive Sandbox) */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              סימולטור תרחישי קיצון What-If (הדגמת שינוי מסלול אוטונומי):
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => {
                onSimulateFlood?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-2.5 px-2 rounded-xl bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-200 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
            >
              <Waves size={16} />
              <span>שיטפון בעין גדי</span>
            </button>

            <button
              onClick={() => {
                onSimulateHeatwave?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-2.5 px-2 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
            >
              <Flame size={16} />
              <span>חום 44°C במצדה</span>
            </button>

            <button
              onClick={() => {
                onSimulatePollution?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-2.5 px-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-200 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
            >
              <span className="text-base">🧪</span>
              <span>זיהום מים בדליות</span>
            </button>

            <button
              onClick={() => {
                onSimulateStroller?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-2.5 px-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
            >
              <Baby size={16} />
              <span>חירום עגלות 0+</span>
            </button>
          </div>

          <div className="mt-2 text-center">
            <button
              onClick={() => {
                onClear?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-1.5 px-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <RotateCcw size={13} />
              <span>איפוס מצב וחזרה לכל המסלולים</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
