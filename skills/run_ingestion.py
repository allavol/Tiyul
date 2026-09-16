"""
run_ingest_pipeline.py - Executes the Zero-Hallucination & Deduplication Ingestion Pipeline
"""

import json
import sys
from skills.ingest_verified_sites import ingest_candidate_site
from skills.evaluate_min_age import evaluate_min_age

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

candidates = [
    {
        "id": 301,
        "name": "עין מודע - עמק המעיינות",
        "name_en": "Ein Muda Spring",
        "authority_id": "OSM-NODE-1230491",
        "region": "עמק המעיינות והגלבוע",
        "region_group": "north",
        "lat": 32.5085,
        "lng": 35.4521,
        "type": ["מעיין", "מים", "בריכת שכשוך"],
        "type_en": ["Spring", "Water", "Pool"],
        "vulnerabilities": ["עומס חום קיצוני"],
        "vulnerabilities_en": ["Extreme Heat"],
        "category": "water",
        "stroller_accessible": True
    },
    {
        "id": 302,
        "name": "עין חרדלית - נחל כזיב",
        "name_en": "Ein Hardalit - Kziv Stream",
        "authority_id": "OSM-NODE-4592811",
        "region": "גליל מערבי",
        "region_group": "north",
        "lat": 33.0411,
        "lng": 35.2144,
        "type": ["נחל זורם", "מים", "חורש"],
        "type_en": ["Stream", "Water", "Forest"],
        "vulnerabilities": ["שיטפונות", "גשם כבד"],
        "vulnerabilities_en": ["Floods", "Heavy Rain"],
        "category": "water",
        "stroller_accessible": False
    },
    {
        "id": 303,
        "name": "עין ספיר - הרי ירושלים",
        "name_en": "Ein Sapir Spring",
        "authority_id": "OSM-NODE-8920194",
        "region": "הרי יהודה וירושלים",
        "region_group": "jerusalem",
        "lat": 31.7602,
        "lng": 35.1388,
        "type": ["מעיין נקבה", "מערה", "מים", "מקלט בטוח"],
        "type_en": ["Cave Spring", "Water", "Safe Haven"],
        "vulnerabilities": ["Safe Haven", "מקלט בטוח"],
        "vulnerabilities_en": ["Safe Haven"],
        "category": "safe_haven",
        "stroller_accessible": False
    },
    {
        "id": 304,
        "name": "מצפור השלום - דרום רמת הגולן",
        "name_en": "Peace Vista Viewpoint - Golan",
        "authority_id": "OSM-NODE-3309121",
        "region": "דרום רמת הגולן ומבוא חמה",
        "region_group": "north",
        "lat": 32.7358,
        "lng": 35.6562,
        "type": ["מצפור", "נוף", "תצפית הכנרת"],
        "type_en": ["Viewpoint", "Panorama", "Sea of Galilee"],
        "vulnerabilities": ["רוחות חזקות", "סכנת שריפות"],
        "vulnerabilities_en": ["High Winds", "Wildfires"],
        "category": "desert",
        "stroller_accessible": True
    },
    {
        "id": 305,
        "name": "עין יורקעם - מכתש גדול",
        "name_en": "Ein Yorkeam - Great Crater",
        "authority_id": "OSM-NODE-9912044",
        "region": "הנגב הצפוני והמכתש הגדול",
        "region_group": "south",
        "lat": 30.9392,
        "lng": 35.0395,
        "type": ["גב מים", "מדבר", "קניון"],
        "type_en": ["Desert Pool", "Canyon", "Water"],
        "vulnerabilities": ["שיטפונות בזק", "עומס חום קיצוני"],
        "vulnerabilities_en": ["Flash Floods", "Extreme Heat"],
        "category": "water",
        "stroller_accessible": False
    },
    {
        "id": 306,
        "name": "עין עבדת - קניון נחל צין",
        "name_en": "Ein Avdat Canyon Spring",
        "authority_id": "INPA-306",
        "region": "מרכז הנגב ורמת עבדת",
        "region_group": "south",
        "lat": 30.8317,
        "lng": 34.7644,
        "type": ["נווה מדבר", "מפל מים", "מצוקים"],
        "type_en": ["Oasis", "Waterfall", "Cliffs"],
        "vulnerabilities": ["שיטפונות בזק", "עומס חום"],
        "vulnerabilities_en": ["Flash Floods", "Extreme Heat"],
        "category": "water",
        "stroller_accessible": False
    },
    {
        "id": 501,
        "name": "גן לאומי חוף פלמחים",
        "name_en": "Palmachim Beach National Park",
        "authority_id": "INPA-501",
        "region": "מישור החוף הדרומי",
        "region_group": "center",
        "lat": 31.9288,
        "lng": 34.6983,
        "type": ["גן לאומי", "חוף ים", "רכס כורכר"],
        "type_en": ["National Park", "Beach", "Coast"],
        "vulnerabilities": ["סערות ים", "רוחות חזקות"],
        "vulnerabilities_en": ["Sea Storms", "High Winds"],
        "category": "coast",
        "stroller_accessible": True
    },
    {
        "id": 502,
        "name": "חניון לילה שקף - יער יתיר (קק״ל)",
        "name_en": "Yatir Forest Night Camp (KKL-JNF)",
        "authority_id": "KKL-502",
        "region": "דרום הר חברון ויער יתיר",
        "region_group": "south",
        "lat": 31.3482,
        "lng": 35.0594,
        "type": ["חניון לילה", "יער מחטני", "מקלט בטוח"],
        "type_en": ["Night Campground", "Coniferous Forest", "Safe Haven"],
        "vulnerabilities": ["Safe Haven", "מקלט בטוח"],
        "vulnerabilities_en": ["Safe Haven"],
        "category": "safe_haven",
        "stroller_accessible": True
    },
    {
        "id": 503,
        "name": "שמורת טבע נחל שניר (חצבני)",
        "name_en": "Snir Stream Nature Reserve",
        "authority_id": "INPA-503",
        "region": "עמק החולה והגליל העליון",
        "region_group": "north",
        "lat": 33.2384,
        "lng": 35.6262,
        "type": ["שמורת טבע", "נחל זורם", "מים"],
        "type_en": ["Nature Reserve", "Stream", "Water"],
        "vulnerabilities": ["שיטפונות", "הצפות"],
        "vulnerabilities_en": ["Floods"],
        "category": "water",
        "stroller_accessible": False
    },
    {
        "id": 504,
        "name": "יער ביריה ומצודת ביריה (קק״ל)",
        "name_en": "Biriya Forest & Fortress (KKL-JNF)",
        "authority_id": "KKL-504",
        "region": "הגליל העליון וצפת",
        "region_group": "north",
        "lat": 32.9866,
        "lng": 35.5134,
        "type": ["יער", "מורשת", "חורש מוצל", "מקלט בטוח"],
        "type_en": ["Forest", "Heritage", "Safe Haven"],
        "vulnerabilities": ["Safe Haven", "מקלט בטוח"],
        "vulnerabilities_en": ["Safe Haven"],
        "category": "safe_haven",
        "stroller_accessible": True
    },
    {
        "id": 505,
        "name": "גן לאומי ממשית",
        "name_en": "Mamshit National Park",
        "authority_id": "INPA-505",
        "region": "הנגב הצפוני ודימונה",
        "region_group": "south",
        "lat": 31.0253,
        "lng": 35.0642,
        "type": ["גן לאומי", "ארכיאולוגיה", "מדבר"],
        "type_en": ["National Park", "Archaeology", "Desert"],
        "vulnerabilities": ["שיטפונות בזק", "עומס חום קיצוני"],
        "vulnerabilities_en": ["Flash Floods", "Extreme Heat"],
        "category": "desert",
        "stroller_accessible": True
    },
    {
        "id": 506,
        "name": "שמורת טבע מג׳רסה - שפך נחל דליות",
        "name_en": "Majrase - Daliyot Stream Reserve",
        "authority_id": "INPA-506",
        "region": "צפון מזרח הכנרת ורמת הגולן",
        "region_group": "north",
        "lat": 32.8870,
        "lng": 35.6530,
        "type": ["שמורת טבע", "מסלול מים רטוב", "קני חזרן"],
        "type_en": ["Nature Reserve", "Wet Trail", "Water"],
        "vulnerabilities": ["שיטפונות", "עכירות מים"],
        "vulnerabilities_en": ["Floods"],
        "category": "water",
        "stroller_accessible": False
    },
    {
        "id": 507,
        "name": "גן לאומי ארבל ומצוק הארבל",
        "name_en": "Mount Arbel National Park",
        "authority_id": "INPA-507",
        "region": "הגליל התחתון והכנרת",
        "region_group": "north",
        "lat": 32.8236,
        "lng": 35.4988,
        "type": ["גן לאומי", "מצוק", "נוף"],
        "type_en": ["National Park", "Cliffs", "Viewpoint"],
        "vulnerabilities": ["עומס חום קיצוני", "רוחות חזקות"],
        "vulnerabilities_en": ["Extreme Heat", "High Winds"],
        "category": "desert",
        "stroller_accessible": False
    }
]

accepted = 0
for cand in candidates:
    age_eval = evaluate_min_age(cand, current_temp_c=26.0)
    cand["min_age"] = age_eval["min_age"]
    cand["age_group"] = age_eval["age_label"]
    cand["stroller_accessible"] = age_eval["stroller_accessible"]
    res = ingest_candidate_site(cand, "assets_db.json")
    if res["status"] == "ACCEPTED":
        accepted += 1
        print(f"ACCEPTED: {cand['name']} (ID: {cand['id']}, Age: {cand['min_age']}+)")
    else:
        print(f"REJECTED: {cand['name']} - Reasons: {res['reasons']}")

with open("assets_db.json", "r", encoding="utf-8") as f:
    db = json.load(f)

print(f"\nTotal sites now in assets_db.json: {len(db)} (Newly accepted: {accepted})")
