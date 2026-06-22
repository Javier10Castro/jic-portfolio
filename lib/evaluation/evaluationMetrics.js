class EvaluationMetrics {
  constructor() {
    this._records = new Map();
    this._maxRecords = 10000;
  }

  record(name, value, tags = {}) {
    if (!this._records.has(name)) this._records.set(name, []);
    const records = this._records.get(name);
    records.push({ value, tags, timestamp: Date.now() });
    if (records.length > this._maxRecords) records.shift();
  }

  query(name, filter = {}) {
    const records = this._records.get(name) || [];
    let result = records;
    if (filter.since) result = result.filter(r => r.timestamp >= filter.since);
    if (filter.until) result = result.filter(r => r.timestamp <= filter.until);
    if (filter.tags) {
      result = result.filter(r => {
        for (const [k, v] of Object.entries(filter.tags)) {
          if (r.tags[k] !== v) return false;
        }
        return true;
      });
    }
    if (filter.limit) result = result.slice(-filter.limit);
    return result;
  }

  aggregate(name, filter = {}) {
    const records = this.query(name, filter);
    if (records.length === 0) return null;
    const values = records.map(r => r.value);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      median: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)],
      latest: values[values.length - 1],
      first: values[0],
    };
  }

  getMetricNames() {
    return Array.from(this._records.keys());
  }

  clear() {
    this._records.clear();
  }
}

module.exports = { EvaluationMetrics };
