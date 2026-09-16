import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional


def fetch_weather_osint(
    lat: float,
    lng: float,
    mock_scenario: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetches meteorological and OSINT alert telemetry for given coordinates.
    Supports Tomorrow.io live API when TOMORROW_IO_API_KEY is present in environment,
    with deterministic fallback to tactical simulation.
    
    Args:
        lat: Latitude coordinate.
        lng: Longitude coordinate.
        mock_scenario: Optional scenario name to simulate ('flash_flood', 'heatwave', 'storm', 'clear').
        
    Returns:
        Dict containing temperature, precipitation_risk, and active_alerts.
    """
    # Explicit scenario override takes highest precedence
    if mock_scenario:
        if mock_scenario == "flash_flood":
            return {
                "temperature": 21.5,
                "precipitation_risk": "SEVERE",
                "active_alerts": ["Flash Flood Warning", "Flash Floods", "Heavy Rain"]
            }
        elif mock_scenario == "heatwave":
            return {
                "temperature": 42.0,
                "precipitation_risk": "LOW",
                "active_alerts": ["Extreme Heat", "Heat Advisory"]
            }
        elif mock_scenario == "storm":
            return {
                "temperature": 18.0,
                "precipitation_risk": "HIGH",
                "active_alerts": ["High Winds", "Storms"]
            }
        elif mock_scenario == "clear":
            return {
                "temperature": 25.0,
                "precipitation_risk": "LOW",
                "active_alerts": []
            }

    # Live Tomorrow.io API integration if configured
    api_key = os.getenv("TOMORROW_IO_API_KEY") or os.getenv("VITE_TOMORROW_IO_API_KEY") or "2HESE6nVPsY0maF3uYCOwT0B3OcAx6lu"
    if api_key and api_key != "your_tomorrow_io_api_key_here":
        try:
            url = f"https://api.tomorrow.io/v4/weather/realtime?location={lat},{lng}&apikey={api_key}&units=metric"
            req = urllib.request.Request(url, headers={"accept": "application/json", "User-Agent": "BAAL-C4I/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode("utf-8"))
                    values = payload.get("data", {}).get("values", {})
                    temp = values.get("temperature", 24.0)
                    precip_prob = values.get("precipitationProbability", 0)
                    precip_risk = "SEVERE" if precip_prob > 75 else ("HIGH" if precip_prob > 50 else ("MODERATE" if precip_prob > 25 else "LOW"))
                    alerts = []
                    if precip_prob > 60:
                        alerts.append("Heavy Rain")
                    if temp > 38.0:
                        alerts.append("Extreme Heat")
                    return {
                        "temperature": round(temp, 1),
                        "precipitation_risk": precip_risk,
                        "active_alerts": alerts,
                        "source": "Tomorrow.io Live",
                        "humidity": values.get("humidity", 50),
                        "wind_speed": values.get("windSpeed", 0)
                    }
        except Exception:
            pass  # Fallback smoothly to simulation matrix below

    # Regional simulation based on geographical coordinates (Israel Grid)
    # Judean Desert / Dead Sea basin (lat 31.0 to 31.8, lng 35.2 to 35.6)
    if 31.0 <= lat <= 31.8 and 35.2 <= lng <= 35.6:
        # Ein Gedi / Masada region - default baseline simulation
        return {
            "temperature": 26.0,
            "precipitation_risk": "HIGH",
            "active_alerts": ["Flash Floods", "Heavy Rain"]
        }
    # Northern Galilee / Hula Valley (lat > 33.0)
    elif lat >= 33.0:
        return {
            "temperature": 19.0,
            "precipitation_risk": "HIGH",
            "active_alerts": ["Heavy Rain", "Floods"]
        }
    # Coastal Plain (lng < 35.0, lat 32.0 - 32.8)
    elif 32.0 <= lat <= 32.8 and lng <= 35.0:
        return {
            "temperature": 22.0,
            "precipitation_risk": "MODERATE",
            "active_alerts": ["High Winds"]
        }
    else:
        return {
            "temperature": 24.0,
            "precipitation_risk": "LOW",
            "active_alerts": []
        }
