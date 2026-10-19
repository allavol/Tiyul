import React, { useState, useEffect } from 'react';
import { X, Compass } from 'lucide-react';

const SAMPLE_STEPS = [
  { sender: 'user',  text: 'טיול עם ילד בן 4 ותינוק עם עגלה, מחר בצפון 🌿' },
  { sender: 'bot',   text: 'מצוין! מצאתי 3 מסלולים מתאימים לגיל 0+ ו-4+ בצפון. מזג האוויר מחר: 24°C שמשי — תנאים אידיאליים לטיול עם עגלה 👇' },
  { sender: 'bot',   text: '1. שמורת תל דן — גליל עליון · עגלה-ידידותי · נחל זורם\n2. נחל עמוד — גליל תחתון · מסלול מים · גיל 4+\n3. יער ביריה — צפת · צל מלא · 0+' },
];

export default function OnboardingModal({ isLightMode = true, onDismiss, onCTA }) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  // Animate sample conversation one bubble at a time
  useEffect(() => {
    if (visibleSteps >= SAMPLE_STEPS.length) return;
    const t = setTimeout(() => setVisibleSteps((n) => n + 1), visibleSteps === 0 ? 600 : 1200);
    return () => clearTimeout(t);
  }, [visibleSteps]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className={`relative w-full max-w-[420px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-brand-card border-accent/30 text-zinc-100'
      }`}>
        {/* Dismiss X */}
        <button
          onClick={onDismiss}
          className={`absolute top-3 left-3 w-8 h-8 rounded-xl flex items-center justify-center transition z-10 ${
            isLightMode
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className={`p-5 pb-4 border-b ${isLightMode ? 'border-slate-100' : 'border-white/[0.06]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white shadow-[0_2px_12px_var(--accent-glow)] flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">שלום! 👋 אני סוכן הטיולים החכם שלך</h2>
              <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                מחפש טיול? ספר לי — אני אמצא את המקום המושלם
              </p>
            </div>
          </div>
        </div>

        {/* Animated sample conversation */}
        <div className={`p-4 flex flex-col gap-2.5 min-h-[180px] ${isLightMode ? 'bg-slate-50/60' : 'bg-brand-deep/40'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>
            לדוגמה:
          </p>

          {SAMPLE_STEPS.slice(0, visibleSteps).map((step, i) => (
            <div
              key={i}
              className={`flex ${step.sender === 'user' ? 'justify-start' : 'justify-end'} animate-slide-up`}
            >
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                step.sender === 'user'
                  ? isLightMode
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'bg-accent text-brand-deep font-semibold'
                  : isLightMode
                    ? 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                    : 'bg-brand-surface text-zinc-200 border border-white/[0.06]'
              } ${step.sender === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                {step.text}
              </div>
            </div>
          ))}

          {/* Typing indicator while animating */}
          {visibleSteps < SAMPLE_STEPS.length && (
            <div className="flex justify-end">
              <div className={`flex items-center gap-1 px-3 py-2 rounded-2xl rounded-tl-sm text-xs ${
                isLightMode ? 'bg-white border border-slate-200' : 'bg-brand-surface border border-white/[0.06]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLightMode ? 'bg-slate-400' : 'bg-zinc-500'}`} style={{ animationDelay: '0ms' }} />
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLightMode ? 'bg-slate-400' : 'bg-zinc-500'}`} style={{ animationDelay: '150ms' }} />
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLightMode ? 'bg-slate-400' : 'bg-zinc-500'}`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className={`p-4 border-t flex flex-col gap-2 ${isLightMode ? 'border-slate-100' : 'border-white/[0.06]'}`}>
          <button
            onClick={onCTA}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg ${
              isLightMode
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
                : 'bg-accent hover:bg-accent-light text-brand-deep shadow-accent/25'
            }`}
          >
            <Compass className="w-4 h-4" />
            בוא נמצא טיול 🧭
          </button>
          <button
            onClick={onDismiss}
            className={`w-full py-2 text-xs font-medium transition ${
              isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            כבר יודע, תראה לי את המפה
          </button>
        </div>
      </div>
    </div>
  );
}
