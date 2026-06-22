class PrimaryReplica {
  constructor() { this._replicas = {}; }
  addReplica(name, config) { this._replicas[name] = { ...config, name, status: 'connected', lag: 0 }; return { success: true }; }
  removeReplica(name) { delete this._replicas[name]; return { success: true }; }
  sync(name) { const r = this._replicas[name]; if (!r) return { success: false, error: 'Not found' }; r.lag = Math.floor(Math.random() * 50); r.lastSync = Date.now(); return { success: true, replica: name, lag: r.lag }; }
  syncAll() { Object.keys(this._replicas).forEach(n => this.sync(n)); return { success: true, count: Object.keys(this._replicas).length }; }
  getReplicas() { return Object.values(this._replicas); }
  count() { return Object.keys(this._replicas).length; }
  clear() { this._replicas = {}; }
}
module.exports = { PrimaryReplica };
