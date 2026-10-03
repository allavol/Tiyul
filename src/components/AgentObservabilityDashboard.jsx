import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Layers, 
  Terminal, 
  Download, 
  Trash2, 
  X, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Coins, 
  Compass, 
  Filter, 
  Search, 
  ChevronRight,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';
import { AgentTelemetryService } from '../services/agent/AgentTelemetryService';

export default function AgentObservabilityDashboard({ isOpen, onClose, initialTraceId = null }) {
  const [telemetryData, setTelemetryData] = useState(() => ({
    traces: AgentTelemetryService.traces,
    metrics: AgentTelemetryService.getMetrics(),
    logs: AgentTelemetryService.logs
  }));

  const [activeTab, setActiveTab] = useState('waterfall'); // 'waterfall' | 'logs' | 'otlp'
  const [selectedTraceId, setSelectedTraceId] = useState(initialTraceId || AgentTelemetryService.traces[0]?.traceId || null);
  const [selectedSpanId, setSelectedSpanId] = useState(null);
  const [logFilterLevel, setLogFilterLevel] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Subscribe to live telemetry events
  useEffect(() => {
    const unsubscribe = AgentTelemetryService.subscribe((data) => {
      setTelemetryData({
        traces: [...data.traces],
        metrics: { ...data.metrics },
        logs: [...data.logs]
      });
    });

    return () => unsubscribe();
  }, []);

  // Update selectedTraceId when initialTraceId changes or first trace loads
  useEffect(() => {
    if (initialTraceId) {
      setSelectedTraceId(initialTraceId);
    } else if (!selectedTraceId && telemetryData.traces.length > 0) {
      setSelectedTraceId(telemetryData.traces[0].traceId);
    }
  }, [initialTraceId, telemetryData.traces]);

  // Active selected trace
  const activeTrace = useMemo(() => {
    return telemetryData.traces.find(t => t.traceId === selectedTraceId) || telemetryData.traces[0] || null;
  }, [telemetryData.traces, selectedTraceId]);

  // Selected span inside the active trace
  const activeSpan = useMemo(() => {
    if (!activeTrace || !selectedSpanId) return null;
    return activeTrace.spans.find(s => s.spanId === selectedSpanId) || null;
  }, [activeTrace, selectedSpanId]);

  // Auto-select root span when trace changes
  useEffect(() => {
    if (activeTrace) {
      setSelectedSpanId(activeTrace.rootSpanId);
    } else {
      setSelectedSpanId(null);
    }
  }, [activeTrace?.traceId]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Download OTLP JSON file
  const handleDownloadOtlp = () => {
    const jsonStr = AgentTelemetryService.exportOtlpJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_baal_traces_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return telemetryData.logs.filter(log => {
      if (logFilterLevel !== 'ALL' && log.level !== logFilterLevel) return false;
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchesMsg = log.message.toLowerCase().includes(q);
        const matchesTrace = log.traceId?.toLowerCase().includes(q);
        const matchesComp = log.component?.toLowerCase().includes(q);
        if (!matchesMsg && !matchesTrace && !matchesComp) return false;
      }
      return true;
    });
  }, [telemetryData.logs, logFilterLevel, logSearchQuery]);

  if (!isOpen) return null;

  const { metrics } = telemetryData;

  return (
    <div 
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md font-sans text-zinc-100 p-2 sm:p-4 select-text"
      role="dialog"
      aria-modal="true"
      aria-label="Agent BAAL Observability Dashboard"
    >
      <div className="w-full max-w-7xl h-[94vh] bg-[#0e1117] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* ── Top Header & KPI Status Bar ─────────────────── */}
        <div className="px-5 py-3.5 bg-[#151922] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">חמ"ל טלמטריה וצפיות סוכן BAAL</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                  OpenTelemetry GenAI v1.39
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">מעקב עקבות (Tracing), שרשראות קריאה (Waterfall), מדידת זמנים ואימות עלות 0$</p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-400">ממוצע שיהוי:</span>
              <span className="font-mono font-bold text-white">{metrics.avgLatencyMs}ms</span>
              <span className="text-[10px] text-zinc-500">(P95: {metrics.p95LatencyMs}ms)</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400">עלות ענן:</span>
              <span className="font-mono font-bold text-emerald-400">$0.0000</span>
              <span className="text-[10px] text-zinc-400">({metrics.totalTokens} Tokens)</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-400">הצלחה:</span>
              <span className="font-mono font-bold text-emerald-400">{metrics.successRatePercent}%</span>
            </div>

            {metrics.redundantCallsDetected > 0 ? (
              <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600/50 text-xs flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{metrics.redundantCallsDetected} כפילויות זוהו</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center gap-1 text-zinc-400">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>0 כפילויות</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadOtlp}
              title="ייצוא קובץ JSON בפורמט OpenTelemetry OTLP"
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-zinc-700"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">OTLP JSON</span>
            </button>
            <button
              onClick={() => AgentTelemetryService.clear()}
              title="נקה את היסטוריית הטלמטריה"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-300 transition active:scale-95 border border-zinc-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="סגור חלון טלמטריה (Escape)"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition active:scale-95 border border-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────── */}
        <div className="px-5 bg-[#12161f] border-b border-white/5 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('waterfall')}
            className={`py-2.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'waterfall'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>עקבות ושרשרת ביצוע (Waterfall)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
              {telemetryData.traces.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'logs'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>יומן אירועים מובנה (Structured Logs)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
              {telemetryData.logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('otlp')}
            className={`py-2.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'otlp'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>סכמת OpenTelemetry OTLP Raw</span>
          </button>
        </div>

        {/* ── Tab Content: Traces & Waterfall Visualizer ───── */}
        {activeTab === 'waterfall' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            
            {/* Left Trace Selector Sidebar */}
            <div className="w-full md:w-80 md:min-w-[280px] bg-[#11141c] border-b md:border-b-0 md:border-r border-white/5 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-white/5 text-xs text-zinc-400 font-semibold flex items-center justify-between">
                <span>שיחות אחרונות (Traces)</span>
                <span className="font-mono text-[10px] text-zinc-500">{telemetryData.traces.length} עקבות שמורות</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {telemetryData.traces.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    עדיין אין שיחות מוקלטות. פתחו את הצ'אט ושאלו שאלה כדי לראות את שרשרת הפירוק בזמן אמת!
                  </div>
                ) : (
                  telemetryData.traces.map((trace) => {
                    const isSelected = trace.traceId === activeTrace?.traceId;
                    return (
                      <button
                        key={trace.traceId}
                        onClick={() => setSelectedTraceId(trace.traceId)}
                        className={`w-full text-right p-3 transition flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-950/40 border-r-2 border-cyan-400'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-zinc-200 truncate max-w-[170px]">
                            {trace.query || trace.name || 'שאילתה ללא כותרת'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            trace.status === 'OK' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' 
                              : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          }`}>
                            {trace.durationMs !== null ? `${trace.durationMs}ms` : 'RUNNING'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{new Date(trace.startTime).toLocaleTimeString()}</span>
                          <span>{trace.spans?.length || 1} spans</span>
                        </div>
                        {trace.redundantCalls && trace.redundantCalls.length > 0 && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 font-sans">
                            <AlertTriangle className="w-3 h-3" />
                            <span>זוהתה קריאה כפולה</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Trace Details & Waterfall Visualizer */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0c0f14] overflow-hidden">
              {activeTrace ? (
                <>
                  {/* Trace Metadata Banner */}
                  <div className="p-4 bg-[#141822] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base truncate">
                          "{activeTrace.query}"
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          activeTrace.status === 'OK' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                        }`}>
                          {activeTrace.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          Trace ID: 
                          <span className="text-cyan-400">{activeTrace.traceId.slice(0, 12)}...</span>
                          <button
                            onClick={() => handleCopy(activeTrace.traceId, 'traceId')}
                            className="p-0.5 hover:text-white"
                            title="העתק Trace ID מלא"
                          >
                            {copiedKey === 'traceId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </span>
                        <span>משך כולל: <strong className="text-white">{activeTrace.durationMs}ms</strong></span>
                        <span>Tokens: <strong className="text-white">{activeTrace.tokenUsage?.totalTokens || 0}</strong></span>
                        <span>עלות: <strong className="text-emerald-400">$0.00</strong></span>
                      </div>
                    </div>

                    {/* Redundant calls warning if any */}
                    {activeTrace.redundantCalls && activeTrace.redundantCalls.length > 0 && (
                      <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <div>
                          <strong>אזהרת ביצועים (Redundant Call):</strong>
                          <span className="mr-1">הכלי {activeTrace.redundantCalls[0].toolName} הופעל פעמיים עם פרמטרים זהים.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Waterfall Bars Container */}
                  <div className="flex-1 p-4 overflow-y-auto min-h-0 flex flex-col gap-6">
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5 text-[11px] font-mono text-zinc-500">
                        <span>שלב / Span Name</span>
                        <div className="flex items-center gap-8">
                          <span>0ms</span>
                          <span>{Math.round((activeTrace.durationMs || 100) / 2)}ms</span>
                          <span>{activeTrace.durationMs || 100}ms</span>
                        </div>
                      </div>

                      {/* Span Rows */}
                      <div className="flex flex-col gap-2">
                        {activeTrace.spans.map((span) => {
                          const totalDuration = activeTrace.durationMs || 1;
                          const offsetMs = Math.max(0, span.startTime - activeTrace.startTime);
                          const spanDuration = span.durationMs || 1;
                          const offsetPercent = Math.min(95, Math.max(0, (offsetMs / totalDuration) * 100));
                          const widthPercent = Math.min(100 - offsetPercent, Math.max(3, (spanDuration / totalDuration) * 100));
                          const isSelected = span.spanId === activeSpan?.spanId;

                          // Color by type
                          let barColor = 'bg-cyan-500';
                          let tagColor = 'text-cyan-400 border-cyan-800/40 bg-cyan-950/50';
                          if (span.type === 'invoke_agent') {
                            barColor = 'bg-indigo-500';
                            tagColor = 'text-indigo-300 border-indigo-800/40 bg-indigo-950/50';
                          } else if (span.type === 'execute_tool') {
                            barColor = 'bg-emerald-500';
                            tagColor = 'text-emerald-300 border-emerald-800/40 bg-emerald-950/50';
                          } else if (span.type === 'parse_nlu') {
                            barColor = 'bg-sky-400';
                            tagColor = 'text-sky-300 border-sky-800/40 bg-sky-950/50';
                          } else if (span.name.includes('rank')) {
                            barColor = 'bg-amber-500';
                            tagColor = 'text-amber-300 border-amber-800/40 bg-amber-950/50';
                          }

                          return (
                            <div
                              key={span.spanId}
                              onClick={() => setSelectedSpanId(span.spanId)}
                              className={`p-2 rounded-lg cursor-pointer transition border flex flex-col gap-1.5 ${
                                isSelected
                                  ? 'bg-[#181d28] border-cyan-500/60 shadow-lg'
                                  : 'bg-[#10141d] border-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${tagColor}`}>
                                    {span.type}
                                  </span>
                                  <span className="font-bold text-zinc-200">
                                    {span.name}
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] text-zinc-400">
                                  {span.durationMs !== null ? `${span.durationMs}ms` : 'running...'}
                                </span>
                              </div>

                              {/* Progress bar line */}
                              <div className="w-full h-3 bg-zinc-900 rounded-full relative overflow-hidden">
                                <div
                                  className={`absolute top-0 bottom-0 rounded-full transition-all duration-300 ${barColor}`}
                                  style={{
                                    left: `${offsetPercent}%`,
                                    width: `${widthPercent}%`
                                  }}
                                  title={`${span.name}: ${spanDuration}ms (התחלה: +${offsetMs}ms)`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Span Detail Inspector Side/Bottom Drawer */}
                    {activeSpan && (
                      <div className="mt-4 p-4 rounded-xl bg-[#141824] border border-cyan-500/30 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono text-[10px] border border-cyan-800">
                              {activeSpan.type}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {activeSpan.name}
                            </span>
                            <span className="text-zinc-500 text-[11px] font-mono">
                              ({activeSpan.durationMs}ms)
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            activeSpan.status === 'OK' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {activeSpan.status}
                          </span>
                        </div>

                        {/* OpenTelemetry Semantic Attributes Table */}
                        <div>
                          <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">OpenTelemetry Attributes</div>
                          <div className="rounded-lg bg-black/40 border border-white/5 p-2 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                            {Object.entries(activeSpan.attributes || {}).map(([k, v]) => (
                              <div key={k} className="flex items-start justify-between gap-4 text-zinc-300">
                                <span className="text-cyan-400">{k}</span>
                                <span className="text-zinc-400 text-left truncate max-w-[300px]">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Input & Output payloads */}
                        {(activeSpan.input || activeSpan.output) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                            {activeSpan.input && (
                              <div>
                                <div className="text-zinc-400 mb-1 font-sans font-semibold">Input Payload:</div>
                                <pre className="p-2 rounded bg-black/50 border border-white/5 text-zinc-300 overflow-x-auto max-h-32 text-[10px]">
                                  {typeof activeSpan.input === 'object' ? JSON.stringify(activeSpan.input, null, 2) : activeSpan.input}
                                </pre>
                              </div>
                            )}
                            {activeSpan.output && (
                              <div>
                                <div className="text-zinc-400 mb-1 font-sans font-semibold">Output Payload:</div>
                                <pre className="p-2 rounded bg-black/50 border border-white/5 text-emerald-300 overflow-x-auto max-h-32 text-[10px]">
                                  {typeof activeSpan.output === 'object' ? JSON.stringify(activeSpan.output, null, 2) : activeSpan.output}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                  בחר שיחה מהרשימה כדי לצפות בעקבות ובפירוט השלבים
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Content: Structured Logs Explorer ───────── */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0c0f14] overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3 bg-[#131720] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400">רמת תיעוד:</span>
                {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilterLevel(lvl)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                      logFilterLevel === lvl
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="חיפוש ביומן אירועים..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Logs Table */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  לא נמצאו רשומות יומן התואמות את הסינון.
                </div>
              ) : (
                filteredLogs.map(log => {
                  let levelBadge = 'bg-zinc-800 text-zinc-300';
                  if (log.level === 'INFO') levelBadge = 'bg-cyan-950 text-cyan-400 border border-cyan-800/40';
                  if (log.level === 'WARN') levelBadge = 'bg-amber-950 text-amber-400 border border-amber-800/40';
                  if (log.level === 'ERROR') levelBadge = 'bg-rose-950 text-rose-400 border border-rose-800/40';

                  return (
                    <div key={log.id} className="p-3 hover:bg-white/[0.02] flex items-start gap-3">
                      <span className="text-[10px] text-zinc-500 pt-0.5 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${levelBadge}`}>
                        {log.level}
                      </span>
                      <span className="text-zinc-400 text-[11px] whitespace-nowrap font-sans">
                        [{log.component}]
                      </span>
                      <span className="flex-1 text-zinc-200 break-words font-sans">
                        {log.message}
                      </span>
                      {log.traceId && (
                        <button
                          onClick={() => {
                            setSelectedTraceId(log.traceId);
                            setActiveTab('waterfall');
                          }}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                          title="עבור ל-Trace"
                        >
                          <span>{log.traceId.slice(0, 8)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Tab Content: OpenTelemetry OTLP Raw JSON ────── */}
        {activeTab === 'otlp' && (
          <div className="flex-1 p-4 bg-[#0c0f14] overflow-hidden flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                ייצוא תקני OTLP v1.39 (תואם Grafana Tempo, Jaeger, SigNoz ו-DataDog):
              </span>
              <button
                onClick={() => handleCopy(AgentTelemetryService.exportOtlpJson(), 'otlpJson')}
                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5"
              >
                {copiedKey === 'otlpJson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>העתק OTLP JSON</span>
              </button>
            </div>
            <pre className="flex-1 p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-cyan-300 overflow-auto select-all">
              {AgentTelemetryService.exportOtlpJson()}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
