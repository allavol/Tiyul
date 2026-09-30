/**
 * telemetry.js - Lightweight Local Client Telemetry ($0 Operating Cost)
 * 
 * Records tactical user interactions and agent decisions in local memory & sessionStorage
 * with zero cloud transmission (100% privacy and zero-cost).
 */

const STORAGE_KEY = 'tiyul_local_telemetry_events_v1';
const MAX_EVENTS = 100;

export const TELEMETRY_EVENT_TYPES = {
  SEARCH_QUERY: 'SEARCH_QUERY',
  SITE_SELECTED: 'SITE_SELECTED',
  CATEGORY_FILTER: 'CATEGORY_FILTER',
  AGE_FILTER: 'AGE_FILTER',
  WEATHER_VIEW: 'WEATHER_VIEW',
  CHAT_QUERY: 'CHAT_QUERY',
  WHAT_IF_TRIGGER: 'WHAT_IF_TRIGGER',
  SIMULATION_TRIGGER: 'SIMULATION_TRIGGER',
  SAFE_HAVEN_ROUTED: 'SAFE_HAVEN_ROUTED',
  CATALOG_TOGGLED: 'CATALOG_TOGGLED',
};

class LocalTelemetryTracker {
  constructor() {
    this.events = [];
    this._load();
  }

  _load() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      if (data) {
        this.events = JSON.parse(data);
      }
    } catch (e) {}
  }

  _save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.events.slice(-MAX_EVENTS)));
    } catch (e) {}
  }

  /**
   * Track an event
   * @param {string} type 
   * @param {object} payload 
   */
  track(type, payload = {}) {
    const event = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events.shift();
    }
    this._save();
    return event;
  }

  getRecentEvents(limit = 20) {
    return this.events.slice(-limit).reverse();
  }

  clear() {
    this.events = [];
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }
}

export const telemetry = new LocalTelemetryTracker();
