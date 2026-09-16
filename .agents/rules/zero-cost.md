# Rule: Hardcoded Zero-Cost Constraint ($0 Operating Cost)

**Scope**: Entire repository (`Tyul`), all agents, services, and pipelines.

## Mandatory Directives:

1. **Local LLM Only ($0)**:
   - All AI/LLM evaluation must run locally via Ollama (`http://127.0.0.1:11434/api/generate` with Llama 3 or compatible open models) or deterministic failsafe heuristics.
   - Do NOT use paid OpenAI, Anthropic, or billable cloud APIs.

2. **Open / Free Map Tiles ($0)**:
   - Use CartoDB Dark Matter free tier tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`) or standard OpenStreetMap.
   - Do NOT integrate paid Google Maps JavaScript API, Mapbox billable tokens, or any service requiring a credit card or per-tile charges.

3. **Weather & OSINT Telemetry ($0)**:
   - Rely primarily on local deterministic tactical simulations.
   - Any external weather telemetry must remain strictly within 100% free-tier limits without risk of overage charges.

4. **Zero Cloud Infrastructure Billing ($0)**:
   - Run purely client-side and locally on the host machine.
   - No provisioned cloud VMs, managed cloud databases, or billable cloud serverless functions.
