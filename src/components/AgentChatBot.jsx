import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Send, 
  X, 
  Sparkles, 
  Bot, 
  User, 
  MapPin, 
  ShieldCheck, 
  Sun, 
  Droplets, 
  Baby, 
  Trees, 
  ExternalLink,
  RotateCcw,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Minimize2,
  Maximize2,
  Navigation,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  Download,
  Bug,
  Share2
} from 'lucide-react';
import { AgentBotService } from '../services/AgentBotService';
import { AgentAuditLogger } from '../services/AgentAuditLogger';
import { getCategoryIconChar, getAgeBadge } from '../utils/weatherUtils';

const ThinkingIndicator = () => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phases = [
    '📡 שואב נתוני מזג אוויר וחירום מקומיים...',
    '🗺️ מצליב נתוני שטח למסלולים מותאמים...',
    '🧠 מגבש המלצות בטיחות מותאמות אישית...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 items-start mt-2">
      <div className="bg-brand-card text-zinc-300 border border-white/[0.06] shadow-md max-w-[88%] rounded-2xl p-3.5 leading-relaxed text-sm flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-accent">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        <div className="text-xs text-zinc-400 animate-pulse transition-all duration-300">
          {phases[phaseIndex]}
        </div>
      </div>
    </div>
  );
};

// Renders clean formatted text, turning **bold** into stylish strong elements while preserving line breaks (Finding H7)
export function renderFormattedText(text) {
  if (!text || typeof text !== 'string') return '';
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white bg-white/10 px-1 py-0.5 rounded">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part.replace(/\*/g, '');
  });
}

// Clean any markdown asterisks formatting so raw stars are never shown in chat bubbles
export function stripAsterisks(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\*{1,2}/g, '');
}

export default function AgentChatBot({
  isOpen,
  onClose,
  onSelectSite,
  onProposalsUpdate,
  assets = [],
  queryTrigger = null,
  onClearQueryTrigger = null,
  onOpenObservability = null,
  isLightMode = true,
  isPanelMode = false,   // when true: always visible, fills parent container, no floating positioning
}) {
  const CHAT_STORAGE_KEY = 'tiyul_agent_chat_messages_v2';
  const SESSION_STORAGE_KEY = 'tiyul_agent_session_state_v2';
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour session expiration window

  const defaultWelcomeMessages = [
    {
      id: 'welcome',
      sender: 'bot',
      text: 'שלום וברוכים הבאים! 🧭 אני סוכן הטיולים החכם שלכם.\n\nספרו לי: לאן תרצו לטייל ומתי? (למשל: "רוצים לטייל מחר בצפון עם ילדים קטנים בני 3, מחפשים מים").',
      options: [
        { label: '🎲 הפתע אותי!', value: 'הפתע אותי עם מסלול טיול מומלץ ומותאם להיום' },
        { label: '🏞️ טיול מים בצפון למחר (גיל 4+)', value: 'אני רוצה לטייל מחר בצפון עם ילדים קטנים בני 4, מחפשים מסלול מים' },
        { label: '👶 טיול עגלות מוצל בשרון (0+)', value: 'מחפשים מסלול נגיש לעגלות מוצל בשרון לתינוק 0+' },
        { label: '🏰 טיול נוף ומבצרים בירושלים (6+)', value: 'מחפשים טיול נוף ועתיקות בירושלים לילד בן 6' },
      ],
      proposals: [],
      toolActivity: null,
    }
  ];

  const [messages, setMessages] = useState(() => {
    try {
      // Purge legacy untimed v1 sessions to ensure clean slate
      localStorage.removeItem('tiyul_agent_chat_messages_v1');
      localStorage.removeItem('tiyul_agent_session_state_v1');
      localStorage.removeItem('tiyul_chat_messages');
      localStorage.removeItem('tiyul_session_state');

      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isFresh = parsed?.timestamp && (Date.now() - parsed.timestamp < SESSION_TTL_MS);
        const msgs = parsed?.messages || (Array.isArray(parsed) && !parsed.timestamp ? parsed : null);
        if (isFresh && Array.isArray(msgs) && msgs.length > 0) {
          // Keep welcome options in sync with latest definitions
          if (msgs[0]?.id === 'welcome') {
            msgs[0].options = defaultWelcomeMessages[0].options;
          }
          return msgs;
        } else {
          // Stale / Expired (>24h) session -> Purge
          localStorage.removeItem(CHAT_STORAGE_KEY);
        }
      }
    } catch (e) {}
    return defaultWelcomeMessages;
  });

  const [sessionState, setSessionState] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isFresh = parsed?.timestamp && (Date.now() - parsed.timestamp < SESSION_TTL_MS);
        const state = parsed?.state || (parsed && typeof parsed === 'object' && !parsed.timestamp ? parsed : null);
        if (isFresh && state && typeof state === 'object') {
          return state;
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (e) {}
    return AgentBotService.getInitialState();
  });

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [exportedAudit, setExportedAudit] = useState(false);
  const [reportedIssue, setReportedIssue] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleCardExpansion = (cardId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Sync messages to localStorage with timestamp for 24h expiration
  useEffect(() => {
    try {
      const payload = {
        timestamp: Date.now(),
        messages,
      };
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }, [messages]);

  // Sync sessionState to localStorage with timestamp for 24h expiration
  useEffect(() => {
    try {
      const payload = {
        timestamp: Date.now(),
        state: sessionState,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }, [sessionState]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isProcessing]);

  // Handle external query trigger (e.g. from FloatingMapCard "שאל את הסוכן")
  useEffect(() => {
    if (queryTrigger && isOpen) {
      setIsMinimized(false);
      handleSendMessage(queryTrigger);
      onClearQueryTrigger?.();
    }
  }, [queryTrigger, isOpen]);

  // Copy recommendation to clipboard
  const handleCopyProposal = (prop) => {
    const text = `🧭 המלצת טיול: ${prop.name} (${prop.region})
🌡️ מזג אוויר: ${prop.weather?.temp || ''} (${prop.weather?.conditions || ''})
💡 נימוק: ${prop.matchRationale || ''}
🚗 Waze: https://waze.com/ul?ll=${prop.lat},${prop.lng}&navigate=yes`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(prop.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Send message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isProcessing) return;

    // 1. Append User Message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);

    // 2. Process with AgentBotService
    const startTime = performance.now();
    try {
      // Natural responsive micro-delay for smooth UI transition (<100ms, Finding H6)
      await new Promise((r) => setTimeout(r, 80));

      const response = await AgentBotService.processUserMessage(text, sessionState);
      const latencyMs = performance.now() - startTime;

      // Record to validation audit trail with immutable timestamp
      AgentAuditLogger.recordTurn({
        query: text,
        response: response.text,
        nluState: response.state,
        proposals: response.proposals,
        toolActivity: response.toolActivity,
        latencyMs
      });

      setSessionState(response.state);

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        options: response.options || [],
        proposals: response.proposals || [],
        toolActivity: response.toolActivity,
        traceId: response.traceId || null,
      };

      setMessages((prev) => [...prev, botMsg]);

      // If recommendations were generated, notify parent map to show ONLY them!
      if (response.proposals && response.proposals.length > 0 && onProposalsUpdate) {
        onProposalsUpdate(response.proposals);
      }

      // If a single site was directly requested/returned, automatically select and pop it up on the map!
      if (response.proposals && response.proposals.length === 1 && onSelectSite) {
        const singleSite = response.proposals[0];
        const fullAsset = assets.find((a) => a.id === singleSite.id) || singleSite;
        onSelectSite(fullAsset);
      }
    } catch (err) {
      console.error('Agent bot processing error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'סליחה, אירעה שגיאה בעיבוד הבקשה. אנא נסו שוב או בחרו באחת האפשרויות למטה.',
          options: [
            { label: '🏞️ מסלול מים בצפון למחר', value: 'אני רוצה לטייל מחר בצפון עם ילדים, מחפש מים' }
          ],
          proposals: [],
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset conversation
  const handleReset = () => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('tiyul_agent_chat_messages_v1');
      localStorage.removeItem('tiyul_agent_session_state_v1');
      localStorage.removeItem('tiyul_chat_messages');
      localStorage.removeItem('tiyul_session_state');
    } catch (e) {}
    setSessionState(AgentBotService.getInitialState());
    if (onProposalsUpdate) {
      onProposalsUpdate([]);
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'השיחה וההיסטוריה אופסו בהצלחה! 🌿 ספרו לי: לאיזה אזור בארץ תרצו לטייל ומתי?',
        options: [
          { label: '🏞️ צפון (גליל, גולן וכרמל)', value: 'באזור הצפון' },
          { label: '🌾 מרכז והשרון', value: 'באזור המרכז והשרון' },
          { label: '🏰 ירושלים והשפלה', value: 'באזור ירושלים והשפלה' },
          { label: '🏜️ דרום וים המלח', value: 'באזור הדרום וים המלח' },
        ],
        proposals: [],
        toolActivity: null,
      }
    ]);
  };

  if (!isOpen && !isPanelMode) return null;

  /* Minimized Docked Widget Pill */
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-[1200] pointer-events-auto animate-floating-card font-body select-none">
        <button
          onClick={() => setIsMinimized(false)}
          data-testid="docked-chatbot-pill"
          title="הרחב שיחת סוכן"
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl transition-all group ${
            isLightMode
              ? 'bg-white text-slate-800 border-slate-200 shadow-slate-900/10 hover:border-teal-300'
              : 'glass-panel border-accent/40 bg-brand-deep/95 text-zinc-100 hover:border-accent hover:bg-brand-card'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow ${
            isLightMode ? 'bg-teal-50 text-teal-700' : 'bg-accent/20 text-accent'
          }`}>
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="text-right">
            <div className={`text-xs font-black flex items-center gap-1.5 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              <span>סוכן הטיולים</span>
              {sessionState.lastProposals?.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${
                  isLightMode
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-accent/20 text-accent border-accent/30'
                }`}>
                  {sessionState.lastProposals.length} הצעות
                </span>
              )}
            </div>
            <div className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-zinc-400'}`}>לחץ להרחבת השיחה ↗</div>
          </div>
          <Maximize2 className={`w-4 h-4 transition ml-1 ${
            isLightMode ? 'text-slate-400 group-hover:text-teal-600' : 'text-zinc-400 group-hover:text-accent'
          }`} />
        </button>
      </div>
    );
  }

  return (
    /* Panel mode (desktop side panel) or floating drawer (mobile) */
    <div
      role={isPanelMode ? 'complementary' : 'dialog'}
      aria-modal={isPanelMode ? undefined : 'true'}
      aria-label="סוכן הטיולים החכם"
      className={
        isPanelMode
          ? `w-full h-full flex flex-col overflow-hidden font-body select-none pointer-events-auto ${
              isLightMode
                ? 'bg-white text-slate-800'
                : 'bg-brand-card text-zinc-100'
            }`
          : `fixed inset-3 bottom-16 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:h-[580px] sm:max-h-[85vh] z-[1200] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-floating-card font-body select-none pointer-events-auto border backdrop-blur-2xl ${
              isLightMode
                ? 'bg-white/95 text-slate-800 border-slate-200/90 shadow-slate-900/10'
                : 'glass-panel text-zinc-100 border-[var(--border-accent)]'
            }`
      }
    >
      {/* Top Header */}
      <div className={`p-4 border-b flex items-center justify-between gap-3 ${
        isLightMode ? 'bg-slate-50/90 border-slate-200' : 'bg-brand-card/60 border-white/[0.06]'
      }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-lg">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-base tracking-tight font-display ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  סוכן הטיולים
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-accent bg-accent/[0.08] px-1.5 py-0.5 rounded-full border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  AI GUIDE
                </span>
              </div>
              <p className={`text-xs font-light ${isLightMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                תכנון מסלולים מונחה בטיחות ונתוני שטח
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const ok = AgentAuditLogger.exportAsJsonFile();
                if (ok) {
                  setExportedAudit(true);
                  setTimeout(() => setExportedAudit(false), 2000);
                }
              }}
              title="הורד יומן ולידציה ובקרת איכות (JSON)"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-600'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-emerald-400'
              }`}
            >
              {exportedAudit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                try {
                  const fullReport = AgentAuditLogger.generateFullReportMarkdown();
                  if (navigator?.clipboard?.writeText) {
                    navigator.clipboard.writeText(fullReport).catch(() => {});
                  }
                } catch (e) {}
                setShowAuditModal(true);
              }}
              title="שליחת לוג ובקרת איכות (שיתוף בנייד / GitHub / הורדה)"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-600'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-amber-400'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              title="איפוס שיחה"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-teal-700'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-accent'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              title="מזער שיחה"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="סגור"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm no-scrollbar">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-2 ${isBot ? 'items-start' : 'items-end'}`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed ${
                    isBot
                      ? isLightMode
                        ? 'bg-slate-100 text-slate-800 border border-slate-200/90 shadow-sm'
                        : 'bg-brand-card text-zinc-200 border border-white/[0.06] shadow-md'
                      : isLightMode
                        ? 'bg-teal-600 text-white font-semibold shadow-sm'
                        : 'bg-accent text-brand-deep font-semibold shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Tool Execution Badge */}
                  {msg.toolActivity && (
                    <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-xs font-mono flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-accent flex items-center gap-1.5">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>{msg.toolActivity}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rich Graphical Proposals (Collapsible UN-COLLAPSE MODE) */}
                {msg.proposals && msg.proposals.length > 0 && (
                  <div className="w-full space-y-2 my-1.5">
                    {msg.proposals.map((prop) => {
                      const ageBadge = getAgeBadge(prop.min_age);
                      const fullAsset = assets.find((a) => a.id === prop.id) || prop;
                      const cardKey = `${msg.id || 'msg'}-${prop.id}`;
                      const isExpanded = !!expandedCards[cardKey];

                      // ── Build reason chips from available proposal data ──
                      const reasonChips = [];
                      if (prop.min_age === 0) reasonChips.push({ label: 'עגלה-ידידותי', color: 'chip-age' });
                      else reasonChips.push({ label: `גיל ${prop.min_age}+`, color: 'chip-age' });
                      const types = prop.type || [];
                      if (types.some((t) => t.includes('מים') || t.includes('נחל') || t.includes('מעיין') || t.includes('בריכה'))) {
                        reasonChips.push({ label: '💧 מים', color: 'chip-water' });
                      }
                      if (types.some((t) => t.includes('יער') || t.includes('חורש'))) {
                        reasonChips.push({ label: '🌲 צל', color: 'chip-shade' });
                      }
                      if (types.some((t) => t.includes('מדבר') || t.includes('נגב') || t.includes('מכתש'))) {
                        reasonChips.push({ label: '🏜️ מדבר', color: 'chip-desert' });
                      }
                      if (prop.weather?.temp) {
                        reasonChips.push({ label: prop.weather.temp, color: 'chip-weather' });
                      }
                      if (prop._distKm) {
                        reasonChips.push({ label: `📍 ${Math.round(prop._distKm)} ק"מ`, color: 'chip-dist' });
                      }

                      return (
                        <div
                          key={cardKey}
                          className={`w-full p-3 rounded-2xl border transition-all duration-200 group ${
                            isLightMode
                              ? 'bg-white/95 border-slate-200 shadow-sm hover:border-teal-500/50'
                              : 'editorial-card border-[var(--border-accent)]'
                          }`}
                          style={isLightMode ? undefined : { borderColor: 'var(--border-accent)' }}
                        >
                          {/* Card Header (Always visible - compact & clickable) */}
                          <div className="flex items-center justify-between gap-2">
                            <div 
                              onClick={() => toggleCardExpansion(cardKey)}
                              className="min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-base flex-shrink-0">{getCategoryIconChar(prop)}</span>
                                <h4 className={`text-sm font-bold transition-colors font-display truncate ${
                                  isLightMode ? 'text-slate-900 group-hover:text-teal-700' : 'text-white group-hover:text-accent'
                                }`}>
                                  {prop.name}
                                </h4>
                              </div>
                              <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                                <span className={isLightMode ? 'text-teal-700 font-semibold' : 'text-accent/80 font-semibold'}>{prop.region}</span>
                                <span className={isLightMode ? 'text-slate-300' : 'text-zinc-600'}>•</span>
                                <span className={`font-mono text-[10px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                                  {prop.authority_id}
                                </span>
                                {prop.weather?.temp && (
                                  <>
                                    <span className={isLightMode ? 'text-slate-300' : 'text-zinc-600'}>•</span>
                                    <span className={`font-bold text-[11px] ${isLightMode ? 'text-amber-600' : 'text-amber-300'}`}>{prop.weather.temp}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${ageBadge.color}`}>
                                {ageBadge.icon} {ageBadge.label}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCardExpansion(cardKey);
                                }}
                                className={`p-1 rounded-lg flex items-center justify-center text-xs transition ${
                                  isLightMode
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                                    : 'bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white'
                                }`}
                                title={isExpanded ? 'סגור פרטים' : 'פתח פרטים'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className={`w-4 h-4 ${isLightMode ? 'text-teal-600' : 'text-accent'}`} />
                                ) : (
                                  <ChevronDown className={`w-4 h-4 ${isLightMode ? 'text-slate-400 group-hover:text-teal-600' : 'text-zinc-400 group-hover:text-accent'}`} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Reason Chips (always visible) */}
                          {reasonChips.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                              {reasonChips.slice(0, 4).map((chip, ci) => (
                                <span
                                  key={ci}
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    chip.color === 'chip-age'
                                      ? isLightMode
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                      : chip.color === 'chip-water'
                                      ? isLightMode
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                                      : chip.color === 'chip-weather'
                                      ? isLightMode
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                      : isLightMode
                                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                                        : 'bg-white/[0.06] text-zinc-400 border-white/[0.1]'
                                  }`}
                                >
                                  {chip.color === 'chip-age' && <span>✅</span>}
                                  {chip.label}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Quick Actions (Always visible) */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => {
                                if (onSelectSite) {
                                  onSelectSite(fullAsset);
                                }
                                if (window.innerWidth < 640) {
                                  setIsMinimized(true);
                                }
                              }}
                              className={`flex-1 py-1.5 px-2.5 active:scale-[0.98] font-bold text-[11px] leading-tight rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition ${
                                isLightMode
                                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                  : 'bg-accent hover:bg-accent-light text-brand-deep'
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>הצג במפה 🗺️</span>
                            </button>

                            <button
                              onClick={() => toggleCardExpansion(cardKey)}
                              className={`py-1.5 px-2.5 active:scale-[0.98] font-bold text-[11px] leading-tight rounded-lg flex items-center justify-center gap-1 transition border ${
                                isLightMode
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  : 'bg-brand-deep/80 hover:bg-brand-deep text-zinc-300 hover:text-white border-white/[0.08]'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className={`w-3 h-3 ${isLightMode ? 'text-teal-600' : 'text-accent'}`} />
                                  <span>סגור פרטים</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className={`w-3 h-3 ${isLightMode ? 'text-teal-600' : 'text-accent'}`} />
                                  <span>פרטים נוספים</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Expandable Details Container */}
                          {isExpanded && (
                            <div className={`pt-2.5 mt-2 space-y-2 border-t animate-in fade-in duration-200 ${
                              isLightMode ? 'border-slate-200' : 'border-white/[0.06]'
                            }`}>
                              {/* Weather & Climate Pill */}
                              <div className={`grid grid-cols-2 gap-1.5 text-xs p-2 rounded-xl border ${
                                isLightMode
                                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                                  : 'bg-brand-deep/60 border-white/[0.04]'
                              }`}>
                                <div className={`flex items-center gap-1.5 ${isLightMode ? 'text-amber-600' : 'text-amber-300'}`}>
                                  <Sun className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="font-bold">{prop.weather.temp}</span>
                                  <span className={`text-[10px] truncate ${isLightMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                                    ({prop.weather.conditions})
                                  </span>
                                </div>
                                <div className={`flex items-center gap-1.5 ${isLightMode ? 'text-teal-700' : 'text-accent'}`}>
                                  <Droplets className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className={`text-xs truncate ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                                    {prop.weather.heatLoad}
                                  </span>
                                </div>
                              </div>

                              {/* XAI Explainability Rationale */}
                              <p className={`text-xs p-2 rounded-xl leading-snug border ${
                                isLightMode
                                  ? 'text-slate-700 bg-teal-50/70 border-teal-200/80'
                                  : 'text-zinc-300 bg-accent/[0.05] border-accent/10'
                              }`}>
                                💡 {prop.matchRationale}
                              </p>

                              {/* Water Advisory if any */}
                              {prop.waterAdvisory && (
                                <div className={`flex items-center gap-1.5 text-xs p-2 rounded-xl border ${
                                  isLightMode
                                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                                    : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                                }`}>
                                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{prop.waterAdvisory.title}</span>
                                </div>
                              )}

                              {/* Navigation & Copy Actions */}
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <a
                                  href={`https://waze.com/ul?ll=${prop.lat},${prop.lng}&navigate=yes`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`py-1.5 px-2 active:scale-[0.98] font-bold text-[11px] leading-tight rounded-lg flex items-center justify-center gap-1 transition text-center border ${
                                    isLightMode
                                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                      : 'bg-brand-deep/80 hover:bg-brand-deep text-zinc-200 hover:text-white border-white/[0.08]'
                                  }`}
                                >
                                  <Navigation className={`w-3 h-3 flex-shrink-0 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
                                  <span className="truncate">נווט ב-Waze</span>
                                </a>

                                <button
                                  onClick={() => handleCopyProposal(prop)}
                                  className={`py-1.5 px-2 active:scale-[0.98] font-bold text-[11px] leading-tight rounded-lg flex items-center justify-center gap-1 transition text-center border ${
                                    isLightMode
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                      : 'bg-brand-deep/80 hover:bg-brand-deep text-zinc-200 hover:text-white border-white/[0.08]'
                                  }`}
                                >
                                  {copiedId === prop.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600 truncate">הועתק ללוח!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className={`w-3 h-3 ${isLightMode ? 'text-teal-600' : 'text-accent'}`} />
                                      <span className="truncate">העתק פרטים</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Coordinates */}
                              <div className={`flex items-center justify-end text-[10px] font-mono px-1 ${
                                isLightMode ? 'text-slate-400' : 'text-zinc-500'
                              }`}>
                                📍 {prop.lat.toFixed(3)}, {prop.lng.toFixed(3)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick Selection Options / Pills */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 max-w-[95%]">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(opt.value)}
                        disabled={isProcessing}
                        className="teal-chip text-right"
                        style={{ fontSize: '11px' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking Indicator */}
          {isProcessing && <ThinkingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className={`p-3 border-t ${
          isLightMode ? 'bg-slate-50/90 border-slate-200' : 'bg-brand-card/60 border-white/[0.06]'
        }`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`flex items-center gap-2 border rounded-2xl px-3 py-1.5 transition-colors shadow-inner ${
              isLightMode
                ? 'bg-white border-slate-200 focus-within:border-teal-500'
                : 'bg-brand-deep border-white/[0.08] focus-within:border-accent/40'
            }`}
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="כתבו בקשה חופשית... (למשל: טיול מים מחר בצפון לגיל 4)"
              disabled={isProcessing}
              className={`flex-1 bg-transparent text-xs py-1.5 text-right font-body focus:outline-none ${
                isLightMode ? 'text-slate-900 placeholder-slate-400' : 'text-zinc-100 placeholder-zinc-600'
              }`}
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isProcessing}
              className={`w-8 h-8 rounded-xl disabled:opacity-30 flex items-center justify-center transition flex-shrink-0 shadow font-bold ${
                isLightMode
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-accent hover:bg-accent-light text-brand-deep'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className={`flex items-center justify-center text-[10px] mt-2 px-1 ${
            isLightMode ? 'text-slate-500' : 'text-zinc-500'
          }`}>
            <span>🛡️ שיחה מאובטחת • נתונים מאומתים מ-INPA</span>
          </div>
        </div>

        {/* Audit Log Modal */}
        {showAuditModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 rounded-3xl animate-fade-in ${
            isLightMode ? 'bg-slate-900/20 backdrop-blur-[2px]' : 'bg-black/70 backdrop-blur-sm'
          }`} dir="rtl">
            <div className={`relative w-full border rounded-2xl shadow-2xl p-4 flex flex-col gap-3 max-h-full overflow-y-auto ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
                : 'bg-zinc-900 border-white/10 text-zinc-100'
            }`}>
              {/* Header */}
              <div className={`flex items-center justify-between border-b pb-3 ${
                isLightMode ? 'border-slate-200' : 'border-white/10'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isLightMode
                      ? 'bg-teal-50 border border-teal-200 text-teal-700'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>שליחת לוג ובקרת איכות</h3>
                    <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>פרוטוקול השיחה מתועד ומוכן לשיתוף</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                    isLightMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Auto-copy Alert */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isLightMode
                  ? 'bg-teal-50/80 border-teal-200 text-teal-900'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              }`}>
                <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isLightMode ? 'text-teal-600' : 'text-emerald-400'}`} />
                <p className="text-xs leading-relaxed">
                  <strong>הפרוטוקול המלא וה-JSON הועתקו ללוח!</strong> כעת תוכלו לשתף אותו ישירות או להדביקו בכל מקום.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                {/* Native Mobile Share */}
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    onClick={async () => {
                      await AgentAuditLogger.shareAuditLog();
                      setShowAuditModal(false);
                    }}
                    className={`w-full p-3.5 rounded-xl border flex items-center gap-3 transition group text-right shadow-sm ${
                      isLightMode
                        ? 'bg-teal-600 hover:bg-teal-700 border-teal-700 text-white'
                        : 'bg-accent/20 hover:bg-accent/30 border border-accent/40 text-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isLightMode ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent'
                    }`}>
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">שיתוף ישיר בנייד (WhatsApp / Drive / מייל)</div>
                      <div className={`text-[10px] ${isLightMode ? 'text-teal-100' : 'text-zinc-400'}`}>פתיחת תפריט השיתוף הטבעי של הטלפון לשליחה מיידית</div>
                    </div>
                  </button>
                )}

                {/* GitHub Issue with Ultra-Short URL */}
                <button
                  onClick={() => {
                    AgentAuditLogger.openGitHubIssueReport();
                    setShowAuditModal(false);
                  }}
                  className={`w-full p-3.5 rounded-xl border flex items-center gap-3 transition group text-right ${
                    isLightMode
                      ? 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-slate-800'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isLightMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <Bug className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold">פתיחה ב-GitHub Issues</div>
                    <div className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>פתיחת דיווח קצר ונקי (עשו 'הדבק' כדי לצרף את הלוג המלא)</div>
                  </div>
                </button>

                {/* Download JSON File */}
                <button
                  onClick={() => {
                    AgentAuditLogger.exportAsJsonFile();
                    setExportedAudit(true);
                    setTimeout(() => setExportedAudit(false), 2000);
                  }}
                  className={`w-full p-3.5 rounded-xl border flex items-center gap-3 transition group text-right ${
                    isLightMode
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold">הורדת קובץ לוג (JSON)</div>
                    <div className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>שמירת קובץ הנתונים המלא ישירות למכשיר</div>
                  </div>
                </button>
              </div>

              {/* Close Footer */}
              <div className={`pt-2 border-t flex justify-end ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition ${
                    isLightMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-zinc-300'
                  }`}
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
