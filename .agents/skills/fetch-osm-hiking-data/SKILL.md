---
name: fetch-osm-hiking-data
description: >-
  Collects crowdsourced OpenStreetMap (OSM) hiking trails, natural springs, pools, and viewpoints in Israel.
  Extracts geospatial coordinates, vulnerability tags, and free Wikidata metadata at strict $0 cost.
---

# fetch_osm_hiking_data

Collects crowdsourced hiking trails, natural springs, and panoramic viewpoints in Israel from OpenStreetMap (OSM) and Wikidata.

## Capabilities & Data Extracted
- **Natural Springs & Pools** (`natural=spring`, `amenity=drinking_water`): Springs, wading pools, seasonal desert potholes (גבים).
- **Panoramic Viewpoints** (`tourism=viewpoint`): Scenic lookouts, observation decks, and mountain viewpoints.
- **Hiking Routes** (`route=hiking`): Official Israel Trail (שביל ישראל) and regional color-coded trails.
- **Wikidata SPARQL enrichment**: Multilingual descriptions, historical background, and free Creative Commons photos.
- **Strict $0 Cost & Deterministic Fallback**: Automatic failover to local offline cache when network or rate-limits are reached.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `poi_type` | string | No | Filter by POI type: `"spring"`, `"viewpoint"`, `"trail"`, or `"all"` (default: `"all"`). |
| `region_group` | string | No | Optional geographic filter: `"north"`, `"center"`, `"south"`, `"jerusalem"`. |
| `use_live_api` | boolean | No | When `true`, queries live Overpass API. When `false` (default), uses verified offline dataset. |

## Returns

```json
{
  "status": "SUCCESS",
  "total_count": 6,
  "data_source": "OpenStreetMap & Wikidata ($0 Cost)",
  "items": [
    {
      "id": 301,
      "name": "עין מודע - עמק המעיינות",
      "name_en": "Ein Muda Spring",
      "region": "עמק המעיינות והגלבוע",
      "region_group": "north",
      "lat": 32.5085,
      "lng": 35.4521,
      "type": ["מעיין", "מים", "בריכת שכשוך"],
      "vulnerabilities": ["עומס חום קיצוני"],
      "category": "water"
    }
  ]
}
```

## Python Usage Example

```python
from skills.fetch_osm_hiking_data import fetch_osm_hiking_data

# Discover all northern springs
springs = fetch_osm_hiking_data(poi_type="spring", region_group="north")
for spring in springs["items"]:
    print(f"Spring: {spring['name']} @ {spring['lat']}, {spring['lng']}")
```
