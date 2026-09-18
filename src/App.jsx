import React, { useState, useMemo } from 'react';
import { Compass, Sparkles, Map, Mountain, Settings, Search, Sun, Moon } from 'lucide-react';
import initialAssetsData from '../assets_db.json';
import TacticalSidebar from './components/TacticalSidebar';
import TacticalMap from './components/TacticalMap';
import AgentOperationsModal from './components/AgentOperationsModal';
import AgentChatBot from './components/AgentChatBot';
import { AgentService } from './services/AgentService';
import { getDefaultDayIndex } from './utils/weatherUtils';

export default function App() {
  // Initialize assets from assets_db.json
  const [assets, setAssets] = useState(() =>
    initialAssetsData.map((asset) => ({
      ...asset,
      status: asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven' ? 'SAFE HAVEN' : 'SAFE',
      rerouteTarget: null,
      agentSummary: null,
    }))
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('all'); // 'all' | '0' | '4' | '7' | '10'
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentStatus, setAgentStatus] = useState('ONLINE'); // 'ONLINE' | 'PROCESSING' | 'ALERT_REROUTED'
  const [agentLastDecision, setAgentLastDecision] = useState(`כל ${initialAssetsData.length} השמורות והמסלולים נסרקו ונמצאו בטוחים לפעילות ללא סיכוני מזג אוויר.`);
  const [activeScenario, setActiveScenario] = useState('NORMAL'); // 'NORMAL' | 'FLOOD' | 'HEATWAVE'
  const [selectedDayIndex, setSelectedDayIndex] = useState(getDefaultDayIndex); // 0 (today) or 1 (tomorrow if >= 16:00)
  const [showNationalRadar, setShowNationalRadar] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [recommendedAssetIds, setRecommendedAssetIds] = useState(null); // null when showing all, or array of IDs
  const [activeRailTab, setActiveRailTab] = useState('trails'); // 'trails' | 'map' | 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLightMode, setIsLightMode] = useState(true);

  // Filtered & Sorted Assets Pipeline
  const filteredAssets = useMemo(() => {
    let list = assets.filter((asset) => {
      // 1. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = asset.name?.toLowerCase().includes(q) || asset.name_en?.toLowerCase().includes(q);
        const matchRegion = asset.region?.toLowerCase().includes(q);
        const matchType = asset.type?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchRegion && !matchType) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'safe_haven') {
          const isHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
          if (!isHaven) return false;
        } else if (selectedCategory === 'spni') {
          if (asset.category !== 'spni' && !asset.org?.includes('החברה להגנת הטבע')) return false;
        } else if (asset.category !== selectedCategory) {
          return false;
        }
      }

      // 3. Minimum Age filter
      if (selectedAgeFilter !== 'all') {
        const reqAge = Number(selectedAgeFilter);
        if (reqAge === 0) {
          if (asset.min_age !== 0) return false;
        } else if (reqAge === 4) {
          if (asset.min_age > 4) return false;
        } else if (reqAge === 7) {
          if (asset.min_age > 7) return false;
        } else if (reqAge === 10) {
          if (asset.min_age < 10) return false;
        }
      }

      return true;
    });

    // Show alerts / rerouted at the top
    list.sort((a, b) => (a.status === 'CRITICAL' || a.status === 'REROUTED' ? -1 : 1));

    return list;
  }, [assets, searchQuery, selectedCategory, selectedAgeFilter, recommendedAssetIds]);

  // 1. Simulate Flood Trigger
  const handleSimulateFlood = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAgentStatus('PROCESSING');
    setActiveScenario('FLOOD');

    try {
      const evaluation = await AgentService.evaluateThreat(
        'SIMULATE_FLOOD',
        initialAssetsData
      );

      if (evaluation.error) {
        const fallbackEval = AgentService.evaluateLocalFailsafe('SIMULATE_FLOOD', initialAssetsData);
        applyEvaluation(fallbackEval);
        setAgentLastDecision(fallbackEval.reasoning_log);
        setAgentStatus('ALERT_REROUTED');
        return;
      }

      applyEvaluation(evaluation);
      setAgentLastDecision(evaluation.reasoning_log);
      setAgentStatus('ALERT_REROUTED');
    } catch (err) {
      const fallbackEval = AgentService.evaluateLocalFailsafe('SIMULATE_FLOOD', initialAssetsData);
      applyEvaluation(fallbackEval);
      setAgentLastDecision(fallbackEval.reasoning_log);
      setAgentStatus('ALERT_REROUTED');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Simulate Heatwave Trigger
  const handleSimulateHeatwave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAgentStatus('PROCESSING');
    setActiveScenario('HEATWAVE');

    try {
      const evaluation = AgentService.evaluateLocalFailsafe('SIMULATE_HEATWAVE', initialAssetsData);
      applyEvaluation(evaluation);
      setAgentLastDecision(evaluation.reasoning_log);
      setAgentStatus('ALERT_REROUTED');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Simulate Water Pollution Trigger
  const handleSimulatePollution = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAgentStatus('PROCESSING');
    setActiveScenario('POLLUTION');

    try {
      const evaluation = AgentService.evaluateLocalFailsafe('SIMULATE_POLLUTION', initialAssetsData);
      applyEvaluation(evaluation);
      setAgentLastDecision(evaluation.reasoning_log);
      setAgentStatus('ALERT_REROUTED');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Simulate Stroller Emergency Trigger
  const handleSimulateStroller = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAgentStatus('PROCESSING');
    setActiveScenario('STROLLER');

    try {
      const evaluation = AgentService.evaluateLocalFailsafe('SIMULATE_STROLLER', initialAssetsData);
      applyEvaluation(evaluation);
      setAgentLastDecision(evaluation.reasoning_log);
      setAgentStatus('ALERT_REROUTED');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to apply evaluation results to assets state
  const applyEvaluation = (evalResult) => {
    const targetHaven = initialAssetsData.find((a) => a.id === evalResult.fallback_asset_id);

    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id === evalResult.affected_trip_id) {
          return {
            ...asset,
            status: 'REROUTED',
            rerouteTarget: targetHaven || { id: evalResult.fallback_asset_id, name: 'Safe Haven' },
            agentSummary: evalResult.reasoning_log,
          };
        }
        return asset;
      })
    );

    setActiveRoute({
      from: evalResult.affected_trip_id,
      to: evalResult.fallback_asset_id,
    });

    setSelectedAssetId(evalResult.affected_trip_id);
  };

  // 3. Clear Trigger
  const handleClear = () => {
    setAssets(
      initialAssetsData.map((asset) => ({
        ...asset,
        status: asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven' ? 'SAFE HAVEN' : 'SAFE',
        rerouteTarget: null,
        agentSummary: null,
      }))
    );
    setActiveRoute(null);
    setSelectedAssetId(null);
    setShowNationalRadar(false);
    setIsAgentModalOpen(false);
    setSelectedDayIndex(getDefaultDayIndex());
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAgeFilter('all');
    setActiveScenario('NORMAL');
    setAgentStatus('ONLINE');
    setAgentLastDecision(`כל ${initialAssetsData.length} השמורות והמסלולים נסרקו ונמצאו בטוחים לפעילות ללא סיכוני מזג אוויר.`);
  };

  const RAIL_TABS = [
    { id: 'trails', icon: Mountain, label: 'מסלולים' },
    { id: 'map', icon: Map, label: 'מפה' },
    { id: 'settings', icon: Settings, label: 'הגדרות' },
  ];

  return (
    <div className={`fixed inset-0 flex flex-col bg-brand-deep text-[var(--text-primary)] overflow-hidden font-body select-none ${isLightMode ? 'light' : ''}`}>
      {/* ── Full-Width Map (100% Screen) ─────────────────── */}
      <div className="w-full h-full relative z-10">
        <TacticalMap
          assets={filteredAssets}
          activeRoute={activeRoute}
          selectedAssetId={selectedAssetId}
          onSelectAsset={(id) => {
            setSelectedAssetId(id);
            setShowNationalRadar(false);
          }}
          onCloseCard={() => setSelectedAssetId(null)}
          activeScenario={activeScenario}
          selectedDayIndex={selectedDayIndex}
          showNationalRadar={showNationalRadar}
          onCloseNationalRadar={() => setShowNationalRadar(false)}
          isLightMode={isLightMode}
          recommendedAssetIds={recommendedAssetIds}
        />

        {/* Floating AI Agent & Operations Controls (Bottom-Right on Map - Mobile Responsive Hebrew RTL) */}
        <div className="absolute bottom-4 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-[1000] flex items-center justify-between sm:justify-end gap-2.5 pointer-events-auto">
          {/* Main Chatbot Trigger */}
          <button
            onClick={() => setIsChatBotOpen(true)}
            title="פתח את סוכן הטיולים החכם"
            className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm sm:text-base border backdrop-blur-2xl transition-all group active:scale-95 ${
              isLightMode
                ? 'bg-white text-teal-900 border-teal-200/60 shadow-teal-900/5 hover:bg-teal-50/50'
                : 'bg-gradient-to-r from-teal-600 via-accent-dim to-teal-700 text-white border-accent/50 hover:from-teal-500 hover:to-accent'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isLightMode ? 'bg-teal-500' : 'bg-accent-light'}`} />
            <Compass className={`w-5 h-5 group-hover:rotate-45 transition-transform ${isLightMode ? 'text-teal-600' : ''}`} />
            <div className="text-right leading-tight">
              <div>שאל את סוכן הטיולים 🧭</div>
              <div className={`text-xs font-normal ${isLightMode ? 'text-teal-600' : 'text-teal-200'}`}>תכנון מסלולים מותאם אישית</div>
            </div>
          </button>

          {/* Agent Brain & Crisis Simulations Modal Trigger */}
          <button
            onClick={() => setIsAgentModalOpen(true)}
            title="מוח הסוכן ותרחישי חירום"
            className={`h-[52px] px-3.5 rounded-2xl glass-panel flex items-center gap-2 border shadow-2xl transition active:scale-95 text-xs font-bold ${
              isLightMode
                ? 'text-teal-700 border-teal-200/60 hover:bg-teal-50/50 shadow-teal-900/5'
                : 'text-accent border-accent/30 hover:bg-white/10'
            }`}
          >
            <div className="relative">
              <Sparkles className="w-5 h-5" />
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ${isLightMode ? 'bg-teal-500' : 'bg-accent'}`} />
            </div>
            <span className="hidden sm:inline">מוח הסוכן</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            title="החלף מצב תצוגה"
            className={`h-[52px] w-[52px] rounded-2xl glass-panel flex items-center justify-center border shadow-2xl transition active:scale-95 ${
              isLightMode
                ? 'border-teal-200/60 hover:bg-teal-50/50 shadow-teal-900/5'
                : 'border-accent/30 hover:bg-white/10'
            }`}
          >
            {isLightMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Popup 1: Agent Intelligence & Operations Modal */}
      <AgentOperationsModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        agentStatus={agentStatus}
        agentLastDecision={agentLastDecision}
        onSimulateFlood={handleSimulateFlood}
        onSimulateHeatwave={handleSimulateHeatwave}
        onSimulatePollution={handleSimulatePollution}
        onSimulateStroller={handleSimulateStroller}
        onClear={handleClear}
        isProcessing={isProcessing}
      />

      {/* Popup 2: Conversational AI Hiking Bot Drawer */}
      <AgentChatBot
        isOpen={isChatBotOpen}
        onClose={() => setIsChatBotOpen(false)}
        onProposalsUpdate={(proposals) => {
          if (proposals && proposals.length > 0) {
            setRecommendedAssetIds(proposals.map((p) => p.id));
          } else {
            setRecommendedAssetIds(null);
          }
        }}
        onSelectSite={(site) => {
          setSelectedAssetId(site.id);
        }}
        assets={assets}
      />
    </div>
  );
}
