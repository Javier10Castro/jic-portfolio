class RedisCache {
  constructor() { this._store = {}; this._ttls = {}; }
  connect(config) { this._prefix = config.prefix || ''; return { success: true }; }
  get(key) { const k = this._prefix + key; if (this._ttls[k] && this._ttls[k] < Date.now()) { delete this._store[k]; delete this._ttls[k]; return null; } return this._store[k] || null; }
  set(key, value, ttlMs) { const k = this._prefix + key; this._store[k] = value; if (ttlMs) this._ttls[k] = Date.now() + ttlMs; return { success: true }; }
  delete(key) { const k = this._prefix + key; delete this._store[k]; delete this._ttls[k]; return { success: true }; }
  clear() { this._store = {}; this._ttls = {}; }
}
module.exports = { RedisCache };
