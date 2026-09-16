---
name: fetch-gov-parks-data
description: >-
  Collects official government open data from data.gov.il (INPA nature reserves and national parks),
  KKL-JNF Open GIS Hub (forests, night campgrounds, picnic areas), and Water Authority hydrological stream gauges.
---

# fetch_gov_parks_data

Collects official Israeli open data for national parks, nature reserves, and KKL-JNF forests with live stream flow metrics and Safe Haven designations.

## Capabilities & Sources
- **INPA (רשות הטבע והגנים - רט"ג)**: Official data from `data.gov.il`, opening hours, drinking water facilities, and designated vulnerable habitats.
- **KKL-JNF (קרן קימת לישראל - קק"ל)**: Shaded coniferous forests, picnic sites, and 24/7 overnight campgrounds acting as certified Safe Havens.
- **Water Authority (רשות המים)**: Stream flow rate measurements (`stream_flow_rate_m3_sec`) to identify raging streams or dry channels.
- **100% Free & Open**: Compatible with CC-BY 4.0 government open data licenses at strict $0 cost.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `authority` | string | No | Filter by authority: `"inpa"` (רט"ג), `"kkl"` (קק"ל), or `"all"` (default: `"all"`). |
| `region_group` | string | No | Geographic region: `"north"`, `"center"`, `"south"`, `"jerusalem"`. |
| `safe_havens_only` | boolean | No | When `true`, filters only certified sheltered/shaded fallback havens. |
| `use_live_api` | boolean | No | Set to `true` to query live `data.gov.il` CKAN API. |

## Returns

```json
{
  "status": "SUCCESS",
  "total_count": 5,
  "data_sources": [
    "data.gov.il (National Parks & Reserves)",
    "KKL-JNF Open GIS Hub (Forests & Campgrounds)",
    "Israel Water Authority (Hydrological Stream Gauges)"
  ],
  "items": [
    {
      "id": 502,
      "name": "חניון לילה שקף - יער יתיר (קק״ל)",
      "name_en": "Yatir Forest Night Camp (KKL-JNF)",
      "org": "קרן קימת לישראל (קק״ל)",
      "region": "דרום הר חברון ויער יתיר",
      "region_group": "south",
      "lat": 31.3482,
      "lng": 35.0594,
      "category": "safe_haven",
      "is_safe_haven": true
    }
  ]
}
```

## Python Usage Example

```python
from skills.fetch_gov_parks_data import fetch_gov_parks_data

# Discover all certified Safe Havens from KKL
havens = fetch_gov_parks_data(authority="kkl", safe_havens_only=True)
for haven in havens["items"]:
    print(f"Safe Haven: {haven['name']} ({haven['opening_hours']})")
```
