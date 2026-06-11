-- =============================================================
-- Migration 005: Narrow project status CHECK constraint
-- Runtime only allows: draft, preview, approved, deployed
-- Removes: processing, deploying, failed, cancelled
--
-- Legacy mapping:
--   processing → preview
--   deploying  → deployed
--   failed     → preview
--   cancelled  → preview
-- =============================================================

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

UPDATE projects SET status = 'preview'  WHERE status IN ('processing', 'failed', 'cancelled');
UPDATE projects SET status = 'deployed' WHERE status = 'deploying';

ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'preview', 'approved', 'deployed'));
