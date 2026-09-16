import React from 'react';

export default function NexusFooter({
  systemStatus = 'ACTIVE',
  dataHarvestStatus = 'OK',
  agentStatusText = 'GRID NORMAL — Monitoring 19 assets across national coverage',
}) {
  const isSystemActive = systemStatus === 'ACTIVE';
  const isDataOk = dataHarvestStatus === 'OK';

  return (
    <footer className="w-full h-9 bg-slate-950 border-t border-slate-700 px-4 flex items-center justify-between text-xs text-slate-400 z-10 flex-shrink-0 select-none">
      {/* 1. Left: Hazard Legend */}
      <div className="flex items-center gap-3 text-[11px] font-medium">
        <span className="text-slate-500 uppercase text-[10px] font-bold">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300">Safe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span className="text-slate-300">Safe Haven</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-slate-300">Alert</span>
        </div>
      </div>

      {/* 2. Center: The Decision Stream (Single-line Telemetry Ticker) */}
      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded max-w-2xl truncate">
        {/* Block 1: SYSTEM */}
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className="text-slate-500">[SYSTEM:</span>
          <span className={isSystemActive ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {systemStatus}
          </span>
          <span className="text-slate-500">]</span>
        </span>

        <span className="text-slate-600">|</span>

        {/* Block 2: DATA HARVEST */}
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className="text-slate-500">[DATA HARVEST:</span>
          <span className={isDataOk ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {dataHarvestStatus}
          </span>
          <span className="text-slate-500">]</span>
        </span>

        <span className="text-slate-600">|</span>

        {/* Block 3: AGENT */}
        <span className="flex items-center gap-1 truncate">
          <span className="text-slate-500 flex-shrink-0">[AGENT:</span>
          <span className="text-sky-300 truncate font-sans text-xs">
            {agentStatusText}
          </span>
          <span className="text-slate-500 flex-shrink-0">]</span>
        </span>
      </div>

      {/* 3. Right: Legal Disclaimer */}
      <div className="text-[10px] text-slate-400 text-left max-w-xs truncate hidden md:block">
        System provides AI-assisted estimations. Verify field conditions. No liability assumed.
      </div>
    </footer>
  );
}
