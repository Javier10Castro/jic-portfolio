class OptimizationRecommendations {
  constructor() {
    this._recommendations = [];
    this._counter = 0;
  }

  generate(projectId, metrics, suggestions) {
    if (!projectId) throw new Error('projectId is required');
    if (!metrics) throw new Error('metrics is required');
    const id = 'or_' + (++this._counter);
    const recommendation = {
      id,
      projectId,
      metrics: JSON.parse(JSON.stringify(metrics)),
      suggestions: suggestions || [],
      expectedImprovement: suggestions ? suggestions.length * 10 : 0,
      generatedAt: new Date().toISOString()
    };
    this._recommendations.push(recommendation);
    return recommendation;
  }

  get(id) {
    if (!id) return null;
    return this._recommendations.find(r => r.id === id) || null;
  }

  findByProject(projectId) {
    if (!projectId) return [];
    return this._recommendations.filter(r => r.projectId === projectId);
  }

  list() {
    return this._recommendations;
  }

  clear() {
    this._recommendations = [];
    this._counter = 0;
  }
}

module.exports = { OptimizationRecommendations };
