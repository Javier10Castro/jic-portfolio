class WorkflowRecommendations {
  constructor() {
    this._recommendations = [];
    this._counter = 0;
  }

  generate(projectId, workflowAnalysis, optimizations) {
    if (!projectId) throw new Error('projectId is required');
    if (!workflowAnalysis) throw new Error('workflowAnalysis is required');
    const id = 'wr_' + (++this._counter);
    const recommendation = {
      id,
      projectId,
      workflowAnalysis: JSON.parse(JSON.stringify(workflowAnalysis)),
      optimizations: optimizations || [],
      impact: optimizations && optimizations.length > 2 ? 'high' : 'medium',
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

module.exports = { WorkflowRecommendations };
