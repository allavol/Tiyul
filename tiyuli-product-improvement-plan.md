# Tiyuli — Product Improvement Plan
## For LinkedIn Portfolio / Recruiter Review
**Role Target:** AI Product Manager / AI Builder

---

## Top-Level Overview

Tiyuli ("לאן נטייל?") is a $0-cost autonomous AI hiking advisor that fuses Hebrew NLU, real-time weather data, and Israeli GIS to recommend safe, age-appropriate outdoor trips. The architecture is genuinely sophisticated (5-engine AI pipeline, 82 automated tests, crisis rerouting, multi-layer guardrails), but the product suffers from a **positioning gap**, **UX identity confusion**, and **trust-building deficits** that would prevent mainstream adoption. The improvements below treat the product as a launchable consumer app, not a technical demo.

---

## Sub-Task 1 — Fix the Product Name & Brand Positioning

**Status:** [ ] pending

### Intent
The app header says **"GeoGuard טיולים ובטיחות"** but the product is called Tiyuli. The subtitle reads *"חמ"ל טקטי לניטור איומים, מזג אוויר ו-OSINT בזמן אמת // סוכן המדריך"* — military C4I language for a **family hiking app**. This is an AI-product manager's most fundamental mistake: the vocabulary terrifies the exact users you need (parents, families, casual hikers).

**Why change is needed:** First-time users read the top bar within 3 seconds and decide whether to trust the product. "Tactical threat monitoring" and "OSINT" belong to a military ops dashboard — not a trip planner for kids. Brand anxiety triggers early abandonment.

**Strategy:** Realign the brand voice to the actual user persona (families, parents, weekend adventurers) while preserving the AI safety angle as a *benefit*, not a jargon-term.

### Solution A — Consumer-friendly rebrand (recommended)
Replace the top bar brand copy:
- **Product name:** Keep `Tiyuli` / `לאן נטייל?`
- **Subtitle:** `"ממליץ טיולים חכם · מותאם מזג אוויר · בטוח לכל הגיל"`
- Remove "GeoGuard", "חמ"ל", "OSINT", "טקטי" from all user-visible surfaces
- Replace the `Shield` icon with a `Compass` or `Mountain` icon (it currently evokes military/security)

### Solution B — Dual-mode brand (stretch)
Keep the tactical dark mode for power users who love the military aesthetic, but add a **"Family Mode"** toggle that switches the top bar language and icon set to friendly consumer vocabulary.

### Expected Outcomes
- Top bar copy reflects consumer use case
- No military/security jargon visible to end users
- Brand icon matches product category

### Relevant Context
- `src/components/LuxeTopBar.jsx` lines 28–53 — brand name and subtitle hardcoded
- `index.html` — page `<title>` tag
- `tailwind.config.js` — brand color names

---

## Sub-Task 2 — Establish a Real First-Run Onboarding Flow

**Status:** [ ] pending

### Intent
The app boots directly to a full-screen dark map with no explanation of what to do. New users see 19 green pins on a map with zero context about the AI agent. The chat drawer is hidden behind a small bottom-right button. Discoverability of the core value prop (conversational AI trip planning) is near zero.

**Why change is needed:** A product that starts with "here is a map of Israel" misses the activation moment. Users who don't discover the AI agent will treat this as a static hiking directory — and judge it as inferior to Waze or Google Maps.

**Strategy:** Create a lightweight onboarding overlay that (a) names the AI agent, (b) shows one sample conversation, and (c) invites the user to try it — all dismissible in one tap.

### Solution A — Welcome modal with sample query (recommended)
A centered modal on first visit (localStorage flag `tiyuli_onboarded`):
- Headline: "שלום! 👋 אני מדריך הטיולים החכם שלך"
- Animated sample conversation (pre-rendered) showing: user types "טיול עם ילד בן 4 בצפון מחר" → agent responds with 3 site proposals
- One big CTA button: "בוא נמצא טיול 🧭" → opens the chat drawer
- Small "כבר יודע" dismiss link

### Solution B — Tooltip-based coach marks
4 sequential contextual tooltips pointing to:
1. Map pins → "19 שמורות טבע מאומתות"
2. Chat button → "שאל את הסוכן בשפה חופשית"
3. Age filter → "סנן לפי גיל הילדים שלך"
4. Scenario buttons → "בדוק מה יקרה אם יש שיטפון"

### Expected Outcomes
- First-time user understands the AI agent exists within 5 seconds
- Chat drawer open rate increases from near-zero (cold boot) to measurable
- `localStorage` flag prevents repeat display

### Relevant Context
- Chat drawer entry point: `src/components/AgentChatBot.jsx` — `isOpen` prop controlled from App
- No current onboarding code exists anywhere in `src/components/`

---

## Sub-Task 3 — Surface AI Recommendations as the Primary UI, Not a Hidden Drawer

**Status:** [ ] pending

### Intent
The AI agent is the product's entire differentiation, but it lives inside a collapsed drawer in the bottom-right corner. The map dominates 100% of the visible area. A user who doesn't know to click "שאל סוכן" will never experience the AI.

**Why change is needed:** The layout hierarchy communicates "map app with a chatbot bolted on" instead of "AI advisor with a map as supporting context." This is a classic build-first vs. design-for-user-mental-model mistake.

**Strategy:** Flip the layout: make AI recommendations the primary left-panel content at app load, with the map as the supporting right panel. This is the layout pattern used by Booking.com, Airbnb, and every successful search-with-map product.

### Solution A — Split-pane layout: AI panel left + Map right (recommended)
- Desktop: 380px left pane (AI chat + site list), remaining width for map
- Mobile: Bottom sheet that covers 60% of screen by default (map visible behind)
- Left pane shows the welcome message and quick options immediately on load
- The "close chat" button shrinks the pane to an icon rail, it doesn't hide it entirely

### Solution B — AI-first landing state (moderate change)
Keep the full-screen map, but add a persistent **hero prompt bar** across the bottom (like Google Maps' search bar) that says: `"לאן לטייל? ספר לי על הטיול שאתה מתכנן..."` — clicking it expands into the full chat experience. The map is visible but not the sole focus.

### Expected Outcomes
- AI agent is visible and accessible without any interaction on cold load
- Users can see site recommendations without having to ask
- Map remains discoverable and interactive

### Relevant Context
- `src/components/AgentChatBot.jsx` — currently a floating drawer, not a panel
- `src/components/TacticalMap.jsx` — full-screen, no room for side panel currently
- `src/components/SiteChunkyCard.jsx` — would populate the left panel list

---

## Sub-Task 4 — Replace Inline Styles with Consistent Design Tokens

**Status:** [ ] pending

### Intent
`LuxeTopBar.jsx` is built entirely with inline `style={{}}` objects, while `SiteChunkyCard.jsx` uses Tailwind classes. The mix of two styling systems causes visual inconsistency and makes theming (dark/light mode) fragile — inline styles completely bypass the CSS variable system defined in `src/index.css`.

**Why change is needed:** This is not cosmetic — the light mode toggle partially breaks for the top bar because the CSS `.light {}` overrides don't apply to inline styles. The technical debt also makes future theme changes require editing two systems.

**Strategy:** Migrate `LuxeTopBar.jsx` to use Tailwind classes and CSS variables, matching the pattern already established in `SiteChunkyCard.jsx`.

### Solution A — Full Tailwind migration of LuxeTopBar (recommended)
Replace all `style={{...}}` in `LuxeTopBar.jsx` with Tailwind classes:
- `backgroundColor: '#12161f'` → `bg-[#12161f]` or `bg-brand-deep`
- `borderBottom` → `border-b border-white/[0.08]`
- Adds light-mode compatibility automatically via CSS variables

### Solution B — Scoped CSS module for LuxeTopBar
Create `LuxeTopBar.module.css` using CSS variables for colors, keeping specificity isolated.

### Expected Outcomes
- Light/dark mode toggle works consistently across the entire UI
- Single source of truth for design tokens
- No inline style objects that bypass theming

### Relevant Context
- `src/components/LuxeTopBar.jsx` — entire file is inline styles
- `src/index.css` — CSS variables defined but not used in top bar
- `tailwind.config.js` — custom `brand-` color tokens available

---

## Sub-Task 5 — Add Site Photos / Visual Identity to Cards

**Status:** [ ] pending

### Intent
`SiteChunkyCard.jsx` and `FloatingMapCard.jsx` show site name, age badge, and weather pills — but no photo. In a product competing for attention against Google Maps (street view) and Waze (satellite), text-only cards feel like a 2010 database export. Users rely heavily on visual context when choosing an outdoor destination.

**Why change is needed:** The psychological decision pathway for outdoor trips is: *see it → want it → plan it*. Text-only cards short-circuit step 1. A photo converts a data point into a destination.

**Strategy:** Add a photo URL field to `assets_db.json` and render a hero image in site cards. Use Wikimedia Commons (free, no API key) or pre-downloaded static images committed to the repo.

### Solution A — Static hero images from Wikimedia Commons (recommended, $0 cost)
1. Add `"photo_url": "https://upload.wikimedia.org/..."` field to each of the 19 assets in `assets_db.json`
2. Add a 16:9 (or 2:1) image slot at the top of `SiteChunkyCard.jsx` and `FloatingMapCard.jsx`
3. Fallback: placeholder gradient using the site's `region_group` color if photo unavailable

### Solution B — Region-based illustrated backgrounds
Design 4 illustrated SVG headers (North/Center/Jerusalem/South) embedded as data URIs — no network dependency, offline-capable, visually distinctive per region.

### Expected Outcomes
- Every site card shows a visual above the text
- `assets_db.json` extended with `photo_url` field
- Graceful fallback for missing images

### Relevant Context
- `assets_db.json` — 19 entries, no photo field currently
- `src/components/SiteChunkyCard.jsx` — card layout
- `src/components/FloatingMapCard.jsx` — detail card layout

---

## Sub-Task 6 — Fix Test Brittleness: Add Missing Edge Cases

**Status:** [ ] pending

### Intent
The test suite reports 82 tests passing, but the user reports "I keep finding more issues." This signals the tests are **coverage-wide but not depth-tested** — they verify happy paths and documented edge cases but don't cover the unpredictable space of real Hebrew input variation.

**Why change is needed:** A test suite that passes 100% but still lets bugs through is not doing its job. The gap is in **semantic equivalence testing** — different phrasings that mean the same thing, and near-miss inputs that should succeed but fall into the wrong branch.

**Strategy:** Audit the golden dataset for coverage gaps; add at least 20 new test cases in three categories: (1) synonym/rephrase resilience, (2) mixed Hebrew+numbers, (3) ambiguous age expressions.

### Solution A — Expand golden_dataset_eval with semantic equivalence pairs (recommended)
For every canonical query in `tests/golden_dataset_eval.test.js`, add 2–3 paraphrase variants:
- "טיול עם ילד בן 4" → also test "ילד ב-4" / "בן ארבע שנים" / "4 שנים"
- "מחר" → also test "בש.ב הקרוב" / "שישי" / "סוף השבוע"
- Water exclusion: "בלי מים" → also test "לא ליד נחל" / "לא מים" / "יבש בלבד"

### Solution B — Property-based testing with random Hebrew input generation
Use a small Hebrew word bank generator to produce randomized valid queries and assert that the parser never throws an unhandled exception (even if the recommendation is wrong, it should never crash or loop).

### Expected Outcomes
- 20+ new test cases added to `golden_dataset_eval.test.js`
- CI catches regressions on paraphrase variants, not just canonical queries
- Zero unhandled-exception paths under fuzz

### Relevant Context
- `tests/golden_dataset_eval.test.js` — 53 existing golden queries
- `src/services/agent/AgentNLUParser.js` — 1,931 lines, many regex branches
- `tests/agent_modules.test.js` — unit tests for individual parsers

---

## Sub-Task 7 — Add a "Why This Site?" Explainability Row to Every Recommendation

**Status:** [ ] pending

### Intent
The AI engine generates XAI rationale internally (in `AgentRulesEngine.js`), but this reasoning is mostly surfaced only in the C4I modal (which users rarely open). The site cards show age badge and weather pill, but not *why the agent chose this specific site for this specific family*.

**Why change is needed:** Users don't trust a black-box recommendation. "The AI said so" doesn't drive booking intent. A one-line explainability row ("✅ מתאים לגיל 4+ · נחל זורם · 38 ק"מ מתל אביב · צפי חמישה בעלי לב") builds trust and differentiates from a static list.

**Strategy:** Extract the top 3 ranking signals from `AgentRulesEngine.js` per site and render them as a compact chip row below the site name in cards.

### Solution A — Inline reason chips on proposal cards (recommended)
In `SiteChunkyCard.jsx` when the card is a proposal (agent-recommended):
- Render 2–3 teal `teal-chip` tags showing: `✅ גיל 4+`, `💧 נחל`, `📍 38 ק"מ`, `☀️ מזג אוויר מתאים`
- Source: `asset._matchReasons[]` array passed from the agent

### Solution B — Expandable "explain" section
Add a `▾ למה הסוכן בחר אתר זה?` collapse/expand row at the bottom of each proposal card revealing the full XAI paragraph from the agent.

### Expected Outcomes
- Every agent proposal has at least 2 visible match reasons
- Users can see the reasoning without opening the C4I modal
- Agent `AgentRulesEngine` outputs `_matchReasons` array per result

### Relevant Context
- `src/services/agent/AgentRulesEngine.js` — scoring logic that generates rationale
- `src/components/SiteChunkyCard.jsx` — card render
- `src/components/AgentChatBot.jsx` — proposal rendering in chat

---

## Sub-Task 8 — UI Design Overhaul: Two Design Directions + HTML Mockups

**Status:** [ ] pending

### Intent
The current UI is technically functional but visually communicates "developer built this for developers." Common AI-generated UI symptoms present: excessive glassmorphism, teal-on-dark everywhere, military badge language, and no visual hierarchy between hero content and supporting data. For LinkedIn presentation, the UI needs to be portfolio-worthy.

**Why change is needed:** A recruiter or PM evaluating this product will form their visual impression in 5 seconds. A UI that looks like a dark monitoring dashboard will not be associated with a consumer-facing AI product vision — regardless of the sophistication of the underlying engine.

**Strategy:** Two distinct design directions to choose from. Both preserve the existing component structure (minimal code change), achieved via Tailwind class and CSS variable changes.

---

### Design Direction A — "Trailhead" (Warm Nature Aesthetic)

**Philosophy:** Nature-inspired warmth that makes hiking destinations feel inviting rather than tactical. Think REI meets Alltrails meets Apple Maps.

**Color System:**
- Background: `#1A1814` (warm near-black, earthy)
- Card: `#252118` (warm dark brown)
- Accent: `#F59E0B` → `#D97706` (amber/golden — sunrise palette)
- Text primary: `#FEF3C7` (warm cream)
- Text secondary: `#A8956B` (warm tan)
- Status safe: `#22C55E` (green, unchanged — universal)
- Status danger: `#EF4444` (red, unchanged)
- Map: Replace dark military filter with a warm sepia-tone OpenStreetMap style

**Typography:**
- Headlines: Heebo 800 (already loaded)
- Body: Rubik 400 (already loaded)
- Drop: JetBrains Mono (keep for data only)

**Component Changes:**
- Top bar: amber gradient logo mark (🏕️ or mountain SVG), warmer subtitle copy
- Site cards: rounded-2xl, amber border-on-hover, warm card background
- Chat drawer: cream/warm background instead of charcoal, amber send button
- Map pins: orange filled circles instead of teal, warm glow shadow
- Age badges: earth tones (terracotta/sage/ochre/rust)

**Mockup file:** `mockup-trailhead.html`

---

### Design Direction B — "Clarity" (Clean Minimal, Light-First)

**Philosophy:** Light, airy, trustworthy — like Notion meets Google Maps meets an Apple product. Maximum readability, minimum decoration. Emphasizes content over chrome.

**Color System:**
- Background: `#F8FAFC` (off-white)
- Card: `#FFFFFF` (pure white)
- Card border: `#E2E8F0` (light gray)
- Accent: `#0EA5E9` (sky blue — approachable, modern, trust-building)
- Text primary: `#0F172A` (near-black)
- Text secondary: `#64748B` (slate)
- Status safe: `#16A34A` (darker green for contrast on white)
- Status danger: `#DC2626`
- Map: Standard OpenStreetMap tiles (no filter), with blue boundary overlays

**Typography:**
- Headlines: Rubik 700
- Body: Inter 400
- Scale: 13/14/16/20/24 (tighter, editorial)

**Component Changes:**
- Top bar: white background, thin bottom border, no box shadow — content-first
- Site cards: white cards, subtle gray border, blue accent on hover
- Chat drawer: full white panel, standard input field (not glassmorphic)
- Map pins: blue filled circles with white outline
- Sidebar: left-aligned panel with clean label typography
- Remove all `backdrop-blur` effects (they add visual noise, not value)

**Mockup file:** `mockup-clarity.html`

---

### Expected Outcomes
- Two HTML mockup files created showing each design direction
- Each mockup renders the key screens: top bar + left panel + map + site card
- Zero new dependencies needed (HTML + inline CSS + Google Fonts)

### Relevant Context
- `src/index.css` — CSS variables to remap
- `src/components/LuxeTopBar.jsx` — top bar
- `src/components/SiteChunkyCard.jsx` — site card
- `tailwind.config.js` — brand color tokens

---

## Implementation Priority Order

| # | Sub-Task | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | Brand/Positioning Fix | 🔴 Critical | Low | P0 |
| 2 | Onboarding Flow | 🔴 Critical | Medium | P0 |
| 3 | Layout Flip (AI First) | 🟠 High | High | P1 |
| 8 | UI Design Mockups | 🟠 High | Medium | P1 |
| 7 | Explainability Chips | 🟡 Medium | Low | P2 |
| 5 | Site Photos | 🟡 Medium | Low | P2 |
| 4 | Style System Fix | 🟡 Medium | Medium | P2 |
| 6 | Test Depth Expansion | 🟡 Medium | Medium | P2 |

---

## What This Plan Does NOT Cover

- Backend/database changes (out of scope for $0 cost constraint)
- Multi-language (English/Arabic) support — separate initiative
- Native mobile app (React Native) — separate initiative
- Voice input — separate initiative
- Real OSRM travel time integration — already in backlog (baal.md Sprint 3)
