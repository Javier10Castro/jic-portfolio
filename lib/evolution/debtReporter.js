class DebtReporter {
  constructor() {
    this._reports = [];
    this._counter = 0;
  }

  generate(evolutionId, data) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'debtrpt_' + (++this._counter);
    const items = (data && data.items) || [];
    const totalHours = items.reduce((s, i) => s + (i.estimatedHours || 0), 0);
    const byCategory = {};
    for (const item of items) {
      const cat = item.category || 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, hours: 0 };
      byCategory[cat].count++;
      byCategory[cat].hours += item.estimatedHours || 0;
    }
    const report = {
      id, evolutionId,
      totalItems: items.length,
      totalHours,
      byCategory,
      generatedAt: new Date().toISOString()
    };
    this._reports.push(report);
    return report;
  }

  get(id) {
    if (!id) return null;
    return this._reports.find(r => r.id === id) || null;
  }

  list() {
    return this._reports;
  }

  clear() {
    this._reports = [];
    this._counter = 0;
  }
}

module.exports = { DebtReporter };
