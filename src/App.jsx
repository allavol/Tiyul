import React, { useState, useMemo } from 'react';
import { Compass, Sparkles } from 'lucide-react';
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

  // Filtered & Sorted Assets Pipeline
  const filteredAssets = useMemo(() => {
    // 0. If AI Bot recommendations are active, display ONLY them!
    if (recommendedAssetIds && recommendedAssetIds.length > 0) {
      return assets.filter((asset) => recommendedAssetIds.includes(asset.id));
    }

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
          // Stroller-accessible & toddler routes only
          if (asset.min_age !== 0) return false;
        } else if (reqAge === 4) {
          // Suitable for 4-year-olds (includes 0+ stroller routes & 4+ family trails)
          if (asset.min_age > 4) return false;
        } else if (reqAge === 7) {
          // Suitable for 7-year-olds (includes 0+, 4+, and 7+)
          if (asset.min_age > 7) return false;
        } else if (reqAge === 10) {
          // Challenging routes requiring 10+
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

  return (
    <div className="w-screen h-screen flex flex-row bg-[#0c0d12] text-zinc-100 overflow-hidden font-sans select-none relative">
      {/* Right Sidebar (approx 30% width, min 340px, max 420px) */}
      <div className="w-[30%] min-w-[340px] max-w-[420px] h-full relative z-20 flex-shrink-0">
        <TacticalSidebar
          assets={filteredAssets}
          selectedAssetId={selectedAssetId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedAgeFilter={selectedAgeFilter}
          onAgeFilterChange={setSelectedAgeFilter}
          onSelectAsset={(id) => {
            setSelectedAssetId(id);
            setShowNationalRadar(false);
          }}
          isProcessing={isProcessing}
          agentStatus={agentStatus}
          selectedDayIndex={selectedDayIndex}
          onSelectDayIndex={setSelectedDayIndex}
          onOpenAgentModal={() => setIsAgentModalOpen(true)}
          onOpenChatBot={() => setIsChatBotOpen(true)}
        />
      </div>

      {/* Main Map Area (approx 70% width) */}
      <div className="flex-1 h-full relative z-10">
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
        />

        {/* Active AI Recommendation Filter Banner (Top Center on Map) */}
        {recommendedAssetIds && recommendedAssetIds.length > 0 && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000] bg-[#0c0e14]/96 border border-emerald-500/60 py-2 px-4 rounded-full shadow-2xl backdrop-blur-2xl flex items-center gap-3 text-xs font-bold text-white animate-fade-in pointer-events-auto">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Sparkles className="w-4 h-4 animate-spin-slow text-emerald-400" />
              <span>מציג {filteredAssets.length} מסלולים מומלצים ע״י סוכן הטיולים</span>
            </span>
            <button
              onClick={() => setRecommendedAssetIds(null)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-full text-[11px] transition flex items-center gap-1 border border-zinc-700 shadow"
            >
              <span>הצג את כל האתרים</span>
              <span>↺</span>
            </button>
          </div>
        )}

        {/* Floating AI Agent Trigger Button (Bottom-Left on Map) */}
        <button
          onClick={() => setIsChatBotOpen(true)}
          title="פתח את סוכן הטיולים החכם"
          className="absolute bottom-6 left-6 z-[1000] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs sm:text-sm border border-emerald-400/50 backdrop-blur-2xl transition-all group pointer-events-auto"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping"></span>
          <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          <div className="text-right leading-tight">
            <div>שאל את סוכן הטיולים 🧭</div>
            <div className="text-[10px] text-emerald-200 font-normal">תכנון מסלולים מותאם אישית</div>
          </div>
        </button>
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
