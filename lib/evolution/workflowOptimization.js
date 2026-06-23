class WorkflowOptimization {
  constructor() {
    this._optimizations = [];
    this._counter = 0;
  }

  analyze(evolutionId, workflows) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'wfopt_' + (++this._counter);
    const wfs = workflows || [];
    const opportunities = [];
    for (const wf of wfs) {
      if (wf.steps && wf.steps.length > 10) {
        opportunities.push({ workflowId: wf.id || wf.name, type: 'parallelize', description: 'Consider parallelizing steps', stepCount: wf.steps.length });
      }
      if (wf.retryCount && wf.retryCount > 3) {
        opportunities.push({ workflowId: wf.id || wf.name, type: 'reduce_retries', description: 'High retry count may indicate fragility', retryCount: wf.retryCount });
      }
      if (wf.avgDuration && wf.avgDuration > 30000) {
        opportunities.push({ workflowId: wf.id || wf.name, type: 'optimize_duration', description: 'Long average workflow duration', avgDuration: wf.avgDuration });
      }
    }
    const analysis = {
      id, evolutionId,
      opportunities,
      totalOpportunities: opportunities.length,
      timestamp: new Date().toISOString()
    };
    this._optimizations.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._optimizations.find(o => o.id === id) || null;
  }

  list() {
    return this._optimizations;
  }

  clear() {
    this._optimizations = [];
    this._counter = 0;
  }
}

module.exports = { WorkflowOptimization };
