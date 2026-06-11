-- =============================================================
-- Migration 004: Normalize execution status enum
-- Target: queued, processing, success, failed
-- Removed: completed, cancelled (unused)
-- =============================================================

ALTER TABLE executions DROP CONSTRAINT IF EXISTS executions_status_check;

UPDATE executions SET status = 'success' WHERE status = 'completed';
UPDATE executions SET status = 'failed' WHERE status = 'cancelled';

ALTER TABLE executions ADD CONSTRAINT executions_status_check
  CHECK (status IN ('queued', 'processing', 'success', 'failed'));
