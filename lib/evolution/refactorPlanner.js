class RefactorPlanner {
  constructor() {
    this._refactors = [];
    this._counter = 0;
  }

  create(evolutionId, refactors) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!Array.isArray(refactors)) throw new Error('refactors must be an array');
    const id = 'ref_' + (++this._counter);
    const plan = {
      id, evolutionId,
      refactors: JSON.parse(JSON.stringify(refactors)),
      status: 'draft',
      estimatedHours: refactors.reduce((s, r) => s + (r.estimatedHours || 0), 0),
      createdAt: new Date().toISOString()
    };
    this._refactors.push(plan);
    return plan;
  }

  get(id) {
    if (!id) return null;
    return this._refactors.find(r => r.id === id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return this._refactors;
    return this._refactors.filter(r => r.evolutionId === evolutionId);
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const plan = this._refactors.find(r => r.id === id);
    if (!plan) return null;
    plan.status = status;
    return plan;
  }

  clear() {
    this._refactors = [];
    this._counter = 0;
  }
}

module.exports = { RefactorPlanner };
