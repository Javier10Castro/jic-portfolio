const EVENTS = {
  CONNECTED: 'integration.connected',
  DISCONNECTED: 'integration.disconnected',
  INSTALLED: 'integration.installed',
  SYNCED: 'integration.synced',
  FAILED: 'integration.failed',
  WEBHOOK_RECEIVED: 'integration.webhook.received',
  HEALTH_CHANGED: 'integration.health.changed',
  TOKEN_EXPIRED: 'integration.token.expired'
};

class IntegrationEvents {
  constructor() {
    this._listeners = {};
    this._history = [];
  }

  on(event, handler) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(handler);
  }

  off(event, handler) {
    const handlers = this._listeners[event];
    if (!handlers) return;
    this._listeners[event] = handlers.filter(h => h !== handler);
  }

  emit(event, data) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);

    const handlers = this._listeners[event] || [];
    for (const handler of handlers) {
      try { handler(data); } catch (e) { /* silent */ }
    }

    const wildcard = this._listeners['*'] || [];
    for (const handler of wildcard) {
      try { handler(event, data); } catch (e) { /* silent */ }
    }
  }

  history(event) {
    if (event) {
      return this._history.filter(e => e.event === event);
    }
    return this._history;
  }

  clear() {
    this._listeners = {};
    this._history = [];
  }
}

IntegrationEvents.EVENTS = EVENTS;
module.exports = { IntegrationEvents, EVENTS };
