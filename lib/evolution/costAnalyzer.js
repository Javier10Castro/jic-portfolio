class CostAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, costData) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'cost_an_' + (++this._counter);
    const c = costData || {};
    const currentCost = c.current || 0;
    const projectedCost = c.projected || 0;
    const savings = currentCost - projectedCost;
    const savingsPercent = currentCost > 0 ? (savings / currentCost) * 100 : 0;
    const inefficiencies = [];
    if (currentCost > 0 && savingsPercent < 0) {
      inefficiencies.push({ type: 'cost_increase', description: 'Projected cost exceeds current', delta: -savingsPercent });
    }
    if (c.unusedResources && c.unusedResources > 0) {
      inefficiencies.push({ type: 'unused_resources', count: c.unusedResources });
    }
    const score = inefficiencies.length === 0 ? 1 : Math.max(0, 1 - inefficiencies.length * 0.2);
    const analysis = {
      id, evolutionId, score,
      currentCost, projectedCost, savings, savingsPercent,
      inefficiencies,
      timestamp: new Date().toISOString()
    };
    this._analyses.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._analyses.find(a => a.id === id) || null;
  }

  list() {
    return this._analyses;
  }

  clear() {
    this._analyses = [];
    this._counter = 0;
  }
}

module.exports = { CostAnalyzer };
