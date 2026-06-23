class KnowledgeReporter {
  constructor() {
    this._reports = [];
    this._counter = 0;
  }

  generateReport(knowledgeId, data) {
    if (!knowledgeId) throw new Error('knowledgeId is required');
    const id = 'krpt_' + (++this._counter);
    const report = {
      id,
      knowledgeId,
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

  list(knowledgeId) {
    if (!knowledgeId) return this._reports;
    return this._reports.filter(r => r.knowledgeId === knowledgeId);
  }

  clear() {
    this._reports = [];
    this._counter = 0;
  }
}

module.exports = { KnowledgeReporter };
