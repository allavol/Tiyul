# AGENTS.md - Repository Operational Rules

## Hardcoded Rule: Zero-Cost Operating Constraint ($0 Cost)

All agents and engineers operating in this repository must strictly adhere to a **$0 total cost policy**:

1. **AI / LLMs**: Use only local LLMs (Ollama / Llama 3 via `http://127.0.0.1:11434`) or local rule heuristics. Never invoke paid cloud endpoints.
2. **Maps & GIS**: Use only free basemap tiles (CartoDB Dark Matter / OpenStreetMap). Never use paid Mapbox or Google Maps Platform keys.
3. **Weather / OSINT**: Use deterministic local scenario simulation or free-tier APIs without overage risk.
4. **Hosting & Compute**: Run completely client-side in Vite and on local Python runtimes. No billable cloud resources.
