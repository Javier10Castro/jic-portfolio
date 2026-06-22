class CompositionPlanner {
  constructor() {
    this._plans = new Map();
    this._counter = 0;
  }

  createPlan(appId, blueprint) {
    if (!appId || !blueprint) {
      throw new Error('appId and blueprint are required');
    }
    const plan = {
      id: appId,
      blueprint,
      stages: [
        { name: 'discovery', status: 'pending' },
        { name: 'matching', status: 'pending' },
        { name: 'resolution', status: 'pending' },
        { name: 'allocation', status: 'pending' },
        { name: 'composition', status: 'pending' }
      ],
      status: 'planned',
      createdAt: new Date().toISOString()
    };
    this._plans.set(appId, plan);
    return plan;
  }

  getPlan(appId) {
    if (!appId) return null;
    return this._plans.get(appId) || null;
  }

  listPlans() {
    return Array.from(this._plans.values());
  }

  clear() {
    this._plans.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionPlanner };
