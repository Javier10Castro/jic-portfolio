const PERIODS = ['daily', 'weekly', 'monthly'];

class Analytics {
  constructor(storage, metrics) {
    this._storage = storage;
    this._metrics = metrics;
  }

  async generate(type = 'daily') {
    if (!PERIODS.includes(type)) throw new Error(`Invalid period: "${type}". Valid: ${PERIODS.join(', ')}`);

    const now = Date.now();
    const periodStart = this._periodStart(type, now);
    const allMetrics = this._metrics.getAllMetrics();

    const report = {
      type,
      generatedAt: now,
      periodStart,
      periodEnd: now,
      topProviders: this._topByTag(allMetrics, 'ai.provider'),
      avgLatency: this._avgHistogram(allMetrics, 'ai'),
      avgGenerationTime: this._avgHistogram(allMetrics, 'generator'),
      totalRequests: this._getCounter(allMetrics, 'api.requests'),
      totalErrors: this._getCounter(allMetrics, 'api.errors') + this._getCounter(allMetrics, 'workflow.errors'),
      successRate: this._calculateSuccessRate(allMetrics),
      totalTokens: this._getCounter(allMetrics, 'ai.tokens.input') + this._getCounter(allMetrics, 'ai.tokens.output'),
      estimatedCost: this._estimateCost(allMetrics),
      workflowStats: {
        total: this._getCounter(allMetrics, 'workflow.total'),
        completed: this._getCounter(allMetrics, 'workflow.completed'),
        failed: this._getCounter(allMetrics, 'workflow.failed'),
        avgDuration: this._avgHistogram(allMetrics, 'workflow.duration'),
      },
    };

    if (this._storage) {
      await this._storage.storeAnalytics(type, report);
    }
    return report;
  }

  async getHistory(type = 'daily', limit = 30) {
    if (this._storage) return this._storage.getAnalytics(type, limit);
    return [];
  }

  _periodStart(type, now) {
    const d = new Date(now);
    switch (type) {
      case 'daily': d.setHours(0, 0, 0, 0); break;
      case 'weekly': d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); break;
      case 'monthly': d.setDate(1); d.setHours(0, 0, 0, 0); break;
    }
    return d.getTime();
  }

  _topByTag(allMetrics, tagPrefix, limit = 5) {
    const counters = allMetrics.counters || {};
    const results = [];
    for (const [key, value] of Object.entries(counters)) {
      if (key.startsWith(tagPrefix)) results.push({ key, value });
    }
    return results.sort((a, b) => b.value - a.value).slice(0, limit);
  }

  _avgHistogram(allMetrics, namePrefix) {
    const hists = allMetrics.histograms || {};
    for (const [key, value] of Object.entries(hists)) {
      if (key.startsWith(namePrefix)) return value.avg || 0;
    }
    return 0;
  }

  _getCounter(allMetrics, name) {
    const counters = allMetrics.counters || {};
    let total = 0;
    for (const [key, value] of Object.entries(counters)) {
      if (key.startsWith(name) || key === name) total += value;
    }
    return total;
  }

  _calculateSuccessRate(allMetrics) {
    const total = this._getCounter(allMetrics, 'api.requests');
    const errors = this._getCounter(allMetrics, 'api.errors');
    if (total === 0) return 1;
    return (total - errors) / total;
  }

  _estimateCost(allMetrics) {
    const inputTokens = this._getCounter(allMetrics, 'ai.tokens.input');
    const outputTokens = this._getCounter(allMetrics, 'ai.tokens.output');
    return (inputTokens * 0.00001) + (outputTokens * 0.00003);
  }
}

module.exports = Analytics;
