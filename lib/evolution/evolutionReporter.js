class EvolutionReporter {
  constructor() {
    this._reports = [];
    this._counter = 0;
  }

  generateReport(evolutionId, data) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'rpt_' + (++this._counter);
    const report = {
      id,
      evolutionId,
      data: data || {},
      createdAt: new Date().toISOString()
    };
    this._reports.push(report);
    return report;
  }

  get(id) {
    if (!id) return null;
    return this._reports.find(r => r.id === id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return this._reports;
    return this._reports.filter(r => r.evolutionId === evolutionId);
  }

  clear() {
    this._reports = [];
    this._counter = 0;
  }
}

module.exports = { EvolutionReporter };
