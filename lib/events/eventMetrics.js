class EventMetrics {
  constructor() {
    this._counters = new Map();
    this._gauges = new Map();
    this._histograms = new Map();
    this._throughput = [];
    this._maxThroughputSamples = 1000;
  }

  incrementCounter(name, value = 1, tags = {}) {
    const key = this._tagKey(name, tags);
    this._counters.set(key, (this._counters.get(key) || 0) + value);
  }

  getCounter(name, tags = {}) {
    return this._counters.get(this._tagKey(name, tags)) || 0;
  }

  recordGauge(name, value, tags = {}) {
    const key = this._tagKey(name, tags);
    this._gauges.set(key, value);
  }

  getGauge(name, tags = {}) {
    return this._gauges.get(this._tagKey(name, tags)) || 0;
  }

  recordHistogram(name, value, tags = {}) {
    const key = this._tagKey(name, tags);
    if (!this._histograms.has(key)) this._histograms.set(key, []);
    this._histograms.get(key).push(value);
    if (this._histograms.get(key).length > 1000) this._histograms.get(key).shift();
  }

  getHistogram(name, tags = {}) {
    const key = this._tagKey(name, tags);
    const values = this._histograms.get(key) || [];
    if (values.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      min: sorted[0], max: sorted[sorted.length - 1], avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: sorted.length,
    };
  }

  recordThroughput(count = 1) {
    this._throughput.push({ count, timestamp: Date.now() });
    if (this._throughput.length > this._maxThroughputSamples) this._throughput.shift();
  }

  getThroughput(windowMs = 1000) {
    const now = Date.now();
    const window = this._throughput.filter(t => now - t.timestamp < windowMs);
    return window.reduce((sum, t) => sum + t.count, 0);
  }

  getAllMetrics() {
    return {
      counters: Object.fromEntries(this._counters),
      gauges: Object.fromEntries(this._gauges),
      histograms: Object.fromEntries(
        Array.from(this._histograms.entries()).map(([k, v]) => [k, v.length])
      ),
      throughputPerSecond: this.getThroughput(1000),
    };
  }

  snapshot() {
    return {
      counters: this._counters.size,
      gauges: this._gauges.size,
      histograms: this._histograms.size,
      throughputPerSecond: this.getThroughput(1000),
    };
  }

  reset() {
    this._counters.clear();
    this._gauges.clear();
    this._histograms.clear();
    this._throughput = [];
  }

  _tagKey(name, tags) {
    const tagStr = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join(',');
    return tagStr ? `${name}[${tagStr}]` : name;
  }
}

module.exports = EventMetrics;
