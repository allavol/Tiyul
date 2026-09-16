---
name: fetch-safety-incidents
description: >-
  Collects operational safety incidents in Israel including Police traffic road closures,
  flooded low-water stream crossings, and Fire & Rescue (102) emergency forest orders.
  Executes high-precision geospatial proximity intersection (Geo-fencing) against hiking assets.
---

# fetch_safety_incidents

Collects real-time operational safety and emergency feeds across Israel and correlates proximity against field hiking assets to trigger tactical reroutes.

## Data Sources
- **Israel Police (משטרת ישראל - אגף התנועה)**: Road closures, stream flash flood overflows, and blocked access arteries (e.g. Route 90, Route 40).
- **Fire & Rescue (כבאות והצלה לישראל - 102)**: Wildfire danger decrees, bans on building fires, and forced park/forest closures during severe heatwaves.
- **Geospatial Geo-fencing**: Autonomous haversine distance calculation to verify if an asset falls within the active danger radius.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `asset_lat` | float | No | Latitude of the target hiking site / asset. |
| `asset_lng` | float | No | Longitude of the target hiking site / asset. |
| `severity` | string | No | Filter by severity: `"CRITICAL"`, `"HIGH"`, `"WARNING"`. |

## Returns

```json
{
  "status": "SUCCESS",
  "total_active_incidents": 3,
  "asset_compromised": true,
  "impacted_incidents_count": 1,
  "impacted_incidents": [
    {
      "incident_id": "INC-POL-901",
      "source": "משטרת ישראל - אגף התנועה",
      "severity": "CRITICAL",
      "type": "FLOODED_CROSSING",
      "title": "חסימת כביש 90 עקב שיטפון בנחל צאלים ומצוקי דרגות",
      "distance_to_asset_km": 2.5,
      "recommended_action": "איסור נסיעה והפניית מטיילים מערבה לכיוון שפלת יהודה."
    }
  ],
  "safety_advisory": "⚠️ סכנת שטח פעילה: זוהו חסימות צירים או אירועי חירום בקרבת האתר. מומלץ לנתב לאתר חלופי."
}
```

## Python Usage Example

```python
from skills.fetch_safety_incidents import fetch_safety_incidents

# Assess safety incidents around Masada National Park
masada_incidents = fetch_safety_incidents(asset_lat=31.3156, asset_lng=35.3537)
if masada_incidents["asset_compromised"]:
    print("ALERT: Access road blocked! Reroute required.")
```
