class RiskAnalyzer {
  constructor() {
    this._risks = new Map();
    this._counter = 0;
  }

  analyze(architectureId, risks) {
    if (!architectureId) {
      throw new Error('architectureId is required');
    }
    const id = `risk-${++this._counter}`;
    const analysis = { id, architectureId, risks: risks || [], analyzedAt: new Date().toISOString() };
    this._risks.set(id, analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._risks.get(id) || null;
  }

  list() {
    return Array.from(this._risks.values());
  }

  clear() {
    this._risks.clear();
    this._counter = 0;
  }
}

module.exports = { RiskAnalyzer };
