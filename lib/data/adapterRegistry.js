class AdapterRegistry {
  constructor() { this._adapters = {}; }

  register(type, adapter) {
    if (this._adapters[type]) return { success: false, error: 'Already registered' };
    this._adapters[type] = adapter;
    return { success: true };
  }

  get(type) { return this._adapters[type] || null; }
  unregister(type) { delete this._adapters[type]; }
  list() { return Object.entries(this._adapters).map(([type]) => ({ type })); }
  count() { return Object.keys(this._adapters).length; }
  clear() { this._adapters = {}; }
}
module.exports = { AdapterRegistry };
