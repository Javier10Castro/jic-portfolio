class EvaluationHistory {
  constructor() {
    this._entries = [];
    this._maxEntries = 5000;
  }

  record(entry) {
    const record = {
      id: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...entry,
      timestamp: entry.timestamp || Date.now(),
    };
    this._entries.push(record);
    if (this._entries.length > this._maxEntries) this._entries.shift();
    return record.id;
  }

  get(id) {
    return this._entries.find(e => e.id === id) || null;
  }

  query(filter = {}) {
    let result = this._entries;
    if (filter.type) result = result.filter(e => e.type === filter.type);
    if (filter.status) result = result.filter(e => e.status === filter.status);
    if (filter.since) result = result.filter(e => e.timestamp >= filter.since);
    if (filter.until) result = result.filter(e => e.timestamp <= filter.until);
    if (filter.tags) {
      result = result.filter(e => {
        for (const [k, v] of Object.entries(filter.tags)) {
          if (e.tags?.[k] !== v) return false;
        }
        return true;
      });
    }
    if (filter.limit) result = result.slice(-filter.limit);
    return result;
  }

  stats(filter = {}) {
    const entries = this.query(filter);
    return {
      total: entries.length,
      byType: this._groupBy(entries, 'type'),
      byStatus: this._groupBy(entries, 'status'),
      oldest: entries.length ? Math.min(...entries.map(e => e.timestamp)) : null,
      newest: entries.length ? Math.max(...entries.map(e => e.timestamp)) : null,
    };
  }

  _groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = item[key] || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }

  clear() {
    this._entries = [];
  }
}

module.exports = { EvaluationHistory };
