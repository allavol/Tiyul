---
name: ingest-verified-sites
description: Ingests candidate hiking sites and trails into assets_db.json after strict zero-hallucination verification (Authority ID, Israel BBox, LineString geometry, Haversine <150m deduplication, and fuzzy name similarity).
---

# Ingest Verified Sites Skill (Zero-Hallucination Guardrails)

## Purpose
Prevents hallucinated or duplicate assets from entering the GeoGuard system. Adheres strictly to the **$0 total cost policy** and local rule heuristics.

## Guardrail Gates
1. **Authority ID Verification**: Candidate must possess a verifiable ID from INPA (`INPA-*`), KKL (`KKL-*`), OpenStreetMap (`OSM-NODE-*`, `OSM-WAY-*`, `OSM-REL-*`), or Wikidata (`WIKIDATA-Q*`).
2. **Israel Geospatial BBox**: Latitude in `[29.40, 33.40]`, Longitude in `[34.20, 35.90]`.
3. **Geometry Validation**: Trails must have a LineString sequence of at least 5 coordinate waypoints.
4. **Spatial Deduplication**: Rejects any candidate located within 150 meters of an existing asset.
5. **Fuzzy Token Deduplication**: Rejects candidate if normalized name matches an existing asset with >=75% token similarity within 3km.

## Usage (Python)
```python
from skills.ingest_verified_sites import ingest_candidate_site, verify_site_guardrails

result = ingest_candidate_site(candidate, db_path="assets_db.json")
if result["status"] == "ACCEPTED":
    print("Site added safely:", result["site_id"])
else:
    print("Rejected by guardrails:", result["reasons"])
```
