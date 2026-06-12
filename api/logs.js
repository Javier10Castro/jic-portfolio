/**
 * /api/logs.js — Backward-compatible logs endpoint
 *
 * Thin proxy replicating the old /api/logs behavior.
 * Delegates to the same lib modules as /api/telemetry?type=logs.
 * Preserves backward compatibility for scripts and docs.
 *
 * GET ?id=<requestId>   — Single lifecycle entry (or 404)
 * GET ?limit=<N>        — Recent entries + aggregate metrics
 */

const { listEntries, getAggregateMetrics, lookupRequest } = require('../lib/request-registry');

const CORS = { 'Access-Control-Allow-Origin': '*' };

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(JSON.stringify(payload));
}

function ok(res, payload) { json(res, 200, payload); }
function notFound(res, msg) { json(res, 404, { error: msg || 'Not found' }); }

async function neonLogs(limit) {
  try {
    return await listEntries(limit);
  } catch { return []; }
}

async function neonMetrics() {
  try {
    return await getAggregateMetrics();
  } catch { return null; }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method Not Allowed' });
  }

  const q = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams;
  const id = q.get('id') || '';

  if (id) {
    const entry = await lookupRequest(id);
    if (!entry) return notFound(res, 'Request not found');
    return ok(res, entry);
  }

  const limit = parseInt(q.get('limit') || '20', 10);
  const [entries, metrics] = await Promise.all([neonLogs(limit), neonMetrics()]);
  ok(res, { entries, metrics });
};
