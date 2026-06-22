class DeveloperAnalytics {
  constructor(options = {}) { this._storage = options.storage; this._calls = []; }

  recordCall(endpoint, method, status, latency) {
    const entry = { endpoint, method, status, latency, timestamp: Date.now() };
    this._calls.push(entry);
    if (this._calls.length > 1000) this._calls.shift();
    return entry;
  }

  getStats() {
    const total = this._calls.length;
    const errors = this._calls.filter(c => c.status >= 400).length;
    const avgLatency = total ? Math.round(this._calls.reduce((s, c) => s + c.latency, 0) / total) : 0;
    const endpoints = {};
    this._calls.forEach(c => { endpoints[c.endpoint] = (endpoints[c.endpoint] || 0) + 1; });
    const topEndpoints = Object.entries(endpoints).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([endpoint, count]) => ({ endpoint, count }));
    return { totalCalls: total, errors, errorRate: total ? Math.round(errors / total * 100) : 0, avgLatencyMs: avgLatency, topEndpoints };
  }

  getCalls(filter) {
    let items = [...this._calls];
    if (filter) {
      if (filter.endpoint) items = items.filter(c => c.endpoint.includes(filter.endpoint));
      if (filter.method) items = items.filter(c => c.method === filter.method);
      if (filter.since) items = items.filter(c => c.timestamp >= filter.since);
    }
    return items;
  }

  clear() { this._calls = []; }
}

module.exports = { DeveloperAnalytics };
