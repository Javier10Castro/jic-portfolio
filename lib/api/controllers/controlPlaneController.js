const { success, error } = require('../responses');

function _safe(fn) {
  try { return fn(); } catch (e) { return null; }
}

function getSystemOverview(req, res) {
  const e = _safe(() => require('../../events'));
  const r = _safe(() => require('../../remediation'));
  const c = _safe(() => require('../../cluster'));
  const w = _safe(() => require('../../workflows'));

  const store = e?.getEventStore?.();
  const intel = e?.getIntelligenceEngine?.();
  const remed = r?.getRemediationEngine?.();
  const cm = c?.getClusterManager?.();
  const wm = w?.getWorkflowManager?.();

  const intelHealth = intel ? intel.getHealth() : {};
  const remedHealth = remed ? remed.getHealth() : {};

  const overview = {
    events: { totalProcessed: intelHealth.totalProcessed || 0, eventCount: store ? store._events.length : 0 },
    intelligence: { totalProcessed: intelHealth.totalProcessed || 0, patternCount: intelHealth.patternCount || 0, anomalyCount: intelHealth.anomalyCount || 0, insightCount: intelHealth.insightCount || 0 },
    remediation: { totalExecuted: remedHealth.totalExecuted || 0, pendingApprovals: remedHealth.pendingApprovals || 0, policyCount: remedHealth.policyCount || 0, historyCount: remedHealth.historyCount || 0 },
    cluster: cm ? { workerCount: cm.workers?.length || 0, healthyWorkers: cm.workers?.filter?.(w => w.status === 'healthy')?.length || 0, queueDepth: cm.queueDepth || 0, leaderId: cm.leaderId || null } : {},
    workflows: wm ? { total: wm.workflows?.length || 0, running: wm.workflows?.filter?.(wf => wf.status === 'RUNNING')?.length || 0, failed: wm.workflows?.filter?.(wf => wf.status === 'FAILED')?.length || 0, completed: wm.workflows?.filter?.(wf => wf.status === 'COMPLETED')?.length || 0 } : {},
    timestamp: Date.now(),
  };
  return success(res, overview);
}

function getEvents(req, res) {
  const eventStore = _safe(() => require('../../events').getEventStore());
  if (!eventStore) return success(res, []);
  const limit = parseInt(req.query.limit) || 50;
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.severity) filter.severity = req.query.severity;
  filter.limit = limit;
  filter.sort = 'desc';
  return eventStore.query(filter).then(events => success(res, events)).catch(() => success(res, []));
}

function getInsights(req, res) {
  const intelligence = _safe(() => require('../../events').getIntelligenceEngine());
  const insights = intelligence ? intelligence.insightGenerator.getInsights(req.query) : [];
  const limit = parseInt(req.query.limit) || 50;
  return success(res, insights.slice(-limit));
}

function getAnomalies(req, res) {
  const intelligence = _safe(() => require('../../events').getIntelligenceEngine());
  const anomalies = intelligence ? intelligence.anomalyDetector.getAnomalies(req.query) : [];
  const limit = parseInt(req.query.limit) || 50;
  return success(res, anomalies.slice(-limit));
}

function getPatterns(req, res) {
  const intelligence = _safe(() => require('../../events').getIntelligenceEngine());
  const patterns = intelligence ? intelligence.patternDetector.getPatterns(req.query) : [];
  const limit = parseInt(req.query.limit) || 50;
  return success(res, patterns.slice(-limit));
}

function getRemediationHistory(req, res) {
  const remediation = _safe(() => require('../../remediation').getRemediationEngine());
  const history = remediation ? remediation.store.getHistory(req.query) : [];
  const limit = parseInt(req.query.limit) || 50;
  return success(res, history.slice(-limit));
}

function getRemediationPolicies(req, res) {
  const remediation = _safe(() => require('../../remediation').getRemediationEngine());
  const policies = remediation ? remediation.policies.getPolicies(req.query) : [];
  return success(res, policies);
}

function getClusterStatus(req, res) {
  const cluster = _safe(() => require('../../cluster'));
  const manager = cluster ? cluster.getClusterManager() : null;
  if (!manager) return success(res, { available: false });
  const workers = manager.workers || [];
  return success(res, {
    available: true,
    workerCount: workers.length,
    healthyWorkers: workers.filter(w => w.status === 'healthy').length,
    unhealthyWorkers: workers.filter(w => w.status !== 'healthy').length,
    queueDepth: manager.queueDepth || 0,
    leaderId: manager.leaderId || null,
    isLeader: manager.isLeader || false,
    workers: workers.slice(-20),
    timestamp: Date.now(),
  });
}

function getWorkflowStatus(req, res) {
  const workflows = _safe(() => require('../../workflows'));
  const manager = workflows ? workflows.getWorkflowManager() : null;
  if (!manager) return success(res, { available: false });
  const workflowList = manager.workflows || [];
  const statusFilter = req.query.status;
  let filtered = workflowList;
  if (statusFilter) filtered = filtered.filter(w => w.status === statusFilter);
  return success(res, {
    available: true,
    total: workflowList.length,
    byStatus: {
      running: workflowList.filter(w => w.status === 'RUNNING').length,
      completed: workflowList.filter(w => w.status === 'COMPLETED').length,
      failed: workflowList.filter(w => w.status === 'FAILED').length,
      queued: workflowList.filter(w => w.status === 'QUEUED').length,
      cancelled: workflowList.filter(w => w.status === 'CANCELLED').length,
    },
    recent: filtered.slice(-20).reverse(),
    timestamp: Date.now(),
  });
}

function getRemediationPendingApprovals(req, res) {
  const remediation = _safe(() => require('../../remediation').getRemediationEngine());
  const approvals = remediation ? remediation.getPendingApprovals() : [];
  return success(res, approvals);
}

module.exports = { getSystemOverview, getEvents, getInsights, getAnomalies, getPatterns, getRemediationHistory, getRemediationPolicies, getClusterStatus, getWorkflowStatus, getRemediationPendingApprovals };
