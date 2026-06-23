class SuccessFactors {
  constructor() {
    this._factors = [];
    this._counter = 0;
  }

  identify(projectId, factors, metrics) {
    if (!projectId) throw new Error('projectId is required');
    if (!factors) throw new Error('factors is required');
    const id = 'sf_' + (++this._counter);
    const entry = {
      id,
      projectId,
      factors: Array.isArray(factors) ? factors : [factors],
      metrics: metrics || {},
      score: metrics && metrics.successRate ? metrics.successRate : 0.5,
      identifiedAt: new Date().toISOString()
    };
    this._factors.push(entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._factors.find(f => f.id === id) || null;
  }

  findByProject(projectId) {
    if (!projectId) return [];
    return this._factors.filter(f => f.projectId === projectId);
  }

  topFactors(limit) {
    const sorted = [...this._factors].sort((a, b) => b.score - a.score);
    return sorted.slice(0, limit || 10);
  }

  list() {
    return this._factors;
  }

  clear() {
    this._factors = [];
    this._counter = 0;
  }
}

module.exports = { SuccessFactors };
