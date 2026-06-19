class TelemetryEventBus {
  constructor() {
    this._listeners = new Map();
    this._history = [];
    this._maxHistory = 500;
  }

  on(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const handlers = this._listeners.get(type);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  emit(type, data = {}) {
    const entry = { type, timestamp: Date.now(), data };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) this._history.shift();

    const handlers = this._listeners.get(type);
    if (handlers) {
      for (const h of handlers) { try { h(entry); } catch (e) { /* silent */ } }
    }
    const wildcard = this._listeners.get('*');
    if (wildcard) {
      for (const h of wildcard) { try { h(entry); } catch (e) { /* silent */ } }
    }
    return entry;
  }

  getHistory(type, limit = 100) {
    let events = this._history;
    if (type) events = events.filter(e => e.type === type);
    return events.slice(-limit);
  }

  clear() {
    this._history = [];
  }
}

const EVENT_TYPES = [
  'telemetry.metric',
  'telemetry.trace.started',
  'telemetry.trace.finished',
  'telemetry.alert.created',
  'telemetry.alert.resolved',
  'telemetry.health.changed',
  'telemetry.log',
  'telemetry.analytics.generated',
];

module.exports = { TelemetryEventBus, EVENT_TYPES };
