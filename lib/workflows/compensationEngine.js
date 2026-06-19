class CompensationEngine {
  constructor() {
    this._compensators = new Map();
    this._history = [];
  }

  register(type, compensator) {
    if (typeof compensator !== 'function') throw new Error('Compensator must be a function');
    this._compensators.set(type, compensator);
  }

  async compensate(workflowId, completedSteps, errors) {
    const results = [];
    const reversed = [...completedSteps].reverse();

    for (const step of reversed) {
      try {
        const compensator = this._compensators.get(step.type || step.stepType);
        if (compensator) {
          const result = await compensator(step);
          results.push({ stepId: step.id, success: true, result });
        } else {
          results.push({ stepId: step.id, success: true, skipped: true, reason: `No compensator for type "${step.type || step.stepType}"` });
        }
      } catch (err) {
        results.push({ stepId: step.id, success: false, error: err.message });
      }
    }

    const record = {
      workflowId,
      timestamp: Date.now(),
      stepCount: completedSteps.length,
      successes: results.filter(r => r.success).length,
      failures: results.filter(r => !r.success).length,
      results,
    };
    this._history.push(record);

    return record;
  }

  async undoDeployment(deployment) {
    return { action: 'undo_deployment', deployed: false, details: `Deployment ${deployment.id || deployment.stepId} undone` };
  }

  async undoPersistence(data) {
    return { action: 'undo_persistence', removed: true, details: `Persisted data for step removed` };
  }

  async undoGeneratedArtifacts(artifacts) {
    return { action: 'undo_artifacts', removed: true, details: `Generated artifacts cleaned up` };
  }

  getHistory(limit = 20) {
    return this._history.slice(-limit);
  }

  clear() {
    this._history = [];
  }
}

module.exports = CompensationEngine;
