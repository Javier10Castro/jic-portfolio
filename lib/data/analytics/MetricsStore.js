class MetricsStore {
  constructor() { this._metrics = {}; }
  record(name, value, tags) {
    if (!this._metrics[name]) this._metrics[name] = [];
    this._metrics[name].push({ value, tags: tags || {}, timestamp: Date.now() });
    return { success: true };
  }
  query(name, options = {}) {
    let entries = this._metrics[name] || [];
    if (options.since) entries = entries.filter(e => e.timestamp >= options.since);
    if (options.limit) entries = entries.slice(-options.limit);
    const values = entries.map(e => e.value);
    return {
      success: true, name, count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
      entries
    };
  }
  listNames() { return Object.keys(this._metrics); }
  clear() { this._metrics = {}; }
}
module.exports = { MetricsStore };
