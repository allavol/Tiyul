---
name: fetch-weather-osint
description: >-
  Fetches simulated or live weather and OSINT data for a specific geographic coordinate (lat, lng).
  Returns temperature, precipitation risk, and active hazard alerts for tactical threat assessment.
---

# fetch_weather_osint

Fetches real-time or simulated meteorological and OSINT situational awareness data for tactical field coordinates.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `lat` | float | Yes | Latitude of the target coordinate / asset location. |
| `lng` | float | Yes | Longitude of the target coordinate / asset location. |

## Returns

Returns a JSON object with the following schema:

```json
{
  "temperature": 24.5,
  "precipitation_risk": "HIGH",
  "active_alerts": [
    "Flash Flood Warning",
    "Heavy Rain"
  ]
}
```

- **`temperature`** (float): Current ambient temperature in Celsius.
- **`precipitation_risk`** (string): Risk tier (`"LOW"`, `"MODERATE"`, `"HIGH"`, `"SEVERE"`).
- **`active_alerts`** (list of strings): List of active weather warnings, advisories, or OSINT reports (e.g., `"Flash Floods"`, `"Extreme Heat"`, `"High Winds"`).

## Usage Example

### Python Invocation
```python
from skills.fetch_weather_osint import fetch_weather_osint

weather = fetch_weather_osint(lat=31.4655, lng=35.3884)
print(weather["active_alerts"])
# ['Flash Floods', 'Heavy Rain']
```
