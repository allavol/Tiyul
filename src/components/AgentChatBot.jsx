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
  AlertTriangle
} from 'lucide-react';
import { AgentBotService } from '../services/AgentBotService';
import { getCategoryIconChar, getAgeBadge } from '../utils/weatherUtils';

export default function AgentChatBot({
  isOpen,
  onClose,
  onSelectSite,
  onProposalsUpdate,
  assets = [],
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'שלום וברוכים הבאים! 🧭 אני **סוכן הטיולים החכם** שלכם.\n\nאני כאן כדי לתכנן עבורכם מסלול טיול מושלם ובטוח בטבע בישראל, בהתאמה מדויקת לגילאי הילדים ולתחזית האקלים החיה ב-**Tomorrow.io**.\n\nספרו לי: **לאן תרצו לטייל ומתי?** (למשל: *"רוצים לטייל מחר בצפון עם ילדים קטנים בני 3, מחפשים מים"*).',
      options: [
        { label: '🏞️ טיול מים בצפון למחר (גיל 4+)', value: 'אני רוצה לטייל מחר בצפון עם ילדים קטנים בני 4, מחפשים מסלול מים' },
        { label: '👶 טיול עגלות מוצל בשרון (0+)', value: 'מחפשים מסלול נגיש לעגלות מוצל במרכז והשרון לסוף השבוע' },
        { label: '🏰 עתיקות ותצפיות בירושלים', value: 'רוצים לטייל מחרתיים בירושלים והשפלה עם ילדים בוגרים' },
      ],
      proposals: [],
      toolActivity: null,
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
      // Simulate sub-second tactical thinking delay
      await new Promise((r) => setTimeout(r, 450));

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
        text: 'השיחה אופסה! 🌿 ספרו לי: **לאיזה אזור בארץ תרצו לטייל ומתי?**',
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

  return (
    /* Non-blocking Floating Widget docked on the map (leaves the entire map visible and interactive) */
    <div className="fixed bottom-5 left-5 z-[1200] w-[420px] max-w-[calc(100vw-30px)] h-[580px] max-h-[calc(100vh-80px)] bg-[#0c0e14]/96 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 backdrop-blur-2xl animate-floating-card font-sans select-none pointer-events-auto">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white tracking-wide">
                  סוכן הטיולים החכם
                </h3>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  AI Guide
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-light">
                תכנון מסלולים מונחה בטיחות ונתוני Tomorrow.io
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="איפוס שיחה"
              className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="סגור"
              className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
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
                      ? 'bg-zinc-900/90 text-zinc-200 border border-zinc-800/90 shadow-md'
                      : 'bg-emerald-600 text-white font-medium shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line text-[12.5px]">
                    {msg.text}
                  </div>

                  {/* Tool Execution Badge */}
                  {msg.toolActivity && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{msg.toolActivity}</span>
                    </div>
                  )}
                </div>

                {/* Rich Graphical Proposals (הצעות גרפיות על המסך) */}
                {msg.proposals && msg.proposals.length > 0 && (
                  <div className="w-full space-y-2.5 my-1">
                    {msg.proposals.map((prop) => {
                      const ageBadge = getAgeBadge(prop.min_age);
                      const fullAsset = assets.find((a) => a.id === prop.id) || prop;

                      return (
                        <div
                          key={prop.id}
                          className="w-full bg-[#141722]/90 border border-emerald-500/30 hover:border-emerald-400/70 p-3.5 rounded-2xl shadow-xl transition-all duration-200 space-y-2.5 group"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-base">{getCategoryIconChar(prop)}</span>
                                <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                                  {prop.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-400 mt-0.5">
                                <span>{prop.region}</span>
                                <span>•</span>
                                <span className="font-mono text-emerald-400 font-bold">
                                  {prop.authority_id}
                                </span>
                              </div>
                            </div>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${ageBadge.color}`}>
                              {ageBadge.icon} {ageBadge.label}
                            </span>
                          </div>

                          {/* Weather & Climate Pill from Tomorrow.io */}
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-black/40 p-2 rounded-xl border border-white/5">
                            <div className="flex items-center gap-1.5 text-amber-300">
                              <Sun className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="font-bold">{prop.weather.temp}</span>
                              <span className="text-[9.5px] text-zinc-400 truncate">
                                ({prop.weather.conditions})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-cyan-300">
                              <Droplets className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-[10px] text-zinc-300 truncate">
                                {prop.weather.heatLoad}
                              </span>
                            </div>
                          </div>

                          {/* XAI Explainability Rationale */}
                          <p className="text-[11px] text-zinc-300 bg-emerald-950/30 border border-emerald-900/40 p-2 rounded-xl leading-snug">
                            💡 {prop.matchRationale}
                          </p>

                          {/* Water Advisory if any */}
                          {prop.waterAdvisory && (
                            <div className="flex items-center gap-1.5 text-[10.5px] text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2 rounded-xl">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{prop.waterAdvisory.title}</span>
                            </div>
                          )}

                          {/* Action Button: Fly to Map */}
                          <button
                            onClick={() => {
                              if (onSelectSite) {
                                onSelectSite(fullAsset);
                              }
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/60 transition"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>הצג מסלול ונתונים במפה 🗺️</span>
                          </button>
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
                        className="text-[11px] bg-zinc-800/80 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-700/80 border border-zinc-700/70 text-zinc-300 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-sm text-right"
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
          {isProcessing && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs bg-zinc-900/80 p-3 rounded-2xl w-fit border border-zinc-800 animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>הסוכן מעבד את הבקשה ומתשאל את Tomorrow.io...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-1.5 focus-within:border-emerald-500 transition-colors shadow-inner"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="כתבו בקשה חופשית... (למשל: טיול מים מחר בצפון לגיל 4)"
              disabled={isProcessing}
              className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none py-1.5 text-right font-sans"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isProcessing}
              className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white flex items-center justify-center transition flex-shrink-0 shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 px-1">
            <span>🛡️ שיחה מאובטחת • נתונים מאומתים מ-INPA ו-Tomorrow.io</span>
            <span>$0 Total Cost</span>
          </div>
        </div>

      </div>
  );
}
