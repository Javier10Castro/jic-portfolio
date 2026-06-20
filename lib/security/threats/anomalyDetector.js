class AnomalyDetector {
  constructor() {
    this._baselines = new Map();
    this._anomalies = [];
    this._maxAnomalies = 500;
  }

  learn(entityId, metric, value) {
    const key = `${entityId}:${metric}`;
    if (!this._baselines.has(key)) this._baselines.set(key, { values: [], mean: 0, stdDev: 0 });
    const baseline = this._baselines.get(key);
    baseline.values.push(value);
    if (baseline.values.length > 100) baseline.values.shift();
    this._updateBaseline(baseline);
  }

  detect(entityId, metric, value, context = {}) {
    const key = `${entityId}:${metric}`;
    const baseline = this._baselines.get(key);
    if (!baseline || baseline.values.length < 5) return { anomalous: false, reason: 'Insufficient data' };
    if (baseline.stdDev === 0 && value === baseline.mean) return { anomalous: false };
    if (baseline.stdDev === 0 && Math.abs(value - baseline.mean) > baseline.mean * 2) {
      const anomaly = {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        entityId, metric, value, mean: baseline.mean, stdDev: baseline.stdDev,
        zScore: 999, threshold: context.threshold || 3,
        timestamp: Date.now(), resolved: false
      };
      this._anomalies.push(anomaly);
      if (this._anomalies.length > this._maxAnomalies) this._anomalies.shift();
      return { anomalous: true, anomaly };
    }
    if (baseline.stdDev === 0) return { anomalous: false, zScore: 0 };
    const zScore = Math.abs((value - baseline.mean) / baseline.stdDev);
    const threshold = context.threshold || 3;
    if (zScore > threshold) {
      const anomaly = {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        entityId, metric, value, mean: baseline.mean, stdDev: baseline.stdDev,
        zScore: Math.round(zScore * 100) / 100, threshold,
        timestamp: Date.now(), resolved: false
      };
      this._anomalies.push(anomaly);
      if (this._anomalies.length > this._maxAnomalies) this._anomalies.shift();
      return { anomalous: true, anomaly };
    }
    return { anomalous: false, zScore: Math.round(zScore * 100) / 100 };
  }

  detectBatch(entityId, metrics) {
    const results = [];
    for (const [metric, value] of Object.entries(metrics)) {
      const r = this.detect(entityId, metric, value);
      if (r.anomalous) results.push(r);
    }
    return results;
  }

  getBaseline(entityId, metric) {
    const key = `${entityId}:${metric}`;
    const baseline = this._baselines.get(key);
    if (!baseline) return null;
    return { mean: baseline.mean, stdDev: baseline.stdDev, sampleSize: baseline.values.length };
  }

  getAnomalies(filter = {}) {
    let results = [...this._anomalies];
    if (filter.entityId) results = results.filter(a => a.entityId === filter.entityId);
    if (filter.metric) results = results.filter(a => a.metric === filter.metric);
    if (filter.resolved !== undefined) results = results.filter(a => a.resolved === filter.resolved);
    if (filter.since) results = results.filter(a => a.timestamp >= filter.since);
    return results;
  }

  resolveAnomaly(anomalyId) {
    const anomaly = this._anomalies.find(a => a.id === anomalyId);
    if (!anomaly) return false;
    anomaly.resolved = true;
    return true;
  }

  clear() {
    this._baselines.clear();
    this._anomalies = [];
  }

  _updateBaseline(baseline) {
    const n = baseline.values.length;
    const sum = baseline.values.reduce((a, b) => a + b, 0);
    baseline.mean = sum / n;
    const variance = baseline.values.reduce((a, b) => a + (b - baseline.mean) ** 2, 0) / n;
    baseline.stdDev = Math.sqrt(variance);
  }
}

module.exports = { AnomalyDetector };
