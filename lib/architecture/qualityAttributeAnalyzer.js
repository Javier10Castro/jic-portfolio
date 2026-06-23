class QualityAttributeAnalyzer {
  constructor() {
    this._analyses = new Map();
    this._counter = 0;
  }

  analyze(architectureId, attributes) {
    if (!architectureId || !attributes) {
      throw new Error('architectureId and attributes are required');
    }
    const id = `qa-${++this._counter}`;
    const analysis = { id, architectureId, attributes, analyzedAt: new Date().toISOString() };
    this._analyses.set(id, analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._analyses.get(id) || null;
  }

  list() {
    return Array.from(this._analyses.values());
  }

  clear() {
    this._analyses.clear();
    this._counter = 0;
  }
}

module.exports = { QualityAttributeAnalyzer };
