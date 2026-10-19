import React from 'react';
import { MapPin, Tag, Calendar, RotateCcw, Compass, Info, Footprints } from 'lucide-react';

export default function LuxeTopBar({
  searchQuery,
  onSearchChange,
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
    <header className="flex items-center gap-3 flex-wrap px-4 py-2.5 bg-brand-rail border-b border-white/[0.08] z-[1000] shadow-[0_2px_12px_rgba(0,0,0,0.35)]">

      {/* Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-[32px] h-[32px] rounded-[9px] bg-accent flex items-center justify-center text-white shadow-[0_2px_10px_var(--accent-glow)]">
          <Compass size={18} />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="m-0 text-sm font-black text-[var(--text-primary)] tracking-tight leading-none whitespace-nowrap">
            לאן נטייל?
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded-xl bg-accent/15 text-accent font-bold border border-accent/30 whitespace-nowrap">
            {visibleAssetsCount} / {totalAssetsCount}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/[0.10] flex-shrink-0" />

      {/* Region Filter */}
      <div className="flex items-center gap-1.5">
        <MapPin size={14} className="text-accent flex-shrink-0" />
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="bg-brand-surface text-[var(--text-primary)] border border-white/[0.10] rounded-lg px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer font-body"
        >
          <option value="all">📍 כל האזורים</option>
          <option value="north">🌲 צפון וגליל</option>
          <option value="center">🌾 מרכז והשרון</option>
          <option value="jerusalem">🕍 ירושלים והשפלה</option>
          <option value="south">☀️ דרום, נגב ואילת</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5">
        <Tag size={14} className="text-accent flex-shrink-0" />
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-brand-surface text-[var(--text-primary)] border border-white/[0.10] rounded-lg px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer font-body"
        >
          <option value="all">🏷️ כל השמורות</option>
          <option value="spni">🌿 החברה להגנת הטבע</option>
          <option value="water">💧 מים ונחלים</option>
          <option value="desert">🏜️ מדבר</option>
          <option value="coast">🏖️ חופים</option>
          <option value="safe_haven">🛡️ מקלטים בטוחים</option>
        </select>
      </div>

      {/* Difficulty Filter */}
      <div className="flex items-center gap-1.5">
        <Footprints size={14} className="text-accent flex-shrink-0" />
        <select
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="bg-brand-surface text-[var(--text-primary)] border border-white/[0.10] rounded-lg px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer font-body"
        >
          <option value="all">🥾 כל רמות הקושי</option>
          <option value="0">🟢 קל מאוד — עגלות ונגיש</option>
          <option value="4">🟡 קל — גיל 4+</option>
          <option value="7">🟠 בינוני — גיל 7+</option>
          <option value="10">🔴 מאתגר — גיל 10+</option>
        </select>
      </div>

      {/* Visit Date + Forecast badge */}
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition ${
        isOutOfHorizon
          ? 'bg-amber-500/15 border-amber-500/50'
          : 'bg-brand-surface border-white/[0.10]'
      }`}>
        <Calendar size={14} className={isOutOfHorizon ? 'text-amber-400 flex-shrink-0' : 'text-accent flex-shrink-0'} />
        <input
          type="date"
          value={visitDate}
          onChange={(e) => onDateChange(e.target.value)}
          className={`bg-transparent border-0 text-[12px] font-bold outline-none cursor-pointer font-body leading-none ${
            isOutOfHorizon ? 'text-amber-400' : 'text-[var(--text-primary)]'
          }`}
        />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
          isOutOfHorizon
            ? 'bg-amber-400 text-black'
            : 'bg-emerald-600 text-white'
        }`}>
          {isOutOfHorizon
            ? '⚠️ מחוץ לתחזית'
            : `✓ ${daysAhead === 0 ? 'היום' : `+${daysAhead} ימים`}`}
        </span>
      </div>

      {/* Forecast range hint */}
      <div className="hidden lg:flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
        <Info size={11} />
        <span>תחזית עד 5 ימים קדימה</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear button */}
      <button
        onClick={onClear}
        disabled={isProcessing}
        title="איפוס פילטרים"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] text-[var(--text-muted)] border border-white/[0.10] rounded-lg text-xs font-semibold cursor-pointer transition hover:bg-white/[0.10] hover:text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      >
        <RotateCcw size={13} />
        איפוס
      </button>
    </header>
  );
}
