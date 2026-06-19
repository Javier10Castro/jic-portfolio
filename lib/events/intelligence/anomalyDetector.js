class AnomalyDetector {
  constructor(options = {}) {
    this._windowSize = options.windowSize || 100;
    this._zScoreThreshold = options.zScoreThreshold || 2.5;
    this._rollingWindows = new Map();
    this._expectedLifecycles = new Map();
    this._anomalies = [];
    this._maxAnomalies = 500;
  }

  ingest(event) {
    const anomalies = [];
    anomalies.push(...this._checkErrorRateSpike(event));
    anomalies.push(...this._checkVolumeSpike(event));
    anomalies.push(...this._checkUnexpectedTransitions(event));
    anomalies.push(...this._checkMissingLifecycles(event));
    anomalies.push(...this._checkLatencyAnomaly(event));
    return anomalies;
  }

  getAnomalies(filter = {}) {
    let results = this._anomalies;
    if (filter.severity) results = results.filter(a => a.severity === filter.severity);
    if (filter.type) results = results.filter(a => a.type === filter.type);
    if (filter.since) results = results.filter(a => a.timestamp >= filter.since);
    return results.slice(-100);
  }

  clear() {
    this._anomalies = [];
    this._rollingWindows.clear();
    this._expectedLifecycles.clear();
  }

  _addAnomaly(type, severity, confidence, event, detail) {
    const entry = {
      type,
      severity,
      confidence: Math.round(confidence * 100) / 100,
      timestamp: Date.now(),
      detail: detail || {},
      sourceEventId: event.id,
    };
    this._anomalies.push(entry);
    if (this._anomalies.length > this._maxAnomalies) this._anomalies.shift();
    return entry;
  }

  _getWindow(key, maxSize) {
    if (!this._rollingWindows.has(key)) this._rollingWindows.set(key, []);
    return this._rollingWindows.get(key);
  }

  _pushValue(key, value, maxSize) {
    const window = this._getWindow(key, maxSize);
    window.push(value);
    if (window.length > maxSize) window.shift();
    return window;
  }

  _zScore(values, value) {
    if (values.length < 3) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    if (std === 0) return 0;
    return (value - mean) / std;
  }

  _checkErrorRateSpike(event) {
    const type = event.type || '';
    if (!type.includes('error') && !type.includes('failure') && !type.includes('failed')) return [];
    const key = 'error_ts:' + (event.source || 'unknown');
    const now = Date.now();
    if (!this._errorTimestamps) this._errorTimestamps = new Map();
    if (!this._errorTimestamps.has(key)) this._errorTimestamps.set(key, []);
    const timestamps = this._errorTimestamps.get(key);
    timestamps.push(now);
    while (timestamps.length > 0 && now - timestamps[0] > 10000) timestamps.shift();

    const rate = timestamps.length;
    const rateKey = 'err_rate_hist:' + key;
    const rates = this._pushValue(rateKey, rate, this._windowSize);
    if (rates.length < 5) return [];
    const z = this._zScore(rates, rate);
    if (z > this._zScoreThreshold) {
      return [this._addAnomaly('error_rate_spike', 'high', Math.min(0.95, z / (this._zScoreThreshold * 2)),
        event, { rate, zScore: Math.round(z * 100) / 100, sampleSize: rates.length })];
    }
    return [];
  }

  _checkVolumeSpike(event) {
    const key = 'vol_ts:' + (event.source || 'global');
    const now = Date.now();
    if (!this._volumeTimestamps) this._volumeTimestamps = new Map();
    if (!this._volumeTimestamps.has(key)) this._volumeTimestamps.set(key, []);
    const timestamps = this._volumeTimestamps.get(key);
    timestamps.push(now);
    while (timestamps.length > 0 && now - timestamps[0] > 5000) timestamps.shift();

    const rate = timestamps.length;
    const rateKey = 'vol_rate_hist:' + key;
    const rates = this._pushValue(rateKey, rate, this._windowSize);
    if (rates.length < 5) return [];
    const z = this._zScore(rates, rate);
    if (z > this._zScoreThreshold) {
      return [this._addAnomaly('volume_spike', 'medium', Math.min(0.9, z / (this._zScoreThreshold * 2)),
        event, { rate, zScore: Math.round(z * 100) / 100, sampleSize: rates.length })];
    }
    return [];
  }

  _checkUnexpectedTransitions(event) {
    const type = event.type || '';
    if (!type.includes('transition') && !type.includes('status')) return [];
    const payload = event.payload || {};
    const from = payload.from || payload.previousState || '';
    const to = payload.to || payload.currentState || payload.status || '';
    const invalid = [
      ['completed', 'running'],
      ['completed', 'queued'],
      ['cancelled', 'running'],
      ['rolled_back', 'running'],
    ];
    for (const [f, t] of invalid) {
      if (from === f && to === t) {
        return [this._addAnomaly('invalid_state_transition', 'high', 0.95,
          event, { from, to, reason: `${f} → ${t} is not a valid transition` })];
      }
    }
    return [];
  }

  _checkMissingLifecycles(event) {
    const type = event.type || '';
    const correlationId = event.correlationId;
    if (!correlationId || !type.includes('started') && !type.includes('completed') && !type.includes('failed')) return [];
    if (!this._expectedLifecycles.has(correlationId)) {
      this._expectedLifecycles.set(correlationId, { events: [], started: null });
    }
    const state = this._expectedLifecycles.get(correlationId);
    state.events.push(event);
    if (type.includes('started')) state.started = event;
    if (type.includes('completed') || type.includes('failed')) {
      if (state.started && state.started.source !== event.source) {
        this._expectedLifecycles.delete(correlationId);
        return [this._addAnomaly('cross_source_lifecycle', 'low', 0.6,
          event, { correlationId, startedSource: state.started.source, completedSource: event.source })];
      }
      this._expectedLifecycles.delete(correlationId);
    }
    if (state.events.length > 20) {
      this._expectedLifecycles.delete(correlationId);
      return [this._addAnomaly('orphaned_correlation', 'low', 0.5,
        event, { correlationId, eventCount: state.events.length })];
    }
    return [];
  }

  _checkLatencyAnomaly(event) {
    const latency = event.payload?.latency || 0;
    if (!latency) return [];
    const key = 'latency_values:' + (event.source || 'unknown');
    const window = this._pushValue(key, latency, this._windowSize);
    if (window.length < 5) return [];
    const z = this._zScore(window, latency);
    if (z > this._zScoreThreshold) {
      return [this._addAnomaly('latency_anomaly', 'medium', Math.min(0.9, z / (this._zScoreThreshold * 2)),
        event, { latency, zScore: Math.round(z * 100) / 100, source: event.source })];
    }
    return [];
  }
}

module.exports = AnomalyDetector;
