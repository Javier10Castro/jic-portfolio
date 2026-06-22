const { RuntimeRegistry } = require('./runtimeRegistry');
const { RuntimeStorage } = require('./runtimeStorage');
const { RuntimeEvents } = require('./runtimeEvents');
const { RuntimeMetrics } = require('./runtimeMetrics');
const { RuntimeHealth } = require('./runtimeHealth');
const { RuntimeScheduler } = require('./runtimeScheduler');
const { RuntimeHistory } = require('./runtimeHistory');
const { RuntimeReporter } = require('./runtimeReporter');

class RuntimeManager {
  constructor(options) {
    this._options = options || {};
    this._startTime = null;
    this._registry = new RuntimeRegistry();
    this._storage = new RuntimeStorage();
    this._events = new RuntimeEvents();
    this._metrics = new RuntimeMetrics();
    this._health = new RuntimeHealth();
    this._scheduler = new RuntimeScheduler();
    this._history = new RuntimeHistory();
    this._reporter = new RuntimeReporter();
  }

  get registry() {
    return this._registry;
  }

  get storage() {
    return this._storage;
  }

  get events() {
    return this._events;
  }

  get metrics() {
    return this._metrics;
  }

  get health() {
    return this._health;
  }

  get scheduler() {
    return this._scheduler;
  }

  get history() {
    return this._history;
  }

  get reporter() {
    return this._reporter;
  }

  start() {
    if (this._startTime !== null) {
      return false;
    }
    this._startTime = Date.now();
    this._events.emit(this._events.constructor.EVENTS.RUNTIME_STARTED, { timestamp: this._startTime });
    return true;
  }

  stop() {
    if (this._startTime === null) {
      return false;
    }
    this._scheduler.clear();
    this._startTime = null;
    this._events.emit(this._events.constructor.EVENTS.RUNTIME_STOPPED, { timestamp: Date.now() });
    return true;
  }

  getStatus() {
    return {
      version: '1.0.0',
      uptime: this._startTime !== null ? Date.now() - this._startTime : null,
      components: {
        registry: this._registry.count() > 0 ? 'active' : 'idle',
        storage: typeof this._storage.getAll === 'function' ? 'active' : 'idle',
        events: this._events.listEvents().length > 0 ? 'active' : 'idle',
        health: typeof this._health.getAllStatus === 'function' ? 'active' : 'idle',
        scheduler: this._scheduler.list().length > 0 ? 'active' : 'idle',
      },
      activeFlags: this._storage.has('flags') ? this._storage.get('flags') : {},
      activeConfigs: this._storage.has('configs') ? this._storage.get('configs') : {},
      activeRollouts: this._storage.has('rollouts') ? this._storage.get('rollouts') : [],
      services: this._registry.count(),
    };
  }

  clear() {
    this._registry.clear();
    this._storage.clear();
    this._events.clear();
    this._metrics.clear();
    this._health.clear();
    this._scheduler.clear();
    this._history.clear();
    this._reporter.clear();
  }
}

module.exports = { RuntimeManager };
