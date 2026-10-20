import React from 'react';
import { MapPin, Tag, Calendar, RotateCcw, Compass, Footprints } from 'lucide-react';

export default function LuxeTopBar({
  selectedRegion,
  onRegionChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  visitDate,
  daysAhead,
  isOutOfHorizon,
  onDateChange,
  onClear,
  isProcessing,
  totalAssetsCount,
  visibleAssetsCount,
}) {
  return (
    <header className="flex flex-col gap-2 w-full px-5 py-2.5 bg-brand-rail border-b border-white/[0.08] z-[1000] shadow-[0_4px_20px_rgba(0,0,0,0.35)]">

      {/* ── Top Row: Brand Header ── */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-[36px] h-[36px] rounded-xl bg-accent flex items-center justify-center text-white shadow-[0_2px_10px_var(--accent-glow)]">
            <Compass size={22} />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-xl font-bold text-white tracking-tight leading-none whitespace-nowrap font-sans">
              לאן נטייל?
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 text-accent font-bold border border-accent/30 whitespace-nowrap">
              {totalAssetsCount} אתרים
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls Row (אזור, שמורה, רמת קושי, תאריך ואיפוס) ── */}
      <div className="flex items-center gap-2.5 w-full flex-wrap">

        {/* Region Filter */}
        <div className="flex items-center gap-1.5 h-10 bg-brand-surface px-3 rounded-xl border border-white/[0.14] hover:border-white/[0.25] transition flex-shrink-0">
          <MapPin size={16} className="text-accent flex-shrink-0" />
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer font-sans border-0 p-0"
          >
            <option value="all" className="bg-[#0f1218]">כל האזורים</option>
            <option value="north" className="bg-[#0f1218]">🌲 צפון וגליל</option>
            <option value="center" className="bg-[#0f1218]">🌾 מרכז ושרון</option>
            <option value="jerusalem" className="bg-[#0f1218]">🕍 ירושלים והשפלה</option>
            <option value="south" className="bg-[#0f1218]">☀️ דרום ונגב</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 h-10 bg-brand-surface px-3 rounded-xl border border-white/[0.14] hover:border-white/[0.25] transition flex-shrink-0">
          <Tag size={16} className="text-accent flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer font-sans border-0 p-0"
          >
            <option value="all" className="bg-[#0f1218]">כל השמורות</option>
            <option value="spni" className="bg-[#0f1218]">🌿 החברה להגנת הטבע</option>
            <option value="water" className="bg-[#0f1218]">💧 שמורות מים ונחלים</option>
            <option value="desert" className="bg-[#0f1218]">🏜️ מדבר</option>
            <option value="coast" className="bg-[#0f1218]">🏖️ חופים</option>
            <option value="safe_haven" className="bg-[#0f1218]">🛡️ מקלטים בטוחים</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1.5 h-10 bg-brand-surface px-3 rounded-xl border border-white/[0.14] hover:border-white/[0.25] transition flex-shrink-0">
          <Footprints size={16} className="text-accent flex-shrink-0" />
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer font-sans border-0 p-0"
          >
            <option value="all" className="bg-[#0f1218]">כל הרמות</option>
            <option value="0" className="bg-[#0f1218]">🟢 קל — עגלות (0+)</option>
            <option value="4" className="bg-[#0f1218]">🟡 קל — ילדים (4+)</option>
            <option value="7" className="bg-[#0f1218]">🟠 בינוני — לכת (7+)</option>
            <option value="10" className="bg-[#0f1218]">🔴 מאתגר — 10+</option>
          </select>
        </div>

        {/* Visit Date + Forecast badge */}
        <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border transition flex-shrink-0 ${
          isOutOfHorizon
            ? 'bg-amber-500/15 border-amber-500/50'
            : 'bg-brand-surface border-white/[0.14]'
        }`}>
          <Calendar size={16} className={isOutOfHorizon ? 'text-amber-400 flex-shrink-0' : 'text-accent flex-shrink-0'} />
          <input
            type="date"
            value={visitDate}
            onChange={(e) => onDateChange(e.target.value)}
            className={`bg-transparent border-0 text-sm font-bold outline-none cursor-pointer font-sans leading-none ${
              isOutOfHorizon ? 'text-amber-400' : 'text-white'
            }`}
          />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
            isOutOfHorizon
              ? 'bg-amber-400 text-black'
              : 'bg-emerald-600 text-white'
          }`}>
            {isOutOfHorizon
              ? '⚠️ מחוץ לתחזית'
              : `✓ ${daysAhead === 0 ? 'היום' : `+${daysAhead} ימים`}`}
          </span>
        </div>

        {/* Clear / Reset button */}
        <button
          onClick={onClear}
          disabled={isProcessing}
          title="איפוס פילטרים וחיפוש"
          className="flex items-center gap-1.5 h-10 px-3.5 bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.14] hover:border-white/[0.25] rounded-xl text-sm font-bold cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <RotateCcw size={15} />
          <span>איפוס</span>
        </button>
      </div>
    </header>
  );
}
