const { query } = require('./index');

async function saveLog(entry) {
  const sql = `
    INSERT INTO request_logs (
      request_id, status, endpoint,
      received_at, queued_at, execution_started_at, execution_finished_at,
      queue_position, queue_depth, queue_wait_ms,
      execution_duration_ms, total_lifecycle_ms,
      payload_sanitized, error_reason,
      validation_stage, validation_field, validation_reason
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT (request_id) DO UPDATE SET
      status = EXCLUDED.status,
      execution_started_at = EXCLUDED.execution_started_at,
      execution_finished_at = EXCLUDED.execution_finished_at,
      queue_wait_ms = EXCLUDED.queue_wait_ms,
      execution_duration_ms = EXCLUDED.execution_duration_ms,
      total_lifecycle_ms = EXCLUDED.total_lifecycle_ms,
      error_reason = EXCLUDED.error_reason,
      validation_stage = EXCLUDED.validation_stage,
      validation_field = EXCLUDED.validation_field,
      validation_reason = EXCLUDED.validation_reason,
      updated_at = NOW()
  `;
  await query(sql, [
    entry.requestId || null,
    entry.status || 'queued',
    entry.endpoint || null,
    entry.receivedAt != null ? entry.receivedAt : null,
    entry.queuedAt != null ? entry.queuedAt : null,
    entry.executionStartedAt != null ? entry.executionStartedAt : null,
    entry.executionFinishedAt != null ? entry.executionFinishedAt : null,
    entry.queuePosition != null ? entry.queuePosition : null,
    entry.queueDepth != null ? entry.queueDepth : null,
    entry.queueWaitTimeMs != null ? entry.queueWaitTimeMs : null,
    entry.executionDurationMs != null ? entry.executionDurationMs : null,
    entry.totalLifecycleTimeMs != null ? entry.totalLifecycleTimeMs : null,
    entry.payloadSanitized || null,
    entry.errorReason || entry.reason || null,
    entry.validationStage || null,
    entry.validationField || null,
    entry.validationReason || null,
  ]);
}

async function getLog(requestId) {
  const sql = `SELECT * FROM request_logs WHERE request_id = $1`;
  const result = await query(sql, [requestId]);
  if (!result.rows.length) return null;
  return _rowToApi(result.rows[0]);
}

async function listLogs(limit = 20, offset = 0) {
  const cap = Math.min(Math.max(1, limit), 200);
  const off = Math.max(0, offset);
  const sql = `SELECT * FROM request_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
  const result = await query(sql, [cap, off]);
  return result.rows.map(_rowToApi);
}

async function getAggregateMetrics() {
  const sql = `
    SELECT
      COUNT(*)::int AS total_requests,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_requests,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_requests,
      COALESCE(AVG(execution_duration_ms) FILTER (WHERE status = 'completed'), 0)::int AS average_execution_time_ms,
      COALESCE(AVG(queue_wait_ms) FILTER (WHERE status = 'completed'), 0)::int AS average_queue_wait_time_ms
    FROM request_logs
  `;
  const result = await query(sql);
  const r = result.rows[0];
  return {
    totalRequests: r.total_requests,
    completedRequests: r.completed_requests,
    failedRequests: r.failed_requests,
    averageExecutionTimeMs: r.average_execution_time_ms,
    averageQueueWaitTimeMs: r.average_queue_wait_time_ms,
  };
}

function _rowToApi(row) {
  return {
    requestId: row.request_id,
    status: row.status,
    endpoint: row.endpoint,
    receivedAt: row.received_at,
    queuedAt: row.queued_at,
    executionStartedAt: row.execution_started_at,
    executionFinishedAt: row.execution_finished_at,
    queuePosition: row.queue_position,
    queueDepth: row.queue_depth,
    queueWaitTimeMs: row.queue_wait_ms,
    executionDurationMs: row.execution_duration_ms,
    totalLifecycleTimeMs: row.total_lifecycle_ms,
    payloadSanitized: row.payload_sanitized,
    errorReason: row.error_reason,
    validationStage: row.validation_stage,
    validationField: row.validation_field,
    validationReason: row.validation_reason,
    createdAt: row.created_at,
  };
}

module.exports = { saveLog, getLog, listLogs, getAggregateMetrics };
