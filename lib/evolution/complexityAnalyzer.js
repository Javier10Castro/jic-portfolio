class ComplexityAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, modules) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'cmp_an_' + (++this._counter);
    const mods = Array.isArray(modules) ? modules : [];
    const highComplexity = mods.filter(m => (m.complexity || 0) > 10);
    const mediumComplexity = mods.filter(m => {
      const c = m.complexity || 0;
      return c > 5 && c <= 10;
    });
    const score = mods.length === 0 ? 1 : Math.max(0, 1 - (highComplexity.length * 0.15 + mediumComplexity.length * 0.05));
    const analysis = {
      id, evolutionId, score,
      totalModules: mods.length,
      highComplexity: highComplexity.length,
      mediumComplexity: mediumComplexity.length,
      highComplexityModules: highComplexity.map(m => m.name || m.id),
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

module.exports = { ComplexityAnalyzer };
