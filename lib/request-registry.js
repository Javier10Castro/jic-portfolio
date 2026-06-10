const MAX_ENTRIES = 1000;
const ENTRY_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

const registry = new Map();
let _timer = null;

function _isExpired(entry) {
  return Date.now() - entry.updatedAt > ENTRY_TTL_MS;
}

function _evictExpired() {
  const now = Date.now();
  for (const [key, entry] of registry) {
    if (now - entry.updatedAt > ENTRY_TTL_MS) {
      registry.delete(key);
    }
  }
}

function _enforceCapacity() {
  if (registry.size <= MAX_ENTRIES) return;
  const sorted = Array.from(registry.entries())
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, MAX_ENTRIES);
  registry.clear();
  for (const [k, v] of sorted) registry.set(k, v);
}

function _ensureTimer() {
  if (_timer) return;
  _timer = setInterval(() => {
    _evictExpired();
    _enforceCapacity();
  }, CLEANUP_INTERVAL_MS);
  if (_timer && _timer.unref) _timer.unref();
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
  _ensureTimer();
  _evictExpired();
  const existing = registry.get(requestId) || {};
  const entry = { ...existing, ...updates, updatedAt: Date.now() };
  const computed = _computeDerived(entry);
  // Persist raw entry (with updatedAt for TTL) + derived fields for aggregate queries
  registry.set(requestId, { ...entry, executionDurationMs: computed.executionDurationMs, queueWaitTimeMs: computed.queueWaitTimeMs, totalLifecycleTimeMs: computed.totalLifecycleTimeMs });
  _enforceCapacity();
  return computed;
}

function lookupRequest(requestId) {
  if (!requestId) return null;
  const entry = registry.get(requestId);
  if (!entry) return null;
  if (_isExpired(entry)) {
    registry.delete(requestId);
    return null;
  }
  return _computeDerived(entry);
}

function getAggregateMetrics() {
  _evictExpired();
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
