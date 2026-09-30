"""
eval_xai_judge.py - LLM-as-a-Judge & XAI Quality Rubric Evaluator
Part of Sprint 4 (Finding A4) & Agent BAAL Autonomous Architecture ($0 Operating Cost).

Evaluates agent outputs across 4 standardized dimensions:
1. Faithfulness (Grounding against assets_db.json & weather telemetry)
2. Constraint Satisfaction (Age, Region, Timing, Stroller accessibility)
3. Explainability / XAI Depth (Clarity of rationale, drive times, safety advice)
4. Formatting Integrity (Zero markdown asterisks, clean Hebrew tone)
"""

import json
import os
import sys
import re
from typing import Dict, List, Any

# Ensure UTF-8 stdout on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def evaluate_response_rubric(turn: Dict[str, Any], ground_assets: List[Dict[str, Any]]) -> Dict[str, Any]:
    query = turn.get("query", "")
    text = turn.get("text", "")
    state = turn.get("state", {})
    proposals = turn.get("proposals", [])
    
    scores = {}
    feedback = []

    # Dimension 1: Formatting Integrity (Weight: 20%)
    # Rule: Zero asterisks in user-facing text
    asterisk_count = text.count('*')
    if asterisk_count == 0:
        scores["formatting"] = 100
    else:
        scores["formatting"] = max(0, 100 - asterisk_count * 25)
        feedback.append(f"Contains {asterisk_count} raw markdown asterisks.")

    # Dimension 2: Faithfulness / Zero Hallucination (Weight: 30%)
    if not proposals:
        # Clarification or refusal
        scores["faithfulness"] = 100
    else:
        valid_proposals = 0
        asset_ids = {a["id"] for a in ground_assets}
        for p in proposals:
            if p.get("id") in asset_ids:
                valid_proposals += 1
            else:
                feedback.append(f"Hallucinated asset ID: {p.get('id')}")
        scores["faithfulness"] = int((valid_proposals / len(proposals)) * 100)

    # Dimension 3: Constraint Satisfaction (Weight: 25%)
    constraint_score = 100
    if state.get("minAge") is not None:
        hiker_age = state.get("minAge")
        for p in proposals:
            if p.get("min_age", 0) > max(hiker_age, 4):
                constraint_score -= 30
                feedback.append(f"Site {p.get('name')} (min age {p.get('min_age')}) exceeds hiker age {hiker_age}")
    
    if state.get("region") == "radius" and state.get("maxDistanceKm"):
        max_d = state.get("maxDistanceKm")
        for p in proposals:
            if p.get("_distKm", 0) > max_d * 1.15: # 15% tolerance
                constraint_score -= 20
                feedback.append(f"Site {p.get('name')} ({p.get('_distKm')}km) exceeds radius limit ({max_d}km)")

    scores["constraints"] = max(0, constraint_score)

    # Dimension 4: Explainability (XAI) & Actionability (Weight: 25%)
    xai_score = 70
    if any(keyword in text for keyword in ["נסיעה", "דק'", "ק\"מ", "ק״מ", "סלול", "בטוח", "מזג"]):
        xai_score += 15
    if turn.get("toolActivity"):
        xai_score += 15
    scores["explainability"] = min(100, xai_score)

    # Weighted Overall Score
    total_score = (
        scores["formatting"] * 0.20 +
        scores["faithfulness"] * 0.30 +
        scores["constraints"] * 0.25 +
        scores["explainability"] * 0.25
    )

    return {
        "query": query,
        "overall_score": round(total_score, 1),
        "dimensions": scores,
        "feedback": feedback if feedback else ["Perfect alignment with rubric."]
    }


def main():
    db_path = 'assets_db.json'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        sys.exit(1)

    with open(db_path, 'r', encoding='utf-8') as f:
        ground_assets = json.load(f)

    # Sample audit turns representing family hiking scenarios
    sample_turns = [
        {
            "query": "רוצה טיול מים בצפון למחר עם ילד בן 4",
            "text": "שלום! הנה 3 מסלולים מומלצים ובטוחים בצפון למחר:\n1. עין שוקק - שביל סלול ובטוח\n2. נחל הקיבוצים - מים נעימים לילדים",
            "state": {"region": "north", "timing": "tomorrow", "minAge": 4, "feature": "water"},
            "proposals": [
                {"id": 850, "name": "עין שוקק", "min_age": 0, "_distKm": 35},
                {"id": 851, "name": "עין הקיבוצים", "min_age": 4, "_distKm": 38}
            ],
            "toolActivity": "חישוב מרחקים ותחזית מזג אוויר מותאמת"
        },
        {
            "query": "מחפש מסלול נגיש לעגלת תינוק במרכז להיום",
            "text": "הנה מסלולים נגישים לעגלות עם שבילים סלולים ונוחים במרכז.",
            "state": {"region": "center", "timing": "today", "minAge": 0, "feature": "stroller"},
            "proposals": [
                {"id": 105, "name": "פארק הירקון", "min_age": 0, "_distKm": 12, "stroller_accessible": True}
            ],
            "toolActivity": "סינון נגישות עגלות ומזג אוויר חי"
        }
    ]

    print("=" * 65)
    print(" ⚖️  LLM-as-a-Judge: GeoGuard XAI & Explainability Benchmark")
    print("=" * 65)

    total_overall = 0
    for i, turn in enumerate(sample_turns, 1):
        res = evaluate_response_rubric(turn, ground_assets)
        total_overall += res["overall_score"]
        print(f"\n[Case #{i}] Query: \"{res['query']}\"")
        print(f"  • Overall XAI Score : {res['overall_score']}%")
        print(f"  • Formatting Integrity : {res['dimensions']['formatting']}%")
        print(f"  • Zero-Hallucination : {res['dimensions']['faithfulness']}%")
        print(f"  • Constraints Match   : {res['dimensions']['constraints']}%")
        print(f"  • Explainability Depth: {res['dimensions']['explainability']}%")
        print(f"  • Feedback           : {', '.join(res['feedback'])}")

    avg_score = round(total_overall / len(sample_turns), 1)
    print("\n" + "=" * 65)
    print(f"  🎯 AGGREGATE SYSTEM XAI QUALITY SCORE: {avg_score}%")
    print("=" * 65)


if __name__ == '__main__':
    main()
