class OptimizationPlanner {
  constructor() {
    this._optimizations = [];
    this._counter = 0;
  }

  create(evolutionId, optimizations) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!Array.isArray(optimizations)) throw new Error('optimizations must be an array');
    const id = 'opt_' + (++this._counter);
    const plan = {
      id, evolutionId,
      optimizations: JSON.parse(JSON.stringify(optimizations)),
      status: 'draft',
      expectedImprovement: optimizations.reduce((s, o) => s + (o.expectedGain || 0), 0),
      createdAt: new Date().toISOString()
    };
    this._optimizations.push(plan);
    return plan;
  }

  get(id) {
    if (!id) return null;
    return this._optimizations.find(o => o.id === id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return this._optimizations;
    return this._optimizations.filter(o => o.evolutionId === evolutionId);
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const plan = this._optimizations.find(o => o.id === id);
    if (!plan) return null;
    plan.status = status;
    return plan;
  }

  clear() {
    this._optimizations = [];
    this._counter = 0;
  }
}

module.exports = { OptimizationPlanner };
