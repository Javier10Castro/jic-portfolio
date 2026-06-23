class GraphEnricher {
  constructor(name) {
    this.name = name;
    this._enrichers = [];
  }

  registerEnricher(enricher) {
    this._enrichers.push(enricher);
  }

  enrich(graphState) {
    const results = [];
    for (const fn of this._enrichers) {
      try {
        const result = fn(graphState);
        results.push(result);
      } catch (e) {
        results.push({ error: e.message });
      }
    }
    return results;
  }

  getEnrichers() { return [...this._enrichers]; }

  getName() { return this.name; }
}

module.exports = { GraphEnricher };
