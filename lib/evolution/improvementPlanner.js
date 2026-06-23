class ImprovementPlanner {
  constructor() {
    this._plans = [];
    this._counter = 0;
  }

  create(evolutionId, improvements) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!Array.isArray(improvements)) throw new Error('improvements must be an array');
    const id = 'imp_' + (++this._counter);
    const plan = {
      id, evolutionId,
      improvements: JSON.parse(JSON.stringify(improvements)),
      status: 'draft',
      priority: 'medium',
      createdAt: new Date().toISOString()
    };
    this._plans.push(plan);
    return plan;
  }

  get(id) {
    if (!id) return null;
    return this._plans.find(p => p.id === id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return this._plans;
    return this._plans.filter(p => p.evolutionId === evolutionId);
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const plan = this._plans.find(p => p.id === id);
    if (!plan) return null;
    plan.status = status;
    return plan;
  }

  clear() {
    this._plans = [];
    this._counter = 0;
  }
}

module.exports = { ImprovementPlanner };
