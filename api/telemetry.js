/**
 * /api/telemetry.js — Consolidated observability module
 *
 * Replaces: /api/logs, /api/traces, /api/health
 * Frees 3 serverless function slots for Vercel Hobby compliance.
 *
 * GET ?type=logs&limit=50         — Request lifecycle logs
 * GET ?type=traces&id=<rqId>      — Trace events (merged memory + Neon)
 * GET ?type=coverage              — Coverage metrics (27 pathIds)
 * GET ?type=health                — System health (queue, rate-limit, memory)
 * GET ?type=health&section=queue  — Queue-specific health
 * GET ?type=health&section=rate-limit — Rate-limit-specific health
 * GET ?type=range&hours=24        — Time-range trace analytics
 *
 * POST internal event logging (future, not yet active):
 *   body: { action: 'trace', ...traceEvent }
 */

const { listEntries, getAggregateMetrics, lookupRequest } = require('../lib/request-registry');
const tracer = require('../lib/tracer');
const requestTraces = require('../lib/db/requestTraces');
const emailQueue = require('../lib/queue');
const { getDetailedSnapshot, getSnapshot } = require('../lib/rate-limit');
const { deployInfo } = require('../lib/safeBodyParser');

const CORS = { 'Access-Control-Allow-Origin': '*' };

// ── Neon helpers (async, best-effort) ────────────────────────

async function _neonLogs(limit) {
  try {
    return await listEntries(limit);
  } catch { return []; }
}

async function _neonMetrics() {
  try {
    return await getAggregateMetrics();
  } catch { return null; }
}

async function _neonTracesById(requestId) {
  try {
    return await requestTraces.getTracesByRequestId(requestId);
  } catch { return []; }
}

async function _neonCoverage() {
  try {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const paths = await requestTraces.getDistinctPathsSince(since);
    const covered = requestTraces.ALL_PATHS.filter(p => paths.includes(p));
    return {
      total: requestTraces.ALL_PATHS.length,
      executed: paths.length,
      covered: covered.length,
      coveredPaths: covered.sort(),
      missingPaths: requestTraces.ALL_PATHS.filter(p => !paths.includes(p)).sort(),
      percentage: requestTraces.ALL_PATHS.length > 0
        ? Math.round((covered.length / requestTraces.ALL_PATHS.length) * 100) : 0,
      source: 'neon',
      rangeHours: 24,
    };
  } catch { return null; }
}

async function _neonRangeAggregation(hours) {
  try {
    const aggregated = await requestTraces.getAggregatedPaths(hours);
    const timeBuckets = await requestTraces.getTimeBucketStats(hours, 60);
    return {
      rangeHours: hours,
      paths: aggregated,
      totalDistinctPaths: aggregated.length,
      timeBuckets,
      bucketSizeMinutes: 60,
    };
  } catch { return null; }
}

// ── Response helpers ──────────────────────────────────────────

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(JSON.stringify(payload));
}

function ok(res, payload) { json(res, 200, payload); }
function notFound(res, msg) { json(res, 404, { error: msg || 'Not found' }); }

// ── Route handlers ────────────────────────────────────────────

async function handleLogs(req, res, q) {
  const id = q.get('id') || '';
  if (id) {
    const entry = await lookupRequest(id);
    if (!entry) return notFound(res, 'Request not found');
    return ok(res, entry);
  }
  const limit = parseInt(q.get('limit') || '20', 10);
  const [entries, metrics] = await Promise.all([_neonLogs(limit), _neonMetrics()]);
  ok(res, { entries, metrics });
}

async function handleTraces(req, res, q) {
  const id = q.get('id') || '';
  if (!id) return ok(res, { traces: [], found: false });
  const memoryTraces = tracer.getTraces(id).map(t => ({ ...t, source: 'memory' }));
  const neonTraces = await _neonTracesById(id);
  const seen = new Set();
  const merged = [];
  for (const t of [...memoryTraces, ...neonTraces]) {
    const key = `${t.requestId}:${t.pathId}`;
    if (!seen.has(key)) { seen.add(key); merged.push(t); }
  }
  merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  ok(res, {
    traces: merged,
    found: merged.length > 0,
    sources: { memory: memoryTraces.length, neon: neonTraces.length, merged: merged.length },
  });
}

async function handleCoverage(req, res) {
  const memCoverage = tracer.getCoverage();
  const neonCoverage = await _neonCoverage();
  const allCovered = new Set([
    ...(memCoverage.coveredPaths || []),
    ...(neonCoverage ? neonCoverage.coveredPaths : []),
  ]);
  const allCoveredArr = tracer.ALL_PATHS.filter(p => allCovered.has(p));
  ok(res, {
    coverage: {
      total: tracer.ALL_PATHS.length,
      executed: allCovered.size,
      covered: allCoveredArr.length,
      coveredPaths: allCoveredArr.sort(),
      missingPaths: tracer.ALL_PATHS.filter(p => !allCovered.has(p)).sort(),
      percentage: tracer.ALL_PATHS.length > 0
        ? Math.round((allCoveredArr.length / tracer.ALL_PATHS.length) * 100) : 0,
      source: 'merged',
      memory: { executed: memCoverage.executed, percentage: memCoverage.percentage },
      neon: neonCoverage ? { executed: neonCoverage.executed, percentage: neonCoverage.percentage, rangeHours: 24 } : null,
    },
  });
}

async function handleHealth(req, res, q) {
  const section = q.get('section') || 'summary';

  if (section === 'queue') {
    const detailed = await emailQueue.getDetailedStats();
    const stats = emailQueue.stats();
    return ok(res, {
      status: 'ok', timestamp: detailed.timestamp,
      queue: {
        depth: stats.depth, currentDepth: detailed.queue.depth,
        active: stats.active, activeWorkers: detailed.queue.active,
        maxDepth: detailed.queue.maxDepth,
        utilizationPercent: Math.round((detailed.queue.depth / detailed.queue.maxDepth) * 100),
      },
      throughput: {
        totalEnqueued: detailed.throughput.totalEnqueued,
        completed: stats.completed, failed: stats.failed,
        successRate: stats.completed + stats.failed > 0
          ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100) + '%' : '100%',
      },
      oldestRequest: {
        ageMs: detailed.oldestRequestAgeMs, ageSec: detailed.oldestRequestAgeSec,
        ageMin: Math.round(detailed.oldestRequestAgeMs / 60000),
      },
      lifecycle: detailed.lifecycle,
    });
  }

  if (section === 'rate-limit') {
    const detailed = getDetailedSnapshot();
    const basic = getSnapshot();
    return ok(res, {
      status: 'ok', timestamp: detailed.timestamp, instanceId: detailed.instanceId,
      ip: {
        currentEntries: basic.ipEntries, currentUsage: detailed.ip.entries,
        softLimit: detailed.ip.softLimit, hardLimit: detailed.ip.hardLimit,
        windowMs: detailed.ip.windowMs, oldestEntryAgeMs: detailed.ip.oldestEntryAgeMs,
        windowResetTime: detailed.ip.windowResetTime,
      },
      emailDedup: {
        cacheSize: basic.emailEntries, currentEntries: detailed.emailDedup.entries,
        limit: detailed.emailDedup.limit, windowMs: detailed.emailDedup.windowMs,
        oldestEntryAgeMs: detailed.emailDedup.oldestEntryAgeMs,
        windowResetTime: detailed.emailDedup.windowResetTime,
      },
      thresholds: {
        edgeSoftLimit: detailed.ip.softLimit, edgeHardLimit: detailed.ip.hardLimit,
        edgeWindowMs: detailed.ip.windowMs, emailDedupWindowMs: detailed.emailDedup.windowMs,
        emailDedupMaxPerWindow: detailed.emailDedup.limit,
      },
    });
  }

  const queueStats = emailQueue.stats();
  const detailed = await emailQueue.getDetailedStats();
  const rlSnapshot = getSnapshot();
  const di = deployInfo();

  ok(res, {
    status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(),
    instance: { id: rlSnapshot.instanceId, sha: di.sha, env: di.env, region: di.region },
    queue: {
      size: queueStats.depth, active: queueStats.active,
      pending: Math.max(0, queueStats.depth - queueStats.active),
      completed: queueStats.completed, failed: queueStats.failed, maxDepth: 100,
    },
    lifecycle: detailed.lifecycle,
    rateLimit: {
      ipEntries: rlSnapshot.ipEntries, emailEntries: rlSnapshot.emailEntries,
      edgeSoftLimit: rlSnapshot.edgeSoftLimit, edgeHardLimit: rlSnapshot.edgeHardLimit,
      edgeWindowMs: rlSnapshot.edgeWindowMs, emailDedupWindowMs: rlSnapshot.emailDedupWindowMs,
    },
    memory: process.memoryUsage ? {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    } : null,
  });
}

async function handleRange(req, res, q) {
  const hours = parseInt(q.get('hours') || '24', 10);
  const data = await _neonRangeAggregation(hours);
  if (!data) return notFound(res, 'Range data unavailable');
  ok(res, { endpoint: 'telemetry', type: 'range', ...data });
}

// ── POST: Internal event logging ──────────────────────────────

async function handlePost(req, res) {
  let body = '';
  try {
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body);
    if (parsed.action === 'trace' && parsed.requestId && parsed.pathId) {
      tracer.trace(parsed.requestId, parsed.endpoint || 'unknown', parsed.stage || parsed.pathId, parsed.pathId);
    }
    ok(res, { accepted: true });
  } catch {
    ok(res, { accepted: false, error: 'invalid_body' });
  }
}

// ── Main handler ──────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method Not Allowed' });
  }

  const q = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams;
  const type = q.get('type') || '';

  switch (type) {
    case 'logs':
      return handleLogs(req, res, q);
    case 'traces':
      return handleTraces(req, res, q);
    case 'coverage':
      return handleCoverage(req, res);
    case 'health':
      return handleHealth(req, res, q);
    case 'range':
      return handleRange(req, res, q);
    default:
      return json(res, 400, {
        error: 'Invalid type',
        validTypes: ['logs', 'traces', 'coverage', 'health', 'range'],
        docs: '/api/telemetry?type=health',
      });
  }
};
