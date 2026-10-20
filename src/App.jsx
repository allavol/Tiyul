import React, { useState, useMemo, useEffect } from 'react';
import { Compass, Sun, Moon, ShieldAlert } from 'lucide-react';
import initialAssetsData from '../assets_db.json';
import TacticalMap from './components/TacticalMap';
import MapErrorBoundary from './components/MapErrorBoundary';
import AgentOperationsModal from './components/AgentOperationsModal';
import AgentChatBot from './components/AgentChatBot';
import LuxeTopBar from './components/LuxeTopBar';
import OnboardingModal from './components/OnboardingModal';
import { AgentService } from './services/AgentService';
import { getDefaultDayIndex, isWaterAsset } from './utils/weatherUtils';

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
  const [chatBotQueryTrigger, setChatBotQueryTrigger] = useState(null);
  const [isLightMode, setIsLightMode] = useState(true);

  // ── Region filter (for LuxeTopBar) ──
  const [selectedRegion, setSelectedRegion] = useState('all');

  // ── Visit date & forecast horizon ──
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const daysAhead = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(visitDate); target.setHours(0,0,0,0);
    return Math.round((target - today) / 86400000);
  }, [visitDate]);
  const isOutOfHorizon = daysAhead > 5;

  // ── Onboarding ──
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('tiyuli_onboarded'); } catch { return true; }
  });
  const handleDismissOnboarding = () => {
    try { localStorage.setItem('tiyuli_onboarded', '1'); } catch {}
    setShowOnboarding(false);
  };
  const handleOnboardingCTA = () => {
    try { localStorage.setItem('tiyuli_onboarded', '1'); } catch {}
    setShowOnboarding(false);
    setIsChatBotOpen(true);
  };

  // Finding H5: Full keyboard navigation (Escape closes topmost modal/drawer)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAgentModalOpen) {
          setIsAgentModalOpen(false);
        } else if (isChatBotOpen) {
          setIsChatBotOpen(false);
        } else if (selectedAssetId) {
          setSelectedAssetId(null);
        } else if (showNationalRadar) {
          setShowNationalRadar(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAgentModalOpen, isChatBotOpen, selectedAssetId, showNationalRadar]);

  // Trigger conversational agent briefing for a specific site
  const handleAskAgentAboutSite = (asset) => {
    setIsChatBotOpen(true);
    setChatBotQueryTrigger(`ספר לי על ${asset.name}`);
  };

  // Filtered & Sorted Assets Pipeline
  const filteredAssets = useMemo(() => {
    let list = assets.filter((asset) => {
      // 1. Smart Search Anchor Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = asset.name?.toLowerCase().includes(q) || asset.name_en?.toLowerCase().includes(q);
        const matchRegion = asset.region?.toLowerCase().includes(q) || asset.region_group?.toLowerCase().includes(q);
        const matchType = asset.type?.some((t) => t.toLowerCase().includes(q));
        const matchDesc = asset.description?.toLowerCase().includes(q);

        // Smart keyword anchors
        const isStrollerQuery = q.includes('עגל') || q.includes('נגיש') || q === '0' || q === '0+';
        const matchStroller = isStrollerQuery && (asset.stroller_accessible || asset.min_age === 0);

        const isWaterQuery = q.includes('מים') || q.includes('מעיין') || q.includes('נחל') || q.includes('שכשוך') || q.includes('בריכ');
        const matchWater = isWaterQuery && isWaterAsset(asset);

        const isForestQuery = q.includes('יער') || q.includes('חורש') || q.includes('צל') || q.includes('מוצל');
        const matchForest = isForestQuery && (asset.type?.some(t => t.includes('חורש') || t.includes('יער')) || asset.category === 'forest');

        const isAntiquityQuery = q.includes('עתיק') || q.includes('ארכיאולוג') || q.includes('מבצר') || q.includes('מורשת');
        const matchAntiquity = isAntiquityQuery && (asset.type?.some(t => t.includes('ארכיאולוגיה') || t.includes('עתיקות') || t.includes('מורשת') || t.includes('מבצר')));

        const isDesertQuery = q.includes('מדבר') || q.includes('נגב') || q.includes('דיונ') || q.includes('ערבה');
        const matchDesert = isDesertQuery && (asset.region_group === 'south' || asset.type?.some(t => t.includes('מדבר')));

        const isFreeQuery = q.includes('חינם') || q.includes('ללא תשלום');
        const matchFree = isFreeQuery && (!asset.entry_fee || asset.entry_fee.includes('חינם'));

        // Age number match (e.g. "4", "7", "10")
        const ageMatch = q.match(/\b(0|4|7|10|12)\b/);
        const matchAge = ageMatch ? asset.min_age <= Number(ageMatch[1]) : false;

        if (!matchName && !matchRegion && !matchType && !matchDesc && !matchStroller && !matchWater && !matchForest && !matchAntiquity && !matchDesert && !matchFree && !matchAge) {
          return false;
        }
      }

      // 2. Region filter
      if (selectedRegion !== 'all' && asset.region_group !== selectedRegion) return false;

      // 3. Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'safe_haven') {
          const isHaven = asset.vulnerabilities?.includes('Safe Haven') || asset.category === 'safe_haven';
          if (!isHaven) return false;
        } else if (selectedCategory === 'spni') {
          if (asset.category !== 'spni' && !asset.org?.includes('החברה להגנת הטבע')) return false;
        } else if (selectedCategory === 'water') {
          if (!isWaterAsset(asset)) return false;
        } else if (asset.category !== selectedCategory) {
          return false;
        }
      }

      // 4. Minimum Age filter
      if (selectedAgeFilter !== 'all') {
        const reqAge = Number(selectedAgeFilter);
        if (reqAge === 0) {
          if (asset.min_age !== 0 && !asset.stroller_accessible) return false;
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
  }, [assets, searchQuery, selectedRegion, selectedCategory, selectedAgeFilter, recommendedAssetIds]);

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
    setSelectedRegion('all');
    setSelectedCategory('all');
    setSelectedAgeFilter('all');
    setActiveScenario('NORMAL');
    setAgentStatus('ONLINE');
    setAgentLastDecision(`כל ${initialAssetsData.length} השמורות והמסלולים נסרקו ונמצאו בטוחים לפעילות ללא סיכוני מזג אוויר.`);
  };


  return (
    <div className={`fixed inset-0 flex flex-col bg-brand-deep text-[var(--text-primary)] overflow-hidden font-body select-none ${isLightMode ? 'light' : ''}`}>

      {/* ── Top Bar (full width) ── */}
      <LuxeTopBar
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDifficulty={selectedAgeFilter}
        onDifficultyChange={setSelectedAgeFilter}
        visitDate={visitDate}
        daysAhead={daysAhead}
        isOutOfHorizon={isOutOfHorizon}
        onDateChange={setVisitDate}
        onClear={handleClear}
        isProcessing={isProcessing}
        totalAssetsCount={initialAssetsData.length}
        visibleAssetsCount={filteredAssets.length}
      />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── AI Panel: visible on desktop (md+), hidden on mobile ── */}
        <aside className={`hidden md:flex md:w-[400px] lg:w-[440px] flex-shrink-0 flex-col border-l overflow-hidden z-[1000] relative ${
          isLightMode
            ? 'border-slate-300/90 shadow-[-10px_0_24px_rgba(0,0,0,0.16)] bg-white'
            : 'border-white/[0.12] shadow-[-14px_0_36px_rgba(0,0,0,0.65)] bg-brand-card'
        }`}>
          <AgentChatBot
            isOpen={true}
            onClose={() => {}}
            isLightMode={isLightMode}
            isPanelMode={true}
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
            queryTrigger={chatBotQueryTrigger}
            onClearQueryTrigger={() => setChatBotQueryTrigger(null)}
          />
        </aside>

        {/* ── Map Panel ── */}
        <div className="flex-1 relative z-10 min-w-0">
          <MapErrorBoundary>
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
              onAskAgentAboutSite={handleAskAgentAboutSite}
              onClearRecommendations={() => setRecommendedAssetIds(null)}
            />
          </MapErrorBoundary>

          {/* ── Mobile-only floating controls (bottom-right on map) ── */}
          <div className="absolute bottom-4 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-[1000] flex items-center justify-between sm:justify-end gap-2.5 pointer-events-auto md:hidden">
            {/* Mobile chat trigger */}
            <button
              onClick={() => setIsChatBotOpen(true)}
              title="פתח את סוכן הטיולים החכם"
              aria-label="פתח סוכן טיולים חכם"
              className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm border backdrop-blur-2xl transition-all group active:scale-95 ${
                isLightMode
                  ? 'bg-white text-teal-900 border-teal-200/60 shadow-teal-900/5 hover:bg-teal-50/50'
                  : 'bg-gradient-to-r from-teal-600 via-accent-dim to-teal-700 text-white border-accent/50 hover:from-teal-500 hover:to-accent'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isLightMode ? 'bg-teal-500' : 'bg-accent-light'}`} />
              <Compass className={`w-5 h-5 group-hover:rotate-45 transition-transform ${isLightMode ? 'text-teal-600' : ''}`} />
              <div className="text-right leading-tight">
                <div>סוכן הטיולים 🧭</div>
                <div className={`text-xs font-normal ${isLightMode ? 'text-teal-600' : 'text-teal-200'}`}>תכנון מסלולים מותאם אישית</div>
              </div>
            </button>

            {/* Agent Brain */}
            <button
              onClick={() => setIsAgentModalOpen(true)}
              title="מוח - החלטות וספי בטיחות"
              aria-label="פתח חלון מוח וספי בטיחות"
              className={`h-[52px] px-4 rounded-2xl glass-panel flex items-center gap-2 border shadow-2xl transition active:scale-95 text-xs font-bold ${
                isLightMode
                  ? 'text-teal-800 border-teal-300 bg-white/80 hover:bg-teal-50/80 shadow-teal-900/10'
                  : 'text-accent border-accent/40 bg-brand-deep/80 hover:bg-white/10 hover:border-accent'
              }`}
            >
              <div className="relative">
                <ShieldAlert className="w-5 h-5 text-accent animate-pulse" />
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping ${isLightMode ? 'bg-teal-500' : 'bg-accent'}`} />
              </div>
              <span>מוח</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              title="החלף מצב תצוגה"
              aria-label="החלף מצב תצוגה כהה/בהיר"
              className={`h-[52px] w-[52px] rounded-2xl glass-panel flex items-center justify-center border shadow-2xl transition active:scale-95 ${
                isLightMode
                  ? 'border-teal-200/60 hover:bg-teal-50/50 shadow-teal-900/5'
                  : 'border-accent/30 hover:bg-white/10'
              }`}
            >
              {isLightMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </button>
          </div>

          {/* ── Desktop-only theme toggle + brain (top-left corner of map) ── */}
          <div className="absolute top-4 left-4 z-[1000] hidden md:flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setIsAgentModalOpen(true)}
              title="מוח - החלטות וספי בטיחות"
              className={`h-9 px-3 rounded-xl glass-panel flex items-center gap-1.5 border shadow-lg transition active:scale-95 text-xs font-bold ${
                isLightMode
                  ? 'text-teal-800 border-teal-300 bg-white/80 hover:bg-teal-50/80'
                  : 'text-accent border-accent/40 bg-brand-deep/80 hover:bg-white/10 hover:border-accent'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-accent animate-pulse" />
              <span>ניתוח סיכונים</span>
            </button>
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              title="החלף מצב תצוגה"
              className={`h-9 w-9 rounded-xl glass-panel flex items-center justify-center border shadow-lg transition active:scale-95 ${
                isLightMode
                  ? 'border-teal-200/60 hover:bg-teal-50/50'
                  : 'border-accent/30 hover:bg-white/10'
              }`}
            >
              {isLightMode ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Onboarding Modal ── */}
      {showOnboarding && (
        <OnboardingModal
          isLightMode={isLightMode}
          onDismiss={handleDismissOnboarding}
          onCTA={handleOnboardingCTA}
        />
      )}

      {/* Popup: Agent Intelligence & Operations Modal */}
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

      {/* Mobile-only: Conversational AI Hiking Bot Drawer */}
      <div className="md:hidden">
        <AgentChatBot
          isOpen={isChatBotOpen}
          onClose={() => setIsChatBotOpen(false)}
          isLightMode={isLightMode}
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
          queryTrigger={chatBotQueryTrigger}
          onClearQueryTrigger={() => setChatBotQueryTrigger(null)}
        />
      </div>
    </div>
  );
}
