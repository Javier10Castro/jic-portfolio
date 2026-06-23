class TechnicalDebtAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, debtItems) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'debt_an_' + (++this._counter);
    const items = debtItems || [];
    const totalDebt = items.reduce((s, i) => s + (i.estimatedHours || 0), 0);
    const categories = {};
    for (const item of items) {
      const cat = item.category || 'uncategorized';
      if (!categories[cat]) categories[cat] = 0;
      categories[cat] += item.estimatedHours || 0;
    }
    const critical = items.filter(i => i.severity === 'critical' || (i.estimatedHours || 0) > 40);
    const score = items.length === 0 ? 1 : Math.max(0, 1 - (totalDebt / 100) * 0.1);
    const analysis = {
      id, evolutionId, score,
      totalItems: items.length, totalDebt,
      categories, criticalCount: critical.length,
      criticalItems: critical.map(i => i.description || i.type),
      timestamp: new Date().toISOString()
    };
    this._analyses.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._analyses.find(a => a.id === id) || null;
  }

  list() {
    return this._analyses;
  }

  clear() {
    this._analyses = [];
    this._counter = 0;
  }
}

module.exports = { TechnicalDebtAnalyzer };
