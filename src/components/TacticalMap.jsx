import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import FloatingMapCard from './FloatingMapCard';
import NationalRadarCard from './NationalRadarCard';

export default function TacticalMap({
  assets = [],
  activeRoute = null,
  selectedAssetId = null,
  onSelectAsset,
  onCloseCard,
  activeScenario = 'NORMAL',
  selectedDayIndex = 0,
  showNationalRadar = false,
  onCloseNationalRadar,
  isLightMode = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [31.5, 35.1],
      zoom: 8,
      minZoom: 7,
      maxZoom: 18,
      zoomControl: false,
    });

    // Map Basemap with Hebrew labels and zero watermarks
    tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=he', {
      attribution: '&copy; Google Maps',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      className: isLightMode ? '' : 'dark-map-tiles',
    }).addTo(map);

    // Zoom control at bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Store map instance
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map theme dynamically when isLightMode changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const container = tileLayerRef.current.getContainer();
      if (container) {
        if (isLightMode) {
          container.classList.remove('dark-map-tiles');
        } else {
          container.classList.add('dark-map-tiles');
        }
      }
    }
  }, [isLightMode]);

  // Update Badge Pins — Surfline Teal Circular Data Points
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    assets.forEach((asset) => {
      const isSafeHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
      const isAlert = asset.status === 'CRITICAL' || asset.status === 'REROUTED';
      const isSelected = selectedAssetId === asset.id;

      // Category Icon
      let iconChar = '🌲';
      const types = (asset.type || []).join(' ');
      if (isSafeHaven) iconChar = '🛡️';
      else if (types.includes('מים') || types.includes('חוף')) iconChar = '💧';
      else if (types.includes('הרים') || types.includes('שלג')) iconChar = '⛰️';
      else if (types.includes('מדבר')) iconChar = '☀️';
      else if (asset.category === 'spni') iconChar = '🦅';

      // Colors — Surfline teal circular badges
      const bgColor = isAlert ? '#dc2626' : isSelected ? '#2DD4BF' : '#14B8A6';
      const borderStyle = isSelected
        ? 'border: 2.5px solid #2DD4BF; box-shadow: 0 0 18px rgba(45, 212, 191, 0.5);'
        : isAlert
        ? 'border: 2.5px solid #ef4444; box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);'
        : 'border: 2px solid rgba(45, 212, 191, 0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.5);';

      const iconHtml = `
        <div style="width: 42px; height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer; pointer-events: auto;">
          <!-- Teal Circular Badge -->
          <div style="
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background-color: ${isSelected ? bgColor : '#222228'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            ${borderStyle}
            transition: all 0.2s ease;
          ">
            ${iconChar}
          </div>

          <!-- Label Pill Below -->
          <div style="
            margin-top: 2px;
            background-color: #1c1c21;
            color: ${isAlert ? '#fca5a5' : '#2DD4BF'};
            border: 1px solid ${isAlert ? 'rgba(239,68,68,0.3)' : 'rgba(45,212,191,0.2)'};
            padding: 1px 6px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 800;
            font-family: 'Outfit', 'Heebo', sans-serif;
            display: flex;
            align-items: center;
            gap: 2px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            white-space: nowrap;
          ">
            <span>${isAlert ? '⚠️' : '✓'}</span>
            <span>${isAlert ? 'ALERT' : '100'}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'reference-badge-pin',
        html: iconHtml,
        iconSize: [42, 52],
        iconAnchor: [21, 17], // Anchored to center of the 34px circle
      });

      const marker = L.marker([asset.lat, asset.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        onSelectAsset?.(asset.id);
      });

      markersRef.current[asset.id] = marker;
    });

    // If filtered to a small subset (e.g. AI Recommendations 1-5 sites), smoothly focus map on them!
    if (assets.length > 0 && assets.length <= 6 && !selectedAssetId) {
      const bounds = L.latLngBounds(assets.map((a) => [a.lat, a.lng]));
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 12,
        duration: 1.2,
      });
    }
  }, [assets, selectedAssetId, onSelectAsset]);

  // Handle flyTo when a single asset is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedAssetId) return;

    const targetAsset = assets.find((a) => a.id === selectedAssetId);
    if (targetAsset && typeof targetAsset.lat === 'number' && typeof targetAsset.lng === 'number') {
      map.flyTo([targetAsset.lat, targetAsset.lng], 13, {
        duration: 1.2,
      });
    }
  }, [selectedAssetId, assets]);

  // Teal Routing Line matching Surfline accent
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (activeRoute && activeRoute.from && activeRoute.to) {
      const fromAsset = assets.find((a) => a.id === activeRoute.from);
      const toAsset = assets.find((a) => a.id === activeRoute.to);

      if (fromAsset && toAsset) {
        const latlngs = [
          [fromAsset.lat, fromAsset.lng],
          [toAsset.lat, toAsset.lng],
        ];

        const polyline = L.polyline(latlngs, {
          color: '#2DD4BF', // Teal accent routing line
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        polylineRef.current = polyline;
        map.fitBounds(latlngs, { padding: [80, 80], maxZoom: 10 });
      }
    }
  }, [activeRoute, assets]);

  // Fly to selected asset
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedAssetId) return;

    const asset = assets.find((a) => a.id === selectedAssetId);
    if (asset) {
      map.flyTo([asset.lat, asset.lng], 10, { duration: 0.8 });
    }
  }, [selectedAssetId, assets]);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  return (
    <div className="w-full h-full relative">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Rich Detail Card over the map on the left */}
      {selectedAsset && (
        <FloatingMapCard
          asset={selectedAsset}
          activeScenario={activeScenario}
          selectedDayIndex={selectedDayIndex}
          onClose={onCloseCard}
          onSelectAlternative={(alt) => onSelectAsset(alt.id)}
        />
      )}

      {/* Floating National Radar Card on the left when no asset is selected and radar requested */}
      {!selectedAsset && showNationalRadar && (
        <NationalRadarCard
          activeScenario={activeScenario}
          selectedDay={selectedDayIndex}
          totalAssetsCount={assets.length}
          onClose={onCloseNationalRadar || onCloseCard}
        />
      )}
    </div>
  );
}
