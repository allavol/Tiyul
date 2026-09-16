---
name: evaluate-min-age
description: Evaluates recommended minimum age (0+ strollers, 4+ kids, 8+ juniors, 12+ adventurers) for hiking trails and reserves based on physical obstacles and dynamic climate constraints.
---

# Evaluate Minimum Age Skill

## Purpose
Determines the age suitability tier for families, youth groups, and hikers. Prevents taking young children into dangerous boulder fields, extreme sun exposure, or technical canyons with ladders.

## Age Tiers
- **0+ (פעוטות ועגלות)**: Paved promenade, shade, no steps or ladders, safe haven.
- **4+ (ילדים ומשפחות)**: Clear gentle trail, under 3 km, archaeological parks.
- **8+ (נוער ומשפחות מטיבות לכת)**: Rocky terrain, water wading, elevation climb.
- **12+ (אתגרי ומיטיבי לכת)**: Exposed cliffs, ladders, rungs, extreme canyons.

## Dynamic Weather Escalation
If temperature exceeds 36°C or flood/rain alerts create slippery conditions, the recommended age automatically escalates to protect hikers from heatstroke and falls.

## Usage (Python)
```python
from skills.evaluate_min_age import evaluate_min_age

res = evaluate_min_age(asset, current_temp_c=35.5)
print(res["min_age"], res["age_label"])
```
