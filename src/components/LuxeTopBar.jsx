import React from 'react';
import { MapPin, Tag, Calendar, RotateCcw, Compass, Footprints, Car } from 'lucide-react';
import { KNOWN_CITIES } from '../services/osrmService';

export default function LuxeTopBar({
  selectedRegion,
  onRegionChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  originCity = 'תל אביב',
  onOriginCityChange,
  visitDate,
  daysAhead,
  isOutOfHorizon,
  onDateChange,
  onClear,
  isProcessing,
  totalAssetsCount,
  visibleAssetsCount,
  isLightMode = false,
}) {
  const ctrl = isLightMode
    ? 'bg-zinc-100 border-zinc-300 hover:border-zinc-400'
    : 'bg-brand-surface border-white/[0.14] hover:border-white/[0.25]';
  const selectText = isLightMode ? 'text-zinc-900' : 'text-white';
  const optionClass = isLightMode ? 'bg-white text-zinc-900' : 'bg-[#18181c] text-white';
  const resetBtn = isLightMode
    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300 hover:border-zinc-400'
    : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/[0.14] hover:border-white/[0.25]';

  return (
    <header className={`flex flex-col gap-2 w-full px-5 py-2.5 border-b z-[1000] shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-colors ${
      isLightMode
        ? 'bg-white border-zinc-200'
        : 'bg-brand-rail border-white/[0.08]'
    }`}>

      {/* ── Top Row: Brand Header ── */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-[36px] h-[36px] rounded-xl bg-accent flex items-center justify-center text-white shadow-[0_2px_10px_var(--accent-glow)]">
            <Compass size={22} />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className={`m-0 text-xl font-bold tracking-tight leading-none whitespace-nowrap font-sans ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>
              לאן נטייל?
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 text-accent font-bold border border-accent/30 whitespace-nowrap">
              {totalAssetsCount} אתרים
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex items-center gap-2.5 w-full flex-wrap">

        {/* Origin / Departure City Filter */}
        {onOriginCityChange && (
          <div className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border transition flex-shrink-0 ${ctrl}`}>
            <Car size={16} className="text-accent flex-shrink-0" />
            <select
              value={originCity}
              onChange={(e) => onOriginCityChange(e.target.value)}
              className={`bg-transparent text-sm font-bold outline-none cursor-pointer font-sans border-0 p-0 ${selectText}`}
              title="נקודת מוצא לחישוב זמני נסיעה ועומסי פקקים"
            >
              {Object.keys(KNOWN_CITIES).map((city) => (
                <option key={city} value={city} className={optionClass}>
                  🚗 מ{city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Region Filter */}
        <div className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border transition flex-shrink-0 ${ctrl}`}>
          <MapPin size={16} className="text-accent flex-shrink-0" />
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className={`bg-transparent text-sm font-bold outline-none cursor-pointer font-sans border-0 p-0 ${selectText}`}
          >
            <option value="all" className={optionClass}>כל האזורים</option>
            <option value="north" className={optionClass}>🌲 צפון וגליל</option>
            <option value="center" className={optionClass}>🌾 מרכז ושרון</option>
            <option value="jerusalem" className={optionClass}>🕍 ירושלים והשפלה</option>
            <option value="south" className={optionClass}>☀️ דרום ונגב</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border transition flex-shrink-0 ${ctrl}`}>
          <Tag size={16} className="text-accent flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`bg-transparent text-sm font-bold outline-none cursor-pointer font-sans border-0 p-0 ${selectText}`}
          >
            <option value="all" className={optionClass}>כל סוגי הטיול</option>
            <option value="water" className={optionClass}>💧 מים ונחלים</option>
            <option value="spni" className={optionClass}>🌿 טבע וחי בר</option>
            <option value="desert" className={optionClass}>🏜️ מדבר ונגב</option>
            <option value="coast" className={optionClass}>🏖️ חוף וים</option>
            <option value="safe_haven" className={optionClass}>🛡️ מקלטים בטוחים</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border transition flex-shrink-0 ${ctrl}`}>
          <Footprints size={16} className="text-accent flex-shrink-0" />
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className={`bg-transparent text-sm font-bold outline-none cursor-pointer font-sans border-0 p-0 ${selectText}`}
          >
            <option value="all" className={optionClass}>כל הרמות</option>
            <option value="0" className={optionClass}>🟢 קל — עגלות (0+)</option>
            <option value="4" className={optionClass}>🟡 קל — ילדים (4+)</option>
            <option value="7" className={optionClass}>🟠 בינוני — לכת (7+)</option>
            <option value="10" className={optionClass}>🔴 מאתגר — 10+</option>
          </select>
        </div>

        {/* Visit Date + Forecast badge */}
        <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border transition flex-shrink-0 ${
          isOutOfHorizon
            ? 'bg-amber-500/15 border-amber-500/50'
            : ctrl
        }`}>
          <Calendar size={16} className={isOutOfHorizon ? 'text-amber-400 flex-shrink-0' : 'text-accent flex-shrink-0'} />
          <input
            type="date"
            value={visitDate}
            onChange={(e) => onDateChange(e.target.value)}
            className={`bg-transparent border-0 text-sm font-bold outline-none cursor-pointer font-sans leading-none ${
              isOutOfHorizon ? 'text-amber-400' : selectText
            }`}
          />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
            isOutOfHorizon ? 'bg-amber-400 text-black' : 'bg-emerald-600 text-white'
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
          className={`flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-sm font-bold cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 border ${resetBtn}`}
        >
          <RotateCcw size={15} />
          <span>איפוס</span>
        </button>
      </div>
    </header>
  );
}
