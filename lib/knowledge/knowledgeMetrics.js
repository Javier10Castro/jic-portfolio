class KnowledgeMetrics {
  constructor() {
    this._metrics = [];
  }

  record(name, value, tags) {
    if (!name) throw new Error('name is required');
    if (value === null || value === undefined) throw new Error('value is required');
    const entry = { name, value, tags: tags || {}, timestamp: new Date().toISOString() };
    this._metrics.push(entry);
    return entry;
  }

  query(name) {
    if (!name) return [];
    return this._metrics.filter(m => m.name === name);
  }

  aggregate(name, fn) {
    const entries = this.query(name);
    if (entries.length === 0) return null;
    if (fn) return fn(entries.map(e => e.value));
    return entries.reduce((sum, e) => sum + e.value, 0);
  }

  getMetricNames() {
    return [...new Set(this._metrics.map(m => m.name))];
  }

  clear() {
    this._metrics = [];
  }
}

module.exports = { KnowledgeMetrics };
