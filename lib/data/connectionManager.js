class ConnectionManager {
  constructor() { this._connections = {}; }

  connect(name, type, config, adapterRegistry) {
    if (this._connections[name]) return { success: false, error: 'Already connected' };
    const adapter = adapterRegistry ? adapterRegistry.get(type) : null;
    if (!adapter) return { success: false, error: `No adapter for type: ${type}` };
    const result = adapter.connect(config);
    if (!result.success) return result;
    this._connections[name] = { name, type, config, connectedAt: Date.now(), instance: result.instance };
    return { success: true, connection: this._connections[name] };
  }

  disconnect(name) {
    if (!this._connections[name]) return { success: false, error: 'Not connected' };
    delete this._connections[name];
    return { success: true };
  }

  get(name) { return this._connections[name] || null; }
  list() { return Object.values(this._connections); }
  count() { return Object.keys(this._connections).length; }
  clear() { this._connections = {}; }
}
module.exports = { ConnectionManager };
