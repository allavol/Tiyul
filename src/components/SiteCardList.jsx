import React from 'react';
import { MapPin, Navigation, Shield, Droplets, Sun, Trees, Mountain, Compass } from 'lucide-react';

export default function SiteCardList({
  assets = [],
  selectedAssetId = null,
  isOutOfHorizon = false,
  visitDate = '',
  onSelectAsset,
}) {
  const getCategoryIcon = (asset) => {
    const types = (asset.type || []).join(' ');
    const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';

    if (isSafeHaven) return <Shield size={18} color="#38bdf8" />;
    if (types.includes('מים') || types.includes('חוף') || types.includes('בריכות')) return <Droplets size={18} color="#0284c7" />;
    if (types.includes('הרים') || types.includes('שלג') || types.includes('מכתש')) return <Mountain size={18} color="#a855f7" />;
    if (types.includes('חורש') || types.includes('טבע') || types.includes('יער')) return <Trees size={18} color="#22c55e" />;
    if (types.includes('מדבר') || types.includes('דיונות')) return <Sun size={18} color="#f59e0b" />;
    return <Compass size={18} color="#38bdf8" />;
  };

  const getCategoryBg = (asset) => {
    const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
    if (isSafeHaven) return 'rgba(56, 189, 248, 0.12)';
    const types = (asset.type || []).join(' ');
    if (types.includes('מים')) return 'rgba(2, 132, 199, 0.12)';
    if (types.includes('הרים')) return 'rgba(168, 85, 247, 0.12)';
    if (types.includes('טבע')) return 'rgba(34, 197, 94, 0.12)';
    if (types.includes('מדבר')) return 'rgba(245, 158, 11, 0.12)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div
      style={{
        flex: '1 1 0%',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
          רשימת אתרים ({assets.length})
        </span>
        {visitDate && (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            לתאריך: {visitDate}
          </span>
        )}
      </div>

      {assets.length === 0 ? (
        <div
          style={{
            padding: '30px 20px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '13px',
            backgroundColor: '#161b24',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          לא נמצאו אתרים התואמים את החיפוש והסינון.
        </div>
      ) : (
        assets.map((asset) => {
          const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
          const isCritical = asset.status === 'CRITICAL' || asset.status === 'REROUTED';
          const isSelected = selectedAssetId === asset.id;

          let badgeColor = '#22c55e';
          let badgeBg = 'rgba(34, 197, 94, 0.12)';
          let badgeBorder = 'rgba(34, 197, 94, 0.3)';
          let badgeText = isOutOfHorizon ? 'מעבר לתחזית' : 'פתוח ובטוח';

          if (isCritical) {
            badgeColor = '#ef4444';
            badgeBg = 'rgba(239, 68, 68, 0.15)';
            badgeBorder = 'rgba(239, 68, 68, 0.4)';
            badgeText = 'הפניה למקלט';
          } else if (isSafeHaven) {
            badgeColor = '#38bdf8';
            badgeBg = 'rgba(56, 189, 248, 0.15)';
            badgeBorder = 'rgba(56, 189, 248, 0.4)';
            badgeText = 'מקלט בטוח';
          } else if (isOutOfHorizon) {
            badgeColor = '#f59e0b';
            badgeBg = 'rgba(245, 158, 11, 0.15)';
            badgeBorder = 'rgba(245, 158, 11, 0.4)';
            badgeText = 'מעבר לתחזית';
          }

          return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset?.(asset.id)}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                backgroundColor: isSelected ? '#1e2430' : '#161b24',
                border: `1px solid ${isSelected ? '#38bdf8' : isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '12px',
                padding: '12px',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.25)' : 'none',
              }}
              onMouseOver={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)';
              }}
            >
              {/* Thumbnail / Icon Badge */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: getCategoryBg(asset),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {getCategoryIcon(asset)}
              </div>

              {/* Main Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                {/* Header Row: Title & Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isCritical ? '#f87171' : '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {asset.name}
                  </span>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {badgeText}
                  </span>
                </div>

                {/* Subtitle: Region & Types (NO LAT/LNG!) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <MapPin size={12} color="#38bdf8" />
                  <span>{asset.region || 'ישראל'}</span>
                  <span>•</span>
                  <span>{asset.type?.slice(0, 2).join(', ')}</span>
                </div>

                {/* Vulnerability notice if any */}
                {asset.vulnerabilities && !isSafeHaven && (
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    רגישות: {asset.vulnerabilities.join(', ')}
                  </div>
                )}

                {/* Reroute Alert Banner if REROUTED */}
                {asset.rerouteTarget && (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      borderRight: '3px solid #ef4444',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#fca5a5',
                      fontWeight: 600,
                    }}
                  >
                    <Navigation size={12} />
                    <span>הופנה למקלט בטוח: {asset.rerouteTarget.name}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
