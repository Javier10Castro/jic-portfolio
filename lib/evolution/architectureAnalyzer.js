class ArchitectureAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, architecture) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'arch_an_' + (++this._counter);
    const defects = [];
    if (!architecture || !architecture.components) {
      defects.push({ type: 'missing_components', severity: 'high', description: 'No components defined' });
    }
    if (architecture && architecture.components && architecture.components.length === 0) {
      defects.push({ type: 'empty_components', severity: 'medium', description: 'Components array is empty' });
    }
    if (architecture && architecture.components && architecture.components.length > 50) {
      defects.push({ type: 'too_many_components', severity: 'low', description: 'High component count may indicate poor decomposition' });
    }
    const score = defects.length === 0 ? 1 : Math.max(0, 1 - defects.length * 0.2);
    const analysis = {
      id, evolutionId, score, defects,
      totalComponents: architecture && architecture.components ? architecture.components.length : 0,
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

module.exports = { ArchitectureAnalyzer };
