class ConstraintAnalyzer {
  constructor() {
    this._constraints = new Map();
    this._counter = 0;
  }

  analyze(architectureId, constraints) {
    if (!architectureId) {
      throw new Error('architectureId is required');
    }
    const id = `constraint-${++this._counter}`;
    const analysis = { id, architectureId, constraints: constraints || [], analyzedAt: new Date().toISOString() };
    this._constraints.set(id, analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._constraints.get(id) || null;
  }

  list() {
    return Array.from(this._constraints.values());
  }

  clear() {
    this._constraints.clear();
    this._counter = 0;
  }
}

module.exports = { ConstraintAnalyzer };
