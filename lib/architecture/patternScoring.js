class PatternScoring {
  constructor() {
    this._scores = new Map();
    this._counter = 0;
  }

  score(patternId, criteria) {
    if (!patternId || !criteria) {
      throw new Error('patternId and criteria are required');
    }
    const weights = criteria.weights || {};
    const maxWeight = Object.values(weights).reduce((s, w) => s + w, 0) || 1;
    let total = 0;
    const factors = [];
    for (const [key, weight] of Object.entries(weights)) {
      const match = criteria.matches && criteria.matches[key] ? 1 : 0;
      const score = weight * match;
      total += score;
      factors.push({ name: key, weight, match, score });
    }
    const normalizedTotal = Math.round((total / maxWeight) * 100) / 100;
    const id = `score-${++this._counter}`;
    const scoring = { id, patternId, criteria, total: normalizedTotal, factors, scoredAt: new Date().toISOString() };
    this._scores.set(id, scoring);
    return scoring;
  }

  compare(patternIds) {
    if (!Array.isArray(patternIds)) return [];
    return patternIds.map(id => this._scores.get(id)).filter(Boolean).sort((a, b) => b.total - a.total);
  }

  get(id) {
    if (!id) return null;
    return this._scores.get(id) || null;
  }

  list() {
    return Array.from(this._scores.values());
  }

  clear() {
    this._scores.clear();
    this._counter = 0;
  }
}

module.exports = { PatternScoring };
