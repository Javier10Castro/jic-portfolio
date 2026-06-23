class EvolutionAnalyzer {
  constructor(name) {
    this.name = name || 'EvolutionAnalyzer';
    this._analyzers = [];
  }

  registerAnalyzer(fn) {
    if (typeof fn !== 'function') throw new Error('analyzer must be a function');
    this._analyzers.push(fn);
    return this;
  }

  analyze(evolutionId, data) {
    if (!evolutionId) return null;
    const results = this._analyzers.map(fn => fn(evolutionId, data));
    return results;
  }
}

module.exports = { EvolutionAnalyzer };
