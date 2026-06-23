class EvolutionPlanner {
  constructor() {
    this._plans = new Map();
    this._counter = 0;
  }

  createPlan(evolutionId, type, actions) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!type) throw new Error('type is required');
    if (!Array.isArray(actions)) throw new Error('actions must be an array');
    const id = 'plan_' + (++this._counter);
    const plan = {
      id,
      evolutionId,
      type,
      actions: JSON.parse(JSON.stringify(actions)),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this._plans.set(id, plan);
    return plan;
  }

  get(id) {
    if (!id) return null;
    return this._plans.get(id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return Array.from(this._plans.values());
    return Array.from(this._plans.values()).filter(p => p.evolutionId === evolutionId);
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const plan = this._plans.get(id);
    if (!plan) return null;
    plan.status = status;
    plan.updatedAt = new Date().toISOString();
    return plan;
  }

  clear() {
    this._plans.clear();
    this._counter = 0;
  }
}

module.exports = { EvolutionPlanner };
