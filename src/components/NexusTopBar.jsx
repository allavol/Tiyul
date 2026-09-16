import React from 'react';
import { Search, Waves, Flame, RotateCcw, Shield } from 'lucide-react';

export default function NexusTopBar({
  searchQuery = '',
  onSearchChange,
  onSimulateFlood,
  onSimulateHeatwave,
  onClear,
  isProcessing = false,
  totalAssetsCount = 0,
  visibleAssetsCount = 0,
}) {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between gap-4 z-10 flex-shrink-0 shadow-sm">
      {/* 1. Left / Brand */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          <Shield size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-100 leading-none">לאן נטייל?</h1>
            <span className="text-[10px] bg-slate-800 text-sky-400 border border-slate-700 font-bold px-1.5 py-0.5 rounded">
              C4I
            </span>
          </div>
          <span className="text-[11px] text-slate-400">GeoGuard Tactical Control</span>
        </div>
      </div>

      {/* 2. Center: Chunky Prominent Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="חיפוש שמורת טבע, גן לאומי, בית ספר שדה, או אזור..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg py-2 pr-10 pl-4 text-xs text-slate-100 placeholder-slate-400 outline-none transition shadow-inner font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Right: Action Buttons */}
      <div className="flex items-center gap-2 min-w-[340px] justify-end">
        <button
          onClick={onSimulateFlood}
          disabled={isProcessing}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3 rounded-lg transition flex items-center gap-1.5 shadow-sm"
        >
          <Waves size={14} />
          <span>Simulate Flood</span>
        </button>

        <button
          onClick={onSimulateHeatwave}
          disabled={isProcessing}
          className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3 rounded-lg transition flex items-center gap-1.5 shadow-sm"
        >
          <Flame size={14} />
          <span>Simulate Heatwave</span>
        </button>

        <button
          onClick={onClear}
          disabled={isProcessing}
          className="bg-slate-800 hover:bg-slate-700 active:bg-slate-850 disabled:opacity-50 text-slate-300 border border-slate-700 font-semibold text-xs py-2 px-3 rounded-lg transition flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw size={14} />
          <span>Clear</span>
        </button>
      </div>
    </header>
  );
}
