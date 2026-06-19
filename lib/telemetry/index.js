const TelemetryManager = require('./telemetryManager');
const TelemetryStorage = require('./telemetryStorage');
const MetricsCollector = require('./metricsCollector');
const TracingEngine = require('./tracingEngine');
const { Logger, LEVELS } = require('./logger');
const { HealthMonitor, COMPONENTS } = require('./healthMonitor');
const Diagnostics = require('./diagnostics');
const Analytics = require('./analytics');
const AlertManager = require('./alertManager');
const { TelemetryEventBus, EVENT_TYPES } = require('./eventBus');

const _defaultManager = new TelemetryManager();

function recordMetric(name, value, type, tags) {
  return _defaultManager.recordMetric(name, value, type, tags);
}

function recordTrace(name, service, options) {
  return _defaultManager.recordTrace(name, service, options);
}

function recordEvent(type, data) {
  return _defaultManager.recordEvent(type, data);
}

function recordLog(level, message, meta) {
  return _defaultManager.recordLog(level, message, meta);
}

async function getMetrics(filter) {
  return _defaultManager.getMetrics(filter);
}

async function getTraces(filter) {
  return _defaultManager.getTraces(filter);
}

async function getHealth() {
  return _defaultManager.getHealth();
}

function getTelemetryManager() {
  return _defaultManager;
}

function createTelemetryManager(options) {
  return new TelemetryManager(options);
}

module.exports = {
  recordMetric,
  recordTrace,
  recordEvent,
  recordLog,
  getMetrics,
  getTraces,
  getHealth,
  getTelemetryManager,
  createTelemetryManager,
  TelemetryManager,
  TelemetryStorage,
  MetricsCollector,
  TracingEngine,
  Logger,
  HealthMonitor,
  Diagnostics,
  Analytics,
  AlertManager,
  TelemetryEventBus,
  LEVELS,
  COMPONENTS,
  EVENT_TYPES,
};
