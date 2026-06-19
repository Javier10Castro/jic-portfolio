const SEVERITIES = ['info', 'warning', 'critical', 'emergency'];
const STATUSES = ['active', 'acknowledged', 'resolved'];

class AlertManager {
  constructor(storage, events) {
    this._storage = storage;
    this._events = events;
    this._rules = [];
    this._alerts = new Map();
    this._idCounter = 0;
  }

  addRule(rule) {
    if (!rule.name) throw new Error('Alert rule must have a name');
    if (!rule.condition || typeof rule.condition !== 'function') throw new Error('Alert rule must have a condition function');
    const r = { id: `rule-${++this._idCounter}`, ...rule, createdAt: Date.now() };
    this._rules.push(r);
    return r;
  }

  removeRule(ruleId) {
    const idx = this._rules.findIndex(r => r.id === ruleId);
    if (idx !== -1) { this._rules.splice(idx, 1); return true; }
    return false;
  }

  listRules() {
    return [...this._rules];
  }

  async evaluate(context = {}) {
    const triggered = [];
    for (const rule of this._rules) {
      try {
        const result = rule.condition(context);
        if (result) {
          const alert = await this._createAlert(rule, context, result);
          triggered.push(alert);
        }
      } catch (e) { /* silent */ }
    }
    return triggered;
  }

  async _createAlert(rule, context, result) {
    const alert = {
      id: `alert-${Date.now().toString(36)}-${++this._idCounter}`,
      ruleId: rule.id,
      name: rule.name,
      severity: rule.severity || 'warning',
      status: 'active',
      message: typeof result === 'string' ? result : rule.message || `Alert: ${rule.name}`,
      context: JSON.parse(JSON.stringify(context)),
      createdAt: Date.now(),
      resolvedAt: null,
    };
    this._alerts.set(alert.id, alert);
    if (this._storage) await this._storage.storeAlert(alert);
    if (this._events) this._events.emit('telemetry.alert.created', alert);
    return alert;
  }

  async acknowledge(alertId) {
    const alert = this._alerts.get(alertId);
    if (!alert) return null;
    alert.status = 'acknowledged';
    if (this._storage) await this._storage.storeAlert(alert);
    return alert;
  }

  async resolve(alertId) {
    const alert = this._alerts.get(alertId);
    if (!alert) return null;
    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    if (this._storage) await this._storage.storeAlert(alert);
    if (this._events) this._events.emit('telemetry.alert.resolved', alert);
    return alert;
  }

  async getAlerts(filter = {}) {
    if (this._storage) return this._storage.getAlerts(filter);
    let list = Array.from(this._alerts.values());
    if (filter.severity) list = list.filter(a => a.severity === filter.severity);
    if (filter.status) list = list.filter(a => a.status === filter.status);
    if (filter.since) list = list.filter(a => a.createdAt >= filter.since);
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list.slice(0, filter.limit || 100);
  }

  clear() { this._alerts.clear(); }

  getAlertCounts() {
    const counts = { total: 0, active: 0, acknowledged: 0, resolved: 0 };
    for (const alert of this._alerts.values()) {
      counts.total++;
      counts[alert.status] = (counts[alert.status] || 0) + 1;
    }
    return counts;
  }

  static createLatencyRule(name, provider, thresholdMs, severity = 'warning') {
    return {
      name: `${name} - ${provider} latency > ${thresholdMs}ms`,
      severity,
      message: `${provider} AI latency exceeded ${thresholdMs}ms`,
      condition: (ctx) => {
        if (ctx.aiLatency && ctx.aiLatency[provider] && ctx.aiLatency[provider] > thresholdMs) {
          return `Latency ${ctx.aiLatency[provider]}ms exceeds ${thresholdMs}ms`;
        }
        return null;
      },
    };
  }

  static createFailureRule(name, source, threshold, severity = 'critical') {
    return {
      name: `${name} - ${source} failures > ${threshold}`,
      severity,
      message: `${source} failure count exceeded ${threshold}`,
      condition: (ctx) => {
        if (ctx.failures && ctx.failures[source] && ctx.failures[source] > threshold) {
          return `${source} failures: ${ctx.failures[source]} > ${threshold}`;
        }
        return null;
      },
    };
  }
}

module.exports = AlertManager;
