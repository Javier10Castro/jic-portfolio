class VectorManager {
  constructor() { this._stores = {}; }
  register(name, provider) { this._stores[name] = provider; }
  get(name) { return this._stores[name] || null; }
  list() { return Object.keys(this._stores); }
  count() { return Object.keys(this._stores).length; }
  clear() { this._stores = {}; }
}
module.exports = { VectorManager };
