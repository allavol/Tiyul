"""
find_safe_alternative skill:
Locates the nearest fallback asset categorized as a "Safe Haven" when the primary asset is CRITICAL.
"""
import os
import json
import math
from typing import Dict, Any, Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets_db.json")


def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two points in kilometers."""
    r = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def find_safe_alternative(
    current_lat: float,
    current_lng: float,
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Finds the geographically closest asset designated as a 'Safe Haven'.
    
    Args:
        current_lat: Latitude of current position.
        current_lng: Longitude of current position.
        db_path: Path to assets_db.json.
        
    Returns:
        Dict containing 'fallback_asset_id', 'fallback_name', and 'distance_km'.
    """
    path = db_path or DEFAULT_DB_PATH
    if not os.path.isabs(path):
        path = os.path.abspath(path)

    with open(path, "r", encoding="utf-8") as f:
        assets = json.load(f)

    # Filter for Safe Haven assets
    safe_havens = [
        asset for asset in assets
        if any("safe haven" in str(v).lower() for v in asset.get("vulnerabilities", []))
    ]

    if not safe_havens:
        raise RuntimeError("No Safe Haven assets found in database.")

    nearest_haven = None
    min_dist = float("inf")

    for haven in safe_havens:
        h_lat = float(haven["lat"])
        h_lng = float(haven["lng"])
        dist = _haversine_distance_km(current_lat, current_lng, h_lat, h_lng)
        if dist < min_dist:
            min_dist = dist
            nearest_haven = haven

    return {
        "fallback_asset_id": nearest_haven["id"],
        "fallback_name": nearest_haven["name"],
        "distance_km": round(min_dist, 2)
    }
