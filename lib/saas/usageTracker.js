const fs = require('fs');
const path = require('path');

const STORAGE = path.resolve(__dirname, '../../data/usage.json');

function _ensureStorage() {
  const dir = path.dirname(STORAGE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORAGE)) fs.writeFileSync(STORAGE, '[]', 'utf-8');
}

function _readAll() {
  _ensureStorage();
  try { return JSON.parse(fs.readFileSync(STORAGE, 'utf-8')); } catch { return []; }
}

function _writeAll(list) {
  _ensureStorage();
  fs.writeFileSync(STORAGE, JSON.stringify(list, null, 2), 'utf-8');
}

const METRIC_TYPES = {
  PROJECT_CREATED: 'project_created',
  DEPLOYMENT_EXECUTED: 'deployment_executed',
  AI_GENERATION: 'ai_generation',
  STORAGE_BYTES: 'storage_bytes',
  BANDWIDTH_BYTES: 'bandwidth_bytes',
  API_CALL: 'api_call',
};

function track({ metric, value, userId, organizationId, workspaceId, projectId, metadata } = {}) {
  if (!metric) throw new Error('metric is required');
  if (value == null) throw new Error('value is required');

  const entry = {
    id: `usage-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    metric,
    value,
    userId: userId || null,
    organizationId: organizationId || null,
    workspaceId: workspaceId || null,
    projectId: projectId || null,
    metadata: metadata || null,
    timestamp: new Date().toISOString(),
  };

  const list = _readAll();
  list.push(entry);
  _writeAll(list);
  return entry;
}

function getUsage({ metric, userId, organizationId, workspaceId, projectId, since, until, aggregate } = {}) {
  let list = _readAll();
  if (metric) list = list.filter(e => e.metric === metric);
  if (userId) list = list.filter(e => e.userId === userId);
  if (organizationId) list = list.filter(e => e.organizationId === organizationId);
  if (workspaceId) list = list.filter(e => e.workspaceId === workspaceId);
  if (projectId) list = list.filter(e => e.projectId === projectId);
  if (since) list = list.filter(e => new Date(e.timestamp) >= new Date(since));
  if (until) list = list.filter(e => new Date(e.timestamp) <= new Date(until));

  if (aggregate) {
    const totals = {};
    for (const entry of list) {
      totals[entry.metric] = (totals[entry.metric] || 0) + entry.value;
    }
    return { entries: list.length, totals, period: { since: since || 'all', until: until || 'now' } };
  }

  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return list;
}

function getSummary(organizationId) {
  const list = _readAll().filter(e => !organizationId || e.organizationId === organizationId);
  const totals = {};
  for (const entry of list) {
    totals[entry.metric] = (totals[entry.metric] || 0) + entry.value;
  }
  return {
    projectsCreated: totals[METRIC_TYPES.PROJECT_CREATED] || 0,
    deploymentsExecuted: totals[METRIC_TYPES.DEPLOYMENT_EXECUTED] || 0,
    aiGenerations: totals[METRIC_TYPES.AI_GENERATION] || 0,
    storageBytes: totals[METRIC_TYPES.STORAGE_BYTES] || 0,
    bandwidthBytes: totals[METRIC_TYPES.BANDWIDTH_BYTES] || 0,
    apiCalls: totals[METRIC_TYPES.API_CALL] || 0,
    totalEntries: list.length,
  };
}

module.exports = { track, getUsage, getSummary, METRIC_TYPES };
