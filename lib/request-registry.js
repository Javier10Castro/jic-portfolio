const MAX_ENTRIES = 1000;
const ENTRY_TTL_MS = 5 * 60 * 1000;
const REDIS_TTL_S = 7 * 24 * 3600;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const REGISTRY_PREFIX = 'request:';

let _redis = null;
let _redisReady = false;
let _redisInitDone = false;

const _memoryStore = new Map();
let _timer = null;

function _tryInitRedis() {
  if (_redisInitDone) return _redisReady;
  _redisInitDone = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const { Redis } = require('@upstash/redis');
      _redis = new Redis({ url, token });
      _redisReady = true;
    } catch (e) {
      _redisReady = false;
    }
  }
  return _redisReady;
}

function _redisKey(requestId) {
  return REGISTRY_PREFIX + requestId;
}

function _isExpired(entry) {
  return Date.now() - entry.updatedAt > ENTRY_TTL_MS;
}

function _evictExpired() {
  const now = Date.now();
  for (const [key, entry] of _memoryStore) {
    if (now - entry.updatedAt > ENTRY_TTL_MS) {
      _memoryStore.delete(key);
    }
  }
}

function _enforceCapacity() {
  if (_memoryStore.size <= MAX_ENTRIES) return;
  const sorted = Array.from(_memoryStore.entries())
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, MAX_ENTRIES);
  _memoryStore.clear();
  for (const [k, v] of sorted) _memoryStore.set(k, v);
}

function _ensureTimer() {
  if (_timer) return;
  _timer = setInterval(() => { _evictExpired(); _enforceCapacity(); }, CLEANUP_INTERVAL_MS);
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

function _computeDerivedForStore(entry) {
  const computed = _computeDerived({ ...entry });
  return { ...entry, executionDurationMs: computed.executionDurationMs, queueWaitTimeMs: computed.queueWaitTimeMs, totalLifecycleTimeMs: computed.totalLifecycleTimeMs };
}

async function _redisSet(requestId, entry) {
  if (!_redisReady) return;
  try {
    await _redis.set(_redisKey(requestId), JSON.stringify(entry), { ex: REDIS_TTL_S });
    await _redis.zadd('request:index', { score: entry.updatedAt || Date.now(), member: requestId });
    await _redis.expire('request:index', REDIS_TTL_S);
  } catch (e) {
    // Best-effort — Redis failure must not break the request path
  }
}

function registerLifecycle(requestId, updates) {
  if (!requestId) return null;
  _tryInitRedis();
  _ensureTimer();
  _evictExpired();
  const existing = _memoryStore.get(requestId) || {};
  const entry = { ...existing, ...updates, updatedAt: Date.now() };
  const computed = _computeDerived(entry);
  const storeEntry = { ...entry, executionDurationMs: computed.executionDurationMs, queueWaitTimeMs: computed.queueWaitTimeMs, totalLifecycleTimeMs: computed.totalLifecycleTimeMs };
  _memoryStore.set(requestId, storeEntry);
  _enforceCapacity();
  _redisSet(requestId, storeEntry);
  return computed;
}

async function lookupRequest(requestId) {
  if (!requestId) return null;
  _tryInitRedis();
  const memEntry = _memoryStore.get(requestId);
  if (memEntry) {
    if (_isExpired(memEntry)) {
      _memoryStore.delete(requestId);
      return null;
    }
    return _computeDerived(memEntry);
  }
  if (!_redisReady) return null;
  try {
    const raw = await _redis.get(_redisKey(requestId));
    if (!raw) return null;
    const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return _computeDerived(entry);
  } catch {
    return null;
  }
}

async function listEntries(limit = 50) {
  _tryInitRedis();
  _evictExpired();
  const cap = Math.min(limit, 200);
  const result = [];
  if (_redisReady) {
    try {
      const ids = await _redis.zrevrange('request:index', 0, cap - 1);
      if (ids && ids.length) {
        const keys = ids.map(id => _redisKey(id));
        const rawEntries = await _redis.mget(...keys);
        for (let i = 0; i < ids.length; i++) {
          const raw = rawEntries[i];
          if (!raw) continue;
          try {
            const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
            result.push({ requestId: ids[i], ..._computeDerived(entry) });
          } catch { /* skip */ }
        }
        return result;
      }
    } catch { /* fall through */ }
  }
  const entries = Array.from(_memoryStore.entries())
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, cap)
    .map(([id, entry]) => ({ requestId: id, ..._computeDerived(entry) }));
  return entries;
}

async function getAggregateMetrics() {
  _tryInitRedis();
  _evictExpired();
  if (_memoryStore.size === 0 && _redisReady) {
    try {
      const count = await _redis.zcard('request:index');
      if (count > 0) {
        const ids = await _redis.zrevrange('request:index', 0, 99);
        let completed = 0, failed = 0, totalExec = 0, totalWait = 0;
        for (const id of ids) {
          const raw = await _redis.get(_redisKey(id));
          if (!raw) continue;
          try {
            const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (entry.status === 'completed') { completed++; totalExec += (entry.executionDurationMs || 0); totalWait += (entry.queueWaitTimeMs || 0); }
            if (entry.status === 'failed') failed++;
          } catch { /* skip */ }
        }
        return { totalRequests: count, completedRequests: completed, failedRequests: failed, averageExecutionTimeMs: completed > 0 ? Math.round(totalExec / completed) : 0, averageQueueWaitTimeMs: completed > 0 ? Math.round(totalWait / completed) : 0 };
      }
    } catch { /* fall through */ }
    return { totalRequests: 0, completedRequests: 0, failedRequests: 0, averageExecutionTimeMs: 0, averageQueueWaitTimeMs: 0 };
  }
  const entries = Array.from(_memoryStore.values());
  const completed = entries.filter(e => e.status === 'completed');
  const failed = entries.filter(e => e.status === 'failed');
  return { totalRequests: _memoryStore.size, completedRequests: completed.length, failedRequests: failed.length, averageExecutionTimeMs: completed.length > 0 ? Math.round(completed.reduce((s, e) => s + (e.executionDurationMs || 0), 0) / completed.length) : 0, averageQueueWaitTimeMs: completed.length > 0 ? Math.round(completed.reduce((s, e) => s + (e.queueWaitTimeMs || 0), 0) / completed.length) : 0 };
}

module.exports = { registerLifecycle, lookupRequest, getAggregateMetrics, listEntries };
