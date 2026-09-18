import React from 'react';
import { Search, MapPin, Tag, Calendar, Waves, Flame, RotateCcw, Shield, AlertTriangle } from 'lucide-react';

export default function LuxeTopBar({
  searchQuery,
  onSearchChange,
  selectedRegion,
  onRegionChange,
  selectedCategory,
  onCategoryChange,
  visitDate,
  daysAhead,
  isOutOfHorizon,
  onDateChange,
  onSimulateFlood,
  onSimulateHeatwave,
  onClear,
  isProcessing,
  systemFault,
  onRunFailsafe,
  totalAssetsCount,
  visibleAssetsCount,
}) {
  return (
    <header
      style={{
        backgroundColor: '#12161f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Upper Row: Brand, Horizon Alert & Simulation Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand & App Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.3px',
                }}
              >
                GeoGuard <span style={{ color: '#38bdf8', fontWeight: 500, fontSize: '15px' }}>טיולים ובטיחות</span>
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {visibleAssetsCount} מתוך {totalAssetsCount} אתרים
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
              חמ"ל טקטי לניטור איומים, מזג אוויר ו-OSINT בזמן אמת // סוכן המדריך
            </p>
          </div>
        </div>

        {/* Action Controls & Failsafe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {systemFault && (
            <button
              onClick={() => onRunFailsafe?.('SIMULATE_FLOOD')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#f59e0b',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <AlertTriangle size={14} />
              בדיקת מקלט בטוח (Failsafe)
            </button>
          )}

          <button
            onClick={onSimulateFlood}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseOver={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)')}
          >
            <Waves size={15} />
            סימולציית שיטפון
          </button>

          <button
            onClick={onSimulateHeatwave}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseOver={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.25)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)')}
          >
            <Flame size={15} />
            סימולציית גל חום
          </button>

          <button
            onClick={onClear}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseOver={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
          >
            <RotateCcw size={15} />
            איפוס
          </button>
        </div>
      </div>

      {/* Lower Row: Search Bar, Region Filter, Category Filter, and Date Horizon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          backgroundColor: '#181d27',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            flex: '1 1 240px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0f1218',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="חפש שמורת טבע, בית ספר שדה, או אתר..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter by Location / Region */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={15} color="#38bdf8" />
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            style={{
              backgroundColor: '#0f1218',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">📍 כל האזורים בישראל</option>
            <option value="north">צפון, גליל ורמת הגולן</option>
            <option value="center">מרכז, שרון ומישור החוף</option>
            <option value="jerusalem">ירושלים, הרי יהודה והשפלה</option>
            <option value="south">דרום, ים המלח, נגב ואילת</option>
          </select>
        </div>

        {/* Filter by Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={15} color="#38bdf8" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{
              backgroundColor: '#0f1218',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">🏷️ כל הסוגים והשמורות</option>
            <option value="spni">החברה להגנת הטבע (SPNI)</option>
            <option value="water">שמורות מים ונחלים</option>
            <option value="desert">מדבר ונווה מדבר</option>
            <option value="coast">חופים ושמורות ימיות</option>
            <option value="safe_haven">מקלטים בטוחים (Safe Haven)</option>
          </select>
        </div>

        {/* Target Visit Date & 5-Day Horizon Rule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isOutOfHorizon ? 'rgba(245, 158, 11, 0.15)' : '#0f1218',
            border: `1px solid ${isOutOfHorizon ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'}`,
            padding: '4px 10px',
            borderRadius: '8px',
          }}
        >
          <Calendar size={15} color={isOutOfHorizon ? '#fbbf24' : '#38bdf8'} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>מועד ביקור מתוכנן:</span>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => onDateChange(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: isOutOfHorizon ? '#fbbf24' : '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isOutOfHorizon ? '#f59e0b' : 'rgba(34, 197, 94, 0.15)',
              color: isOutOfHorizon ? '#000000' : '#4ade80',
              border: `1px solid ${isOutOfHorizon ? '#f59e0b' : 'rgba(34, 197, 94, 0.3)'}`,
            }}
          >
            {isOutOfHorizon ? '⚠️ מעבר לתחזית (>5 ימים)' : `✓ תחזית תקפה (${daysAhead === 0 ? 'היום' : '+' + daysAhead + ' ימים'})`}
          </span>
        </div>
      </div>
    </header>
  );
}
