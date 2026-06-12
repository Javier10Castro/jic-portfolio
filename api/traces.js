/**
 * /api/traces.js — Backward-compatible trace events endpoint
 *
 * Thin proxy replicating the old /api/traces behavior.
 * Delegates to the same lib modules as /api/telemetry.
 *
 * GET ?id=<requestId>        — Trace events for a request (merged memory + Neon)
 * GET ?coverage=true         — Merged coverage across all known paths
 * GET ?range=24h             — Aggregated trace analytics
 */

const tracer = require('../lib/tracer');
const requestTraces = require('../lib/db/requestTraces');

const CORS = { 'Access-Control-Allow-Origin': '*' };

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(JSON.stringify(payload));
}

function ok(res, payload) { json(res, 200, payload); }
function notFound(res, msg) { json(res, 404, { error: msg || 'Not found' }); }

async function neonTracesById(id) {
  try { return await requestTraces.getTracesByRequestId(id); } catch { return []; }
}

async function neonCoverage() {
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
      percentage: requestTraces.ALL_PATHS.length > 0 ? Math.round((covered.length / requestTraces.ALL_PATHS.length) * 100) : 0,
      source: 'neon',
      rangeHours: 24,
    };
  } catch { return null; }
}

async function neonRange(hours) {
  try {
    const agg = await requestTraces.getAggregatedPaths(hours);
    const buckets = await requestTraces.getTimeBucketStats(hours, 60);
    return { rangeHours: hours, paths: agg, totalDistinctPaths: agg.length, timeBuckets: buckets, bucketSizeMinutes: 60 };
  } catch { return null; }
}

async function neonHeatmap(hours) {
  try { return await requestTraces.getHeatmap(hours); } catch { return { total: 0, rows: [], rangeHours: hours }; }
}

async function neonTimeline(hours, limit) {
  try { return await requestTraces.getTimeline(hours, limit); } catch { return { events: [], byRequest: {}, totalRequests: 0, totalEvents: 0, rangeHours: hours }; }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method Not Allowed' });
  }

  const q = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams;
  const id = q.get('id') || '';
  const coverage = q.get('coverage') === 'true';
  const range = q.get('range') || '';
  const heatmap = q.get('heatmap') === 'true';
  const timeline = q.get('timeline') === 'true';
  const hours = parseInt(q.get('hours') || '24', 10);

  if (heatmap) {
    const data = await neonHeatmap(hours);
    return ok(res, { endpoint: 'traces', type: 'heatmap', ...data });
  }

  if (timeline) {
    const limit = parseInt(q.get('limit') || '200', 10);
    const data = await neonTimeline(hours, limit);
    return ok(res, { endpoint: 'traces', type: 'timeline', ...data });
  }

  if (coverage) {
    const memCoverage = tracer.getCoverage();
    const neonData = await neonCoverage();
    const allCovered = new Set([
      ...(memCoverage.coveredPaths || []),
      ...(neonData ? neonData.coveredPaths : []),
    ]);
    const allCoveredArr = tracer.ALL_PATHS.filter(p => allCovered.has(p));
    return ok(res, {
      coverage: {
        total: tracer.ALL_PATHS.length,
        executed: allCovered.size,
        covered: allCoveredArr.length,
        coveredPaths: allCoveredArr.sort(),
        missingPaths: tracer.ALL_PATHS.filter(p => !allCovered.has(p)).sort(),
        percentage: tracer.ALL_PATHS.length > 0 ? Math.round((allCoveredArr.length / tracer.ALL_PATHS.length) * 100) : 0,
        source: 'merged',
        memory: { executed: memCoverage.executed, percentage: memCoverage.percentage },
        neon: neonData ? { executed: neonData.executed, percentage: neonData.percentage, rangeHours: 24 } : null,
      },
    });
  }

  if (range) {
    const rangeHours = parseInt(range.replace('h', ''), 10) || 24;
    const data = await neonRange(rangeHours);
    if (!data) return notFound(res, 'Range data unavailable');
    return ok(res, { endpoint: 'traces', type: 'range', ...data });
  }

  if (id) {
    const memoryTraces = tracer.getTraces(id).map(t => ({ ...t, source: 'memory' }));
    const neonTraces = await neonTracesById(id);
    const seen = new Set();
    const merged = [];
    for (const t of [...memoryTraces, ...neonTraces]) {
      const key = `${t.requestId}:${t.pathId}`;
      if (!seen.has(key)) { seen.add(key); merged.push(t); }
    }
    merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return ok(res, {
      traces: merged,
      found: merged.length > 0,
      sources: { memory: memoryTraces.length, neon: neonTraces.length, merged: merged.length },
    });
  }

  return ok(res, { traces: [], found: false });
};
