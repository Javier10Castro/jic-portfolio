class PerformanceAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, metrics) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'perf_an_' + (++this._counter);
    const m = metrics || {};
    const bottlenecks = [];
    if (m.latency && m.latency > 2000) {
      bottlenecks.push({ type: 'high_latency', value: m.latency, threshold: 2000, severity: 'high' });
    }
    if (m.throughput && m.throughput < 100) {
      bottlenecks.push({ type: 'low_throughput', value: m.throughput, threshold: 100, severity: 'medium' });
    }
    if (m.errorRate && m.errorRate > 0.05) {
      bottlenecks.push({ type: 'high_error_rate', value: m.errorRate, threshold: 0.05, severity: 'high' });
    }
    if (m.memoryUsage && m.memoryUsage > 0.9) {
      bottlenecks.push({ type: 'high_memory_usage', value: m.memoryUsage, threshold: 0.9, severity: 'medium' });
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

module.exports = { PerformanceAnalyzer };
