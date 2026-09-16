import React, { useState } from 'react';
import { 
  Search, 
  Info, 
  Flame, 
  Waves, 
  RotateCcw,
  Sparkles,
  Compass,
  MapPin,
  CheckCircle2,
  CalendarDays
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
}) {
  const isAlertState = agentStatus === 'ALERT_REROUTED';
  const fiveDays = getFiveDaysList();

  return (
    <aside className="w-full h-full flex flex-col bg-[#0c0d12] border-l border-white/[0.08] text-zinc-100 font-sans select-none overflow-hidden" dir="rtl">
      {/* 1. Header: Big Bold Title + Agent Brain Trigger */}
      <div className="px-5 pt-4 pb-2.5 flex items-center justify-between border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none font-['Heebo']">
              לאן נטייל?
            </h1>
            <span className="text-emerald-400 text-lg">🧭</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium mt-1">
            הסוכן המטייל • סיור ותכנון חכם מבוסס AI
          </p>
        </div>

        {/* Agent Brain Trigger Button (Opens Popup 1) */}
        <button
          onClick={onOpenAgentModal}
          title="לחץ לפתיחת מוח הסוכן וספי הבטיחות"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border shadow-sm ${
            isAlertState
              ? 'bg-amber-950/80 text-amber-300 border-amber-700/80 hover:bg-amber-900'
              : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/70 hover:bg-emerald-900/80 hover:border-emerald-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isProcessing
                ? 'bg-amber-400 animate-ping'
                : isAlertState
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          <span className="text-[11px]">
            {isProcessing ? 'סורק...' : isAlertState ? 'שינוי מסלול' : 'מוח הסוכן'}
          </span>
          <Info size={13} className="opacity-80" />
        </button>
      </div>

      {/* 1.5 Interactive AI Conversational Bot Launcher Banner */}
      <div className="px-4 pt-2.5 pb-1">
        <button
          onClick={onOpenChatBot}
          className="w-full bg-gradient-to-r from-emerald-950/90 via-teal-950/70 to-zinc-900/90 hover:from-emerald-900 hover:to-zinc-800 border border-emerald-500/40 hover:border-emerald-400/80 p-2.5 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-950/30 transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="text-right min-w-0">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>סוכן הטיולים האישי (AI)</span>
                <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.2 rounded-full font-mono font-bold">חדש</span>
              </div>
              <p className="text-[10px] text-zinc-300 truncate">
                תכנון מסלול לפי גיל, מים ומזג אוויר חי ב-Tomorrow.io
              </p>
            </div>
          </div>
          <span className="text-emerald-400 text-xs font-bold bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800/60 flex-shrink-0">
            דבר איתי 💬
          </span>
        </button>
      </div>

      {/* 2. 5-Day Horizontal Timeline Strip */}
      <div className="px-4 py-2 border-b border-white/[0.04]">
        <div className="flex items-center justify-between gap-1 bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-2xl shadow-inner">
          {fiveDays.map((day) => {
            const isSelected = selectedDayIndex === day.index;
            return (
              <button
                key={day.id}
                onClick={() => onSelectDayIndex?.(day.index)}
                className={`flex-1 py-1.5 px-1 rounded-xl text-center transition flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span className="text-[11px] font-bold leading-tight">{day.label}</span>
                <span className={`text-[9.5px] leading-tight font-mono ${isSelected ? 'text-zinc-900/80 font-bold' : 'text-zinc-500'}`}>
                  {day.dateStr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Age Filter Chips (Consistent Rounded Pills) */}
      <div className="px-4 pt-2 pb-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
          <span className="text-zinc-500 font-semibold text-[10px] ml-1 flex-shrink-0">גיל:</span>
          {AGE_TIERS_CONFIG.map((item) => {
            const isSelected = selectedAgeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onAgeFilterChange?.(item.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition flex-shrink-0 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 font-black border-white shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-zinc-800/90'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Category Filter Chips (Consistent Rounded Pills) */}
      <div className="px-4 pt-1 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
          <span className="text-zinc-500 font-semibold text-[10px] ml-1 flex-shrink-0">סוג:</span>
          {CATEGORIES_CONFIG.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange?.(cat.id)}
                className={`px-2.5 py-1 rounded-full font-medium transition flex-shrink-0 whitespace-nowrap flex items-center gap-1 border text-[10.5px] ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-zinc-800/90'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Clean Search Input */}
      <div className="px-4 py-1.5">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="חיפוש שמורה, שביל, שרון או מדבר..."
            className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-500/70 rounded-2xl py-2 pr-9 pl-4 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition font-sans"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={14} />
          </div>
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 6. Site Counter & Results Header */}
      <div className="px-5 pt-2 pb-1 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-semibold text-zinc-300">
          מסלולים מומלצים ({assets.length})
        </span>
        <span className="text-[10px] text-zinc-500">
          ממוין לפי בטיחות והתאמה
        </span>
      </div>

      {/* 7. Scrollable List of Monitored Assets */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-2 no-scrollbar">
        {assets.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-500">
            <MapPin size={28} className="mb-2 opacity-40 text-emerald-400" />
            <p className="text-xs font-bold text-zinc-400">לא נמצאו מסלולים בסינון הנוכחי</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">נסה להרחיב את פילטר הגילאים או החיפוש</p>
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
                className={`p-3 rounded-2xl cursor-pointer transition-all border relative flex items-start justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-emerald-500 shadow-lg translate-x-[-2px]'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Right Accent Bar for Selected Item */}
                {isSelected && (
                  <div className="absolute right-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-l-full" />
                )}

                <div className="flex items-start gap-2.5 min-w-0 pr-1">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sm shadow-inner flex-shrink-0 mt-0.5">
                    {categoryIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-white leading-tight truncate">
                        {asset.name}
                      </h4>
                      {isSafeHaven && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                          מקלט
                        </span>
                      )}
                      {isAlert && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-red-950 text-red-300 border border-red-800 animate-pulse">
                          שינוי נתיב
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-zinc-400">
                      <span>{asset.region}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {asset.authority_id || 'INPA'}
                      </span>
                    </div>

                    {/* Micro Weather & Age Badges */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${ageBadge.color}`}>
                        <span>{ageBadge.icon}</span>
                        <span>{ageBadge.label}</span>
                      </span>

                      {weather && (
                        <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                          {weather.temp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Left Safety Score Indicator */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                    isAlert
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : isSafeHaven
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
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
