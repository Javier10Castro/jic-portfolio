class RuntimeMetrics {
  constructor() {
    this._metrics = new Map();
  }

  record(name, value, tags) {
    if (!name || value === undefined || value === null) {
      return false;
    }
    if (!this._metrics.has(name)) {
      this._metrics.set(name, []);
    }
    const entry = {
      value,
      timestamp: Date.now(),
      tags: tags || {},
    };
    this._metrics.get(name).push(entry);
    return true;
  }

  query(name, options) {
    if (!this._metrics.has(name)) {
      return [];
    }
    let entries = this._metrics.get(name);
    if (options) {
      if (options.since !== undefined) {
        entries = entries.filter(function (e) {
          return e.timestamp >= options.since;
        });
      }
      if (options.limit !== undefined && options.limit > 0) {
        entries = entries.slice(-options.limit);
      }
    }
    return entries;
  }

  aggregate(name, fn) {
    if (!this._metrics.has(name)) {
      return null;
    }
    const entries = this._metrics.get(name);
    if (entries.length === 0) {
      return null;
    }
    const values = entries.map(function (e) {
      return e.value;
    });
    switch (fn) {
      case 'count':
        return entries.length;
      case 'avg': {
        const sumVal = values.reduce(function (a, b) {
          return a + b;
        }, 0);
        return sumVal / values.length;
      }
      case 'min':
        return Math.min.apply(null, values);
      case 'max':
        return Math.max.apply(null, values);
      case 'sum':
        return values.reduce(function (a, b) {
          return a + b;
        }, 0);
      default:
        return null;
    }
  }

  getMetricNames() {
    return Array.from(this._metrics.keys());
  }

  clear() {
    this._metrics.clear();
  }
}

module.exports = { RuntimeMetrics };
