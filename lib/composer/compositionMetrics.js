class CompositionMetrics {
  constructor() {
    this._entries = [];
  }

  record(name, value, tags = {}) {
    if (name === null || name === undefined) {
      throw new Error('name must not be null or undefined');
    }
    if (value === null || value === undefined) {
      throw new Error('value must not be null or undefined');
    }
    const entry = {
      name: String(name),
      value,
      tags: typeof tags === 'object' && tags !== null ? { ...tags } : {},
      timestamp: Date.now()
    };
    this._entries.push(entry);
    return entry;
  }

  query(name, options = {}) {
    if (!name) return [];

    const { since, limit } = options;
    let results = this._entries.filter(e => e.name === String(name));

    if (typeof since === 'number') {
      results = results.filter(e => e.timestamp >= since);
    }

    if (typeof limit === 'number' && limit > 0) {
      results = results.slice(-limit);
    }

    return results;
  }

  aggregate(name, fn) {
    const entries = this._entries.filter(e => e.name === String(name));
    if (entries.length === 0) return null;

    const values = entries.map(e => e.value).filter(v => typeof v === 'number');

    switch (fn) {
      case 'count':
        return values.length;
      case 'avg':
        return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return values.length === 0 ? 0 : Math.min(...values);
      case 'max':
        return values.length === 0 ? 0 : Math.max(...values);
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      default:
        if (typeof fn === 'function') {
          return fn(values);
        }
        return null;
    }
  }

  getMetricNames() {
    const names = new Set(this._entries.map(e => e.name));
    return Array.from(names);
  }

  clear() {
    this._entries = [];
  }
}

module.exports = { CompositionMetrics };
