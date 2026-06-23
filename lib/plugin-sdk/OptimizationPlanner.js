class OptimizationPlanner {
  constructor(name) {
    this.name = name || 'OptimizationPlanner';
    this._planners = [];
  }

  registerPlanner(fn) {
    if (typeof fn !== 'function') throw new Error('planner must be a function');
    this._planners.push(fn);
    return this;
  }

  plan(evolutionId, data) {
    if (!evolutionId) return null;
    const plans = this._planners.map(fn => fn(evolutionId, data));
    return plans;
  }
}

module.exports = { OptimizationPlanner };
