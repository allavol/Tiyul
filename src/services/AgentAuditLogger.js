/**
 * AgentAuditLogger.js - Client-Side Validation & Interaction Audit Logger
 * 
 * Part of Agent BAAL Validation Framework & Quality Gate ($0 Total Cost Policy).
 * Features:
 * - Immutable ISO-8601 timestamps on every interaction turn
 * - Captures query, NLU parsed state, bot response, proposals and telemetry
 * - Zero-cloud client storage (localStorage circular buffer, up to 200 turns)
 * - One-click JSON export for offline audit and LLM-as-a-Judge inspection
 * - Optional zero-cost webhook sync to Google Apps Script -> Google Drive
 */

const STORAGE_KEY = 'tiyul_validation_audit_log';
const CONFIG_KEY = 'tiyul_audit_config';
const MAX_STORED_TURNS = 200;
const CURRENT_APP_VERSION = '1.0.0';
const CURRENT_APP_COMMIT = '4bcf757';

class AgentAuditLoggerClass {
  constructor() {
    this.sessionId = this._initSessionId();
    this.inMemoryLog = this._createDefaultLog();
    this.inMemoryWebhookUrl = '';
    this._loadFromStorage();
  }

  _createDefaultLog() {
    const nowIso = new Date().toISOString();
    return {
      log_id: 'log_' + this.sessionId,
      client_timestamp: nowIso,
      updated_at: nowIso,
      app_version: CURRENT_APP_VERSION,
      app_commit_hash: CURRENT_APP_COMMIT,
      environment: typeof window !== 'undefined' ? window.location.hostname : 'node',
      user_device: typeof navigator !== 'undefined' ? navigator.userAgent : 'test-runner',
      session_id: this.sessionId,
      turns: [],
      audit_metadata: {
        is_checked: false,
        checked_at: null,
        verdict: 'PENDING',
        resolution_status: 'PENDING'
      }
    };
  }

  _initSessionId() {
    if (typeof sessionStorage !== 'undefined') {
      let id = sessionStorage.getItem('tiyul_audit_session_id');
      if (!id) {
        id = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        try { sessionStorage.setItem('tiyul_audit_session_id', id); } catch (e) {}
      }
      return id;
    }
    return 'sess_' + Date.now().toString(36);
  }

  /**
   * Record a full conversation turn into the validation audit trail.
   */
  recordTurn({
    query = '',
    response = '',
    nluState = {},
    proposals = [],
    toolActivity = null,
    latencyMs = 0
  }) {
    if (!query || typeof query !== 'string') return null;

    const nowIso = new Date().toISOString();
    const turnId = 'turn_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    const turnRecord = {
      turn_id: turnId,
      timestamp: nowIso,
      query: query.trim(),
      nlu_parsed: {
        region: nluState.region || null,
        sub_region: nluState.subRegion || null,
        timing: nluState.timing || null,
        target_month: nluState.targetMonth || null,
        min_age: nluState.minAge ?? null,
        stroller: !!nluState.stroller,
        feature: nluState.feature || null,
        water_negation: !!nluState.waterNegation,
        is_contradiction: !!nluState.contradiction,
        origin_city: nluState.originCity || null,
        max_distance_km: nluState.maxDistanceKm || null
      },
      agent_response: typeof response === 'string' ? response : (response?.text || ''),
      proposals_count: proposals?.length || 0,
      proposals: (proposals || []).map(p => ({
        id: p.id,
        name: p.name,
        region: p.region,
        min_age: p.min_age,
        stroller_accessible: !!p.stroller_accessible,
        authority_id: p.authority_id || null,
        dist_km: p._distKm || null
      })),
      tool_activity: toolActivity || null,
      latency_ms: Math.round(latencyMs)
    };

    if (!this.inMemoryLog) {
      this.inMemoryLog = this._createDefaultLog();
    }

    this.inMemoryLog.turns.unshift(turnRecord);
    if (this.inMemoryLog.turns.length > MAX_STORED_TURNS) {
      this.inMemoryLog.turns.pop();
    }
    this.inMemoryLog.updated_at = nowIso;

    this._saveToStorage();

    return turnRecord;
  }

  /**
   * Retrieve the current audit log container.
   */
  getAuditLog() {
    if (!this.inMemoryLog) {
      this.inMemoryLog = this._createDefaultLog();
    }
    return this.inMemoryLog;
  }

  _saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryLog));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for validation log');
    }
  }

  _loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.turns)) {
          this.inMemoryLog = parsed;
        }
      }
      const rawCfg = localStorage.getItem(CONFIG_KEY);
      if (rawCfg) {
        const parsedCfg = JSON.parse(rawCfg);
        if (parsedCfg && parsedCfg.webhookUrl) {
          this.inMemoryWebhookUrl = parsedCfg.webhookUrl;
        }
      }
    } catch (e) {}
  }

  /**
   * Export the current audit log as a downloadable JSON file.
   */
  exportAsJsonFile() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;

    const log = this.getAuditLog();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tiyul_validation_audit_${dateStr}.json`;
    const jsonStr = JSON.stringify(log, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  /**
   * Constructs an ultra-short, URL-safe GitHub Issue URL (under 100 characters total)
   * with ZERO body parameter to guarantee that GitHub HTTP 414 'Whoa there! Your request URL is too long'
   * errors NEVER occur, even when mobile users are redirected through https://github.com/login?return_to=...
   */
  buildSafeGitHubIssueUrl(repoUrl = 'https://github.com/allavol/Tiyul') {
    const log = this.getAuditLog();
    const turns = log.turns || [];
    const latestTurn = turns[turns.length - 1] || turns[0];
    const querySnippet = latestTurn?.query ? latestTurn.query.trim().substring(0, 25) : 'Report';
    const nowIso = new Date().toISOString().substring(0, 10);

    const title = `[Q&A Audit] ${querySnippet} (${nowIso})`;
    // Pass ONLY title! Body is copied to user's clipboard ready for Paste.
    return `${repoUrl}/issues/new?title=${encodeURIComponent(title)}`;
  }

  /**
   * Triggers native Web Share API on mobile (WhatsApp, Gmail, Drive, Telegram)
   * or falls back to clipboard copy.
   */
  async shareAuditLog() {
    const fullReport = this.generateFullReportMarkdown();
    const log = this.getAuditLog();
    const nowIso = new Date().toISOString().substring(0, 10);
    const fileName = `audit_log_${nowIso}.json`;

    // 1. Copy to clipboard as baseline
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullReport);
      }
    } catch (e) {}

    // 2. Mobile Web Share API
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (typeof File !== 'undefined' && navigator.canShare) {
          const file = new File([JSON.stringify(log, null, 2)], fileName, { type: 'application/json' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `דוח שיחה לסוכן הטיולים (${nowIso})`,
              text: `מצורף יומן שיחה ואימות (${nowIso}):`,
              files: [file]
            });
            return { success: true, method: 'share_files' };
          }
        }

        await navigator.share({
          title: `דוח שיחה לסוכן הטיולים (${nowIso})`,
          text: fullReport
        });
        return { success: true, method: 'share_text' };
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'aborted' };
        }
      }
    }

    return { success: true, method: 'clipboard' };
  }

  /**
   * Generates the comprehensive Markdown + JSON payload for clipboard copy or export.
   */
  generateFullReportMarkdown() {
    const log = this.getAuditLog();
    const turns = log.turns || [];
    const nowIso = new Date().toISOString();

    let md = `### 🛡️ דיווח ולידציה ובקרת איכות לסוכן הטיולים\n\n`;
    md += `- **חותמת זמן לקוח:** \`${log.client_timestamp || nowIso}\`\n`;
    md += `- **גרסת אפליקציה:** \`${log.app_version}\` (Commit \`${log.app_commit_hash}\`)\n`;
    md += `- **סביבה:** \`${log.environment}\`\n`;
    md += `- **מזהה שיחה:** \`${log.session_id}\`\n`;
    md += `- **סה"כ תורות שנבדקו:** \`${turns.length}\`\n\n`;

    md += `#### פרוטוקול השאלות והתשובות המלא:\n\n`;
    turns.forEach((t, i) => {
      md += `**תור #${i + 1} (${t.timestamp}):**\n`;
      md += `* **שאלה:** ${t.query}\n`;
      md += `* **תשובת הסוכן:** ${t.agent_response}\n`;
      if (t.proposals && t.proposals.length > 0) {
        md += `* **הצעות:** ${t.proposals.map(p => p.name).join(', ')}\n`;
      }
      md += `\n---\n`;
    });

    const jsonSnippet = JSON.stringify(log, null, 2);
    md += `\n<details>\n<summary>📋 נתוני JSON מובנים לסקירה ממוחשבת (Click to Expand)</summary>\n\n\`\`\`json\n${jsonSnippet}\n\`\`\`\n</details>\n`;

    return md;
  }

  /**
   * Open a pre-filled GitHub Issue in a new tab with the structured validation audit payload.
   * Completely zero-cost, secure, copies full payload to clipboard, and stays within safe URL limits.
   */
  openGitHubIssueReport(repoUrl = 'https://github.com/allavol/Tiyul') {
    if (typeof window === 'undefined') return false;

    // 1. Copy complete, untruncated transcript + JSON to user clipboard
    try {
      const fullReport = this.generateFullReportMarkdown();
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(fullReport).catch(() => {});
      }
    } catch (e) {}

    // 2. Open safe-length GitHub issue URL
    const targetUrl = this.buildSafeGitHubIssueUrl(repoUrl);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return true;
  }

  /**
   * Set and persist a Google Apps Script Webhook URL for Google Drive sync.
   */
  setWebhookUrl(url) {
    this.inMemoryWebhookUrl = url ? url.trim() : '';
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ webhookUrl: this.inMemoryWebhookUrl }));
    } catch (e) {}
  }

  /**
   * Get the configured Google Apps Script Webhook URL.
   */
  getWebhookUrl() {
    return this.inMemoryWebhookUrl || '';
  }

  /**
   * Sync the current audit log to Google Drive via Google Apps Script Webhook.
   * Uses text/plain payload to avoid CORS preflight options issues in Apps Script.
   */
  async syncToWebhook(overrideUrl = null) {
    const targetUrl = overrideUrl || this.getWebhookUrl();
    if (!targetUrl) {
      throw new Error('כתובת Webhook ל-Google Drive אינה מוגדרת');
    }

    const log = this.getAuditLog();
    if (!log.turns || log.turns.length === 0) {
      throw new Error('אין שאלות ותשובות מתועדות ביומן לסנכרון');
    }

    // Google Apps Script doPost receives text/plain seamlessly without CORS blockers
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(log)
    });

    if (!response.ok) {
      throw new Error(`שגיאת שרת בסנכרון (${response.status})`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Reset the current audit log.
   */
  clearLog() {
    this.inMemoryLog = this._createDefaultLog();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  }
}

export const AgentAuditLogger = new AgentAuditLoggerClass();
