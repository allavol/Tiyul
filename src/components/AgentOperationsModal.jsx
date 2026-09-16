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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-body">
      <div 
        className="w-full max-w-xl glass-panel rounded-3xl p-6 shadow-2xl text-zinc-100 relative overflow-hidden space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar"
        dir="rtl"
        style={{ borderColor: 'var(--border-accent)' }}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Row */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/[0.08] border border-accent/20 text-accent flex items-center justify-center font-black shadow-inner">
              <Cpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight font-display">
                  מוח הסוכן (C4I)
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-accent bg-accent/[0.08] border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                מערכת היתוך נתונים ותמיכה בהחלטות בטיחות
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Data Feeds */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Radio size={12} className="text-accent" />
            מקורות מידע מסונכרנים:
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-brand-card p-2.5 rounded-xl border border-white/[0.06] flex items-center gap-2">
              <span className="text-base">📡</span>
              <div>
                <strong className="block text-zinc-200 text-[11px]">Tomorrow.io & IMS</strong>
                <span className="text-[9px] text-zinc-500">תחזית מיקרו-אקלים, עומס חום וגשם</span>
              </div>
            </div>
            <div className="bg-brand-card p-2.5 rounded-xl border border-white/[0.06] flex items-center gap-2">
              <span className="text-base">🏞️</span>
              <div>
                <strong className="block text-zinc-200 text-[11px]">רט"ג וקק"ל</strong>
                <span className="text-[9px] text-zinc-500">58 שמורות ומקלטים בטוחים</span>
              </div>
            </div>
            <div className="bg-brand-card p-2.5 rounded-xl border border-white/[0.06] flex items-center gap-2">
              <span className="text-base">🌊</span>
              <div>
                <strong className="block text-zinc-200 text-[11px]">רשות המים ומשרד הבריאות</strong>
                <span className="text-[9px] text-zinc-500">דיגומי קולי ועכירות נחלים</span>
              </div>
            </div>
            <div className="bg-brand-card p-2.5 rounded-xl border border-white/[0.06] flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <div>
                <strong className="block text-zinc-200 text-[11px]">רשות העתיקות ושבילי ישראל</strong>
                <span className="text-[9px] text-zinc-500">סימון שבילים, תוואי שטח ועגלות</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Decision Matrix & Thresholds */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldCheck size={12} className="text-accent" />
            ספי בטיחות ומנגנון החלטות (XAI):
          </h3>
          <div className="bg-brand-card p-3 rounded-2xl border border-white/[0.06] space-y-2.5 text-xs">
            <div className="flex items-start gap-2">
              <ThermometerSun size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200 text-[11px]">סף עומס חום (38°C+):</strong>
                <p className="text-[10px] text-zinc-500">
                  מעל 38°C מנותב אוטומטית למקלט בטוח מוצל/ממוזג.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CloudRain size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200 text-[11px]">משקעים ושיטפונות באגן:</strong>
                <p className="text-[10px] text-zinc-500">
                  זיהוי גשם באגן ניקוז קניוני מפעיל וקטור פינוי מיידי באלגוריתם Haversine.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Baby size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200 text-[11px]">מדרג גילאים (0+, 4+, 7+, 10+):</strong>
                <p className="text-[10px] text-zinc-500">
                  הערכת מכשולים פיזיים בצימוד לתנאי מזג האוויר.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Decision Log */}
        <div className="bg-brand-card p-3 rounded-2xl border border-white/[0.06]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity size={12} className="text-accent" />
              החלטת הסוכן האחרונה:
            </span>
            <span className="text-[9px] text-zinc-600 font-mono">REAL-TIME</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-mono bg-brand-deep/60 p-2.5 rounded-xl border border-white/[0.04]">
            {agentLastDecision}
          </p>
        </div>

        {/* 5. Trigger What-If Simulations */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-accent flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={12} />
              סימולטור תרחישים WHAT-IF:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => {
                onSimulateFlood?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-2.5 px-2 rounded-xl bg-blue-500/[0.08] hover:bg-blue-500/15 border border-blue-500/20 text-blue-300 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
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
              className="py-2.5 px-2 rounded-xl bg-amber-500/[0.08] hover:bg-amber-500/15 border border-amber-500/20 text-amber-300 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
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
              className="py-2.5 px-2 rounded-xl bg-purple-500/[0.08] hover:bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
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
              className="py-2.5 px-2 rounded-xl bg-accent/[0.08] hover:bg-accent/15 border border-accent/20 text-accent text-xs font-bold flex flex-col items-center justify-center gap-1 transition text-center"
            >
              <Baby size={16} />
              <span>חירום עגלות 0+</span>
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              onClick={() => {
                onClear?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-1.5 px-4 rounded-full bg-brand-surface hover:bg-brand-card text-zinc-400 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition border border-white/[0.06]"
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
