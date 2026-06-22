class StorageManager {
  constructor() { this._providers = {}; }
  register(name, provider) { this._providers[name] = provider; }
  get(name) { return this._providers[name] || null; }
  list() { return Object.keys(this._providers); }
  count() { return Object.keys(this._providers).length; }
  clear() { this._providers = {}; }
}
module.exports = { StorageManager };
