---
name: update-c4i-dashboard
description: >-
  Executes C4I dashboard tactical updates for asset rerouting.
  Updates asset status, renders rerouting vector to the Safe Haven, and logs explainability (XAI) rationale.
---

# update_c4i_dashboard

Executes tactical UI updates on the Family Mission Control C4I dashboard:
1. Transitions asset status to `"REROUTED"`.
2. Updates map pin rendering (e.g. highlights threat and fallback waypoint).
3. Draws tactical routing vectors from original asset location to selected Safe Haven.
4. Emits structured XAI reasoning logs to the tactical terminal.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `original_asset_id` | int | Yes | ID of the asset being rerouted. |
| `new_status` | string | Yes | New operational status (typically `"REROUTED"`). |
| `fallback_asset_id` | int | Yes | ID of the target Safe Haven. |
| `confidence_score` | int | Yes | Confidence score (1-100) of the decision logic. |
| `reasoning_log` | string | Yes | Concise 1-sentence data fusion reasoning log. |

## Returns

- **`success`** (boolean): Returns `true` if the dashboard state and tactical dispatch are successfully updated.

## Usage Example

### Python Invocation
```python
from skills.update_c4i_dashboard import update_c4i_dashboard

status = update_c4i_dashboard(
    original_asset_id=103,
    new_status="REROUTED",
    fallback_asset_id=105,
    confidence_score=95,
    reasoning_log="Ein Gedi triggered CRITICAL flash flood vulnerability; rerouted to closest Safe Haven Beit Guvrin (50.4 km) outside threat zone."
)
# Returns: True
```
