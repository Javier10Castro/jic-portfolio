const ClusterStorage = require('./clusterStorage');

class ClusterMetrics {
  constructor(storage) {
    this._storage = storage || new ClusterStorage();
    this._counters = new Map();
    this._gauges = new Map();
    this._histograms = new Map();
    this._workerHistory = [];
    this._maxWorkerHistory = 1000;
  }

  incrementCounter(name, value = 1, tags = {}) {
    const key = this._tagKey(name, tags);
    this._counters.set(key, (this._counters.get(key) || 0) + value);
    this._storage.storeMetric({ name, value, type: 'counter', tags, timestamp: Date.now() });
  }

  recordGauge(name, value, tags = {}) {
    const key = this._tagKey(name, tags);
    this._gauges.set(key, value);
    this._storage.storeMetric({ name, value, type: 'gauge', tags, timestamp: Date.now() });
  }

  recordHistogram(name, value, tags = {}) {
    const key = this._tagKey(name, tags);
    if (!this._histograms.has(key)) this._histograms.set(key, []);
    this._histograms.get(key).push(value);
    if (this._histograms.get(key).length > 1000) this._histograms.get(key).shift();
    this._storage.storeMetric({ name, value, type: 'histogram', tags, timestamp: Date.now() });
  }

  recordWorkerEvent(workerId, event) {
    this._workerHistory.push({ workerId, event, timestamp: Date.now() });
    if (this._workerHistory.length > this._maxWorkerHistory) this._workerHistory.shift();
  }

  getCounter(name, tags = {}) {
    return this._counters.get(this._tagKey(name, tags)) || 0;
  }

  getGauge(name, tags = {}) {
    return this._gauges.get(this._tagKey(name, tags)) || 0;
  }

  getHistogram(name, tags = {}) {
    const key = this._tagKey(name, tags);
    const values = this._histograms.get(key) || [];
    if (values.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: sorted.length,
    };
  }

  getAllMetrics() {
    return {
      counters: Object.fromEntries(this._counters),
      gauges: Object.fromEntries(this._gauges),
      histograms: Object.fromEntries(
        Array.from(this._histograms.entries()).map(([k, v]) => [k, v.length])
      ),
    };
  }

  getWorkerHistory(limit = 100) {
    return this._workerHistory.slice(-limit);
  }

  snapshot() {
    return {
      counters: this._counters.size,
      gauges: this._gauges.size,
      histograms: this._histograms.size,
      workerEvents: this._workerHistory.length,
    };
  }

  recordDispatch(workerId, taskId, strategy) {
    this.incrementCounter('tasks.dispatched', 1, { workerId, strategy });
    this.recordWorkerEvent(workerId, { type: 'dispatch', taskId, strategy });
  }

  recordCompletion(workerId, taskId, duration) {
    this.incrementCounter('tasks.completed', 1, { workerId });
    this.recordHistogram('task.duration', duration, { workerId });
    this.recordGauge('tasks.running', this._getRunningCount(), { workerId });
  }

  recordFailure(workerId, taskId) {
    this.incrementCounter('tasks.failed', 1, { workerId });
    this.recordWorkerEvent(workerId, { type: 'failure', taskId });
  }

  recordHeartbeat(workerId) {
    this.incrementCounter('heartbeats', 1, { workerId });
  }

  recordFailover(previousLeader, newLeader) {
    this.incrementCounter('failovers', 1);
    this.recordWorkerEvent('system', { type: 'failover', previousLeader, newLeader });
  }

  _getRunningCount() {
    let count = 0;
    for (const [key, val] of this._counters) {
      if (key.startsWith('tasks.running')) count += val;
    }
    return count;
  }

  _tagKey(name, tags) {
    const tagStr = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join(',');
    return tagStr ? `${name}[${tagStr}]` : name;
  }

  reset() {
    this._counters.clear();
    this._gauges.clear();
    this._histograms.clear();
    this._workerHistory = [];
  }
}

module.exports = ClusterMetrics;
