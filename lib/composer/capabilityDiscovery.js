class CapabilityDiscovery {
  constructor(registry) {
    this._registry = registry;
    this._history = [];
  }

  discover(query) {
    const result = this._registry
      ? (this._registry.find ? this._registry.find(query) : [])
      : [];
    this._history.push({ type: 'query', query, timestamp: Date.now() });
    return result;
  }

  discoverByType(type) {
    if (!type) return [];
    const result = this._registry ? (this._registry.find ? this._registry.find({ type }) : []) : [];
    this._history.push({ kind: 'type', type, timestamp: Date.now() });
    return result;
  }

  discoverAll() {
    const result = this._registry ? (this._registry.list ? this._registry.list() : []) : [];
    this._history.push({ type: 'all', timestamp: Date.now() });
    return result;
  }

  getDiscoveryHistory() {
    return this._history;
  }

  clear() {
    this._history = [];
  }
}

module.exports = { CapabilityDiscovery };
