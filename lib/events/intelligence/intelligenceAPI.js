class IntelligenceAPI {
  constructor(intelligenceEngine) {
    this._engine = intelligenceEngine;
  }

  getInsights(filter = {}) {
    return this._engine.store.get('insights', filter);
  }

  getPatterns(filter = {}) {
    return this._engine.store.get('patterns', filter);
  }

  getAnomalies(filter = {}) {
    return this._engine.store.get('anomalies', filter);
  }

  getCorrelationGraph() {
    return this._engine.correlationEngine.getGraph();
  }

  getHealthIntelligence() {
    const health = this._engine.getHealth();
    const recentInsights = this._engine.insightGenerator.getInsights({ limit: 5 });
    return {
      health,
      topInsights: recentInsights,
      graph: this._engine.correlationEngine.getGraph(),
    };
  }
}

module.exports = IntelligenceAPI;
