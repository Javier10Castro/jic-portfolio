class EvaluationReports {
  constructor(history, metrics, storage) {
    this._history = history;
    this._metrics = metrics;
    this._storage = storage;
    this._reports = [];
  }

  generate(options = {}) {
    const filter = options.filter || {};
    const entries = this._history.query(filter);
    const completed = entries.filter(e => e.status === 'completed');
    const failed = entries.filter(e => e.status === 'failed');
    const quality = this._metrics.aggregate('quality', filter);
    const latency = this._metrics.aggregate('latency', filter);
    const cost = this._metrics.aggregate('cost', filter);
    const accuracy = this._metrics.aggregate('accuracy', filter);
    const consistency = this._metrics.aggregate('consistency', filter);
    const hallucination = this._metrics.aggregate('hallucination', filter);
    const overallScore = this._calculateOverall({
      quality: quality?.avg || 0,
      latency: latency?.avg || 0,
      cost: cost?.avg || 0,
      accuracy: accuracy?.avg || 0,
      consistency: consistency?.avg || 0,
      hallucination: hallucination?.avg || 0,
    });
    const report = {
      id: `report_${Date.now()}`,
      generatedAt: Date.now(),
      filter,
      overallScore,
      details: {
        quality: quality || { count: 0, avg: 0 },
        latency: latency || { count: 0, avg: 0 },
        cost: cost || { count: 0, avg: 0 },
        accuracy: accuracy || { count: 0, avg: 0 },
        consistency: consistency || { count: 0, avg: 0 },
        hallucination: hallucination || { count: 0, avg: 0 },
      },
      totalEvaluations: entries.length,
      completed,
      failed: failed.length,
      suggestions: this._generateSuggestions({ quality, latency, cost, accuracy, consistency, hallucination }),
    };
    this._reports.push(report);
    return report;
  }

  _calculateOverall(scores) {
    const hallucinationScore = 1 - (scores.hallucination || 0);
    const weights = { quality: 0.3, accuracy: 0.2, consistency: 0.15, latency: 0.15, cost: 0.1, hallucination: 0.1 };
    const weighted = Object.entries(weights).reduce((sum, [key, w]) => {
      const val = key === 'hallucination' ? hallucinationScore : (scores[key] || 0);
      return sum + (val * w);
    }, 0);
    return Math.round(weighted * 100) / 100;
  }

  _generateSuggestions(scores) {
    const suggestions = [];
    if (scores.quality && scores.quality.avg < 0.7) {
      suggestions.push({ area: 'quality', severity: 'high', message: 'Quality score is below 0.7 — review prompt templates and consider A/B testing' });
    }
    if (scores.accuracy && scores.accuracy.avg < 0.7) {
      suggestions.push({ area: 'accuracy', severity: 'high', message: 'Accuracy is below 0.7 — evaluate benchmark datasets and model selection' });
    }
    if (scores.hallucination && scores.hallucination.avg > 0.15) {
      suggestions.push({ area: 'hallucination', severity: 'critical', message: `Hallucination rate is ${(scores.hallucination.avg * 100).toFixed(1)}% — add guardrails and validation` });
    }
    if (scores.latency && scores.latency.avg > 2000) {
      suggestions.push({ area: 'latency', severity: 'medium', message: `Average latency is ${scores.latency.avg.toFixed(0)}ms — consider model optimization` });
    }
    if (scores.cost && scores.cost.avg > 0.01) {
      suggestions.push({ area: 'cost', severity: 'low', message: 'Cost per evaluation is above 0.01 — review model pricing tier' });
    }
    if (scores.consistency && scores.consistency.avg < 0.7) {
      suggestions.push({ area: 'consistency', severity: 'medium', message: 'Consistency score is below 0.7 — evaluate prompt variability' });
    }
    return suggestions;
  }

  getReport(id) {
    return this._reports.find(r => r.id === id) || null;
  }

  listReports() {
    return this._reports;
  }

  exportCSV(filter = {}) {
    const entries = this._history.query(filter);
    const headers = ['id', 'type', 'status', 'timestamp', 'score', 'error'];
    const rows = entries.map(e => [
      e.id, e.type, e.status, new Date(e.timestamp).toISOString(),
      e.result?.score ?? '', e.error ?? '',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  clear() {
    this._reports = [];
  }
}

module.exports = { EvaluationReports };
