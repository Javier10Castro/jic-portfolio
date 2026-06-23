class DebtPrioritizer {
  constructor() {
    this._priorities = new Map();
  }

  prioritize(items) {
    if (!Array.isArray(items)) throw new Error('items must be an array');
    const scored = items.map(item => {
      let score = 0;
      const severityMap = { critical: 100, high: 50, medium: 20, low: 5 };
      score += severityMap[item.severity] || 0;
      score += Math.min((item.estimatedHours || 0), 50);
      if (item.status === 'open') score += 10;
      return { item, score, priority: score >= 100 ? 'critical' : score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low' };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  get(id) {
    if (!id) return null;
    return this._priorities.get(id) || null;
  }

  set(id, priority) {
    if (!id || !priority) return null;
    this._priorities.set(id, priority);
    return priority;
  }

  clear() {
    this._priorities.clear();
  }
}

module.exports = { DebtPrioritizer };
