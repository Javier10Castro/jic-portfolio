class TradeoffAnalyzer {
  constructor() {
    this._tradeoffs = new Map();
    this._counter = 0;
  }

  analyze(architectureId, tradeoffs) {
    if (!architectureId) {
      throw new Error('architectureId is required');
    }
    const id = `to-${++this._counter}`;
    const analysis = { id, architectureId, tradeoffs: tradeoffs || [], analyzedAt: new Date().toISOString() };
    this._tradeoffs.set(id, analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._tradeoffs.get(id) || null;
  }

  list() {
    return Array.from(this._tradeoffs.values());
  }

  clear() {
    this._tradeoffs.clear();
    this._counter = 0;
  }
}

module.exports = { TradeoffAnalyzer };
