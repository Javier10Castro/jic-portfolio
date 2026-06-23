class ArchitecturePlanner {
  constructor() {
    this._plans = new Map();
    this._counter = 0;
  }

  createPlan(solutionId, blueprint) {
    if (!solutionId || !blueprint) {
      throw new Error('solutionId and blueprint are required');
    }
    const plan = {
      id: solutionId,
      blueprint,
      stages: [
        { name: 'analysis', status: 'pending' },
        { name: 'design', status: 'pending' },
        { name: 'validation', status: 'pending' },
        { name: 'decisions', status: 'pending' },
        { name: 'blueprint', status: 'pending' }
      ],
      status: 'planned',
      createdAt: new Date().toISOString()
    };
    this._plans.set(solutionId, plan);
    return plan;
  }

  getPlan(id) {
    if (!id) return null;
    return this._plans.get(id) || null;
  }

  listPlans() {
    return Array.from(this._plans.values());
  }

  clear() {
    this._plans.clear();
    this._counter = 0;
  }
}

module.exports = { ArchitecturePlanner };
