class IndexManager {
  constructor() { this._indexes = {}; }
  create(name, config = {}) {
    if (this._indexes[name]) return { success: false, error: 'Index exists' };
    this._indexes[name] = { name, type: config.type || 'hnsw', dimensions: config.dimensions || 1536, metric: config.metric || 'cosine', status: 'ready', createdAt: Date.now() };
    return { success: true, index: this._indexes[name] };
  }
  get(name) { return this._indexes[name] || null; }
  drop(name) { delete this._indexes[name]; return { success: true }; }
  list() { return Object.values(this._indexes); }
  count() { return Object.keys(this._indexes).length; }
  clear() { this._indexes = {}; }
}
module.exports = { IndexManager };
