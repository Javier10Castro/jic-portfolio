class DistributedCache {
  constructor() { this._nodes = {}; this._store = {}; }
  addNode(name, config) { this._nodes[name] = config; return { success: true }; }
  removeNode(name) { delete this._nodes[name]; }
  get(key) { return this._store[key] || null; }
  set(key, value, ttlMs) { this._store[key] = value; return { success: true }; }
  delete(key) { delete this._store[key]; return { success: true }; }
  getNodes() { return Object.keys(this._nodes); }
  clear() { this._nodes = {}; this._store = {}; }
}
module.exports = { DistributedCache };
