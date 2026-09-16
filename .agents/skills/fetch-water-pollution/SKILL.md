---
name: fetch-water-pollution
description: Collects water quality advisories, bacterial contamination warnings (E. coli, leptospirosis), and stream swimming closures from Ministry of Health and Environmental Protection open feeds at $0 cost.
---

# Fetch Water Pollution Skill

## Purpose
Monitors health and environmental open data for bacterial contamination, turbidity, and swimming bans across Israeli streams, rivers, and natural springs.

## Output Schema
- `has_advisory`: bool
- `severity`: "SAFE" | "ADVISORY" | "WARNING" | "CRITICAL"
- `stream_name`: Hebrew stream name
- `status_he`: Official advisory description
- `recommendation_he`: Safety guidance for hikers and families
- `distance_km`: Distance to advisory epicentre

## Usage (Python)
```python
from skills.fetch_water_pollution import check_water_pollution

status = check_water_pollution(lat=32.9030, lng=35.6310, asset_name="נחל הזכי")
if status["has_advisory"]:
    print(f"Warning: {status['status_he']} - {status['recommendation_he']}")
```
