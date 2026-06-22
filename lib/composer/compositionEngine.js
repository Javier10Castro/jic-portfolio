class CompositionEngine {
  constructor() {
    this._executions = new Map();
    this._counter = 0;
  }

  execute(compositionId, plan) {
    if (!compositionId || !plan) {
      throw new Error('compositionId and plan are required');
    }
    const stages = [
      { name: 'resolveDependencies', status: 'pending' },
      { name: 'allocateResources', status: 'pending' },
      { name: 'composeServices', status: 'pending' },
      { name: 'validate', status: 'pending' },
      { name: 'report', status: 'pending' }
    ];

    const execution = {
      id: compositionId,
      plan,
      stages,
      status: 'running',
      currentStage: 0,
      startedAt: new Date().toISOString()
    };

    this._executions.set(compositionId, execution);
    return execution;
  }

  getExecution(compositionId) {
    if (!compositionId) return null;
    return this._executions.get(compositionId) || null;
  }

  listExecutions() {
    return Array.from(this._executions.values());
  }

  clear() {
    this._executions.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionEngine };
