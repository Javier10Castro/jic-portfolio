class ReplicationManager {
  constructor() { this._replications = {}; }

  setup(name, config = {}) {
    if (this._replications[name]) return { success: false, error: 'Already exists' };
    this._replications[name] = { name, type: config.type || 'primary-replica', status: 'active', config, created_at: Date.now(), lag: 0 };
    return { success: true, replication: this._replications[name] };
  }

  getStatus(name) {
    const rep = this._replications[name];
    if (!rep) return null;
    rep.lag = Math.floor(Math.random() * 100);
    rep.lastSync = Date.now();
    return { ...rep };
  }

  list() { return Object.values(this._replications); }
  remove(name) { delete this._replications[name]; }
  count() { return Object.keys(this._replications).length; }
  clear() { this._replications = {}; }
}
module.exports = { ReplicationManager };
