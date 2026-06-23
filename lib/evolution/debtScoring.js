class DebtScoring {
  constructor() {
    this._scores = [];
    this._counter = 0;
  }

  score(evolutionId, items) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'debtscore_' + (++this._counter);
    const rawItems = items || [];
    const totalHours = rawItems.reduce((s, i) => s + (i.estimatedHours || 0), 0);
    const criticalCount = rawItems.filter(i => i.severity === 'critical').length;
    const highCount = rawItems.filter(i => i.severity === 'high').length;
    const rawScore = Math.min(totalHours / 10, 100);
    const score = Math.max(0, 100 - rawScore - criticalCount * 5 - highCount * 2);
    const result = {
      id, evolutionId,
      score: Math.round(score * 100) / 100,
      totalHours,
      criticalCount,
      highCount,
      totalItems: rawItems.length,
      health: score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor',
      timestamp: new Date().toISOString()
    };
    this._scores.push(result);
    return result;
  }

  get(id) {
    if (!id) return null;
    return this._scores.find(s => s.id === id) || null;
  }

  list() {
    return this._scores;
  }

  clear() {
    this._scores = [];
    this._counter = 0;
  }
}

module.exports = { DebtScoring };
