/**
 * requestTraces.js — Neon persistence for runtime trace events
 *
 * Fire-and-forget writes. Never blocks the request lifecycle.
 * Read operations used by /api/traces endpoint for coverage + analytics.
 */

const { query } = require('./index');

const ALL_PATHS = [
  'sendBrief:methodCheck', 'sendBrief:parseBody', 'sendBrief:honeypotCheck',
  'sendBrief:timingCheck', 'sendBrief:sanitizeAndValidateName',
  'sendBrief:validateEmail', 'sendBrief:validatePrompt',
  'sendBrief:rateLimit:ip', 'sendBrief:rateLimit:email',
  'sendBrief:configCheck', 'sendBrief:queueCheck',
  'sendContact:methodCheck', 'sendContact:parseBody', 'sendContact:honeypotCheck',
  'sendContact:timingCheck', 'sendContact:sanitizeAndValidateName',
  'sendContact:validateEmail', 'sendContact:validateMessage:empty',
  'sendContact:validateMessage:tooLong', 'sendContact:rateLimit:ip',
  'sendContact:rateLimit:email', 'sendContact:configCheck', 'sendContact:queueCheck',
];

async function _ensureTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS request_traces (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(64) NOT NULL,
        path_id VARCHAR(128) NOT NULL,
        endpoint VARCHAR(32) NOT NULL,
        stage VARCHAR(64) NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_request_traces_request_id ON request_traces(request_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_request_traces_timestamp ON request_traces(timestamp DESC)`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_request_traces_unique ON request_traces(request_id, path_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_request_traces_endpoint ON request_traces(endpoint)`);
  } catch {}
}

const _tableReady = _ensureTable();

async function saveTrace({ requestId, pathId, endpoint, stage, timestamp }) {
  if (!requestId || !pathId) return;
  try {
    await _tableReady;
    await query(`
      INSERT INTO request_traces (request_id, path_id, endpoint, stage, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (request_id, path_id) DO NOTHING
    `, [requestId, pathId, endpoint, stage, timestamp != null ? timestamp : Date.now()]);
  } catch (err) {
    // Non-blocking — silently ignore DB errors
  }
}

async function getTracesByRequestId(requestId) {
  if (!requestId) return [];
  try {
    const result = await query(
      'SELECT request_id, path_id, endpoint, stage, timestamp, created_at FROM request_traces WHERE request_id = $1 ORDER BY timestamp ASC',
      [requestId]
    );
    return result.rows.map(r => ({
      requestId: r.request_id,
      pathId: r.path_id,
      endpoint: r.endpoint,
      stage: r.stage,
      timestamp: r.timestamp,
      createdAt: r.created_at,
      source: 'neon',
    }));
  } catch {
    return [];
  }
}

async function getDistinctPathsSince(sinceMs) {
  try {
    const result = await query(
      'SELECT DISTINCT path_id FROM request_traces WHERE timestamp >= $1',
      [sinceMs]
    );
    return result.rows.map(r => r.path_id);
  } catch {
    return [];
  }
}

async function getAggregatedPaths(hoursBack = 24) {
  const since = Date.now() - hoursBack * 60 * 60 * 1000;
  try {
    const result = await query(`
      SELECT
        path_id,
        endpoint,
        COUNT(*)::int AS hit_count,
        MIN(timestamp) AS first_seen,
        MAX(timestamp) AS last_seen
      FROM request_traces
      WHERE timestamp >= $1
      GROUP BY path_id, endpoint
      ORDER BY path_id ASC
    `, [since]);
    return result.rows.map(r => ({
      pathId: r.path_id,
      endpoint: r.endpoint,
      hitCount: r.hit_count,
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
    }));
  } catch {
    return [];
  }
}

async function getTimeBucketStats(hoursBack = 24, bucketMinutes = 60) {
  const since = Date.now() - hoursBack * 60 * 60 * 1000;
  const bucketMs = bucketMinutes * 60 * 1000;
  try {
    const result = await query(`
      SELECT
        (timestamp / $1)::bigint * $1 AS bucket_start,
        COUNT(*)::int AS event_count,
        COUNT(DISTINCT path_id)::int AS distinct_paths
      FROM request_traces
      WHERE timestamp >= $2
      GROUP BY (timestamp / $1)::bigint * $1
      ORDER BY bucket_start ASC
    `, [bucketMs, since]);
    return result.rows.map(r => ({
      bucketStart: r.bucket_start,
      eventCount: r.event_count,
      distinctPaths: r.distinct_paths,
    }));
  } catch {
    return [];
  }
}

module.exports = {
  saveTrace,
  getTracesByRequestId,
  getDistinctPathsSince,
  getAggregatedPaths,
  getTimeBucketStats,
  ALL_PATHS,
};
