class SolutionBlueprint {
  constructor() {
    this._blueprints = new Map();
  }

  generate(solutionId, components, topology) {
    if (!solutionId) {
      throw new Error('solutionId is required');
    }
    const blueprint = {
      solutionId,
      components: Array.isArray(components) ? [...components] : [],
      topology: topology || {},
      patterns: [],
      decisions: [],
      estimatedCost: {},
      timestamp: new Date().toISOString()
    };
    this._blueprints.set(solutionId, blueprint);
    return blueprint;
  }

  get(id) {
    if (!id) return null;
    return this._blueprints.get(id) || null;
  }

  export(id, format = 'json') {
    const blueprint = this._blueprints.get(id);
    if (!blueprint) return null;
    if (format === 'yaml') {
      const lines = ['solutionId: ' + blueprint.solutionId, 'patterns:', '  - ' + (blueprint.patterns.length > 0 ? blueprint.patterns.join('\n  - ') : ''), 'decisions:', '  - ' + (blueprint.decisions.length > 0 ? blueprint.decisions.join('\n  - ') : ''), 'components: ' + blueprint.components.length, 'timestamp: ' + blueprint.timestamp];
      return { data: lines.join('\n'), format };
    }
    return { data: blueprint, format };
  }

  clear() {
    this._blueprints.clear();
  }
}

module.exports = { SolutionBlueprint };
