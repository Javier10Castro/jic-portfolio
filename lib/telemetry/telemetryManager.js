const TelemetryStorage = require('./telemetryStorage');
const MetricsCollector = require('./metricsCollector');
const TracingEngine = require('./tracingEngine');
const { Logger } = require('./logger');
const { HealthMonitor } = require('./healthMonitor');
const Diagnostics = require('./diagnostics');
const Analytics = require('./analytics');
const AlertManager = require('./alertManager');
const { TelemetryEventBus, EVENT_TYPES } = require('./eventBus');

class TelemetryManager {
  constructor(options = {}) {
    this._options = options;
    this._enabled = options.enabled !== false;
    this._autoCollect = options.autoCollect !== false;

    this.storage = new TelemetryStorage();
    this.events = new TelemetryEventBus();
    this.metrics = new MetricsCollector(this.storage);
    this.tracing = new TracingEngine(this.storage);
    this.logger = new Logger(this.storage, { source: 'telemetry', minLevel: options.logLevel || 'INFO' });
    this.health = new HealthMonitor(this.storage);
    this.diagnostics = new Diagnostics(this);
    this.analytics = new Analytics(this.storage, this.metrics);
    this.alerts = new AlertManager(this.storage, this.events);

    this._componentMetrics = new Map();

    if (this._autoCollect) {
      this._startAutoCollect();
    }
  }

  get enabled() { return this._enabled; }

  enable() {
    this._enabled = true;
    this.logger.enable();
  }

  disable() {
    this._enabled = false;
    this.logger.disable();
  }

  recordMetric(name, value, type = 'counter', tags = {}) {
    if (!this._enabled) return;
    if (type === 'counter') return this.metrics.increment(name, value, tags);
    if (type === 'gauge') return this.metrics.gauge(name, value, tags);
    if (type === 'histogram') return this.metrics.histogram(name, value, tags);
  }

  recordTrace(name, service, options = {}) {
    if (!this._enabled) return null;
    return this.tracing.startTrace(name, service, options);
  }

  recordLog(level, message, meta = {}) {
    if (!this._enabled) return;
    const method = this.logger[level.toLowerCase()];
    return method ? method.call(this.logger, message, meta) : undefined;
  }

  recordEvent(type, data = {}) {
    if (!this._enabled) return;
    return this.events.emit(type, data);
  }

  async getMetrics(filter = {}) {
    return this.storage.getMetrics(filter);
  }

  async getTraces(filter = {}) {
    return this.storage.getTraces(filter);
  }

  async getHealth() {
    return this.health.getSummary();
  }

  registerComponentMetrics(component, metricsFn) {
    this._componentMetrics.set(component, metricsFn);
  }

  async generateDailyAnalytics() {
    return this.analytics.generate('daily');
  }

  async generateWeeklyAnalytics() {
    return this.analytics.generate('weekly');
  }

  async generateMonthlyAnalytics() {
    return this.analytics.generate('monthly');
  }

  async systemSnapshot() {
    return this.diagnostics.systemSnapshot();
  }

  async healthSummary() {
    return this.diagnostics.healthSummary();
  }

  async errorSummary(since) {
    return this.diagnostics.errorSummary(since);
  }

  addAlertRule(rule) {
    return this.alerts.addRule(rule);
  }

  evaluateAlerts(context) {
    return this.alerts.evaluate(context);
  }

  _startAutoCollect() {
    const interval = this._options.collectInterval || 30000;
    this._collectTimer = setInterval(() => {
      if (!this._enabled) return;
      this.metrics.gauge('system.memory.heapUsed', process.memoryUsage().heapUsed);
      this.metrics.gauge('system.memory.heapTotal', process.memoryUsage().heapTotal);
      this.metrics.gauge('system.uptime', process.uptime());
      this.metrics.increment('system.collect.cycles');
    }, interval);
  }

  stop() {
    if (this._collectTimer) clearInterval(this._collectTimer);
    this._enabled = false;
  }
}

module.exports = TelemetryManager;
