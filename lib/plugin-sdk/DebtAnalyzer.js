class DebtAnalyzer {
  constructor(name) {
    this.name = name || 'DebtAnalyzer';
    this._metrics = [];
  }

  registerMetric(name, fn) {
    if (!name || typeof fn !== 'function') throw new Error('name and function required');
    this._metrics.push({ name, fn });
    return this;
  }

  analyze(evolutionId, items) {
    if (!evolutionId) return null;
    const results = this._metrics.map(m => ({ metric: m.name, value: m.fn(evolutionId, items) }));
    return results;
  }
}

module.exports = { DebtAnalyzer };
