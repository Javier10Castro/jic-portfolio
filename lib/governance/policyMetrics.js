class PolicyMetrics {
  constructor() {
    this._metrics = new Map();
  }

  record(name, value, tags) {
    if (!name) return;
    if (!this._metrics.has(name)) this._metrics.set(name, []);
    const entry = {
      value: value !== undefined ? value : null,
      tags: tags || {},
      timestamp: Date.now()
    };
    this._metrics.get(name).push(entry);
    return entry;
  }

  query(name, opts) {
    if (!name) return [];
    const entries = this._metrics.get(name);
    if (!entries) return [];
    let results = [...entries];
    if (opts) {
      if (opts.since) results = results.filter(e => e.timestamp >= opts.since);
      if (opts.limit) results = results.slice(-opts.limit);
    }
    return results;
  }

  aggregate(name, fn) {
    const entries = this._metrics.get(name);
    if (!entries || entries.length === 0) return null;
    const values = entries.map(e => e.value).filter(v => v !== null && typeof v === 'number');
    if (values.length === 0) return null;
    switch (fn) {
      case 'count': return values.length;
      case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      case 'sum': return values.reduce((a, b) => a + b, 0);
      default: return null;
    }
  }

  getMetricNames() {
    return Array.from(this._metrics.keys());
  }

  clear() {
    this._metrics.clear();
  }
}

module.exports = { PolicyMetrics };
