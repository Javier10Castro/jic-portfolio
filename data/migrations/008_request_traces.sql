-- Migration 008: request_traces table
-- Persistent storage for validation path trace events.
-- Enables cross-instance, cold-start-safe coverage computation.
-- Trace events are NON-blocking fire-and-forget — never await in request path.

CREATE TABLE IF NOT EXISTS request_traces (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  path_id VARCHAR(128) NOT NULL,
  endpoint VARCHAR(32) NOT NULL,
  stage VARCHAR(64) NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for per-request lookup (debugging)
CREATE INDEX IF NOT EXISTS idx_request_traces_request_id ON request_traces(request_id);

-- Index for time-range queries (coverage analytics)
CREATE INDEX IF NOT EXISTS idx_request_traces_timestamp ON request_traces(timestamp DESC);

-- Unique constraint prevents duplicate trace events per request+path
-- (a single request should only hit each validation path once)
CREATE UNIQUE INDEX IF NOT EXISTS idx_request_traces_unique ON request_traces(request_id, path_id);

-- Index for endpoint-scoped queries
CREATE INDEX IF NOT EXISTS idx_request_traces_endpoint ON request_traces(endpoint);
