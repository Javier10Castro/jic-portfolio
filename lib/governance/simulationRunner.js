const simulationEngine = require('./simulationEngine');

class SimulationRunner {
  constructor() {
    this.scenarios = new Map();
    this.nextId = 1;
  }

  runScenario(scenario) {
    if (!scenario) return null;
    const id = `scenario_${this.nextId++}`;
    const results = simulationEngine.simulateAll(scenario.policies || [], scenario.data, scenario.options);
    const summary = {
      total: results.length, matched: results.filter(r => r.matched).length,
      unmatched: results.filter(r => !r.matched).length
    };
    const record = { id, description: scenario.description || '', results, summary, timestamp: new Date().toISOString() };
    this.scenarios.set(id, record);
    return record;
  }

  runBatch(scenarios) {
    if (!Array.isArray(scenarios)) return [];
    return scenarios.map(s => this.runScenario(s));
  }

  getScenario(id) {
    return this.scenarios.get(id) || null;
  }

  listScenarios() {
    return Array.from(this.scenarios.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  compareScenarios(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return ids.map(id => this.scenarios.get(id)).filter(Boolean);
  }

  clear() {
    this.scenarios.clear();
    this.nextId = 1;
  }
}

module.exports = new SimulationRunner();
