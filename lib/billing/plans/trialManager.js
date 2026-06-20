class TrialManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._trials = {};
  }

  startTrial(customerId, planId, days = 14, options = {}) {
    const trial = {
      id: `trial-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      customerId, planId, days, status: 'active',
      startDate: Date.now(), endDate: Date.now() + days * 86400000,
      convertedAt: null, expiredAt: null,
      metadata: options.metadata || {}
    };
    if (!this._trials[customerId]) this._trials[customerId] = [];
    this._trials[customerId].push(trial);
    if (this._storage) this._storage.create('trials', trial.id, trial);
    if (this._events) this._events.emit('trial.started', trial);
    return trial;
  }

  convertTrial(customerId) {
    const active = this.getActiveTrial(customerId);
    if (!active) return null;
    active.status = 'converted';
    active.convertedAt = Date.now();
    if (this._storage) this._storage.update('trials', active.id, active);
    return active;
  }

  expireTrial(customerId) {
    const active = this.getActiveTrial(customerId);
    if (!active) return null;
    active.status = 'expired';
    active.expiredAt = Date.now();
    if (this._storage) this._storage.update('trials', active.id, active);
    if (this._events) this._events.emit('trial.expired', active);
    return active;
  }

  getActiveTrial(customerId) {
    const trials = this._trials[customerId] || [];
    return trials.find(t => t.status === 'active' && t.endDate > Date.now()) || null;
  }

  hasActiveTrial(customerId) { return this.getActiveTrial(customerId) !== null; }
  getTrials(customerId) { return this._trials[customerId] ? [...this._trials[customerId]] : []; }
  getActiveCount() {
    return Object.values(this._trials).reduce((sum, trials) =>
      sum + trials.filter(t => t.status === 'active' && t.endDate > Date.now()).length, 0);
  }
  getConvertedCount() {
    return Object.values(this._trials).reduce((sum, trials) =>
      sum + trials.filter(t => t.status === 'converted').length, 0);
  }
  clear() { this._trials = {}; }
}

module.exports = { TrialManager };
