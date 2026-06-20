class UsageTracker {
  constructor(options = {}) {
    this._storage = options.storage;
    this._records = {};
  }

  trackEvent(customerId, event, value = 1, options = {}) {
    const record = {
      id: `ue-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      customerId, event, value, timestamp: Date.now(),
      source: options.source || 'api', metadata: options.metadata || {}
    };
    const key = `${customerId}`;
    if (!this._records[key]) this._records[key] = [];
    this._records[key].push(record);
    if (this._storage) this._storage.push('usage_events', record);
    return record;
  }

  getEvents(customerId, options = {}) {
    const records = this._records[customerId] || [];
    let filtered = [...records];
    if (options.event) filtered = filtered.filter(r => r.event === options.event);
    if (options.start) filtered = filtered.filter(r => r.timestamp >= options.start);
    if (options.end) filtered = filtered.filter(r => r.timestamp <= options.end);
    if (options.limit) filtered = filtered.slice(-options.limit);
    return filtered;
  }

  getUniqueCustomers() { return Object.keys(this._records); }
  clear() { this._records = {}; }
}

module.exports = { UsageTracker };
