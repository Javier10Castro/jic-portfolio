const crypto = require('crypto');

class MetricsCollector {
  constructor(storage) {
    this._storage = storage;
    this._counters = new Map();
    this._histograms = new Map();
    this._gauges = new Map();
  }

  increment(name, value = 1, tags = {}) {
    const key = this._key(name, tags);
    this._counters.set(key, (this._counters.get(key) || 0) + value);
    return this._emit(name, 'counter', value, tags);
  }

  gauge(name, value, tags = {}) {
    const key = this._key(name, tags);
    this._gauges.set(key, value);
    return this._emit(name, 'gauge', value, tags);
  }

  histogram(name, value, tags = {}) {
    const key = this._key(name, tags);
    if (!this._histograms.has(key)) this._histograms.set(key, []);
    this._histograms.get(key).push(value);
    return this._emit(name, 'histogram', value, tags);
  }

  recordLatency(name, durationMs, tags = {}) {
    return this.histogram(`${name}.latency`, durationMs, tags);
  }

  recordError(name, tags = {}) {
    return this.increment(`${name}.errors`, 1, tags);
  }

  recordTokenUsage(provider, inputTokens, outputTokens, tags = {}) {
    const base = { provider, ...tags };
    this.increment('ai.tokens.input', inputTokens, base);
    this.increment('ai.tokens.output', outputTokens, base);
    this.histogram('ai.tokens.total', inputTokens + outputTokens, base);
    return this._emit('ai.tokens', 'usage', { inputTokens, outputTokens }, base);
  }

  getCounter(name, tags = {}) {
    return this._counters.get(this._key(name, tags)) || 0;
  }

  getGauge(name, tags = {}) {
    return this._gauges.get(this._key(name, tags)) || 0;
  }

  getHistogram(name, tags = {}) {
    const key = this._key(name, tags);
    const values = this._histograms.get(key) || [];
    if (values.length === 0) return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllMetrics() {
    const counters = {};
    for (const [key, value] of this._counters) counters[key] = value;
    const gauges = {};
    for (const [key, value] of this._gauges) gauges[key] = value;
    const histograms = {};
    for (const [key] of this._histograms) histograms[key] = this.getHistogram(...this._parseKey(key));
    return { counters, gauges, histograms };
  }

  reset() {
    this._counters.clear();
    this._histograms.clear();
    this._gauges.clear();
  }

  _emit(name, type, value, tags) {
    const entry = { name, type, value, tags, timestamp: Date.now(), source: 'metrics' };
    if (this._storage) this._storage.storeMetric(entry).catch(() => {});
    return entry;
  }

  _key(name, tags) {
    const sorted = Object.keys(tags).sort().map(k => `${k}:${tags[k]}`).join(',');
    return sorted ? `${name}{${sorted}}` : name;
  }

  _parseKey(key) {
    const brace = key.indexOf('{');
    if (brace === -1) return [key, {}];
    const name = key.substring(0, brace);
    const tagsStr = key.substring(brace + 1, key.length - 1);
    const tags = {};
    if (tagsStr) {
      for (const part of tagsStr.split(',')) {
        const [k, v] = part.split(':');
        if (k) tags[k] = v;
      }
    }
    return [name, tags];
  }
}

module.exports = MetricsCollector;
