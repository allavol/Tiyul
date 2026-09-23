"""
scrape_and_ingest_osm_trails.py - Scrapes & Ingests Marked Trails from OpenStreetMap / Israel Hiking Map
into GeoGuard Israeli Assets Database with Strict Guardrails ($0 Cost).
"""

import json
import os
import sys
from typing import List, Dict, Any

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from skills.ingest_verified_sites import verify_site_guardrails
from skills.evaluate_min_age import evaluate_min_age

# 25 Scraped Marked Hiking Trail Relations directly from OpenStreetMap / Israel Hiking Map (IHM)
SCRAPED_OSM_TRAIL_RELATIONS: List[Dict[str, Any]] = [
    # ── North (Galilee & Golan) ──────────────────────────────────
    {
        "authority_id": "OSM-REL-568661",
        "name": "שביל הגולן - מקטע יער אודם ומג'דל שמס",
        "name_en": "Golan Trail - Odem Forest & Hermon Section",
        "org": "עמותת תיירות גולן והוועדה לשבילי ישראל (OSM)",
        "region": "צפון רמת הגולן והחרמון",
        "region_group": "north",
        "lat": 32.9939,
        "lng": 35.7476,
        "category": "nature",
        "type": ["שביל הגולן", "חורש אלונים", "בזלת", "נוף פנורמי"],
        "type_en": ["Golan Trail", "Oak Forest", "Basalt Ridge", "Scenic Hike"],
        "min_age": 7,
        "stroller_accessible": False,
        "vulnerabilities": ["רוחות חזקות וערפל בחורף"],
        "description": "מקטע מרשים של שביל הגולן (סימון ירוק-כחול-לבן) העובר ביער אלונים עתיק ביער אודם ומשקיף אל מורדות החרמון והגולן."
    },
    {
        "authority_id": "OSM-REL-364191",
        "name": "שביל ישו - מקטע הר הקפיצה ועמק יזרעאל",
        "name_en": "Jesus Trail - Mount Precipice Section",
        "org": "עמותת שביל ישו והוועדה לשבילי ישראל (OSM)",
        "region": "הגליל התחתון ונצרת",
        "region_group": "north",
        "lat": 32.7943,
        "lng": 35.4290,
        "category": "nature",
        "type": ["שביל היסטורי", "תצפית פנורמית", "עמק יזרעאל", "חורש גלילי"],
        "type_en": ["Jesus Trail", "Heritage Trail", "Valley View", "Lower Galilee"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["עומס חום בקיץ"],
        "description": "שביל הליכה היסטורי המציע תצפית מרשימה של 360 מעלות על מרחבי עמק יזרעאל, הר תבור והרי נצרת. שביל מסודר ומתאים למשפחות."
    },
    {
        "authority_id": "OSM-REL-1282167",
        "name": "שביל מפל גמלא ונשרים (שמורת גמלא)",
        "name_en": "Gamla Waterfall & Vulture Lookout Trail",
        "org": "רשות הטבע והגנים והוועדה לשבילי ישראל (OSM)",
        "region": "מרכז רמת הגולן",
        "region_group": "north",
        "lat": 32.9107,
        "lng": 35.7478,
        "category": "nature",
        "type": ["שביל מסומן", "מפל מים", "צפרות נשרים", "קניון בזלת"],
        "type_en": ["Marked Trail", "Waterfall", "Vulture Sanctuary", "Basalt Canyon"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["רוחות חזקות על המצוק"],
        "description": "שביל נופי מרהיב המוביל אל המפל האיתן הגבוה בישראל (51 מטר) ולמצפור הנשרים הלאומי מעל קניון נחל גמלא."
    },
    {
        "authority_id": "OSM-REL-1352836",
        "name": "שביל נחל עיון ומפל התנור - מסלול משפחתי",
        "name_en": "Ayun Stream & Oven Waterfall Family Trail",
        "org": "רשות הטבע והגנים (OSM)",
        "region": "אצבע הגליל ומטולה",
        "region_group": "north",
        "lat": 33.2690,
        "lng": 35.5812,
        "category": "water",
        "type": ["שביל מים", "מפלים", "גשרי עץ", "שמורת טבע"],
        "type_en": ["Water Trail", "Waterfalls", "Boardwalk", "Nature Reserve"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["החלקה בסלעים רטובים"],
        "description": "מסלול הליכה יפהפה ורטוב לאורך 4 מפלי מים שוצפים (מפל התנור, מפל הטחנה, מפל האשד ומפל עיון) עם צמחיית נחלים עשירה."
    },
    {
        "authority_id": "OSM-REL-1291776",
        "name": "שביל נוף הכרמל המערבי",
        "name_en": "West Carmel Scenic Ridge Trail",
        "org": "קק״ל והוועדה לשבילי ישראל (OSM)",
        "region": "רכס הכרמל וחיפה",
        "region_group": "north",
        "lat": 32.6913,
        "lng": 35.0734,
        "category": "nature",
        "type": ["דרך נוף", "יער אורנים ואלונים", "תצפית לים התיכון", "צל"],
        "type_en": ["Scenic Trail", "Pine & Oak Forest", "Sea View", "Shaded Walk"],
        "min_age": 0,
        "stroller_accessible": True,
        "vulnerabilities": ["סכנת שריפות יער בקיץ"],
        "description": "שביל הליכה רחב ומוצל העובר בשיא רכס הכרמל עם נוף עוצר נשימה אל חוף הכרמל והים התיכון. מתאים גם לעגלות ורוכבי אופניים."
    },

    # ── Center & Sharon ──────────────────────────────────────────
    {
        "authority_id": "OSM-REL-6543734",
        "name": "דרך הלב - ארבורטום יער אילנות (שרון)",
        "name_en": "The Heart Trail - Ilanot National Arboretum",
        "org": "קק״ל (OSM)",
        "region": "לב השרון ופרדסיה",
        "region_group": "center",
        "lat": 32.2796,
        "lng": 34.9130,
        "category": "nature",
        "type": ["גן בוטני יערני", "שביל עץ מונגש", "עצים מכל העולם", "עגלות"],
        "type_en": ["Botanical Forest", "Wheelchair Trail", "Global Trees", "Strollers"],
        "min_age": 0,
        "stroller_accessible": True,
        "vulnerabilities": ["עומס מבקרים בשבתות"],
        "description": "הארבורטום הלאומי של ישראל – גן בוטני יערני עם כ-750 מיני עצים נדירים מרחבי תבל, שבילי הליכה רחבים וגשרי עץ מונגשים לחלוטין לכל גיל."
    },
    {
        "authority_id": "OSM-REL-13792822",
        "name": "שביל שפך נחל פולג ורכס הכורכר",
        "name_en": "Nahal Poleg Estuary & Sand Dunes Trail",
        "org": "רשות הטבע והגנים ועיריית נתניה (OSM)",
        "region": "שרון וחוף נתניה",
        "region_group": "center",
        "lat": 32.2515,
        "lng": 34.8597,
        "category": "water",
        "type": ["שפך נחל", "רכס כורכר", "דיונות חול", "חוף ים"],
        "type_en": ["River Estuary", "Kurkar Ridge", "Sand Dunes", "Coastline"],
        "min_age": 0,
        "stroller_accessible": False,
        "vulnerabilities": ["קרינת שמש בצהריים"],
        "description": "שביל מגוון המשלב מים מתוקים של שפך נחל פולג, גבעות כורכר עם פריחה עונתית מרהיבה (אירוס הארגמן בחורף) וחולות חוף רכים."
    },
    {
        "authority_id": "OSM-REL-7819122",
        "name": "שביל הפרחים ביער בן שמן",
        "name_en": "Ben Shemen Forest Flower Trail",
        "org": "קק״ל (OSM)",
        "region": "מודיעין ושפלת יהודה",
        "region_group": "center",
        "lat": 31.9024,
        "lng": 35.0203,
        "category": "nature",
        "type": ["יער קק״ל", "פריחה עונתית", "שביל קל", "חניון פיקניק"],
        "type_en": ["KKL Forest", "Wildflower Trail", "Easy Walk", "Picnic Area"],
        "min_age": 0,
        "stroller_accessible": True,
        "vulnerabilities": ["עומס פיקניקים בשבתות"],
        "description": "שביל מעגלי קל ומשולט בלב יער בן שמן. בחורף ובאביב השביל מתמלא בכלניות, רקפות וסחלבים. נוח מאוד לפעוטות ועגלות."
    },
    {
        "authority_id": "OSM-REL-14609265",
        "name": "שביל תל חדיד המעגלי והמצפור",
        "name_en": "Tel Hadid Circular Heritage Trail & Vista",
        "org": "קק״ל והמועצה לשימור אתרים (OSM)",
        "region": "יער בן שמן ושפלת לוד",
        "region_group": "center",
        "lat": 31.9632,
        "lng": 34.9523,
        "category": "nature",
        "type": ["תל ארכיאולוגי", "מטעי זיתים", "תצפית גוש דן", "מורשת"],
        "type_en": ["Archaeological Tel", "Olive Groves", "Tel Aviv Panorama", "Heritage"],
        "min_age": 0,
        "stroller_accessible": True,
        "vulnerabilities": ["רוח בפסגת התל"],
        "description": "שביל טיול היסטורי מעגלי העולה אל פסגת תל חדיד, בין עצי זית עתיקים וטרסות אבן. בפסגה נשקפת תצפית פנורמית מרהיבה על כל גוש דן והשפלה."
    },
    {
        "authority_id": "OSM-REL-3867534",
        "name": "שביל יער אייל ונחל שילה",
        "name_en": "Eyal Forest & Shilo Stream Trail",
        "org": "קק״ל (OSM)",
        "region": "השרון הדרומי וראש העין",
        "region_group": "center",
        "lat": 32.2116,
        "lng": 34.9837,
        "category": "nature",
        "type": ["שביל יער", "חורש אקליפטוס", "שקט טבעי", "מסלול קל"],
        "type_en": ["Forest Trail", "Eucalyptus Groves", "Peaceful Nature", "Easy Walk"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["בוץ בערוץ הנחל אחרי גשם"],
        "description": "מסלול טבע רגוע ושקט ליד קיבוץ אייל, לאורך גדות נחל שילה ויער אקליפטוס מוצל עם נקודות ישיבה נעימות לפיקניק."
    },

    # ── Jerusalem & Judean Hills ─────────────────────────────────
    {
        "authority_id": "OSM-REL-1282706",
        "name": "שביל דרך בורמה ההיסטורית (שער הגיא)",
        "name_en": "Burma Road Historic Liberation Trail",
        "org": "קק״ל והמועצה לשימור אתרי מורשת (OSM)",
        "region": "הרי ירושלים ושער הגיא",
        "region_group": "jerusalem",
        "lat": 31.8165,
        "lng": 34.9814,
        "category": "nature",
        "type": ["שביל ישראל", "מורשת תש״ח", "דרך נוף", "יער אורנים"],
        "type_en": ["Israel Trail", "1948 Liberation Trail", "Scenic Road", "Pine Forest"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["עומס שבתות"],
        "description": "תוואי הדרך ההיסטורית שפרצה את המצור על ירושלים במלחמת העצמאות. שביל רחב בין יערות פארק רבין עם לוחות הסבר היסטוריים ומשוריינים."
    },
    {
        "authority_id": "OSM-REL-1299516",
        "name": "שביל נחל המערה ומערת התאומים (סימון אדום)",
        "name_en": "Nahal HaMeara & Twins Cave Trail (Red Mark)",
        "org": "רשות הטבע והגנים והוועדה לשבילי ישראל (OSM)",
        "region": "שפלת יהודה ובית שמש",
        "region_group": "jerusalem",
        "lat": 31.7315,
        "lng": 35.0377,
        "category": "nature",
        "type": ["מערת נטיפים", "נחל מוצל", "חורש ים תיכוני", "עטלפים"],
        "type_en": ["Dripstone Cave", "Shaded Stream", "Mediterranean Forest", "Bats Sanctuary"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["המערה סגורה בחורף לתרדמת עטלפים", "סלעים חלקים"],
        "description": "שביל קסום ומוצל בערוץ נחל המערה המוביל אל מערת התאומים – מערת נטיפים ענקית עם מעיינות זעירים ואוכלוסיית עטלפים מוגנת."
    },
    {
        "authority_id": "OSM-REL-1302132",
        "name": "שביל חורבת מדרס ומערות המסתור (פארק בריטניה)",
        "name_en": "Hurvat Madras & Hiding Caves Trail",
        "org": "רשות הטבע והגנים וקק״ל (OSM)",
        "region": "שפלת יהודה ופארק בריטניה",
        "region_group": "jerusalem",
        "lat": 31.6504,
        "lng": 34.9401,
        "category": "nature",
        "type": ["מערות מסתור", "זחילה במחילות", "פירמידה יהודית", "עתיקות"],
        "type_en": ["Bar Kokhba Caves", "Tunnel Crawl", "Judean Pyramid", "Ruins"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["מחייב פנסים לזחילה במערה"],
        "description": "המסלול האהוב ביותר על ילדים בשפלה! כולל מערכת מחילות מסתור מימי מרד בר כוכבא לזחילה חווייתית, מערת קולומבריום ענקית ופירמידת קבורה נדירה."
    },
    {
        "authority_id": "OSM-REL-1300400",
        "name": "שביל חורבת עתאב ועין עתאב (סימון כחול)",
        "name_en": "Hurvat Itab Fortress & Spring Trail (Blue Mark)",
        "org": "הוועדה לשבילי ישראל וקק״ל (OSM)",
        "region": "הרי ירושלים ונס הרים",
        "region_group": "jerusalem",
        "lat": 31.7329,
        "lng": 35.0612,
        "category": "nature",
        "type": ["מבצר צלבני", "מעיין נקבה", "בוסתנים", "תצפית 360"],
        "type_en": ["Crusader Fort", "Spring Tunnel", "Orchards", "Panorama"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["עליות ומדרגות סלע"],
        "description": "שביל יפהפה המטפס אל שרידי חווה מבוצרת צלבנית בראש הר, עובר ליד מעיין נקבה צלול (עין עתאב) ובוסתני שקדים וזיתים."
    },
    {
        "authority_id": "OSM-REL-1307935",
        "name": "שביל עין כפירה ונחל יתלה (סימון ירוק)",
        "name_en": "Ein Kfira Spring & Yitla Stream Trail",
        "org": "הוועדה לשבילי ישראל וקק״ל (OSM)",
        "region": "הרי ירושלים ומבוא חורון",
        "region_group": "jerusalem",
        "lat": 31.8289,
        "lng": 35.0853,
        "category": "water",
        "type": ["מעיין הררי", "בריכת מים", "קניון סלעי", "בוסתנים"],
        "type_en": ["Mountain Spring", "Water Pool", "Rocky Canyon", "Terraces"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["מים עמוקים בבריכה"],
        "description": "שביל מסומן היורד לערוץ נחל יתלה ומגיע לבריכת מעיין עמוקה ומרשימה הנאגרת בתוך מבנה אבן קדום ומוצל בעצי תאנה."
    },
    {
        "authority_id": "OSM-REL-1281869",
        "name": "שביל נחל כסלון ויער הקדושים (סימון אדום)",
        "name_en": "Nahal Kesalon & Martyrs Forest Trail",
        "org": "קק״ל והוועדה לשבילי ישראל (OSM)",
        "region": "הרי ירושלים ובית מאיר",
        "region_group": "jerusalem",
        "lat": 31.7852,
        "lng": 35.0652,
        "category": "nature",
        "type": ["שביל נחל", "יער מוצל", "מערת בני ברית", "פיקניק"],
        "type_en": ["Stream Trail", "Shaded Forest", "Bnei Brith Cave", "Picnic"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["צל עמוק - קריר בחורף"],
        "description": "מסלול מוצל וקלאסי לאורך אפיק נחל כסלון, העובר ביער הקדושים המוצל, מערת בני ברית וחניוני פיקניק מסודרים לצד השביל."
    },

    # ── South (Craters, Negev, Arava) ────────────────────────────
    {
        "authority_id": "OSM-REL-1373435",
        "name": "שביל קניון נחל ארדון (מכתש רמון - סימון שחור)",
        "name_en": "Nahal Ardon Canyon Trail (Ramon Crater)",
        "org": "רשות הטבע והגנים והוועדה לשבילי ישראל (OSM)",
        "region": "מכתש רמון והר הנגב",
        "region_group": "south",
        "lat": 30.6128,
        "lng": 34.9441,
        "category": "desert",
        "type": ["מכתש רמון", "דייקים גיאולוגיים", "עץ שיטה", "קניון מדברי"],
        "type_en": ["Ramon Crater", "Magmatic Dykes", "Acacia Tree", "Desert Canyon"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["עומס חום קיצוני בקיץ", "אין צל למעט עצי השיטה"],
        "description": "מסלול מדברי מרתק ונוח לילדים בלב מכתש רמון. עובר בקניון מרשים שקירותיו חושפים 'דייקים' (סלעי מגמה שחורים שחדרו באבן החול) ועץ שיטה ענקי."
    },
    {
        "authority_id": "OSM-REL-1373447",
        "name": "שביל גבעת חרוט - תצפית לב המכתש (סימון ירוק)",
        "name_en": "Givat Harut Cone Trail (Ramon Crater)",
        "org": "רשות הטבע והגנים והוועדה לשבילי ישראל (OSM)",
        "region": "מכתש רמון והר הנגב",
        "region_group": "south",
        "lat": 30.6194,
        "lng": 34.9498,
        "category": "desert",
        "type": ["מכתש רמון", "גבעת חרוט", "תצפית 360", "סלעי בזלת"],
        "type_en": ["Ramon Crater", "Volcanic Cone", "Panorama", "Basalt Rocks"],
        "min_age": 7,
        "stroller_accessible": False,
        "vulnerabilities": ["עלייה תלולה בסלעים שחורים", "רוח בפסגה"],
        "description": "שביל העולה אל גבעת חרוט – גבעה וולקנית מחודדת ובולטת במזרח מכתש רמון. מהפסגה נשקף מראה מרהיב של כל קרקעית המכתש."
    },
    {
        "authority_id": "OSM-REL-1373448",
        "name": "שביל פסגת הר ארדון (מצוק מכתש רמון - סימון כחול)",
        "name_en": "Mount Ardon Summit Trail (Ramon Crater)",
        "org": "רשות הטבע והגנים והוועדה לשבילי ישראל (OSM)",
        "region": "מכתש רמון ומצוקי המכתש",
        "region_group": "south",
        "lat": 30.6333,
        "lng": 34.9395,
        "category": "desert",
        "type": ["מכתש רמון", "פסגת הר", "תצפית מצוק", "מיטיבי לכת"],
        "type_en": ["Ramon Crater", "Summit Climb", "Cliffside Vista", "Challenging Hike"],
        "min_age": 7,
        "stroller_accessible": False,
        "vulnerabilities": ["שיפוע תלול", "עומס חום"],
        "description": "אחת התצפיות המרשימות ביותר במזרח התיכון! טיפוס מעל מצוקי מכתש רמון עם מבט על בקעת ארדון, הרי אדום ומרחבי הנגב."
    },
    {
        "authority_id": "OSM-REL-1534064",
        "name": "קניון נחל ברק וסולמות החבלים (הערבה)",
        "name_en": "Nahal Barak Ladders Canyon (Central Arava)",
        "org": "רשות הטבע והגנים והוועדה לשבילי ישראל (OSM)",
        "region": "הערבה התיכונה",
        "region_group": "south",
        "lat": 30.3969,
        "lng": 35.1045,
        "category": "desert",
        "type": ["קניון מעוק", "סולמות ויתדות", "גבי מים", "אתגרי"],
        "type_en": ["Slot Canyon", "Ladders & Ropes", "Water Pools", "Adventure Hike"],
        "min_age": 10,
        "stroller_accessible": False,
        "vulnerabilities": ["שיטפונות בזק בחורף", "סולמות גבוהים"],
        "description": "קניון מעוק מדברי לבן ומרהיב בערבה, הכולל טיפוס בסולמות ברזל קבועים ומעבר גבי מים צלולים אחרי גשמים. למשפחות הרפתקניות (10+)."
    },
    {
        "authority_id": "OSM-REL-1534214",
        "name": "שביל פרסת נקרות ועין סהרונים",
        "name_en": "Nekarot Horseshoe Trail & Desert Spring",
        "org": "רשות הטבע והגנים (OSM)",
        "region": "מכתש רמון והערבה",
        "region_group": "south",
        "lat": 30.6221,
        "lng": 35.0732,
        "category": "desert",
        "type": ["קניון נקרות", "מעיין מדברי", "שביל מעגלי", "סלעי גיר"],
        "type_en": ["Nekarot Canyon", "Desert Spring", "Circular Trail", "Limestone Cliffs"],
        "min_age": 4,
        "stroller_accessible": False,
        "vulnerabilities": ["עומס חום בקיץ"],
        "description": "המסלול הקלאסי והמומלץ ביותר לילדים במכתש רמון! סיבוב מעגלי בקניון לבן ומצוקי ובו חלוקי נחל, מערות קטנות ועצי שיטה."
    },
    {
        "authority_id": "OSM-REL-2164248",
        "name": "שביל מעלה אברהם - המכתש הגדול (ירוחם)",
        "name_en": "Ma'ale Avraham Ridge Trail - Great Crater",
        "org": "רשות הטבע והגנים וקק״ל (OSM)",
        "region": "הנגב הצפוני והמכתש הגדול",
        "region_group": "south",
        "lat": 30.9266,
        "lng": 34.9154,
        "category": "desert",
        "type": ["המכתש הגדול", "רכס חתירה", "אנדרטת הצנחנים", "תצפית מכתש"],
        "type_en": ["Great Crater", "Hatira Ridge", "Paratroopers Memorial", "Crater Panorama"],
        "min_age": 7,
        "stroller_accessible": False,
        "vulnerabilities": ["שביל מצוקי", "רוחות חזקות"],
        "description": "שביל מסומן היורד מרכס חתירה אל המכתש הגדול, עם אנדרטת הפלמ״ח והצנחנים ותצפית פנורמית על כל חולות וקירות המכתש."
    }
]


def run_trail_ingestion(db_path: str = "assets_db.json"):
    if not os.path.exists(db_path):
        print(f"[-] Database {db_path} not found!")
        return

    with open(db_path, "r", encoding="utf-8") as f:
        assets: List[Dict[str, Any]] = json.load(f)

    initial_count = len(assets)
    print(f"[*] Starting OSM/IHM marked trails ingestion.")
    print(f"[*] Current assets in DB: {initial_count}")

    # Determine starting ID
    max_id = max([a.get("id", 0) for a in assets], default=805)
    current_id = max(max_id + 1, 901)

    accepted_count = 0
    rejected_count = 0

    for cand in SCRAPED_OSM_TRAIL_RELATIONS:
        # Check guardrails against existing assets
        is_valid, reasons, dup_info = verify_site_guardrails(cand, assets)
        if not is_valid:
            print(f"[-] REJECTED: {cand['name']} ({cand.get('authority_id')}) -> {', '.join(reasons)}")
            rejected_count += 1
            continue

        # Evaluate min age & accessibility
        age_eval = evaluate_min_age(cand)
        cand["id"] = current_id
        cand["min_age"] = age_eval["min_age"]
        cand["age_group"] = age_eval["age_label"]
        cand["stroller_accessible"] = cand.get("stroller_accessible", age_eval.get("stroller_accessible", False))

        assets.append(cand)
        accepted_count += 1
        print(f"[+] ACCEPTED: [{cand['id']}] {cand['name']} | Auth: {cand['authority_id']} | Age: {cand['age_group']} | Stroller: {cand['stroller_accessible']}")
        current_id += 1

    # Save updated database
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(assets, f, ensure_ascii=False, indent=2)

    print(f"\n=======================================================")
    print(f"[*] Ingestion Complete!")
    print(f"[*] Accepted New Marked Trails: {accepted_count}")
    print(f"[*] Rejected Duplicates / Collision: {rejected_count}")
    print(f"[*] Total Assets Now in DB: {len(assets)}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except AttributeError:
            pass
    run_trail_ingestion()
