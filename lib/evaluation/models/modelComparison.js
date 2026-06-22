class ModelComparison {
  constructor() {
    this._results = {};
  }

  registerResult(modelName, category, score) {
    if (!this._results[modelName]) {
      this._results[modelName] = {};
    }
    this._results[modelName][category] = score;
  }

  compare(models, metrics) {
    const result = { models: [], rankings: {} };
    for (const model of models) {
      const scores = {};
      let total = 0;
      let count = 0;
      for (const metric of metrics) {
        const val = this._results[model]?.[metric];
        if (val !== undefined) {
          scores[metric] = val;
          total += val;
          count++;
        }
      }
      result.models.push({
        name: model,
        scores,
        overall: count > 0 ? total / count : 0,
      });
    }
    for (const metric of metrics) {
      const ranked = [...result.models]
        .filter((m) => m.scores[metric] !== undefined)
        .sort((a, b) => b.scores[metric] - a.scores[metric]);
      result.rankings[metric] = ranked.map((m) => ({ name: m.name, score: m.scores[metric] }));
    }
    return result;
  }

  getModelScores(modelName) {
    return this._results[modelName] || {};
  }

  rankByMetric(metric) {
    const entries = [];
    for (const [name, scores] of Object.entries(this._results)) {
      if (scores[metric] !== undefined) {
        entries.push({ name, score: scores[metric] });
      }
    }
    return entries.sort((a, b) => b.score - a.score);
  }

  getBestModel(metric) {
    const ranked = this.rankByMetric(metric);
    return ranked.length > 0 ? ranked[0] : null;
  }

  clear() {
    this._results = {};
  }
}

module.exports = { ModelComparison };
