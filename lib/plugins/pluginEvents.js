const EVENTS = {
  PLUGIN_INSTALLED: 'plugin.installed',
  PLUGIN_UPDATED: 'plugin.updated',
  PLUGIN_REMOVED: 'plugin.removed',
  PLUGIN_LOADED: 'plugin.loaded',
  PLUGIN_UNLOADED: 'plugin.unloaded',
  PLUGIN_FAILED: 'plugin.failed',
  PLUGIN_ENABLED: 'plugin.enabled',
  PLUGIN_DISABLED: 'plugin.disabled',
  PLUGIN_PERMISSION_DENIED: 'plugin.permission.denied',
  PLUGIN_COMPATIBILITY_FAILED: 'plugin.compatibility.failed'
};

class PluginEvents {
  constructor() {
    this._listeners = {};
    this._history = [];
  }

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
    (this._listeners[event] || []).forEach(h => { try { h(entry); } catch (e) { /* noop */ } });
    (this._listeners['*'] || []).forEach(h => { try { h(entry); } catch (e) { /* noop */ } });
    return entry;
  }

  history(event) {
    if (!event) return [...this._history];
    return this._history.filter(h => h.event === event);
  }

  clear() { this._history = []; }
}

module.exports = { PluginEvents, EVENTS };
