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

let _neon = null;
let _neonReady = false;
let _neonInitDone = false;

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

function _tryInitNeon() {
  if (_neonInitDone) return _neonReady;
  _neonInitDone = true;
  try {
    _neon = require('./db/requestLogs');
    _neonReady = true;
  } catch (e) {
    _neonReady = false;
  }
  return _neonReady;
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

async function _redisSet(requestId, entry) {
  if (!_redisReady) return;
  try {
    await _redis.set(_redisKey(requestId), JSON.stringify(entry), { ex: REDIS_TTL_S });
    await _redis.zadd('request:index', { score: entry.updatedAt || Date.now(), member: requestId });
    await _redis.expire('request:index', REDIS_TTL_S);
  } catch (e) {
    // Best-effort
  }
}

async function _neonSave(entry) {
  if (!_neonReady) return;
  try {
    await _neon.saveLog(entry);
  } catch (e) {
    // Best-effort — Neon failure must not break the request path
  }
}

function registerLifecycle(requestId, updates) {
  if (!requestId) return null;
  _tryInitRedis();
  _tryInitNeon();
  _ensureTimer();
  _evictExpired();
  const existing = _memoryStore.get(requestId) || {};
  const entry = { ...existing, ...updates, updatedAt: Date.now() };
  const computed = _computeDerived(entry);
  const storeEntry = { ...entry, executionDurationMs: computed.executionDurationMs, queueWaitTimeMs: computed.queueWaitTimeMs, totalLifecycleTimeMs: computed.totalLifecycleTimeMs };
  _memoryStore.set(requestId, storeEntry);
  _enforceCapacity();
  _redisSet(requestId, storeEntry);
  // Neon: source of truth (async fire-and-forget, never blocks API)
  _neonSave(storeEntry);
  return computed;
}

async function lookupRequest(requestId) {
  if (!requestId) return null;
  _tryInitRedis();
  _tryInitNeon();
  const memEntry = _memoryStore.get(requestId);
  if (memEntry) {
    if (_isExpired(memEntry)) {
      _memoryStore.delete(requestId);
    } else {
      return _computeDerived(memEntry);
    }
  }
  // Neon: source of truth
  if (_neonReady) {
    try {
      const row = await _neon.getLog(requestId);
      if (row) {
        // Cache in memory for fast subsequent lookups
        const cacheEntry = { ...row, updatedAt: Date.now() };
        _memoryStore.set(requestId, cacheEntry);
        return _computeDerived(cacheEntry);
      }
    } catch { /* fall through */ }
  }
  // Redis fallback (if configured, rarely used)
  if (_redisReady) {
    try {
      const raw = await _redis.get(_redisKey(requestId));
      if (!raw) return null;
      const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return _computeDerived(entry);
    } catch { return null; }
  }
  return null;
}

async function listEntries(limit = 50) {
  _tryInitRedis();
  _tryInitNeon();
  _evictExpired();
  const cap = Math.min(limit, 200);
  let dbEntries = [];
  // Neon: source of truth for persisted entries
  if (_neonReady) {
    try {
      dbEntries = await _neon.listLogs(cap);
    } catch { /* fall through */ }
  }
  // Merge recent in-memory entries not yet in Neon (race condition protection)
  const dbIds = new Set(dbEntries.map(e => e.requestId));
  const memEntries = Array.from(_memoryStore.entries())
    .filter(([id]) => !dbIds.has(id))
    .map(([id, entry]) => ({ requestId: id, ..._computeDerived(entry) }));
  const all = [...dbEntries, ...memEntries].sort((a, b) => (b.receivedAt || b.queuedAt || 0) - (a.receivedAt || a.queuedAt || 0));
  if (all.length >= cap) return all.slice(0, cap);
  // Redis fallback
  if (_redisReady) {
    try {
      const ids = await _redis.zrevrange('request:index', 0, cap - 1);
      if (ids && ids.length) {
        const existingIds = new Set(all.map(e => e.requestId));
        const keys = ids.filter(id => !existingIds.has(id)).map(id => _redisKey(id));
        if (keys.length) {
          const rawEntries = await _redis.mget(...keys);
          for (let i = 0; i < ids.length; i++) {
            const raw = rawEntries[i];
            if (!raw) continue;
            try {
              const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
              all.push({ requestId: ids[i], ..._computeDerived(entry) });
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* fall through */ }
  }
  // Pure memory entries (no DB, no Redis)
  if (!_neonReady && !_redisReady) {
    const pureMem = Array.from(_memoryStore.entries())
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
      .slice(0, cap)
      .map(([id, entry]) => ({ requestId: id, ..._computeDerived(entry) }));
    return pureMem;
  }
  return all.sort((a, b) => (b.receivedAt || b.queuedAt || 0) - (a.receivedAt || a.queuedAt || 0)).slice(0, cap);
}

async function getAggregateMetrics() {
  _tryInitRedis();
  _tryInitNeon();
  _evictExpired();
  // Neon: source of truth
  if (_neonReady) {
    try {
      return await _neon.getAggregateMetrics();
    } catch { /* fall through */ }
  }
  // Redis fallback
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
  }
  // Pure memory fallback
  const entries = Array.from(_memoryStore.values());
  const completed = entries.filter(e => e.status === 'completed');
  const failed = entries.filter(e => e.status === 'failed');
  const avgExec = completed.length > 0 ? Math.round(completed.reduce((s, e) => s + (e.executionDurationMs || 0), 0) / completed.length) : 0;
  const avgWait = completed.length > 0 ? Math.round(completed.reduce((s, e) => s + (e.queueWaitTimeMs || 0), 0) / completed.length) : 0;
  return { totalRequests: _memoryStore.size, completedRequests: completed.length, failedRequests: failed.length, averageExecutionTimeMs: avgExec, averageQueueWaitTimeMs: avgWait };
}

module.exports = { registerLifecycle, lookupRequest, getAggregateMetrics, listEntries };
