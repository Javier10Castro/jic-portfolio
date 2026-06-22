const EVENTS = {
  SDK_GENERATED: 'developer.sdk.generated',
  CLIENT_GENERATED: 'developer.client.generated',
  OPENAPI_GENERATED: 'developer.openapi.generated',
  SCHEMA_GENERATED: 'developer.schema.generated',
  CLI_COMMAND: 'developer.cli.command',
  API_CALL: 'developer.api.call',
  PORTAL_VIEWED: 'developer.portal.viewed',
  DOCS_VIEWED: 'developer.docs.viewed'
};

class DeveloperEvents {
  constructor() { this._listeners = {}; this._history = []; }

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }

  off(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
  }

  emit(event, data) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);
    (this._listeners[event] || []).forEach(h => { try { h(entry); } catch (e) {} });
    (this._listeners['*'] || []).forEach(h => { try { h(entry); } catch (e) {} });
    return entry;
  }

  history(event) {
    if (!event) return [...this._history];
    return this._history.filter(h => h.event === event);
  }

  clear() { this._history = []; this._listeners = {}; }
}

module.exports = { DeveloperEvents, EVENTS };
