class LatencyScoring {
  constructor() {
    this._measurements = [];
  }

  record(latencyMs) {
    this._measurements.push(latencyMs);
  }

  score(latencyMs) {
    const all = [...this._measurements, latencyMs].sort((a, b) => a - b);
    const index = all.indexOf(latencyMs);
    const percentile = all.length > 1 ? index / (all.length - 1) : 0.5;
    const score = Math.exp(-latencyMs / 1000);
    return { score: Math.round(score * 1000) / 1000, latencyMs, percentile: Math.round(percentile * 1000) / 1000 };
  }

  getStats() {
    const sorted = [...this._measurements].sort((a, b) => a - b);
    if (sorted.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: this._percentile(sorted, 50),
      p95: this._percentile(sorted, 95),
      p99: this._percentile(sorted, 99),
    };
  }

  getPercentile(percentile) {
    const sorted = [...this._measurements].sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    return this._percentile(sorted, percentile);
  }

  _percentile(sorted, p) {
    const k = (p / 100) * (sorted.length - 1);
    const f = Math.floor(k);
    const c = Math.ceil(k);
    if (f === c) return sorted[f];
    return sorted[f] + (k - f) * (sorted[c] - sorted[f]);
  }

  compareThreshold(thresholdMs) {
    const stats = this.getStats();
    return {
      thresholdMs,
      avg: stats.avg,
      exceedsThreshold: stats.avg > thresholdMs,
      margin: stats.avg - thresholdMs,
      p95Exceeds: stats.p95 > thresholdMs,
    };
  }

  clear() {
    this._measurements = [];
  }
}

module.exports = { LatencyScoring };
