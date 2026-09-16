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
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
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

    // Dark Map Basemap with Hebrew labels and zero watermarks
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=he', {
      attribution: '&copy; Google Maps',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      className: 'dark-map-tiles',
    }).addTo(map);

    // Zoom control at bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Badge Pins Matching Reference Design
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

      // Category Icon inside white circle
      let iconSvg = '🌲'; // Nature
      const types = (asset.type || []).join(' ');
      if (isSafeHaven) iconSvg = '🛡️';
      else if (types.includes('מים') || types.includes('חוף')) iconSvg = '💧';
      else if (types.includes('הרים') || types.includes('שלג')) iconSvg = '⛰️';
      else if (types.includes('מדבר')) iconSvg = '☀️';
      else if (asset.category === 'spni') iconSvg = '🦅';

      const score = isAlert ? 'ALERT' : isSafeHaven ? '100' : '98';
      const scoreBg = isAlert ? '#ef4444' : '#18181b';
      const scoreColor = isAlert ? '#ffffff' : '#f4f4f5';
      const borderGlow = isSelected ? 'border: 2px solid #34d399; box-shadow: 0 0 14px rgba(52, 211, 153, 0.6);' : 'border: 2px solid #27272a; box-shadow: 0 4px 10px rgba(0,0,0,0.5);';

      const iconHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
          <!-- White Circular Badge -->
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            ${borderGlow}
            transition: all 0.2s ease;
          ">
            ${iconSvg}
          </div>

          <!-- Score Pill Attached Below -->
          <div style="
            margin-top: 3px;
            background-color: ${scoreBg};
            color: ${scoreColor};
            border: 1px solid #3f3f46;
            padding: 1px 6px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            font-family: 'Heebo', sans-serif;
            display: flex;
            align-items: center;
            gap: 2px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.4);
            white-space: nowrap;
          ">
            <span>${isAlert ? '⚠️' : '😊'}</span>
            <span>${score}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'reference-badge-pin',
        html: iconHtml,
        iconSize: [40, 52],
        iconAnchor: [20, 26],
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

  // Mint-Green Routing Line (#34d399) matching the reference design
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
          color: '#34d399', // Mint green glowing line
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
        />
      )}

      {/* Floating National Radar Card on the left when no asset is selected and radar requested */}
      {!selectedAsset && showNationalRadar && (
        <NationalRadarCard
          activeScenario={activeScenario}
          selectedDay={selectedDay}
          totalAssetsCount={assets.length}
          onClose={onCloseNationalRadar || onCloseCard}
        />
      )}
    </div>
  );
}
