---
name: find-safe-alternative
description: >-
  Locates the nearest fallback asset categorized as a "Safe Haven" in assets_db.json
  when an active field asset is evaluated as CRITICAL.
---

# find_safe_alternative

Scans `assets_db.json` for assets designated as `"Safe Haven"` in their `vulnerabilities` array and calculates the geodesic Haversine distance from the given coordinates to identify the closest emergency fallback destination.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `current_lat` | float | Yes | Current latitude of the vulnerable asset or convoy. |
| `current_lng` | float | Yes | Current longitude of the vulnerable asset or convoy. |

## Geodesic Calculation

Uses the Haversine formula:
$$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
where $r = 6371.0\text{ km}$.

## Returns

```json
{
  "fallback_asset_id": 105,
  "fallback_name": "Beit Guvrin National Park",
  "distance_km": 50.42
}
```

- **`fallback_asset_id`** (int): Unique ID of the nearest Safe Haven asset.
- **`fallback_name`** (string): Designation / name of the Safe Haven asset.
- **`distance_km`** (float): Calculated distance in kilometers.

## Usage Example

### Python Invocation
```python
from skills.find_safe_alternative import find_safe_alternative

safe_haven = find_safe_alternative(current_lat=31.4655, current_lng=35.3884)
# Returns: {"fallback_asset_id": 105, "fallback_name": "Beit Guvrin National Park", "distance_km": 50.42}
```
