---
name: evaluate-asset-risk
description: >-
  Cross-references current weather and OSINT data against an asset's known vulnerabilities in assets_db.json.
  Returns the risk tier (SAFE, WARNING, CRITICAL) and any vulnerability triggered.
---

# evaluate_asset_risk

Cross-references weather and OSINT observations against an asset's vulnerability profile loaded from `assets_db.json`.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `asset_id` | int | Yes | Unique ID of the asset in the database. |
| `weather_data` | object | Yes | Weather data output from `fetch_weather_osint`. |

## Vulnerability Matching Rules

1. **CRITICAL**:
   - An active alert or high precipitation directly triggers one of the asset's listed `vulnerabilities` (e.g., Asset has `"Flash Floods"` and weather has `"Flash Floods"` or `"Heavy Rain"` for a `"Water"` type asset).
2. **WARNING**:
   - Elevated conditions exist (e.g., `"High Winds"` or ambient temperature > 40°C) without a direct critical vulnerability match.
3. **SAFE**:
   - No adverse weather alerts match the asset's vulnerability thresholds.

## Returns

```json
{
  "risk_level": "CRITICAL",
  "vulnerability_triggered": "Flash Floods"
}
```

- **`risk_level`** (string): `"SAFE"`, `"WARNING"`, or `"CRITICAL"`.
- **`vulnerability_triggered`** (string): Name of the matching vulnerability triggered, or `"None"`.

## Usage Example

### Python Invocation
```python
from skills.evaluate_asset_risk import evaluate_asset_risk

weather_data = {
    "temperature": 23.0,
    "precipitation_risk": "HIGH",
    "active_alerts": ["Flash Floods"]
}

evaluation = evaluate_asset_risk(asset_id=103, weather_data=weather_data)
# Returns: {"risk_level": "CRITICAL", "vulnerability_triggered": "Flash Floods"}
```
