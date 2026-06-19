const COMPONENTS = [
  'ai_providers', 'workflow_engine', 'deployment_engine',
  'api', 'dashboard', 'storage', 'scheduler', 'agent_system',
  'conversation_engine', 'generator', 'planner',
];

const STATUS_VALUES = ['healthy', 'degraded', 'offline', 'unknown'];

class HealthMonitor {
  constructor(storage) {
    this._storage = storage;
    this._checks = new Map();
    this._history = [];
    this._listeners = [];
  }

  registerCheck(component, checkFn) {
    if (!COMPONENTS.includes(component) && !component.startsWith('custom_')) {
      throw new Error(`Unknown component: "${component}". Valid: ${COMPONENTS.join(', ')}`);
    }
    this._checks.set(component, checkFn);
  }

  async runCheck(component) {
    const checkFn = this._checks.get(component);
    if (!checkFn) return { component, status: 'unknown', message: 'No check registered', timestamp: Date.now() };

    try {
      const result = await checkFn();
      const status = result.status || (result.healthy ? 'healthy' : 'degraded');
      const report = {
        component,
        status: STATUS_VALUES.includes(status) ? status : 'unknown',
        message: result.message || '',
        latency: result.latency || null,
        details: result.details || {},
        timestamp: Date.now(),
      };
      await this._store(component, report);
      return report;
    } catch (err) {
      const report = { component, status: 'offline', message: err.message, timestamp: Date.now() };
      await this._store(component, report);
      return report;
    }
  }

  async runAll() {
    const results = {};
    for (const component of COMPONENTS) {
      if (this._checks.has(component)) {
        results[component] = await this.runCheck(component);
      } else {
        results[component] = { component, status: 'unknown', message: 'No check registered', timestamp: Date.now() };
      }
    }
    for (const [component, checkFn] of this._checks) {
      if (!COMPONENTS.includes(component) && !results[component]) {
        results[component] = await this.runCheck(component);
      }
    }
    return results;
  }

  getStatus(component) {
    return this._history.filter(h => h.component === component).pop() || null;
  }

  getSummary() {
    const all = this._history.reduce((acc, h) => {
      acc[h.component] = h;
      return acc;
    }, {});
    return all;
  }

  getHistory(component, limit = 50) {
    let entries = this._history;
    if (component) entries = entries.filter(h => h.component === component);
    return entries.slice(-limit);
  }

  onChange(callback) {
    this._listeners.push(callback);
    return () => { this._listeners = this._listeners.filter(l => l !== callback); };
  }

  async simulate() {
    const simulated = {};
    for (const component of COMPONENTS) {
      const healthy = Math.random() > 0.2;
      simulated[component] = {
        component,
        status: healthy ? 'healthy' : (Math.random() > 0.5 ? 'degraded' : 'offline'),
        message: healthy ? 'Running normally' : 'Simulated degradation',
        latency: Math.round(Math.random() * 200),
        simulated: true,
        timestamp: Date.now(),
      };
      await this._store(component, simulated[component]);
    }
    return simulated;
  }

  async _store(component, report) {
    this._history.push(report);
    if (this._history.length > 1000) this._history.shift();
    if (this._storage) {
      await this._storage.storeHealth(component, report);
    }
    for (const listener of this._listeners) {
      try { listener(report); } catch (e) { /* silent */ }
    }
  }
}

module.exports = { HealthMonitor, COMPONENTS, STATUS_VALUES };
