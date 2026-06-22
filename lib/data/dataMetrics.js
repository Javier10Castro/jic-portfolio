class DataMetrics {
  constructor() { this._metrics = {}; }

  recordQuery(datasource, timestamp) {
    if (!this._metrics[datasource]) this._metrics[datasource] = { queries: 0, avgLatency: 0, lastQuery: null };
    this._metrics[datasource].queries++;
    this._metrics[datasource].lastQuery = timestamp;
  }

  recordLatency(datasource, latency) {
    if (!this._metrics[datasource]) this._metrics[datasource] = { queries: 0, avgLatency: 0, lastQuery: null };
    const m = this._metrics[datasource];
    m.avgLatency = m.avgLatency ? Math.round((m.avgLatency + latency) / 2) : latency;
  }

  get(name) { return this._metrics[name] || null; }
  getAll() { return { ...this._metrics }; }
  count() { return Object.keys(this._metrics).length; }
  clear() { this._metrics = {}; }
}
module.exports = { DataMetrics };
