class MemoryCache {
  constructor() { this._cache = {}; this._ttls = {}; }
  get(key) {
    if (this._ttls[key] && this._ttls[key] < Date.now()) { delete this._cache[key]; delete this._ttls[key]; return null; }
    return this._cache[key] || null;
  }
  set(key, value, ttlMs) { this._cache[key] = value; if (ttlMs) this._ttls[key] = Date.now() + ttlMs; return { success: true }; }
  delete(key) { delete this._cache[key]; delete this._ttls[key]; return { success: true }; }
  has(key) { return key in this._cache; }
  clear() { this._cache = {}; this._ttls = {}; }
  size() { return Object.keys(this._cache).length; }
}
module.exports = { MemoryCache };
