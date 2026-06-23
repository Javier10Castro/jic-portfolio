class RefactorStrategy {
  constructor(name) {
    this.name = name || 'RefactorStrategy';
    this._strategies = [];
    this._results = [];
  }

  addStrategy(name, fn) {
    if (!name || typeof fn !== 'function') throw new Error('name and function required');
    this._strategies.push({ name, fn });
    return this;
  }

  execute(evolutionId, context) {
    if (!evolutionId) return [];
    this._results = this._strategies.map(s => ({ strategy: s.name, result: s.fn(evolutionId, context) }));
    return this._results;
  }

  getResults() {
    return this._results;
  }
}

module.exports = { RefactorStrategy };
