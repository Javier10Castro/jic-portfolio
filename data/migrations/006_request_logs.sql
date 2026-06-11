CREATE TABLE IF NOT EXISTS request_logs (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  endpoint VARCHAR(64),
  received_at BIGINT,
  queued_at BIGINT,
  execution_started_at BIGINT,
  execution_finished_at BIGINT,
  queue_position INTEGER,
  queue_depth INTEGER,
  queue_wait_ms INTEGER,
  execution_duration_ms INTEGER,
  total_lifecycle_ms INTEGER,
  payload_sanitized TEXT,
  error_reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_status ON request_logs(status);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at DESC);
