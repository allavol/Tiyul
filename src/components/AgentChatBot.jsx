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
  Check
} from 'lucide-react';
import { AgentBotService } from '../services/AgentBotService';
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
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'שלום וברוכים הבאים! 🧭 אני סוכן הטיולים החכם שלכם.\n\nספרו לי: לאן תרצו לטייל ומתי? (למשל: "רוצים לטייל מחר בצפון עם ילדים קטנים בני 3, מחפשים מים").',
      options: [
        { label: '🏞️ טיול מים בצפון למחר (גיל 4+)', value: 'אני רוצה לטייל מחר בצפון עם ילדים קטנים בני 4, מחפשים מסלול מים' },
        { label: '👶 טיול עגלות מוצל בשרון (0+)', value: 'מחפשים מסלול נגיש לעגלות מוצל במרכז והשרון לסוף השבוע' },
        { label: '🏰 טיול נוף ומבצרים בירושלים (6+)', value: 'מחפשים טיול נוף ועתיקות באזור ירושלים בסוף השבוע' },
      ],
      proposals: [],
      toolActivity: null,
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sessionState, setSessionState] = useState(AgentBotService.getInitialState());
  const messagesEndRef = useRef(null);

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
    try {
      // Sub-second tactical thinking delay (<800ms)
      await new Promise((r) => setTimeout(r, 650));

      const response = await AgentBotService.processUserMessage(text, sessionState);

      setSessionState(response.state);

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        options: response.options || [],
        proposals: response.proposals || [],
        toolActivity: response.toolActivity,
      };

      setMessages((prev) => [...prev, botMsg]);

      // If recommendations were generated, notify parent map to show ONLY them!
      if (response.proposals && response.proposals.length > 0 && onProposalsUpdate) {
        onProposalsUpdate(response.proposals);
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
    setSessionState(AgentBotService.getInitialState());
    if (onProposalsUpdate) {
      onProposalsUpdate([]);
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'השיחה אופסה! 🌿 ספרו לי: לאיזה אזור בארץ תרצו לטייל ומתי?',
        options: [
          { label: '🏞️ צפון (גליל וגולן)', value: 'באזור הצפון' },
          { label: '🌾 מרכז והשרון', value: 'באזור המרכז והשרון' },
          { label: '🏰 ירושלים והשפלה', value: 'באזור ירושלים והשפלה' },
          { label: '🏜️ דרום וים המלח', value: 'באזור הדרום וים המלח' },
        ],
        proposals: [],
        toolActivity: null,
      }
    ]);
  };

  if (!isOpen) return null;

  /* Minimized Docked Widget Pill */
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-[1200] pointer-events-auto animate-floating-card font-body select-none">
        <button
          onClick={() => setIsMinimized(false)}
          data-testid="docked-chatbot-pill"
          title="הרחב שיחת סוכן"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-panel border border-accent/40 bg-brand-deep/95 text-zinc-100 shadow-2xl hover:border-accent hover:bg-brand-card transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center shadow">
            <Compass className="w-4 h-4 animate-spin-slow text-accent" />
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>סוכן הטיולים</span>
              {sessionState.lastProposals?.length > 0 && (
                <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full border border-accent/30 font-bold">
                  {sessionState.lastProposals.length} הצעות
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400">לחץ להרחבת השיחה ↗</div>
          </div>
          <Maximize2 className="w-4 h-4 text-zinc-400 group-hover:text-accent transition ml-1" />
        </button>
      </div>
    );
  }

  return (
    /* Mobile & Desktop Responsive Floating Chatbot Widget */
    <div className="fixed inset-3 bottom-16 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:h-[580px] sm:max-h-[85vh] z-[1200] glass-panel rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-floating-card font-body select-none pointer-events-auto" style={{ borderColor: 'var(--border-accent)' }}>
      {/* Top Header */}
      <div className="p-4 border-b border-white/[0.06] bg-brand-card/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-lg">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight font-display">
                  סוכן הטיולים
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-accent bg-accent/[0.08] px-1.5 py-0.5 rounded-full border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  AI GUIDE
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-light">
                תכנון מסלולים מונחה בטיחות ונתוני שטח
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="איפוס שיחה"
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-accent flex items-center justify-center transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              title="מזער שיחה"
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-200 flex items-center justify-center transition"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="סגור"
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-200 flex items-center justify-center transition"
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
                      ? 'bg-brand-card text-zinc-200 border border-white/[0.06] shadow-md'
                      : 'bg-accent text-brand-deep font-semibold shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm">
                    {stripAsterisks(msg.text)}
                  </div>

                  {/* Tool Execution Badge */}
                  {msg.toolActivity && (
                    <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-xs text-accent font-mono flex items-center gap-1.5">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{msg.toolActivity}</span>
                    </div>
                  )}
                </div>

                {/* Rich Graphical Proposals */}
                {msg.proposals && msg.proposals.length > 0 && (
                  <div className="w-full space-y-2.5 my-1">
                    {msg.proposals.map((prop) => {
                      const ageBadge = getAgeBadge(prop.min_age);
                      const fullAsset = assets.find((a) => a.id === prop.id) || prop;

                      return (
                        <div
                          key={prop.id}
                          className="w-full editorial-card p-3.5 space-y-2.5 group"
                          style={{ borderColor: 'var(--border-accent)' }}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-base">{getCategoryIconChar(prop)}</span>
                                <h4 className="text-base font-black text-white group-hover:text-accent transition-colors font-display">
                                  {prop.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                                <span className="text-accent/70 font-semibold uppercase tracking-wider">{prop.region}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="font-mono text-accent/60 font-bold">
                                  {prop.authority_id}
                                </span>
                              </div>
                            </div>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${ageBadge.color}`}>
                              {ageBadge.icon} {ageBadge.label}
                            </span>
                          </div>

                          {/* Weather & Climate Pill */}
                          <div className="grid grid-cols-2 gap-1.5 text-xs bg-brand-deep/60 p-2 rounded-xl border border-white/[0.04]">
                            <div className="flex items-center gap-1.5 text-amber-300">
                              <Sun className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="font-bold">{prop.weather.temp}</span>
                              <span className="text-[10px] text-zinc-500 truncate">
                                ({prop.weather.conditions})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-accent">
                              <Droplets className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-xs text-zinc-400 truncate">
                                {prop.weather.heatLoad}
                              </span>
                            </div>
                          </div>

                          {/* XAI Explainability Rationale */}
                          <p className="text-xs text-zinc-300 bg-accent/[0.05] border border-accent/10 p-2 rounded-xl leading-snug">
                            💡 {prop.matchRationale}
                          </p>

                          {/* Water Advisory if any */}
                          {prop.waterAdvisory && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{prop.waterAdvisory.title}</span>
                            </div>
                          )}

                          {/* Action Buttons: Fly to Map & Direct Waze */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                if (onSelectSite) {
                                  onSelectSite(fullAsset);
                                }
                                if (window.innerWidth < 640) {
                                  setIsMinimized(true);
                                }
                              }}
                              className="py-1.5 px-2 bg-accent hover:bg-accent-light active:scale-[0.98] text-brand-deep font-bold text-[11px] leading-tight rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
                            >
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">הצג מסלול ונתונים במפה 🗺️</span>
                            </button>

                            <a
                              href={`https://waze.com/ul?ll=${prop.lat},${prop.lng}&navigate=yes`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2 bg-brand-deep/80 hover:bg-brand-deep text-zinc-200 hover:text-white border border-white/[0.08] active:scale-[0.98] font-bold text-[11px] leading-tight rounded-lg flex items-center justify-center gap-1 transition text-center"
                            >
                              <Navigation className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <span className="truncate">נווט ב-Waze</span>
                            </a>
                          </div>

                          {/* Site-Specific What-If Crisis Simulation Button */}
                          <button
                            onClick={() => {
                              const siteScenario = AgentBotService.getSiteHazardScenario(prop);
                              handleSendMessage(siteScenario.prompt);
                            }}
                            className="w-full py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/20 active:scale-[0.98] font-bold text-[10.5px] rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
                            title={`הפעל תרחיש חירום What-If ספציפי עבור ${prop.name}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                            <span>תרחיש חירום What-If באתר זה 🚨</span>
                          </button>

                          {/* Secondary Actions: Share / Copy & Coordinates */}
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-0.5">
                            <button
                              onClick={() => handleCopyProposal(prop)}
                              className="flex items-center gap-1 text-zinc-400 hover:text-accent transition py-0.5 font-medium"
                              title="העתק פרטי מסלול לווטסאפ"
                            >
                              {copiedId === prop.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">הועתק ללוח!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>העתק המלצה</span>
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              📍 {prop.lat.toFixed(3)}, {prop.lng.toFixed(3)}
                            </span>
                          </div>
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
        <div className="p-3 border-t border-white/[0.06] bg-brand-card/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-brand-deep border border-white/[0.08] rounded-2xl px-3 py-1.5 focus-within:border-accent/40 transition-colors shadow-inner"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="כתבו בקשה חופשית... (למשל: טיול מים מחר בצפון לגיל 4)"
              disabled={isProcessing}
              className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none py-1.5 text-right font-body"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isProcessing}
              className="w-8 h-8 rounded-xl bg-accent hover:bg-accent-light disabled:opacity-30 text-brand-deep flex items-center justify-center transition flex-shrink-0 shadow font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-center text-[10px] text-zinc-500 mt-2 px-1">
            <span>🛡️ שיחה מאובטחת • נתונים מאומתים מ-INPA</span>
          </div>
        </div>

      </div>
  );
}
