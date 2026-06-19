const { getTelemetryManager } = require('../../telemetry');
const { success } = require('../responses');
const { ValidationError } = require('../errors');

const manager = getTelemetryManager();

async function getMetricsEndpoint(req, res) {
  const { name, source, since, limit } = req.query;
  const filter = {};
  if (name) filter.name = name;
  if (source) filter.source = source;
  if (since) filter.since = parseInt(since);
  if (limit) filter.limit = parseInt(limit);
  const metrics = await manager.getMetrics(filter);
  return success(res, { metrics, total: metrics.length, liveCounters: manager.metrics.getAllMetrics() });
}

async function getTracesEndpoint(req, res) {
  const { traceId, service, since, limit } = req.query;
  if (traceId) {
    const trace = await manager.tracing.getTrace(traceId);
    return success(res, { traceId, spans: trace, tree: manager.tracing.getTraceTree(traceId) });
  }
  const filter = {};
  if (service) filter.service = service;
  if (since) filter.since = parseInt(since);
  if (limit) filter.limit = parseInt(limit);
  const traces = await manager.getTraces(filter);
  return success(res, { traces, total: traces.length });
}

async function getLogsEndpoint(req, res) {
  const { level, source, traceId, since, limit } = req.query;
  const filter = {};
  if (level) filter.level = level.toUpperCase();
  if (source) filter.source = source;
  if (traceId) filter.traceId = traceId;
  if (since) filter.since = parseInt(since);
  if (limit) filter.limit = parseInt(limit);
  const logs = await manager.storage.getLogs(filter);
  return success(res, { logs, total: logs.length });
}

async function getHealthEndpoint(req, res) {
  const health = await manager.healthSummary();
  return success(res, health);
}

async function getAnalyticsEndpoint(req, res) {
  const { type, limit } = req.query;
  const validType = type || 'daily';
  const history = await manager.analytics.getHistory(validType, parseInt(limit) || 30);
  return success(res, { type: validType, reports: history });
}

async function getAlertsEndpoint(req, res) {
  const { severity, status, since, limit } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;
  if (status) filter.status = status;
  if (since) filter.since = parseInt(since);
  if (limit) filter.limit = parseInt(limit);
  const alerts = await manager.alerts.getAlerts(filter);
  const counts = manager.alerts.getAlertCounts();
  return success(res, { alerts, counts, total: alerts.length });
}

async function createAlertEndpoint(req, res) {
  const { name, severity, condition } = req.body;
  if (!name) throw new ValidationError('Alert name is required');
  const rule = manager.alerts.addRule({
    name,
    severity: severity || 'warning',
    condition: () => true,
    message: req.body.message || name,
  });
  return success(res, rule);
}

async function getDiagnosticsEndpoint(req, res) {
  const snapshot = await manager.systemSnapshot();
  const health = await manager.healthSummary();
  const errors = await manager.errorSummary();
  return success(res, { snapshot, health, errors });
}

module.exports = {
  getMetricsEndpoint, getTracesEndpoint, getLogsEndpoint, getHealthEndpoint,
  getAnalyticsEndpoint, getAlertsEndpoint, createAlertEndpoint, getDiagnosticsEndpoint,
};
