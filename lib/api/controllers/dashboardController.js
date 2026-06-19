const { projectManager, usageTracker, auditLog } = require('../../saas');
const { pipelineManager } = require('../../pipeline');
const { success } = require('../responses');

function home(req, res) {
  const projects = projectManager.listProjects ? projectManager.listProjects() : [];
  const usage = usageTracker.getCurrentUsage ? usageTracker.getCurrentUsage(req.user?.id) : {};
  const recentRuns = typeof pipelineManager.listPipelineRuns === 'function' ? pipelineManager.listPipelineRuns() : [];

  return success(res, {
    projects: { total: projects.length },
    usage,
    pipelines: { recent: Array.isArray(recentRuns) ? recentRuns.length : 0 },
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
  });
}

function stats(req, res) {
  const projects = projectManager.listProjects ? projectManager.listProjects() : [];
  const usage = usageTracker.getCurrentUsage ? usageTracker.getCurrentUsage(req.user?.id) : {};
  const auditEntries = auditLog.getLog ? auditLog.getLog() : [];

  return success(res, {
    projects: { total: projects.length, active: projects.filter(p => p.status === 'active').length },
    usage: usage || {},
    audit: { total: auditEntries.length },
    timestamp: new Date().toISOString(),
  });
}

function activity(req, res) {
  const auditEntries = auditLog.getLog ? auditLog.getLog() : [];
  const recent = auditEntries.slice(-50).reverse();
  return success(res, recent);
}

module.exports = { home, stats, activity };
