class ScalabilityAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, scalingData) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'scl_an_' + (++this._counter);
    const sd = scalingData || {};
    const bottlenecks = [];
    if (sd.maxConcurrent && sd.maxConcurrent < 100) {
      bottlenecks.push({ type: 'low_concurrency', value: sd.maxConcurrent, threshold: 100, severity: 'high' });
    }
    if (sd.horizontalScaling === false) {
      bottlenecks.push({ type: 'no_horizontal_scaling', severity: 'high' });
    }
    if (sd.autoScaling === false) {
      bottlenecks.push({ type: 'no_auto_scaling', severity: 'medium' });
    }
    if (sd.databaseConnections && sd.databaseConnections < 10) {
      bottlenecks.push({ type: 'low_db_connections', value: sd.databaseConnections, threshold: 10, severity: 'medium' });
    }
    const score = bottlenecks.length === 0 ? 1 : Math.max(0, 1 - bottlenecks.length * 0.2);
    const analysis = {
      id, evolutionId, score, bottlenecks,
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

module.exports = { ScalabilityAnalyzer };
