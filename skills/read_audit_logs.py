"""
skills/read_audit_logs.py - Decoupled Read-Only Audit Log Ingestion Skill

Enforces strict Least Privilege & Zero Data Loss principles:
1. PURELY READ-ONLY: Never writes, modifies, renames or deletes incoming log files.
2. Schema Validation: Validates ISO-8601 timestamps, log_id and interaction turns.
3. Decoupled Ingestion: Reads from any local directory (e.g. local folder or synced Google Drive folder)
   and emits standardized in-memory audit payloads to the auditor agent.
"""

import os
import json
import re
from typing import List, Dict, Any, Optional

ISO_8601_REGEX = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$')


def is_valid_iso_timestamp(ts: Any) -> bool:
    if not isinstance(ts, str):
        return False
    return bool(ISO_8601_REGEX.match(ts))


def read_audit_logs(
    directory_path: str,
    max_files: int = 100
) -> Dict[str, Any]:
    """
    Read and parse interaction audit logs from a specified folder in READ-ONLY mode.
    
    Args:
        directory_path: Absolute or relative path to the directory containing log files.
        max_files: Maximum number of files to read in a single batch.

    Returns:
        Dict with status, count, and parsed logs:
        {
            "status": "SUCCESS" | "WARNING" | "EMPTY",
            "files_scanned": int,
            "valid_logs": List[Dict],
            "invalid_files": List[Dict]
        }
    """
    if not os.path.exists(directory_path) or not os.path.isdir(directory_path):
        return {
            "status": "EMPTY",
            "message": f"Directory not found: {directory_path}",
            "files_scanned": 0,
            "valid_logs": [],
            "invalid_files": []
        }

    valid_logs: List[Dict[str, Any]] = []
    invalid_files: List[Dict[str, Any]] = []
    files_scanned = 0

    # Sort files by modification time or name
    file_names = sorted(os.listdir(directory_path))

    for fname in file_names:
        if not fname.endswith('.json'):
            continue

        if files_scanned >= max_files:
            break

        file_path = os.path.join(directory_path, fname)
        if not os.path.isfile(file_path):
            continue

        files_scanned += 1

        try:
            # Strictly READ-ONLY opening
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)

            # Validate basic schema
            log_id = content.get('log_id')
            client_ts = content.get('client_timestamp')
            turns = content.get('turns')

            if not log_id or not isinstance(turns, list):
                invalid_files.append({
                    "file_name": fname,
                    "reason": "Missing required 'log_id' or 'turns' list."
                })
                continue

            has_valid_ts = is_valid_iso_timestamp(client_ts)

            valid_logs.append({
                "file_name": fname,
                "file_path": file_path,
                "log_id": str(log_id),
                "client_timestamp": client_ts if has_valid_ts else None,
                "app_version": content.get('app_version', 'unknown'),
                "app_commit_hash": content.get('app_commit_hash', 'unknown'),
                "session_id": content.get('session_id', 'unknown'),
                "environment": content.get('environment', 'unknown'),
                "turns_count": len(turns),
                "turns": turns,
                "audit_metadata": content.get('audit_metadata', {})
            })

        except Exception as err:
            invalid_files.append({
                "file_name": fname,
                "reason": f"Failed to parse JSON: {str(err)}"
            })

    return {
        "status": "SUCCESS" if valid_logs else ("EMPTY" if files_scanned == 0 else "WARNING"),
        "files_scanned": files_scanned,
        "valid_logs": valid_logs,
        "invalid_files": invalid_files
    }
