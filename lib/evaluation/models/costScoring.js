class CostScoring {
  constructor() {
    this._records = [];
  }

  record(cost) {
    this._records.push(cost);
  }

  score(cost) {
    const all = [...this._records, cost].sort((a, b) => a - b);
    const index = all.indexOf(cost);
    const percentile = all.length > 1 ? index / (all.length - 1) : 0.5;
    const score = Math.exp(-cost / 100);
    return { score: Math.round(score * 1000) / 1000, cost, percentile: Math.round(percentile * 1000) / 1000 };
  }

  getStats() {
    const sorted = [...this._records].sort((a, b) => a - b);
    if (sorted.length === 0) return { min: 0, max: 0, avg: 0, median: 0, count: 0 };
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      median: this._percentile(sorted, 50),
      count: sorted.length,
    };
  }

  getProjectedCost(averageDaily, days) {
    return {
      averageDaily,
      days,
      projected: averageDaily * days,
      unit: 'usd',
    };
  }

  compare(models) {
    return models.map((m) => ({
      name: m.name,
      avgCost: m.avgCost || 0,
      minCost: m.minCost || 0,
      maxCost: m.maxCost || 0,
      efficiencyScore: m.avgCost ? Math.round((Math.exp(-m.avgCost / 100)) * 1000) / 1000 : 0,
    }));
  }

  _percentile(sorted, p) {
    const k = (p / 100) * (sorted.length - 1);
    const f = Math.floor(k);
    const c = Math.ceil(k);
    if (f === c) return sorted[f];
    return sorted[f] + (k - f) * (sorted[c] - sorted[f]);
  }

  clear() {
    this._records = [];
  }
}

module.exports = { CostScoring };
