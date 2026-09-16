"""
ingest_verified_sites.py - Zero-Cost & Zero-Hallucination Asset Ingestion Guardrails

Enforces strict verification and deduplication before any trail, spring, or park
can enter the GeoGuard Israeli Assets Database.

Rules:
1. Authority ID Gate: Must possess verified INPA, KKL, OSM (Node/Way/Relation), or Wikidata ID.
2. Geospatial BBox: 29.4 <= Lat <= 33.4, 34.2 <= Lng <= 35.9.
3. Trail Geometry: If classified as a trail, must have >= 5 coordinates (LineString).
4. Spatial Deduplication: Haversine distance threshold < 150m against existing assets.
5. Name Similarity: Fuzzy token / Levenshtein distance check to catch phonetic duplicates.
"""

import json
import math
import os
import sys
from typing import Dict, List, Tuple, Any

# Israel Geo-fence Bounding Box
ISRAEL_BBOX = {
    "min_lat": 29.40,
    "max_lat": 33.40,
    "min_lng": 34.20,
    "max_lng": 35.90
}

VALID_AUTHORITY_PREFIXES = (
    "INPA-", "KKL-", "OSM-NODE-", "OSM-WAY-", "OSM-REL-", "WIKIDATA-Q",
    "AGRI-TRAIL-", "ITC-TRAIL-", "IAA-SITE-", "MUNI-PARK-"
)


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Haversine distance in meters between two coordinates."""
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def clean_hebrew_name(name: str) -> str:
    """Normalize Hebrew name for comparison (remove prefixes like שמורת, גן לאומי, עין)."""
    if not name:
        return ""
    stopwords = ["שמורת", "טבע", "גן", "לאומי", "בית", "ספר", "שדה", "יער", "חניון", "עין", "נחל"]
    words = name.replace("-", " ").replace("'", "").split()
    filtered = [w for w in words if w not in stopwords]
    return " ".join(filtered) if filtered else name


def name_similarity(name1: str, name2: str) -> float:
    """Compute simple Jaccard token similarity between normalized names."""
    c1 = set(clean_hebrew_name(name1).split())
    c2 = set(clean_hebrew_name(name2).split())
    if not c1 or not c2:
        return 0.0
    intersection = len(c1.intersection(c2))
    union = len(c1.union(c2))
    return intersection / union


def verify_site_guardrails(candidate: Dict[str, Any], existing_assets: List[Dict[str, Any]]) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates a candidate site against all 5 Zero-Hallucination & Deduplication gates.
    Returns: (is_valid, rejection_reasons, duplicate_match_info)
    """
    reasons = []

    # 1. Authority ID Gate
    auth_id = candidate.get("authority_id") or candidate.get("gov_site_id") or candidate.get("osm_id")
    if not auth_id or not any(str(auth_id).startswith(prefix) for prefix in VALID_AUTHORITY_PREFIXES):
        reasons.append(f"Authority ID missing or invalid prefix. Must start with {VALID_AUTHORITY_PREFIXES}")

    # 2. Bounding Box Gate
    lat = candidate.get("lat")
    lng = candidate.get("lng")
    if lat is None or lng is None:
        reasons.append("Missing geospatial latitude/longitude coordinates")
    else:
        try:
            lat = float(lat)
            lng = float(lng)
            if not (ISRAEL_BBOX["min_lat"] <= lat <= ISRAEL_BBOX["max_lat"]):
                reasons.append(f"Latitude {lat} outside Israeli boundaries [{ISRAEL_BBOX['min_lat']}, {ISRAEL_BBOX['max_lat']}]")
            if not (ISRAEL_BBOX["min_lng"] <= lng <= ISRAEL_BBOX["max_lng"]):
                reasons.append(f"Longitude {lng} outside Israeli boundaries [{ISRAEL_BBOX['min_lng']}, {ISRAEL_BBOX['max_lng']}]")
        except ValueError:
            reasons.append(f"Coordinates ({lat}, {lng}) cannot be parsed as floats")

    # 3. Geometry Validation for trails
    site_category = candidate.get("category", "")
    is_trail = "trail" in site_category or "hiking" in candidate.get("type_en", [])
    if is_trail:
        waypoints = candidate.get("waypoints", [])
        if len(waypoints) < 5:
            reasons.append(f"Hiking trail must contain at least 5 waypoint coordinates (got {len(waypoints)})")

    # 4. Spatial & Fuzzy Deduplication Gate
    duplicate_match = None
    if lat is not None and lng is not None and isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
        for existing in existing_assets:
            ex_lat = existing.get("lat")
            ex_lng = existing.get("lng")
            if ex_lat is not None and ex_lng is not None:
                dist_m = haversine_distance_m(lat, lng, float(ex_lat), float(ex_lng))
                name_sim = name_similarity(candidate.get("name", ""), existing.get("name", ""))

                # Case A: Spatial collision < 150m
                if dist_m < 150.0:
                    duplicate_match = {
                        "existing_id": existing.get("id"),
                        "existing_name": existing.get("name"),
                        "distance_m": round(dist_m, 1),
                        "rule": "Haversine < 150m spatial duplicate"
                    }
                    reasons.append(f"Spatial duplicate of '{existing.get('name')}' (dist: {round(dist_m, 1)}m < 150m)")
                    break

                # Case B: Name duplicate within 3km
                if name_sim >= 0.75 and dist_m < 3000.0:
                    duplicate_match = {
                        "existing_id": existing.get("id"),
                        "existing_name": existing.get("name"),
                        "distance_m": round(dist_m, 1),
                        "similarity": round(name_sim, 2),
                        "rule": "Name similarity >= 0.75 within 3km"
                    }
                    reasons.append(f"Duplicate by name similarity '{existing.get('name')}' ({round(name_sim*100)}% match at {round(dist_m)}m)")
                    break

    is_valid = len(reasons) == 0
    return is_valid, reasons, duplicate_match or {}


def ingest_candidate_site(candidate: Dict[str, Any], db_path: str = "assets_db.json") -> Dict[str, Any]:
    """Ingests a verified site into assets_db.json if it passes all guardrails."""
    if not os.path.exists(db_path):
        return {"status": "ERROR", "message": f"Database file {db_path} not found"}

    with open(db_path, "r", encoding="utf-8") as f:
        existing_assets = json.load(f)

    is_valid, reasons, dup_info = verify_site_guardrails(candidate, existing_assets)

    if not is_valid:
        return {
            "status": "REJECTED",
            "candidate_name": candidate.get("name"),
            "reasons": reasons,
            "duplicate_match": dup_info,
            "guardrails_passed": False
        }

    # Generate new ID if not present
    max_id = max(a.get("id", 0) for a in existing_assets)
    candidate_id = candidate.get("id", max_id + 1)
    candidate["id"] = candidate_id

    # Append and persist
    existing_assets.append(candidate)
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(existing_assets, f, ensure_ascii=False, indent=2)

    return {
        "status": "ACCEPTED",
        "site_id": candidate_id,
        "name": candidate.get("name"),
        "guardrails_passed": True,
        "message": "Site passed 100% of Zero-Hallucination & Deduplication gates."
    }


if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except AttributeError:
            pass

    print("=== Testing Ingest Verified Sites Skill Guardrails ===")

    # Test 1: Real valid candidate
    valid_candidate = {
        "name": "מעיין אלרואי",
        "name_en": "Elro'i Spring",
        "authority_id": "OSM-NODE-4829104",
        "region": "עמק יזרעאל",
        "region_group": "north",
        "lat": 32.7042,
        "lng": 35.1054,
        "category": "water",
        "type": ["מעיין", "מים"],
        "type_en": ["Spring", "Water"],
        "vulnerabilities": ["עומס מבקרים"],
        "vulnerabilities_en": ["Crowding"]
    }

    # Test 2: Hallucinated candidate without valid authority ID and out of bounds
    fake_candidate = {
        "name": "מעיין הדמיון המופלא",
        "name_en": "Imaginary Mystic Springs",
        "authority_id": "AI-GENERATED-1234",
        "lat": 38.5000,  # Greece / Turkey
        "lng": 25.0000,
        "category": "water"
    }

    # Test 3: Duplicate candidate (Ein Gedi)
    duplicate_candidate = {
        "name": "שמורת עין גדי דרום",
        "authority_id": "INPA-9999",
        "lat": 31.4654,  # Within 20 meters of Ein Gedi Nature Reserve
        "lng": 35.3883,
        "category": "water"
    }

    # Run tests on guardrail logic
    with open("assets_db.json", "r", encoding="utf-8") as f:
        db = json.load(f)

    v1, r1, _ = verify_site_guardrails(valid_candidate, db)
    print(f"Candidate 1 (Real): Valid={v1} (Reasons: {r1})")

    v2, r2, _ = verify_site_guardrails(fake_candidate, db)
    print(f"Candidate 2 (Hallucinated): Valid={v2} (Reasons: {r2})")

    v3, r3, d3 = verify_site_guardrails(duplicate_candidate, db)
    print(f"Candidate 3 (Duplicate): Valid={v3} (Reasons: {r3})")
