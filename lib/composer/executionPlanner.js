class ExecutionPlanner {
  constructor() {
    this._plans = new Map();
    this._counter = 0;
  }

  plan(compositionId, nodes, order = []) {
    if (!compositionId || !Array.isArray(nodes)) {
      throw new Error('compositionId and nodes array are required');
    }

    const orderedNodes = order.length > 0 ? order : nodes.map(n => n.id).filter(Boolean);
    const stageSize = Math.max(1, Math.ceil(orderedNodes.length / 3));

    const stages = [
      {
        name: 'initialization',
        nodes: orderedNodes.slice(0, stageSize),
        parallel: false,
        order: 0
      },
      {
        name: 'execution',
        nodes: orderedNodes.slice(stageSize, stageSize * 2),
        parallel: true,
        order: 1
      },
      {
        name: 'finalization',
        nodes: orderedNodes.slice(stageSize * 2),
        parallel: false,
        order: 2
      }
    ].filter(s => s.nodes.length > 0);

    const plan = {
      id: compositionId,
      stages,
      totalStages: stages.length,
      totalNodes: orderedNodes.length,
      createdAt: new Date().toISOString()
    };

    this._plans.set(compositionId, plan);
    return plan;
  }

  getExecutionPlan(compositionId) {
    if (!compositionId) return null;
    return this._plans.get(compositionId) || null;
  }

  validatePlan(plan) {
    const errors = [];

    if (!plan) {
      errors.push('plan is required');
      return { valid: false, errors };
    }
    if (!plan.id) {
      errors.push('plan must have an id');
    }
    if (!Array.isArray(plan.stages)) {
      errors.push('plan must have a stages array');
    } else if (plan.stages.length === 0) {
      errors.push('plan must have at least one stage');
    } else {
      plan.stages.forEach((stage, index) => {
        if (!stage.name) {
          errors.push(`stage at index ${index} must have a name`);
        }
        if (!Array.isArray(stage.nodes)) {
          errors.push(`stage '${stage.name || index}' must have a nodes array`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  clear() {
    this._plans.clear();
    this._counter = 0;
  }
}

module.exports = { ExecutionPlanner };
