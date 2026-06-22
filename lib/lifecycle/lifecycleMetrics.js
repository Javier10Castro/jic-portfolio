class LifecycleMetrics {
  constructor() {
    this._metrics = new Map();
  }

  record(name, value, tags) {
    if (!name || value === undefined || value === null) {
      throw new Error('Metric name and value are required');
    }
    if (!this._metrics.has(name)) {
      this._metrics.set(name, []);
    }
    const entry = {
      value,
      tags: tags || {},
      timestamp: new Date().toISOString()
    };
    this._metrics.get(name).push(entry);
    return entry;
  }

  query(name, options) {
    if (!this._metrics.has(name)) return [];
    let results = [...this._metrics.get(name)];
    if (options) {
      if (options.since) {
        const sinceTime = new Date(options.since).getTime();
        if (!isNaN(sinceTime)) {
          results = results.filter(e => new Date(e.timestamp).getTime() >= sinceTime);
        }
      }
      if (options.limit && options.limit > 0) {
        results = results.slice(-options.limit);
      }
    }
    return results;
  }

  aggregate(name, fn) {
    if (!this._metrics.has(name)) return 0;
    const entries = this._metrics.get(name);
    if (entries.length === 0) return 0;
    const values = entries.map(e => e.value);
    switch (fn) {
      case 'count':
        return values.length;
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      default:
        throw new Error(`Unknown aggregate function "${fn}". Use count, avg, min, max, or sum`);
    }
  }

  getMetricNames() {
    return Array.from(this._metrics.keys());
  }

  clear() {
    this._metrics.clear();
  }
}

module.exports = { LifecycleMetrics };
