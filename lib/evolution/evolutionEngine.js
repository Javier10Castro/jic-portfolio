class EvolutionEngine {
  constructor() {
    this._executions = new Map();
    this._counter = 0;
  }

  execute(planId, context) {
    if (!planId) throw new Error('planId is required');
    if (!context) throw new Error('context is required');
    const id = 'exec_' + (++this._counter);
    const execution = {
      id,
      planId,
      context: JSON.parse(JSON.stringify(context)),
      status: 'running',
      steps: [],
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    this._executions.set(id, execution);
    return execution;
  }

  get(id) {
    if (!id) return null;
    return this._executions.get(id) || null;
  }

  list(planId) {
    if (!planId) return Array.from(this._executions.values());
    return Array.from(this._executions.values()).filter(e => e.planId === planId);
  }

  completeStep(executionId, step) {
    if (!executionId || !step) return null;
    const exec = this._executions.get(executionId);
    if (!exec) return null;
    exec.steps.push(JSON.parse(JSON.stringify(step)));
    if (step.status === 'completed' || step.status === 'failed') {
      exec.completedAt = new Date().toISOString();
      exec.status = step.status === 'completed' ? 'completed' : 'failed';
    }
    return exec;
  }

  clear() {
    this._executions.clear();
    this._counter = 0;
  }
}

module.exports = { EvolutionEngine };
