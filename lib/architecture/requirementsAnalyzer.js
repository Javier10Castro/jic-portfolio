class RequirementsAnalyzer {
  constructor() {
    this._requirements = new Map();
    this._counter = 0;
  }

  analyze(architectureId, requirements) {
    if (!architectureId) {
      throw new Error('architectureId is required');
    }
    const id = `req-${++this._counter}`;
    const analysis = { id, architectureId, requirements: requirements || [], analyzedAt: new Date().toISOString() };
    this._requirements.set(id, analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._requirements.get(id) || null;
  }

  list() {
    return Array.from(this._requirements.values());
  }

  clear() {
    this._requirements.clear();
    this._counter = 0;
  }
}

module.exports = { RequirementsAnalyzer };
