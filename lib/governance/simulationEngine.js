const ruleEngine = require('./ruleEngine');

class SimulationEngine {
  constructor() {
    this.simulations = new Map();
    this.nextId = 1;
  }

  simulate(policy, data, options) {
    if (!policy) return null;
    const id = `sim_${this.nextId++}`;
    const result = ruleEngine.evaluate(policy.rules || [], data);
    const conditions = (policy.rules || []).map(r => ({ field: r.field, operator: r.operator, value: r.value, matched: result.results.find(res => res.rule === r)?.matched || false }));
    const actions = (policy.actions || []).map(a => ({ ...a, triggered: result.matched }));
    const impact = { resourcesAffected: data ? Object.keys(data).length : 0, actionsTriggered: actions.filter(a => a.triggered).length };
    const simulation = {
      id, policyId: policy.id || 'unknown', matched: result.matched,
      conditions, actions, impact,
      options: options || {}, timestamp: new Date().toISOString()
    };
    this.simulations.set(id, simulation);
    return simulation;
  }

  simulateAll(policies, data, options) {
    if (!Array.isArray(policies)) return [];
    return policies.map(p => this.simulate(p, data, options));
  }

  getSimulation(simulationId) {
    return this.simulations.get(simulationId) || null;
  }

  listSimulations(filters) {
    let results = Array.from(this.simulations.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (!filters) return results;
    if (filters.policyId) results = results.filter(s => s.policyId === filters.policyId);
    if (filters.matched !== undefined) results = results.filter(s => s.matched === filters.matched);
    return results;
  }

  clear() {
    this.simulations.clear();
    this.nextId = 1;
  }
}

module.exports = new SimulationEngine();
