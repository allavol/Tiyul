"""
Agent BAAL - Tactical C4I Simulation Runner
Executes a simulated threat scenario demonstrating OSINT data fusion,
risk evaluation, autonomous safe haven selection, and C4I dashboard dispatch.
"""
import json
from skills.fetch_weather_osint import fetch_weather_osint
from skills.evaluate_asset_risk import evaluate_asset_risk
from skills.find_safe_alternative import find_safe_alternative
from skills.update_c4i_dashboard import update_c4i_dashboard


def run_c4i_simulation():
    print(">> [המדריך C4I AGENT]: Initializing Asset Threat Scan...")
    
    # Target Asset: Ein Gedi Nature Reserve (ID: 103)
    asset_id = 103
    lat, lng = 31.4655, 35.3884

    # 1. Fetch OSINT / Weather data
    print(f">> [SKILL 1]: Fetching OSINT & Weather for coordinates ({lat}, {lng})...")
    weather = fetch_weather_osint(lat=lat, lng=lng, mock_scenario="flash_flood")
    print(f"   Telemtry: Temp={weather['temperature']}C | Precip={weather['precipitation_risk']} | Alerts={weather['active_alerts']}")

    # 2. Risk Evaluation
    print(f">> [SKILL 2]: Cross-referencing asset #{asset_id} vulnerabilities against threat data...")
    risk_assessment = evaluate_asset_risk(asset_id=asset_id, weather_data=weather)
    print(f"   Assessment: Risk Tier={risk_assessment['risk_level']} | Triggered={risk_assessment['vulnerability_triggered']}")

    # 3. Autonomous Reroute to Safe Haven if CRITICAL
    if risk_assessment["risk_level"] == "CRITICAL":
        print(">> [ALERT]: Asset condition is CRITICAL. Activating SAFE HAVEN PROTOCOL...")
        fallback = find_safe_alternative(current_lat=lat, current_lng=lng)
        print(f"   Selected Safe Haven: [{fallback['fallback_asset_id']}] {fallback['fallback_name']} (Distance: {fallback['distance_km']} km)")

        # 4. Dispatch C4I Dashboard Update
        confidence_score = 96
        reasoning_log = (
            f"Cross-referenced Flash Flood alert with Ein Gedi's water/flood vulnerabilities; "
            f"autonomously rerouted to nearest Safe Haven {fallback['fallback_name']} ({fallback['distance_km']} km away)."
        )
        update_c4i_dashboard(
            original_asset_id=asset_id,
            new_status="REROUTED",
            fallback_asset_id=fallback["fallback_asset_id"],
            confidence_score=confidence_score,
            reasoning_log=reasoning_log
        )
        print(">> [המדריך C4I AGENT]: Reroute execution completed successfully.")
    else:
        print(">> [המדריך C4I AGENT]: Asset within safe operational parameters. No rerouting needed.")


if __name__ == "__main__":
    run_c4i_simulation()
