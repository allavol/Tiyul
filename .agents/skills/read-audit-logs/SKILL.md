---
name: read-audit-logs
description: >-
  Reads interaction audit logs from Google Drive synced folders or local directories in strict read-only mode.
  Validates ISO-8601 timestamps, log schema, and interaction turns without modifying or deleting files.
---

# read_audit_logs

Decoupled, read-only ingestion skill designed for Agent BAAL Validation Framework.
Enforces strict least privilege:
- Zero deletion permissions (cannot delete, rename or unlink files).
- Preserves raw audit trails as immutable evidence.
- Emits structured JSON turn payloads to the sandboxed auditor agent.

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `directory_path` | string | Yes | Directory containing the JSON log files. |
| `max_files` | int | No | Maximum number of files to scan (default: 100). |

## Returns

```json
{
  "status": "SUCCESS",
  "files_scanned": 5,
  "valid_logs": [
    {
      "file_name": "2026-10-15_log_123.json",
      "log_id": "log_123",
      "client_timestamp": "2026-10-15T21:52:12.450Z",
      "app_version": "1.0.0",
      "turns_count": 2,
      "turns": [...]
    }
  ],
  "invalid_files": []
}
```
