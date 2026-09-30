import React, { useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Radio, 
  CloudRain, 
  ThermometerSun, 
  Baby, 
  X, 
  RotateCcw
} from 'lucide-react';

export default function AgentOperationsModal({
  isOpen = false,
  onClose,
  agentStatus = 'ONLINE',
  onClear,
  isProcessing = false
}) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAlertState = agentStatus === 'ALERT_REROUTED';

  const dataSources = [
    { icon: '📡', name: 'Tomorrow.io & IMS', desc: 'תחזית מיקרו-אקלים' },
    { icon: '🏞️', name: 'רט"ג וקק"ל', desc: 'שמורות ומקלטים' },
    { icon: '🌊', name: 'רשות המים ומשרד הבריאות', desc: 'דיגום ועכירות נחלים' },
    { icon: '🏛️', name: 'רשות העתיקות ושבילי ישראל', desc: 'סימון שבילים ותוואי שטח' }
  ];

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-body"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="מוח"
        className="w-full max-w-md glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl text-zinc-100 relative overflow-hidden space-y-4"
        dir="rtl"
        style={{ borderColor: 'var(--border-accent)' }}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-60 h-28 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Row */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/[0.08] border border-accent/20 text-accent flex items-center justify-center font-black shadow-inner">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight font-display">
                  מוח
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-accent bg-accent/[0.08] border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                מערכת היתוך נתונים והחלטות בטיחות
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="סגור (Esc)"
            aria-label="סגור חלון"
            className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-zinc-300 hover:text-white border border-white/[0.1] hover:border-accent/40 flex items-center justify-center transition active:scale-95 shadow-md flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. 4 Data Sources Icons (No long descriptions) */}
        <div className="space-y-1.5">
          <h3 className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Radio size={12} className="text-accent" />
            מקורות מידע מסונכרנים:
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {dataSources.map((ds, idx) => (
              <div
                key={idx}
                title={`${ds.name} • ${ds.desc}`}
                className="bg-brand-card hover:bg-brand-card/80 p-2.5 rounded-xl border border-white/[0.06] hover:border-accent/30 flex items-center justify-center text-xl transition-all cursor-default shadow-sm"
              >
                <span>{ds.icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Safety Thresholds & Decision Matrix (XAI) */}
        <div className="space-y-1.5">
          <h3 className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldCheck size={12} className="text-accent" />
            ספי בטיחות ומנגנון החלטות (XAI):
          </h3>
          <div className="bg-brand-card p-3 rounded-2xl border border-white/[0.06] space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <ThermometerSun size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200 text-[11px]">סף עומס חום (38°C+):</strong>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  מעל 38°C מנותב אוטומטית למקלט בטוח מוצל/ממוזג.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CloudRain size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200 text-[11px]">משקעים ושיטפונות באגן:</strong>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  זיהוי גשם באגן ניקוז קניוני מפעיל וקטור פינוי מיידי באלגוריתם Haversine.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Baby size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-200 text-[11px]">מדרג גילאים (0+, 4+, 7+, 10+):</strong>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  הערכת מכשולים פיזיים ותוואי שטח בצימוד לתנאי מזג האוויר.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Alert Reset CTA (Only if alert state is active) */}
        {isAlertState && (
          <div className="pt-2 border-t border-white/[0.06] text-center">
            <button
              onClick={() => {
                onClear?.();
                onClose?.();
              }}
              disabled={isProcessing}
              className="py-1.5 px-4 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition border border-amber-500/30 shadow-sm"
            >
              <RotateCcw size={13} />
              <span>איפוס מצב חירום וחזרה למסלולים</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
