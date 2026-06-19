const crypto = require('crypto');

class TelemetryStorage {
  constructor() {
    this._metrics = [];
    this._traces = new Map();
    this._logs = [];
    this._alerts = [];
    this._health = new Map();
    this._analytics = { daily: [], weekly: [], monthly: [] };
    this._maxMetrics = 5000;
    this._maxLogs = 5000;
    this._maxAlerts = 500;
  }

  async storeMetric(entry) {
    this._metrics.push(entry);
    if (this._metrics.length > this._maxMetrics) this._metrics.shift();
    return entry;
  }

  async storeTrace(trace) {
    if (!trace.traceId) trace.traceId = `tr-${crypto.randomBytes(8).toString('hex')}`;
    if (!this._traces.has(trace.traceId)) this._traces.set(trace.traceId, []);
    this._traces.get(trace.traceId).push(trace);
    return trace;
  }

  async storeLog(entry) {
    this._logs.push(entry);
    if (this._logs.length > this._maxLogs) this._logs.shift();
    return entry;
  }

  async storeAlert(alert) {
    this._alerts.push(alert);
    if (this._alerts.length > this._maxAlerts) this._alerts.shift();
    return alert;
  }

  async storeHealth(component, status) {
    this._health.set(component, { ...status, lastUpdated: Date.now() });
    return status;
  }

  async storeAnalytics(type, data) {
    if (!this._analytics[type]) this._analytics[type] = [];
    this._analytics[type].push({ ...data, storedAt: Date.now() });
    if (this._analytics[type].length > 100) this._analytics[type].shift();
    return data;
  }

  async getMetrics(filter = {}) {
    let list = [...this._metrics];
    if (filter.name) list = list.filter(m => m.name === filter.name);
    if (filter.source) list = list.filter(m => m.source === filter.source);
    if (filter.since) list = list.filter(m => (m.timestamp || 0) >= filter.since);
    if (filter.until) list = list.filter(m => (m.timestamp || 0) <= filter.until);
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (filter.limit) list = list.slice(0, filter.limit);
    return list;
  }

  async getTrace(traceId) {
    return [...(this._traces.get(traceId) || [])];
  }

  async getTraces(filter = {}) {
    let all = [];
    for (const [, spans] of this._traces) all.push(...spans);
    if (filter.since) all = all.filter(s => (s.timestamp || 0) >= filter.since);
    if (filter.service) all = all.filter(s => s.service === filter.service);
    all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (filter.limit) all = all.slice(0, filter.limit);
    return all;
  }

  async getLogs(filter = {}) {
    let list = [...this._logs];
    if (filter.level) list = list.filter(l => l.level === filter.level);
    if (filter.source) list = list.filter(l => l.source === filter.source);
    if (filter.traceId) list = list.filter(l => l.traceId === filter.traceId);
    if (filter.since) list = list.filter(l => (l.timestamp || 0) >= filter.since);
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (filter.limit) list = list.slice(0, filter.limit);
    return list;
  }

  async getAlerts(filter = {}) {
    let list = [...this._alerts];
    if (filter.severity) list = list.filter(a => a.severity === filter.severity);
    if (filter.status) list = list.filter(a => a.status === filter.status);
    if (filter.since) list = list.filter(a => (a.createdAt || 0) >= filter.since);
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (filter.limit) list = list.slice(0, filter.limit);
    return list;
  }

  async getHealth() {
    const result = {};
    for (const [component, status] of this._health) result[component] = status;
    return result;
  }

  async getAnalytics(type, limit = 30) {
    const list = this._analytics[type] || [];
    return list.slice(-limit);
  }

  async clear() {
    this._metrics = [];
    this._traces.clear();
    this._logs = [];
    this._alerts = [];
    this._health.clear();
    this._analytics = { daily: [], weekly: [], monthly: [] };
    return true;
  }

  async countMetrics() { return this._metrics.length; }
  async countTraces() { return this._traces.size; }
  async countLogs() { return this._logs.length; }
  async countAlerts() { return this._alerts.length; }

  snapshot() {
    return {
      metrics: this._metrics.length,
      traces: this._traces.size,
      logs: this._logs.length,
      alerts: this._alerts.length,
      health: this._health.size,
    };
  }
}

module.exports = TelemetryStorage;
