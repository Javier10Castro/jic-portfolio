class ArchitectureRecommendations {
  constructor() {
    this._recommendations = [];
    this._counter = 0;
  }

  generate(projectId, analysis, suggestions) {
    if (!projectId) throw new Error('projectId is required');
    if (!analysis) throw new Error('analysis is required');
    const id = 'ar_' + (++this._counter);
    const recommendation = {
      id,
      projectId,
      analysis: JSON.parse(JSON.stringify(analysis)),
      suggestions: suggestions || [],
      priority: suggestions && suggestions.length > 3 ? 'high' : 'medium',
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

  findByPriority(priority) {
    if (!priority) return [];
    return this._recommendations.filter(r => r.priority === priority);
  }

  list() {
    return this._recommendations;
  }

  clear() {
    this._recommendations = [];
    this._counter = 0;
  }
}

module.exports = { ArchitectureRecommendations };
