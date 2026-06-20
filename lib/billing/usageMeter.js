class UsageMeter {
  constructor(options = {}) {
    this._storage = options.storage;
    this._usage = {};
  }

  track(customerId, metric, amount, options = {}) {
    const key = `${customerId}:${metric}`;
    if (!this._usage[key]) {
      this._usage[key] = { customerId, metric, total: 0, records: [] };
    }
    const record = {
      id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      amount, timestamp: Date.now(),
      source: options.source || 'api',
      metadata: options.metadata || {}
    };
    this._usage[key].total += amount;
    this._usage[key].records.push(record);
    if (this._storage) this._storage.push('usage', { customerId, metric, amount, ...record });
    return record;
  }

  getUsage(customerId, metric) {
    const key = `${customerId}:${metric}`;
    return this._usage[key] || { customerId, metric, total: 0, records: [] };
  }

  getTotal(customerId, metric) {
    const key = `${customerId}:${metric}`;
    return this._usage[key] ? this._usage[key].total : 0;
  }

  getAllMetrics(customerId) {
    return Object.entries(this._usage)
      .filter(([k]) => k.startsWith(`${customerId}:`))
      .map(([, v]) => ({ metric: v.metric, total: v.total }));
  }

  getUsageInRange(customerId, metric, start, end) {
    const key = `${customerId}:${metric}`;
    if (!this._usage[key]) return [];
    return this._usage[key].records.filter(r => r.timestamp >= start && r.timestamp <= end);
  }

  reset(customerId, metric) {
    const key = `${customerId}:${metric}`;
    delete this._usage[key];
  }

  clear() { this._usage = {}; }
}

module.exports = { UsageMeter };
