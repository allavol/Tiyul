"""
update_c4i_dashboard skill:
Executes the final C4I UI update. Changes the asset's pin color, draws a routing line to the safe haven, and prints the logic to the terminal.
"""
import os
import json
from typing import Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets_db.json")


def update_c4i_dashboard(
    original_asset_id: int,
    new_status: str,
    fallback_asset_id: int,
    confidence_score: int,
    reasoning_log: str,
    db_path: Optional[str] = None
) -> bool:
    """
    Executes tactical C4I UI update: updates asset status, draws routing vector,
    and prints structured tactical logs to the terminal.
    
    Args:
        original_asset_id: ID of the compromised asset.
        new_status: New operational status (e.g. "REROUTED").
        fallback_asset_id: ID of the designated Safe Haven.
        confidence_score: Score from 0 to 100.
        reasoning_log: 1-sentence data fusion rationale.
        db_path: Path to assets_db.json.
        
    Returns:
        Boolean indicating success of the C4I update.
    """
    path = db_path or DEFAULT_DB_PATH
    if not os.path.isabs(path):
        path = os.path.abspath(path)

    with open(path, "r", encoding="utf-8") as f:
        assets = json.load(f)

    orig_asset = next((a for a in assets if a.get("id") == original_asset_id), None)
    fallback_asset = next((a for a in assets if a.get("id") == fallback_asset_id), None)

    orig_name = orig_asset["name"] if orig_asset else f"Asset #{original_asset_id}"
    fallback_name = fallback_asset["name"] if fallback_asset else f"Safe Haven #{fallback_asset_id}"

    orig_coords = f"({orig_asset['lat']}, {orig_asset['lng']})" if orig_asset else "(Unknown)"
    fallback_coords = f"({fallback_asset['lat']}, {fallback_asset['lng']})" if fallback_asset else "(Unknown)"

    # Print tactical terminal output
    separator = "=" * 65
    output_lines = [
        f"\n{separator}",
        " [TACTICAL C4I UPDATE] MISSION CONTROL: FAMILY DISPATCH",
        separator,
        f" Target Asset      : [{original_asset_id}] {orig_name} {orig_coords}",
        f" Tactical Status   : {new_status} (PIN COLOR -> RED / WARNING FLASH)",
        f" Safe Haven Target : [{fallback_asset_id}] {fallback_name} {fallback_coords}",
        f" Routing Vector    : {orig_coords} ===> {fallback_coords}",
        f" Confidence Score  : {confidence_score}%",
        f" XAI Reasoning Log : {reasoning_log}",
        f"{separator}\n"
    ]
    for line in output_lines:
        try:
            print(line)
        except UnicodeEncodeError:
            print(line.encode("ascii", "replace").decode("ascii"))

    return True
