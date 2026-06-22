class DataManager {
  constructor() { this._datasources = {}; }
  register(name, config) { this._datasources[name] = { ...config, registeredAt: Date.now() }; }
  get(name) { return this._datasources[name] || null; }
  unregister(name) { delete this._datasources[name]; }
  list() { return Object.entries(this._datasources).map(([name, cfg]) => ({ name, ...cfg })); }
  count() { return Object.keys(this._datasources).length; }
  clear() { this._datasources = {}; }
}
module.exports = { DataManager };
