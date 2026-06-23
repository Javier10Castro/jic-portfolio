class PatternAnalyzer {
  constructor(name) {
    this.name = name;
    this._analyzers = [];
  }

  registerAnalyzer(analyzer) {
    this._analyzers.push(analyzer);
  }

  analyze(data) {
    const results = [];
    for (const fn of this._analyzers) {
      try {
        const result = fn(data);
        results.push(result);
      } catch (e) {
        results.push({ error: e.message });
      }
    }
    return results;
  }

  getAnalyzers() { return [...this._analyzers]; }

  getName() { return this.name; }
}

module.exports = { PatternAnalyzer };
