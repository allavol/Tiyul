"""
run_expanded_ingestion.py - Ingestion Pipeline for 4 New Authoritative Sources

Gathers candidates from:
1. Agri GIS (משרד החקלאות - fetch_agri_trails)
2. Israel Trails Committee (הוועדה לשבילי ישראל - fetch_marked_trails)
3. Israel Antiquities Authority (רשות העתיקות - fetch_iaa_antiquities)
4. Metropolitan Municipal Parks (טבע עירוני - fetch_urban_nature_parks)

Passes each through verify_site_guardrails and evaluate_min_age before ingesting into assets_db.json.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from typing import List, Dict, Any

from skills.ingest_verified_sites import verify_site_guardrails
from skills.evaluate_min_age import evaluate_min_age
from skills.fetch_agri_trails import fetch_agri_trails
from skills.fetch_marked_trails import fetch_marked_trails
from skills.fetch_iaa_antiquities import fetch_iaa_antiquities
from skills.fetch_urban_nature_parks import fetch_urban_nature_parks


def run_expanded_ingestion():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets_db.json")
    with open(db_path, "r", encoding="utf-8") as f:
        assets: List[Dict[str, Any]] = json.load(f)

    initial_count = len(assets)
    print(f"[*] Starting expanded ingestion. Current assets in DB: {initial_count}")

    # Gather candidates from all 4 sources
    candidates: List[Dict[str, Any]] = []
    candidates.extend(fetch_agri_trails())
    candidates.extend(fetch_marked_trails())
    candidates.extend(fetch_iaa_antiquities())
    candidates.extend(fetch_urban_nature_parks())

    print(f"[*] Total candidates collected from 4 new sources: {len(candidates)}")

    added_count = 0
    rejected_count = 0

    for cand in candidates:
        is_valid, rejection_reasons, dup_info = verify_site_guardrails(cand, assets)
        if not is_valid:
            print(f"[-] REJECTED {cand['name']} ({cand.get('authority_id')}): {', '.join(rejection_reasons)}")
            rejected_count += 1
            continue

        # Evaluate min age & accessibility
        age_eval = evaluate_min_age(cand)
        cand["min_age"] = age_eval["min_age"]
        cand["age_group"] = age_eval["age_label"]
        cand["stroller_accessible"] = age_eval["stroller_accessible"]

        assets.append(cand)
        added_count += 1
        print(f"[+] ACCEPTED: [{cand['id']}] {cand['name']} | Auth: {cand['authority_id']} | Min Age: {cand['age_group']}")

    # Save updated database
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(assets, f, ensure_ascii=False, indent=2)

    print(f"\n=======================================================")
    print(f"[*] Expanded Ingestion Complete!")
    print(f"[*] Added: {added_count} | Rejected: {rejected_count}")
    print(f"[*] Total Verified Assets in assets_db.json: {len(assets)}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except AttributeError:
            pass
    run_expanded_ingestion()
