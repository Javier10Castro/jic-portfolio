class EvolutionSimulation {
  constructor() {
    this._simulations = [];
    this._counter = 0;
  }

  simulate(evolutionId, plan) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!plan) throw new Error('plan is required');
    const id = 'sim_' + (++this._counter);
    const totalHours = (plan.actions || plan.improvements || []).reduce((s, a) => s + (a.estimatedHours || 0), 0);
    const breakingChanges = (plan.actions || plan.improvements || []).filter(a => a.breaking === true).length;
    const riskLevel = totalHours > 100 ? 'high' : totalHours > 40 ? 'medium' : 'low';
    const simulation = {
      id, evolutionId,
      planId: plan.id || null,
      estimatedHours: totalHours,
      breakingChanges,
      riskLevel,
      successProbability: Math.max(0, Math.min(1, 1 - (totalHours / 200) - (breakingChanges * 0.1))),
      status: 'simulated',
      createdAt: new Date().toISOString()
    };
    this._simulations.push(simulation);
    return simulation;
  }

  get(id) {
    if (!id) return null;
    return this._simulations.find(s => s.id === id) || null;
  }

  list() {
    return this._simulations;
  }

  clear() {
    this._simulations = [];
    this._counter = 0;
  }
}

module.exports = { EvolutionSimulation };
