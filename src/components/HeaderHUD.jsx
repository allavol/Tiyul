import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, AlertTriangle, Clock } from 'lucide-react';

export default function HeaderHUD({
  activeAlertCount = 0,
  defconLevel = 4,
  systemFault = false,
  totalAssetsCount = 19,
  isOutOfHorizon = false,
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utc = now.toUTCString().split(' ')[4];
      const local = now.toLocaleTimeString();
      setTimeStr(`${local} LOC // ${utc} ZULU`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAlert = activeAlertCount > 0;
  const isFault = systemFault;

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'rgba(7, 11, 20, 0.95)',
        borderBottom: '1px solid var(--border-bright)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 2px 15px rgba(0, 240, 255, 0.1)',
      }}
    >
      {/* Brand & System Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '4px',
            border: '1px solid var(--accent-cyan)',
            backgroundColor: 'rgba(0, 240, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
          }}
        >
          <Shield size={20} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              color: 'var(--accent-cyan)',
              textShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
            }}
          >
            GEOGUARD C4I
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 500 }}>
              v2.4-TACTICAL
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#94a3b8',
              letterSpacing: '0.8px',
            }}
          >
            FAMILY MISSION CONTROL // AUTONOMOUS AGENT: המדריך
          </div>
        </div>
      </div>

      {/* Center Tactical Status Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '3px',
            border: `1px solid ${isFault ? 'var(--accent-amber)' : isAlert ? 'var(--accent-red)' : 'var(--border-dim)'}`,
            backgroundColor: isFault
              ? 'rgba(255, 170, 0, 0.2)'
              : isAlert
              ? 'rgba(255, 42, 85, 0.15)'
              : 'rgba(0, 240, 255, 0.05)',
            animation: isFault ? 'pulse-red 1.2s infinite' : 'none',
          }}
        >
          {isFault ? (
            <AlertTriangle size={14} color="var(--accent-amber)" />
          ) : (
            <Radio size={14} color={isAlert ? 'var(--accent-red)' : 'var(--accent-green)'} />
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: isFault ? 'var(--accent-amber)' : isAlert ? 'var(--accent-red)' : 'var(--accent-green)',
            }}
          >
            {isFault
              ? 'SYS FAULT: AGENT OFFLINE'
              : `DEFCON ${defconLevel}: ${isAlert ? 'TACTICAL REROUTE ACTIVE' : 'GRID STABLE'}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} color="var(--accent-cyan)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            SURVEILLANCE GRID:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
            {totalAssetsCount} ASSETS
          </span>
          {isOutOfHorizon && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '2px',
                backgroundColor: 'rgba(255, 170, 0, 0.2)',
                border: '1px solid var(--accent-amber)',
                color: 'var(--accent-amber)',
                fontWeight: 700,
              }}
            >
              OUT OF HORIZON
            </span>
          )}
        </div>
      </div>

      {/* Clock & Zulu Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={14} color="var(--accent-cyan)" />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--accent-cyan)',
            letterSpacing: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '4px 8px',
            borderRadius: '3px',
            border: '1px solid rgba(0, 240, 255, 0.2)',
          }}
        >
          {timeStr || 'SYNCHRONIZING...'}
        </span>
      </div>
    </header>
  );
}
