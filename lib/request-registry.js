const MAX_ENTRIES = 1000;
const ENTRY_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

const registry = new Map();
let lastCleanup = Date.now();

function _cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  if (registry.size <= MAX_ENTRIES) return;
  const sorted = Array.from(registry.entries())
    .filter(([_, v]) => now - v.updatedAt <= ENTRY_TTL_MS)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, MAX_ENTRIES);
  registry.clear();
  for (const [k, v] of sorted) registry.set(k, v);
}

function _computeDerived(entry) {
  const e = { ...entry };
  if (e.receivedAt != null && e.queuedAt != null && e.executionStartedAt != null) {
    e.queueWaitTimeMs = Math.round(e.executionStartedAt - e.queuedAt);
  }
  if (e.receivedAt != null && e.executionFinishedAt != null) {
    e.totalLifecycleTimeMs = Math.round(e.executionFinishedAt - e.receivedAt);
  }
  if (e.executionStartedAt != null && e.executionFinishedAt != null) {
    e.executionDurationMs = Math.round(e.executionFinishedAt - e.executionStartedAt);
  }
  delete e.updatedAt;
  return e;
}

function registerLifecycle(requestId, updates) {
  if (!requestId) return null;
  const existing = registry.get(requestId) || {};
  const entry = { ...existing, ...updates, updatedAt: Date.now() };
  registry.set(requestId, entry);
  _cleanup();
  return _computeDerived(entry);
}

function lookupRequest(requestId) {
  if (!requestId) return null;
  const entry = registry.get(requestId);
  if (!entry) return null;
  return _computeDerived(entry);
}

function getAggregateMetrics() {
  if (registry.size === 0) return {
    totalRequests: 0, completedRequests: 0, failedRequests: 0,
    averageExecutionTimeMs: 0, averageQueueWaitTimeMs: 0,
  };
  const entries = Array.from(registry.values());
  const completed = entries.filter(e => e.status === 'completed');
  const failed = entries.filter(e => e.status === 'failed');
  const avgExecTime = completed.length > 0
    ? Math.round(completed.reduce((s, e) => s + (e.executionDurationMs || 0), 0) / completed.length)
    : 0;
  const avgWaitTime = completed.length > 0
    ? Math.round(completed.reduce((s, e) => s + (e.queueWaitTimeMs || 0), 0) / completed.length)
    : 0;
  return {
    totalRequests: registry.size,
    completedRequests: completed.length,
    failedRequests: failed.length,
    averageExecutionTimeMs: avgExecTime,
    averageQueueWaitTimeMs: avgWaitTime,
  };
}

module.exports = { registerLifecycle, lookupRequest, getAggregateMetrics };
