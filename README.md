# לאן נטייל? — AI Hiking Advisor for Israel

> An autonomous AI trip-planning agent for Israeli families. Describe your trip in plain Hebrew — kids' ages, region, date — and the agent recommends safe, age-appropriate outdoor destinations in real time. When it detects flash-flood risk or extreme heat, it automatically reroutes to the nearest safe alternative.

**[Live Demo](https://allavol.github.io/Tiyul/)** · [![CI](https://github.com/allavol/Tiyul/actions/workflows/ci.yml/badge.svg)](https://github.com/allavol/Tiyul/actions) · [![Tests](https://img.shields.io/badge/Tests-190%2F190%20passing-brightgreen)](https://github.com/allavol/Tiyul) · [![Cost](https://img.shields.io/badge/Operating%20Cost-%240%2Fmo-emerald)](https://github.com/allavol/Tiyul)

---

## What it does

1. **Conversational AI trip planner** — type "טיול עם ילד בן 4 בצפון מחר" and receive 3 curated, safety-checked site proposals with weather, age-suitability, and rationale
2. **Real-time crisis rerouting** — click "גשם / שיטפון" and watch the agent detect the nearest flood-vulnerable site, fire a red alert, and draw a live reroute vector to the closest safe haven
3. **Age-aware recommendations** — from strollers (0+) to juniors (12+), the agent matches terrain difficulty to the youngest family member
4. **Weather fusion** — live Open-Meteo data merged with site-specific flood/heat vulnerability profiles for every recommendation

---

## Demo — Crisis Rerouting

```
User selects Ein Gedi → clicks "גשם / שיטפון"
Agent: "[סוכן הטיולים] זוהה גשם כבד באגן הניקוז של שמורת טבע עין גדי.
        האתר נחסם אוטומטית. המקלט הבטוח הקרוב: גן לאומי בית גוברין (32.9 ק"מ, ~41 דקות נסיעה)."
→ Red alert banner + animated route vector on map
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Leaflet (CartoDB Dark Matter tiles) |
| AI Agent | Local Hebrew NLU + Haversine geo-engine + rule-based crisis planner |
| Weather | Open-Meteo (free, no API key) with local simulation failsafe |
| GIS Data | INPA + KKL-JNF + OSM open data (51 verified sites) |
| Testing | Vitest · Node resilience · Python skills evals · Playwright E2E |
| Cost | **$0/month** — fully client-side, zero paid APIs |

---

## Key Engineering Features

### Hebrew NLU — no cloud LLM needed
Parses free-text Hebrew input: age expressions ("בן ארבע וחצי", "תינוק", "בן 4"), regions, dates ("מחר", "סוף השבוע", "25 בספטמבר"), typo resilience ("גלליל", "סנפליג"), multi-language input — all locally in ~2ms.

### Dynamic Crisis Engine
`AgentService.evaluateLocalFailsafe()` — given a selected site and threat type, it:
1. Filters all assets matching that vulnerability (flood / heat)
2. Runs Haversine against every `safe_haven` in the DB
3. Returns the geographically nearest safe alternative with drive-time estimate
4. No hardcoded IDs. Works for any site in any region.

### Guardrails
5-layer guardrail chain: blocks political topics, violence, out-of-Israel routing, prompt injection, and jailbreak attempts. Responds in the user's detected language.

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
```

### Tests
```bash
npm test                          # Vitest: 106/106
node tests/test_agent_bot_resilience.js   # Node resilience: 46/46
python -m unittest tests/test_skills.py  # Python skills: 22/22
npx playwright test               # E2E: 2/2
npm run build                     # Production build
```

---

## Repository Structure

```
src/
  components/       React UI components (map, chat, cards, crisis banner)
  services/
    AgentService.js       Crisis engine — dynamic flood/heat rerouting
    AgentBotService.js    Conversational AI state machine
    agent/
      AgentNLUParser.js   Hebrew NLU + typo resilience
      AgentRulesEngine.js Site scoring + XAI rationale
      AgentGeoEngine.js   Haversine radius search
      AgentCrisisEngine.js What-If simulation orchestrator
  utils/
    geoUtils.js     Haversine & drive-time estimation
    weatherUtils.js Weather fusion & heat-load scoring
assets_db.json      51 verified Israeli parks, reserves, and safe havens
tests/              106 unit + resilience + golden dataset + E2E tests
.agents/            AI agent personas and skills (BAAL, Ariel, Auditor)
```

---

## License

MIT — built as an open portfolio project.
