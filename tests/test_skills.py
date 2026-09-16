import unittest
import os
import json
from skills.fetch_weather_osint import fetch_weather_osint
from skills.evaluate_asset_risk import evaluate_asset_risk
from skills.find_safe_alternative import find_safe_alternative
from skills.update_c4i_dashboard import update_c4i_dashboard


class TestBaalSkills(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets_db.json")

    def test_fetch_weather_osint_structure(self):
        weather = fetch_weather_osint(lat=31.4655, lng=35.3884)
        self.assertIn("temperature", weather)
        self.assertIn("precipitation_risk", weather)
        self.assertIn("active_alerts", weather)
        self.assertIsInstance(weather["active_alerts"], list)

    def test_fetch_weather_osint_mock_scenario(self):
        flood_data = fetch_weather_osint(lat=31.4655, lng=35.3884, mock_scenario="flash_flood")
        self.assertEqual(flood_data["precipitation_risk"], "SEVERE")
        self.assertIn("Flash Floods", flood_data["active_alerts"])

    def test_evaluate_asset_risk_critical(self):
        # Ein Gedi (103) has vulnerabilities: ["Flash Floods", "Extreme Heat"]
        weather = {
            "temperature": 22.0,
            "precipitation_risk": "HIGH",
            "active_alerts": ["Flash Floods", "Heavy Rain"]
        }
        result = evaluate_asset_risk(asset_id=103, weather_data=weather, db_path=self.db_path)
        self.assertEqual(result["risk_level"], "CRITICAL")
        self.assertIn(result["vulnerability_triggered"], ["Flash Floods", "שיטפונות בזק", "שיטפונות"])

    def test_evaluate_asset_risk_safe_haven(self):
        # Beit Guvrin (105) is a Safe Haven
        weather = {
            "temperature": 22.0,
            "precipitation_risk": "HIGH",
            "active_alerts": ["Flash Floods"]
        }
        result = evaluate_asset_risk(asset_id=105, weather_data=weather, db_path=self.db_path)
        self.assertEqual(result["risk_level"], "SAFE")

    def test_find_safe_alternative_from_ein_gedi(self):
        # Ein Gedi is in Judean Desert -> Closest safe haven is Kfar Etzion (211) or Beit Guvrin (105)
        alt = find_safe_alternative(current_lat=31.4655, current_lng=35.3884, db_path=self.db_path)
        self.assertIn(alt["fallback_asset_id"], [105, 211])
        self.assertGreater(alt["distance_km"], 0)

    def test_find_safe_alternative_from_north(self):
        # Tel Dan is in Upper Galilee (33.2491, 35.6525) -> Closest safe haven is now Biriya Forest (504, ~31km) or Tzippori (106, ~65km)
        alt = find_safe_alternative(current_lat=33.2491, current_lng=35.6525, db_path=self.db_path)
        self.assertIn(alt["fallback_asset_id"], [504, 106])
        self.assertTrue(any(name in alt["fallback_name"] for name in ["Biriya", "ביריה", "Tzippori", "ציפורי"]))

    def test_update_c4i_dashboard(self):
        success = update_c4i_dashboard(
            original_asset_id=103,
            new_status="REROUTED",
            fallback_asset_id=105,
            confidence_score=98,
            reasoning_log="Ein Gedi matched Flash Flood vulnerability; autonomously routed to Beit Guvrin Safe Haven.",
            db_path=self.db_path
        )
        self.assertTrue(success)

    def test_end_to_end_tactical_reroute(self):
        # 1. Fetch weather for Ein Gedi
        ein_gedi_lat, ein_gedi_lng = 31.4655, 35.3884
        weather = fetch_weather_osint(lat=ein_gedi_lat, lng=ein_gedi_lng, mock_scenario="flash_flood")

        # 2. Risk Evaluation
        eval_result = evaluate_asset_risk(asset_id=103, weather_data=weather, db_path=self.db_path)
        self.assertEqual(eval_result["risk_level"], "CRITICAL")

        # 3. Find Safe Haven
        fallback = find_safe_alternative(current_lat=ein_gedi_lat, current_lng=ein_gedi_lng, db_path=self.db_path)
        self.assertIn(fallback["fallback_asset_id"], [105, 211])

        # 4. Update C4I Dashboard
        c4i_res = update_c4i_dashboard(
            original_asset_id=103,
            new_status="REROUTED",
            fallback_asset_id=fallback["fallback_asset_id"],
            confidence_score=96,
            reasoning_log=f"Triggered by {eval_result['vulnerability_triggered']}; rerouting to {fallback['fallback_name']} ({fallback['distance_km']}km).",
            db_path=self.db_path
        )
        self.assertTrue(c4i_res)

    def test_ingest_guardrail_valid_candidate(self):
        from skills.ingest_verified_sites import verify_site_guardrails
        with open(self.db_path, "r", encoding="utf-8") as f:
            db = json.load(f)

        valid_candidate = {
            "name": "מעיין אלרואי",
            "name_en": "Elro'i Spring",
            "authority_id": "OSM-NODE-4829104",
            "region": "עמק יזרעאל",
            "region_group": "north",
            "lat": 32.7042,
            "lng": 35.1054,
            "category": "water",
            "type": ["מעיין", "מים"]
        }
        is_valid, reasons, _ = verify_site_guardrails(valid_candidate, db)
        self.assertTrue(is_valid)
        self.assertEqual(len(reasons), 0)

    def test_ingest_guardrail_rejects_hallucination(self):
        from skills.ingest_verified_sites import verify_site_guardrails
        with open(self.db_path, "r", encoding="utf-8") as f:
            db = json.load(f)

        fake_candidate = {
            "name": "מעיין הפיות הסודי",
            "authority_id": "LLM-HALLUCINATION-999",
            "lat": 44.5000, # Outside Israel
            "lng": 20.0000,
            "category": "water"
        }
        is_valid, reasons, _ = verify_site_guardrails(fake_candidate, db)
        self.assertFalse(is_valid)
        self.assertTrue(any("Authority ID missing" in r for r in reasons))
        self.assertTrue(any("outside Israeli boundaries" in r for r in reasons))

    def test_ingest_guardrail_rejects_spatial_duplicate(self):
        from skills.ingest_verified_sites import verify_site_guardrails
        with open(self.db_path, "r", encoding="utf-8") as f:
            db = json.load(f)

        duplicate_candidate = {
            "name": "שמורת עין גדי חניון תחתון",
            "authority_id": "INPA-9999",
            "lat": 31.4654,  # Within 20 meters of Ein Gedi
            "lng": 35.3883,
            "category": "water"
        }
        is_valid, reasons, dup_info = verify_site_guardrails(duplicate_candidate, db)
        self.assertFalse(is_valid)
        self.assertTrue(any("Spatial duplicate" in r for r in reasons))
        self.assertEqual(dup_info.get("existing_id"), 103)

    def test_fetch_water_pollution(self):
        from skills.fetch_water_pollution import check_water_pollution
        # Zaki Stream coordinates
        zaki = check_water_pollution(lat=32.9030, lng=35.6310, asset_name="נחל הזכי")
        self.assertTrue(zaki["has_advisory"])
        self.assertEqual(zaki["severity"], "WARNING")
        self.assertIn("קולי צואתי", zaki["status_he"])

        # Tel Dan (unaffected)
        tel_dan = check_water_pollution(lat=33.2491, lng=35.6525, asset_name="שמורת טבע תל דן")
        self.assertFalse(tel_dan["has_advisory"])
        self.assertEqual(tel_dan["severity"], "SAFE")

    def test_evaluate_min_age_base_and_weather(self):
        from skills.evaluate_min_age import evaluate_min_age
        # Safe haven / Beit Guvrin should be 0+ (toddlers / strollers)
        haven = {"name": "גן לאומי בית גוברין", "vulnerabilities": ["Safe Haven"], "stroller_accessible": True}
        res_haven = evaluate_min_age(haven, current_temp_c=25.0)
        self.assertEqual(res_haven["min_age"], 0)
        self.assertTrue(res_haven["stroller_accessible"])

        # Masada at normal temperature should be 7+
        masada = {"name": "גן לאומי מצדה", "vulnerabilities": ["עומס חום"]}
        res_masada_mild = evaluate_min_age(masada, current_temp_c=26.0)
        self.assertEqual(res_masada_mild["min_age"], 7)

        # Masada in heatwave (38C) should escalate to 10+
        res_masada_hot = evaluate_min_age(masada, current_temp_c=38.0)
        self.assertEqual(res_masada_hot["min_age"], 10)
        self.assertTrue(res_masada_hot["is_weather_escalated"])

    def test_fetch_agri_trails_skill(self):
        from skills.fetch_agri_trails import fetch_agri_trails
        trails = fetch_agri_trails()
        self.assertGreaterEqual(len(trails), 4)
        for t in trails:
            self.assertTrue(t["authority_id"].startswith("AGRI-TRAIL-"))
            self.assertIn("lat", t)
            self.assertIn("lng", t)
            # Ensure within Israel bbox and on land
            self.assertTrue(29.4 <= t["lat"] <= 33.4)
            self.assertTrue(34.2 <= t["lng"] <= 35.9)

    def test_fetch_marked_trails_skill(self):
        from skills.fetch_marked_trails import fetch_marked_trails
        trails = fetch_marked_trails()
        self.assertGreaterEqual(len(trails), 4)
        for t in trails:
            self.assertTrue(t["authority_id"].startswith("ITC-TRAIL-"))
            self.assertTrue(29.4 <= t["lat"] <= 33.4)
            self.assertTrue(34.2 <= t["lng"] <= 35.9)

    def test_fetch_iaa_antiquities_skill(self):
        from skills.fetch_iaa_antiquities import fetch_iaa_antiquities
        sites = fetch_iaa_antiquities()
        self.assertGreaterEqual(len(sites), 4)
        for s in sites:
            self.assertTrue(s["authority_id"].startswith("IAA-SITE-"))
            self.assertTrue(29.4 <= s["lat"] <= 33.4)
            self.assertTrue(34.2 <= s["lng"] <= 35.9)

    def test_fetch_urban_nature_parks_skill(self):
        from skills.fetch_urban_nature_parks import fetch_urban_nature_parks
        parks = fetch_urban_nature_parks()
        self.assertGreaterEqual(len(parks), 4)
        for p in parks:
            self.assertTrue(p["authority_id"].startswith("MUNI-PARK-"))
            self.assertTrue(29.4 <= p["lat"] <= 33.4)
            self.assertTrue(34.2 <= p["lng"] <= 35.9)


if __name__ == "__main__":
    unittest.main()
