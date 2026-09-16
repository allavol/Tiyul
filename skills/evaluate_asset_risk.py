"""
evaluate_asset_risk skill:
Cross-references current weather data against an asset's known vulnerabilities.
"""
import os
import json
from typing import Dict, Any, Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets_db.json")


def evaluate_asset_risk(
    asset_id: int,
    weather_data: Dict[str, Any],
    db_path: Optional[str] = None
) -> Dict[str, str]:
    """
    Evaluates risk for a given asset by fusing weather/OSINT telemetry with known vulnerabilities.
    
    Args:
        asset_id: Integer ID of the asset.
        weather_data: Dict containing 'temperature', 'precipitation_risk', and 'active_alerts'.
        db_path: Path to assets_db.json.
        
    Returns:
        Dict with 'risk_level' ("SAFE" | "WARNING" | "CRITICAL") and 'vulnerability_triggered' (str).
    """
    path = db_path or DEFAULT_DB_PATH
    if not os.path.isabs(path):
        path = os.path.abspath(path)

    with open(path, "r", encoding="utf-8") as f:
        assets = json.load(f)

    asset = next((a for a in assets if a.get("id") == asset_id), None)
    if not asset:
        raise ValueError(f"Asset ID {asset_id} not found in database at {path}")

    raw_vulns = asset.get("vulnerabilities", []) + asset.get("vulnerabilities_en", [])
    vulnerabilities = [str(v).lower() for v in raw_vulns]
    alerts = [str(a).lower() for a in weather_data.get("active_alerts", [])]
    asset_types = [str(t).lower() for t in (asset.get("type", []) + asset.get("type_en", []))]
    precip_risk = str(weather_data.get("precipitation_risk", "")).upper()

    # Safe Haven assets are inherently protected from ordinary tactical triggers
    if any("safe haven" in v or "מקלט" in v for v in vulnerabilities):
        return {
            "risk_level": "SAFE",
            "vulnerability_triggered": "None (Safe Haven Asset)"
        }

    # Cross-reference direct vulnerabilities against incoming alerts
    for alert in alerts:
        for orig_vuln, vuln in zip(raw_vulns, vulnerabilities):
            if vuln in alert or alert in vuln:
                return {
                    "risk_level": "CRITICAL",
                    "vulnerability_triggered": orig_vuln
                }

    # Tactical heuristic: Water type + Heavy Rain / Floods threat
    is_water = any(w in t for t in asset_types for w in ["water", "מים", "חוף"])
    has_flood_threat = (
        any(f in a for a in alerts for f in ["heavy rain", "flood", "שיטפון", "גשם"]) or 
        precip_risk in ["HIGH", "SEVERE"]
    )
    if is_water and has_flood_threat:
        for orig_vuln, vuln in zip(raw_vulns, vulnerabilities):
            if any(term in vuln for term in ["flood", "rain", "שיטפון", "גשם"]):
                return {
                    "risk_level": "CRITICAL",
                    "vulnerability_triggered": orig_vuln
                }

    # Tactical heuristic: Desert type + Extreme Heat threat
    is_desert = any(d in t for t in asset_types for d in ["desert", "מדבר"])
    has_heat_threat = (
        any(h in a for a in alerts for h in ["extreme heat", "heat", "חום", "שרב"]) or 
        weather_data.get("temperature", 0) >= 40.0
    )
    if is_desert and has_heat_threat:
        for orig_vuln, vuln in zip(raw_vulns, vulnerabilities):
            if any(term in vuln for term in ["heat", "חום", "שרב"]):
                return {
                    "risk_level": "CRITICAL",
                    "vulnerability_triggered": orig_vuln
                }

    # Warning tier if active alerts exist in the bounding area but do not directly match asset vulnerabilities
    if alerts or precip_risk in ["HIGH", "SEVERE"]:
        return {
            "risk_level": "WARNING",
            "vulnerability_triggered": "Adjacent Regional Alert"
        }

    return {
        "risk_level": "SAFE",
        "vulnerability_triggered": "None"
    }
