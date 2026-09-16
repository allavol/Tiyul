"""
evaluate_min_age.py - Hiking Trail Minimum Age Assessment Skill

Evaluates the minimum recommended age and accessibility tier for Israeli hiking trails
based on topographic obstacles, trail length, water depth, and real-time weather constraints.

Tiers:
- 0+ עגלות (strollers / toddlers)
- 4+ (children)
- 7+ (juniors)
- 10+ (adventurers)

Adheres strictly to the $0 total cost policy and deterministic heuristics.
"""

import sys
from typing import Dict, Any, List


AGE_TIERS = {
    0: {"label_he": "0+ עגלות", "code": "stroller", "icon": "👶"},
    4: {"label_he": "4+", "code": "child", "icon": "🧒"},
    7: {"label_he": "7+", "code": "junior", "icon": "🧗"},
    10: {"label_he": "10+", "code": "adventurer", "icon": "🧗‍♂️"}
}


def evaluate_min_age(asset: Dict[str, Any], current_temp_c: float = 26.0, rain_risk: bool = False) -> Dict[str, Any]:
    """
    Evaluates the minimum recommended age for an asset/trail.
    Takes into account physical obstacles and dynamic climate conditions.
    """
    reasons: List[str] = []
    base_age = 4  # Default baseline for typical Israeli nature parks

    # 1. Physical Obstacle Heuristics
    name = asset.get("name", "")
    categories = asset.get("type", []) + asset.get("type_en", [])
    stroller = asset.get("stroller_accessible", False)
    vulnerabilities = asset.get("vulnerabilities", [])

    # Check for stroller / paved / safe haven
    if stroller or "מקלט בטוח" in vulnerabilities or "Safe Haven" in vulnerabilities or "צפרות" in categories:
        base_age = 0
        reasons.append("מסלול סלול/מיושר, מונגש לעגלות וללא מדרגות סלע תלולות")
    elif any(kw in name for kw in ["ארבל", "דרג'ה", "נחל דרגה", "אוג", "צפית", "סכין"]):
        base_age = 10
        reasons.append("כולל סולמות ברזל, יתדות ומעוקים אתגריים (מתאים למיטיבי לכת 10+)")
    elif any(kw in name for kw in ["מצדה", "חרמון", "מירון", "יהודייה", "זאכי", "מצוק"]):
        base_age = 7
        reasons.append("תוואי שטח סלעי, שיפוע תלול או מעברי מים (מתאים לגילאי 7+)")
    elif "מערות" in categories or "ארכיאולוגיה" in categories:
        base_age = 4
        reasons.append("שבילים מוסדרים עם מעקות באתר ארכיאולוגי/גן לאומי (4+)")

    # 2. Dynamic Weather Escalation Modifiers
    adjusted_age = base_age
    weather_warnings: List[str] = []

    if current_temp_c >= 36.0:
        if adjusted_age < 7:
            adjusted_age = 7
            weather_warnings.append(f"עומס חום קיצוני ({current_temp_c}°C): המסלול הועלה ל-7+ עקב סיכון התייבשות")
        elif adjusted_age == 7:
            adjusted_age = 10
            weather_warnings.append(f"עומס חום קיצוני ({current_temp_c}°C): הגיל הועלה ל-10+ ומחייב 4 ליטר מים לאדם")
    elif current_temp_c >= 33.0 and adjusted_age == 0 and not stroller:
        adjusted_age = 4
        weather_warnings.append("חום מוגבר - לא מומלץ בעגלה חשופה לשמש ללא צל רציף")

    if rain_risk and ("הרים" in categories or "נחל" in name):
        if adjusted_age < 7:
            adjusted_age = 7
            weather_warnings.append("חשש להחלקה על סלעים רטובים - מומלץ לילדים מעל גיל 7 בלבד")

    # Bound to standard tiers (0, 4, 7, 10)
    final_tier = 0
    for tier in sorted(AGE_TIERS.keys()):
        if adjusted_age >= tier:
            final_tier = tier

    tier_info = AGE_TIERS[final_tier]

    return {
        "min_age": final_tier,
        "age_label": tier_info["label_he"],
        "age_code": tier_info["code"],
        "icon": tier_info["icon"],
        "stroller_accessible": (final_tier == 0),
        "base_age": base_age,
        "is_weather_escalated": (final_tier > base_age),
        "reasons": reasons,
        "weather_warnings": weather_warnings,
        "summary_he": f"גיל מינימלי מומלץ: {tier_info['label_he']}"
    }


if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except AttributeError:
            pass

    print("=== Testing Minimum Age Evaluator (0+, 4+, 7+, 10+) ===")
    sample_safe_haven = {"name": "גן לאומי בית גוברין", "vulnerabilities": ["מקלט בטוח"], "stroller_accessible": True}
    print("Beit Guvrin:", evaluate_min_age(sample_safe_haven, current_temp_c=25))

    sample_masada = {"name": "גן לאומי מצדה", "vulnerabilities": ["עומס חום"]}
    print("Masada (mild):", evaluate_min_age(sample_masada, current_temp_c=26))
    print("Masada (heatwave 38C):", evaluate_min_age(sample_masada, current_temp_c=38))

    sample_arbel = {"name": "גן לאומי ארבל ומצוק הארבל", "type": ["מצוק"]}
    print("Arbel:", evaluate_min_age(sample_arbel))
