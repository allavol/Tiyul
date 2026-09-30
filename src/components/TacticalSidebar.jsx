import React from 'react';
import { 
  Search, 
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { 
  getSiteWeather, 
  getAgeBadge, 
  getCategoryIconChar, 
  AGE_TIERS_CONFIG,
  getFiveDaysList 
} from '../utils/weatherUtils';

const CATEGORIES_CONFIG = [
  { id: 'all', label: 'כל המסלולים', icon: '📍' },
  { id: 'water', label: 'מים ונחלים', icon: '💧' },
  { id: 'nature', label: 'טבע ויער', icon: '🌲' },
  { id: 'safe_haven', label: 'מקלט בטוח', icon: '🛡️' },
  { id: 'spni', label: 'בתי ספר שדה', icon: '🦅' },
];

export default function TacticalSidebar({
  assets = [],
  selectedAssetId = null,
  searchQuery = '',
  onSearchChange,
  selectedCategory = 'all',
  onCategoryChange,
  selectedAgeFilter = 'all',
  onAgeFilterChange,
  onSelectAsset,
  isProcessing = false,
  agentStatus = 'ONLINE', // 'ONLINE' | 'PROCESSING' | 'ALERT_REROUTED'
  selectedDayIndex = 0,
  onSelectDayIndex,
  onOpenAgentModal,
  onOpenChatBot,
  onCloseSidebar,
  isLightMode = false,
}) {
  const isAlertState = agentStatus === 'ALERT_REROUTED';
  const fiveDays = getFiveDaysList();

  return (
    <aside 
      className={`w-full h-full flex flex-col font-body select-none overflow-hidden transition-colors ${
        isLightMode ? 'bg-[#fcfdfd] text-zinc-800' : 'bg-[#1c1c21] text-zinc-100'
      }`} 
      dir="rtl"
    >
      {/* ── 1. Editorial Header ─────────────────────────────────── */}
      <div className={`px-5 pt-5 pb-3 flex items-start justify-between border-b ${
        isLightMode ? 'border-zinc-200/80' : 'border-white/[0.04]'
      }`}>
        <div>
          <h1 className={`text-2xl font-black tracking-tight leading-none font-display ${
            isLightMode ? 'text-zinc-900' : 'text-white'
          }`}>
            לאן נטייל?
          </h1>
          <p className={`text-[11px] font-semibold uppercase tracking-wider mt-1.5 ${
            isLightMode ? 'text-teal-700' : 'text-accent'
          }`}>
            AI TRAIL GUIDE • סוכן הטיולים
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Agent Brain Trigger */}
          <button
            onClick={onOpenAgentModal}
            title="מוח"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition border ${
              isAlertState
                ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                : isLightMode
                ? 'border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 shadow-sm'
                : 'border-accent/30 text-accent bg-accent/[0.08] hover:bg-accent/15'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isProcessing
                  ? 'bg-amber-400 animate-ping'
                  : isAlertState
                  ? 'bg-amber-400'
                  : isLightMode
                  ? 'bg-teal-600'
                  : 'bg-accent'
              }`}
            />
            <span>{isProcessing ? 'סורק...' : isAlertState ? 'שינוי מסלול' : 'מוח'}</span>
          </button>

          {/* Close Sidebar */}
          <button
            onClick={onCloseSidebar}
            title="סגור קטלוג"
            aria-label="סגור קטלוג"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              isLightMode
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* ── 1.5 AI Bot Launcher ─────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={onOpenChatBot}
          className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-all group active:scale-[0.99] border ${
            isLightMode
              ? 'bg-teal-50/80 hover:bg-teal-100/70 border-teal-200 text-teal-950 shadow-sm'
              : 'bg-accent/[0.06] hover:bg-accent/[0.12] border-accent/20 hover:border-accent/40 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isLightMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-accent/20 text-accent'
            }`}>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="text-right min-w-0">
              <div className={`text-[11px] font-bold flex items-center gap-1.5 ${
                isLightMode ? 'text-zinc-900' : 'text-white'
              }`}>
                <span>סוכן הטיולים האישי</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                  isLightMode ? 'bg-teal-600 text-white' : 'bg-accent text-brand-deep'
                }`}>AI</span>
              </div>
              <p className={`text-[10px] truncate ${
                isLightMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                תכנון מסלול לפי גיל, מים ומזג אוויר
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${
            isLightMode
              ? 'bg-white text-teal-700 border-teal-200 shadow-sm'
              : 'text-accent bg-accent/10 border-accent/20'
          }`}>
            💬 שאל
          </span>
        </button>
      </div>

      {/* ── 2. 5-Day Timeline Strip ─────────────────────────────── */}
      <div className={`px-4 py-2 border-b ${
        isLightMode ? 'border-zinc-200/80' : 'border-white/[0.04]'
      }`}>
        <div className={`flex items-center justify-between gap-1 p-1 rounded-2xl border ${
          isLightMode ? 'bg-zinc-100/80 border-zinc-200' : 'bg-brand-card border-white/[0.06]'
        }`}>
          {fiveDays.map((day) => {
            const isSelected = selectedDayIndex === day.index;
            return (
              <button
                key={day.id}
                onClick={() => onSelectDayIndex?.(day.index)}
                className={`flex-1 py-1.5 px-1 rounded-xl text-center transition flex flex-col items-center justify-center ${
                  isSelected
                    ? isLightMode
                      ? 'bg-teal-600 text-white shadow-sm font-black'
                      : 'bg-accent text-brand-deep shadow-md font-black'
                    : isLightMode
                    ? 'text-zinc-600 hover:text-zinc-900 hover:bg-white'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-[11px] font-bold leading-tight">{day.label}</span>
                <span className={`text-[9.5px] leading-tight font-mono ${
                  isSelected 
                    ? (isLightMode ? 'text-white/80 font-bold' : 'text-brand-deep/70 font-bold') 
                    : (isLightMode ? 'text-zinc-400' : 'text-zinc-600')
                }`}>
                  {day.dateStr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Filter Chips Row ──────────────────────────────────── */}
      <div className="px-4 pt-2.5 pb-1">
        {/* Age Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[10px] mb-2">
          <span className={`font-semibold text-[9px] ml-1 flex-shrink-0 uppercase tracking-wider ${
            isLightMode ? 'text-zinc-500' : 'text-zinc-500'
          }`}>גיל:</span>
          {AGE_TIERS_CONFIG.map((item) => {
            const isSelected = selectedAgeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onAgeFilterChange?.(item.id)}
                className={`teal-chip ${isSelected ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '3px 10px' }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[10px]">
          <span className={`font-semibold text-[9px] ml-1 flex-shrink-0 uppercase tracking-wider ${
            isLightMode ? 'text-zinc-500' : 'text-zinc-500'
          }`}>סוג:</span>
          {CATEGORIES_CONFIG.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange?.(cat.id)}
                className={`teal-chip ${isSelected ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '3px 10px' }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Search Input ──────────────────────────────────────── */}
      <div className="px-4 py-2">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="חיפוש שמורה, שביל, שרון או מדבר..."
            className={`w-full rounded-xl py-2 pr-9 pl-4 text-xs outline-none transition font-body border ${
              isLightMode
                ? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-teal-500 shadow-sm'
                : 'bg-brand-card border-white/[0.06] text-zinc-100 placeholder-zinc-500 focus:border-accent/50'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
            <Search size={14} />
          </div>
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 hover:text-accent text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 5. Results Counter ────────────────────────────────────── */}
      <div className="px-5 pt-1 pb-1.5 flex items-center justify-between text-[10px]">
        <span className={`font-bold uppercase tracking-wider ${
          isLightMode ? 'text-zinc-700' : 'text-zinc-300'
        }`}>
          {assets.length} מסלולים
        </span>
        <span className={`font-mono ${
          isLightMode ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          ממוין לפי בטיחות
        </span>
      </div>

      {/* ── 6. Editorial Site Cards ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-2 no-scrollbar">
        {assets.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-500">
            <Search size={28} className="mb-2 opacity-30 text-accent" />
            <p className={`text-xs font-bold ${isLightMode ? 'text-zinc-600' : 'text-zinc-400'}`}>לא נמצאו מסלולים</p>
            <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-zinc-400' : 'text-zinc-600'}`}>נסה להרחיב את הסינון</p>
          </div>
        ) : (
          assets.map((asset) => {
            const isSelected = selectedAssetId === asset.id;
            const isAlert = asset.status === 'CRITICAL' || asset.status === 'REROUTED';
            const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
            const weather = getSiteWeather(asset, 'NORMAL', selectedDayIndex);
            const ageBadge = getAgeBadge(asset.min_age);
            const categoryIcon = getCategoryIconChar(asset);

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset?.(asset.id)}
                className={`editorial-card ${isSelected ? 'selected' : ''} p-3 cursor-pointer flex items-start justify-between gap-2.5 ${
                  isLightMode && !isSelected ? 'bg-white border-zinc-200 shadow-sm hover:border-teal-300 hover:bg-teal-50/20' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 pr-0.5">
                  {/* Category Circle */}
                  <div className={`data-badge flex-shrink-0 mt-0.5 ${
                    isAlert ? 'alert' : isSafeHaven ? 'dark' : 'teal'
                  }`}>
                    <span className="text-sm">{categoryIcon}</span>
                  </div>

                  <div className="min-w-0">
                    {/* Name + Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`text-[13px] font-black leading-tight truncate font-display ${
                        isLightMode ? 'text-zinc-900' : 'text-white'
                      }`}>
                        {asset.name}
                      </h4>
                      {isSafeHaven && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
                          מקלט
                        </span>
                      )}
                      {isAlert && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse">
                          שינוי נתיב
                        </span>
                      )}
                    </div>

                    {/* Region + Authority */}
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                      <span className={`font-semibold uppercase tracking-wider ${
                        isLightMode ? 'text-teal-700' : 'text-accent/70'
                      }`}>{asset.region}</span>
                      <span className={isLightMode ? 'text-zinc-300' : 'text-zinc-600'}>•</span>
                      <span className={`font-mono text-[9px] ${
                        isLightMode ? 'text-zinc-400' : 'text-zinc-600'
                      }`}>
                        {asset.authority_id || 'INPA'}
                      </span>
                    </div>

                    {/* Data Badges Row */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Temp Badge */}
                      {weather && (
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border ${
                          isLightMode 
                            ? 'bg-zinc-100 text-zinc-700 border-zinc-200' 
                            : 'bg-brand-surface text-zinc-300 border-white/[0.06]'
                        }`}>
                          {weather.temp}
                        </span>
                      )}

                      {/* Age Badge */}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${ageBadge.color}`}>
                        <span>{ageBadge.icon}</span>
                        <span>{ageBadge.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Safety Score */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                    isAlert
                      ? 'bg-red-500/15 text-red-500 border-red-500/30'
                      : isSafeHaven
                      ? 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                      : isLightMode
                      ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold'
                      : 'bg-accent/10 text-accent border-accent/30'
                  }`}>
                    {isAlert ? '⚠️ התרעה' : isSafeHaven ? '🛡️ מקלט' : '✓ 100'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
