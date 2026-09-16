import React, { useEffect, useRef } from 'react';

export default function AgentLogView({ rawLogs = '', onClear }) {
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [rawLogs]);

  return (
    <div className="flex flex-col h-56 bg-slate-950 border border-slate-700 rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Agent Log View</span>
        </div>
        {rawLogs && (
          <button
            onClick={onClear}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition font-sans"
          >
            Clear Log
          </button>
        )}
      </div>

      {/* Log Output Body */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text"
      >
        {rawLogs || (
          <span className="text-slate-500 italic">
            Waiting for trigger... Raw JSON and agent output will stream here.
          </span>
        )}
      </div>
    </div>
  );
}
