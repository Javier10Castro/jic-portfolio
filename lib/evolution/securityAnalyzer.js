class SecurityAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, findings) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'sec_an_' + (++this._counter);
    const f = Array.isArray(findings) ? findings : [];
    const critical = f.filter(x => x.severity === 'critical');
    const high = f.filter(x => x.severity === 'high');
    const medium = f.filter(x => x.severity === 'medium');
    const score = f.length === 0 ? 1 : Math.max(0, 1 - (critical.length * 0.4 + high.length * 0.2 + medium.length * 0.1));
    const analysis = {
      id, evolutionId, score,
      totalFindings: f.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      criticalFindings: critical.map(x => x.description || x.type),
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

module.exports = { SecurityAnalyzer };
