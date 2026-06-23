class ArchitectureRefactor {
  constructor() {
    this._refactors = [];
    this._counter = 0;
  }

  analyze(evolutionId, architecture) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'archref_' + (++this._counter);
    const arch = architecture || {};
    const recommendations = [];
    if (arch.components && arch.components.length > 20) {
      recommendations.push({ type: 'split_layers', description: 'Consider splitting into more granular layers', currentLayers: arch.layers || 1 });
    }
    if (arch.coupling && arch.coupling > 0.7) {
      recommendations.push({ type: 'reduce_coupling', value: arch.coupling, threshold: 0.7 });
    }
    if (arch.cohesion && arch.cohesion < 0.3) {
      recommendations.push({ type: 'improve_cohesion', value: arch.cohesion, threshold: 0.3 });
    }
    if (!arch.modular) {
      recommendations.push({ type: 'increase_modularity', description: 'Architecture lacks modular decomposition' });
    }
    const analysis = {
      id, evolutionId,
      recommendations,
      totalRecommendations: recommendations.length,
      timestamp: new Date().toISOString()
    };
    this._refactors.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._refactors.find(r => r.id === id) || null;
  }

  list() {
    return this._refactors;
  }

  clear() {
    this._refactors = [];
    this._counter = 0;
  }
}

module.exports = { ArchitectureRefactor };
