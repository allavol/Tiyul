import React, { useEffect, useRef } from 'react';
import { Terminal, Trash2, ShieldAlert } from 'lucide-react';

export default function TerminalConsole({ logs = [], onClearLogs }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (log) => {
    const text = typeof log === 'string' ? log : log.text;
    const type = typeof log === 'object' ? log.type : '';

    if (type === 'fault' || text.includes('[SYSTEM FAULT]')) {
      return '#ffaa00'; // Amber alert
    }
    if (type === 'error' || text.includes('CRITICAL') || text.includes('hazard') || text.includes('flood zone') || text.includes('FAULT')) {
      return '#ff2a55';
    }
    if (type === 'warning' || text.includes('Rerouting') || text.includes('FAILSAFE')) {
      return '#ffaa00';
    }
    if (type === 'success' || text.includes('Verified') || text.includes('STABLE')) {
      return '#00ff66';
    }
    if (text.includes('[BAAL]') || text.includes('[המדריך]')) {
      return '#00f0ff';
    }
    return '#94a3b8';
  };

  return (
    <div
      className="crt-terminal hud-corner"
      style={{
        flex: 1,
        minHeight: '220px',
        backgroundColor: '#03060a',
        border: '1px solid var(--border-dim)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.9)',
      }}
    >
      {/* Terminal Top Bar */}
      <div
        style={{
          padding: '6px 12px',
          backgroundColor: '#0a0f1d',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="var(--accent-cyan)" />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              letterSpacing: '1px',
            }}
          >
            המדריך TACTICAL CONSOLE // C4I KERNEL
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              boxShadow: '0 0 6px var(--accent-green)',
            }}
          />
        </div>

        <button
          onClick={onClearLogs}
          title="Clear Terminal"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          <Trash2 size={12} />
          CLEAR
        </button>
      </div>

      {/* Terminal Output Body */}
      <div
        style={{
          flex: 1,
          padding: '12px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          lineHeight: '1.6',
          color: '#cbd5e1',
        }}
      >
        {logs.map((entry, idx) => {
          const timestamp = entry.time || new Date().toLocaleTimeString();
          const text = typeof entry === 'string' ? entry : entry.text;
          const color = getLogColor(entry);

          return (
            <div
              key={idx}
              style={{
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                animation: 'fadeIn 0.2s ease-in',
              }}
            >
              <span style={{ color: '#475569', userSelect: 'none', flexShrink: 0 }}>[{timestamp}]</span>
              <span style={{ color, wordBreak: 'break-word' }}>{text}</span>
            </div>
          );
        })}

        {/* Prompt with Blinking Cursor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <span style={{ color: 'var(--accent-cyan)' }}>המדריך&gt;</span>
          <span className="cursor-blink" style={{ color: 'var(--accent-green)', fontWeight: 800 }}>
            █
          </span>
        </div>

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
