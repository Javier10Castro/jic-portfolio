class CompositionSimulation {
  constructor() {
    this._simulations = new Map();
    this._counter = 0;
  }

  simulate(composition) {
    if (!composition) {
      return {
        simulationId: null,
        status: 'failed',
        stages: [],
        warnings: ['Composition is null or undefined'],
        recommendations: [],
      };
    }
    const id = `sim_${++this._counter}`;
    const stages = [
      { name: 'validate', duration: Math.random() * 100, result: 'passed' },
      { name: 'resolve-dependencies', duration: Math.random() * 200, result: 'passed' },
      { name: 'initialize-modules', duration: Math.random() * 300, result: 'passed' },
      { name: 'configure-runtime', duration: Math.random() * 150, result: 'passed' },
    ];
    const warnings = [];
    const recommendations = [];

    if (composition.modules && composition.modules.length > 10) {
      warnings.push('Large number of modules may impact performance');
      recommendations.push('Consider splitting into micro-frontends');
    }

    if (!composition.runtime) {
      warnings.push('No runtime configuration provided');
      recommendations.push('Define runtime configuration for production');
    }

    const simulation = {
      simulationId: id,
      status: 'completed',
      stages,
      warnings,
      recommendations,
    };

    this._simulations.set(id, simulation);
    return simulation;
  }

  getSimulation(id) {
    if (!id) return null;
    return this._simulations.get(id) || null;
  }

  listSimulations() {
    return Array.from(this._simulations.values());
  }

  clear() {
    this._simulations.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionSimulation };
