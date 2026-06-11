-- =============================================================
-- SAAS SCHEMA v1 — Multi-Tenant Website Generation Platform
-- Migration 003: SaaS Multi-Tenant Schema
-- Engine: PostgreSQL 15+ (Neon)
-- =============================================================

BEGIN;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- MIGRATION TRACKING
-- =============================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON schema_migrations(name);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at);

-- =============================================================
-- TENANTS
-- =============================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(255) NOT NULL,
  slug                  VARCHAR(100) UNIQUE NOT NULL,
  plan                  VARCHAR(50) NOT NULL DEFAULT 'free',
  stripe_customer_id    VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status   VARCHAR(50) DEFAULT 'active',
  usage_storage_bytes   BIGINT DEFAULT 0,
  usage_projects_count  INT DEFAULT 0,
  usage_executions_count INT DEFAULT 0,
  settings              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe ON workspaces(stripe_customer_id);

-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  avatar_url      TEXT,
  password_hash   VARCHAR(255) NOT NULL,
  email_verified  BOOLEAN DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================================
-- WORKSPACE MEMBERS
-- =============================================================

CREATE TABLE IF NOT EXISTS workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          VARCHAR(20) NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by    UUID REFERENCES users(id),
  joined_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON workspace_members(user_id);

-- =============================================================
-- PROJECTS
-- =============================================================

CREATE TABLE IF NOT EXISTS projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by        UUID NOT NULL REFERENCES users(id),
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) NOT NULL,
  description       TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN (
                      'draft', 'processing', 'preview',
                      'approved', 'deploying', 'deployed',
                      'failed', 'cancelled'
                    )),
  project_type      VARCHAR(50) DEFAULT 'website',
  version           INT NOT NULL DEFAULT 1,
  current_preview_id UUID,
  live_url          TEXT,
  preview_url       TEXT,
  github_repo       TEXT,
  github_org        VARCHAR(255),
  vercel_project_id VARCHAR(255),
  vercel_team_id    VARCHAR(255),
  custom_domain     VARCHAR(255),
  design_system     JSONB,
  plan_ir           JSONB,
  prompt_maestro    TEXT,
  metadata          JSONB DEFAULT '{}',
  feedback          JSONB DEFAULT '[]',
  generated_at      TIMESTAMPTZ,
  deployed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);

-- =============================================================
-- PROJECT INPUTS
-- =============================================================

CREATE TABLE IF NOT EXISTS project_inputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section       VARCHAR(64) NOT NULL,
  field_key     VARCHAR(128) NOT NULL,
  value         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_inputs_project ON project_inputs(project_id);
CREATE INDEX IF NOT EXISTS idx_inputs_section ON project_inputs(project_id, section);

-- =============================================================
-- PROJECT STATES
-- =============================================================

CREATE TABLE IF NOT EXISTS project_states (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_status   VARCHAR(20),
  to_status     VARCHAR(20) NOT NULL,
  triggered_by  UUID REFERENCES users(id),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_states_project ON project_states(project_id);
CREATE INDEX IF NOT EXISTS idx_states_created ON project_states(project_id, created_at DESC);

-- =============================================================
-- PREVIEWS
-- =============================================================

CREATE TABLE IF NOT EXISTS previews (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version                 INT NOT NULL,
  html_content            TEXT,
  css_content             TEXT,
  design_system_snapshot  JSONB,
  plan_ir_snapshot        JSONB,
  decision_score          DECIMAL(5,2),
  decision_id             UUID,
  is_approved             BOOLEAN DEFAULT FALSE,
  approved_by             UUID REFERENCES users(id),
  approved_at             TIMESTAMPTZ,
  is_current              BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_previews_project ON previews(project_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_previews_current ON previews(project_id) WHERE is_current = TRUE;

-- =============================================================
-- DEPLOYMENTS
-- =============================================================

CREATE TABLE IF NOT EXISTS deployments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version               INT NOT NULL,
  preview_id            UUID REFERENCES previews(id),
  environment           VARCHAR(20) NOT NULL DEFAULT 'preview'
                        CHECK (environment IN ('preview', 'production')),
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'deploying', 'deployed', 'failed', 'rolled_back')),
  github_commit_sha     VARCHAR(64),
  github_branch         VARCHAR(255) NOT NULL DEFAULT 'main',
  github_repo_url       TEXT,
  vercel_deployment_id  VARCHAR(255),
  vercel_url            TEXT,
  vercel_alias          VARCHAR(255),
  trigger_type          VARCHAR(20) DEFAULT 'manual'
                        CHECK (trigger_type IN ('auto', 'manual', 'rollback', 'redeploy')),
  initiated_by          UUID REFERENCES users(id),
  metadata              JSONB DEFAULT '{}',
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  rolled_back_to        UUID REFERENCES deployments(id)
);

CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id, environment);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);

-- =============================================================
-- EXECUTIONS
-- =============================================================

CREATE TABLE IF NOT EXISTS executions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id    VARCHAR(64) NOT NULL,
  input_type    VARCHAR(30) NOT NULL
                CHECK (input_type IN ('raw_email', 'structured_prompt', 'json_brief')),
  pipeline      TEXT[] NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'processing'
                CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  steps         JSONB,
  errors        JSONB DEFAULT '[]',
  duration_ms   INT,
  triggered_by  UUID REFERENCES users(id),
  queue_job_id  VARCHAR(255),
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_executions_project ON executions(project_id);
CREATE INDEX IF NOT EXISTS idx_executions_session ON executions(session_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

-- =============================================================
-- DECISIONS
-- =============================================================

CREATE TABLE IF NOT EXISTS decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  execution_id    UUID REFERENCES executions(id),
  decision_type   VARCHAR(30) NOT NULL
                  CHECK (decision_type IN ('validation', 'scoring', 'critic', 'regeneration', 'approval')),
  score           DECIMAL(5,2),
  metrics         JSONB NOT NULL DEFAULT '{}',
  warnings        JSONB DEFAULT '[]',
  passed          BOOLEAN DEFAULT TRUE,
  feedback        TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_execution ON decisions(execution_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);

-- =============================================================
-- ARTIFACTS
-- =============================================================

CREATE TABLE IF NOT EXISTS artifacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  execution_id  UUID REFERENCES executions(id),
  file_path     TEXT NOT NULL,
  file_size     INT,
  checksum      VARCHAR(64),
  content_type  VARCHAR(100),
  storage_url   TEXT,
  storage_key   TEXT,
  is_directory  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_project ON artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_execution ON artifacts(execution_id);

-- =============================================================
-- WEBHOOK EVENTS
-- =============================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        VARCHAR(50) NOT NULL,
  event_type    VARCHAR(100) NOT NULL,
  payload       JSONB NOT NULL,
  status        VARCHAR(20) DEFAULT 'received'
                CHECK (status IN ('received', 'processed', 'failed')),
  deployment_id UUID REFERENCES deployments(id),
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_source ON webhook_events(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_deployment ON webhook_events(deployment_id);

-- =============================================================
-- API KEYS
-- =============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES users(id),
  name          VARCHAR(255) NOT NULL,
  key_prefix    VARCHAR(10) NOT NULL,
  key_hash      VARCHAR(255) NOT NULL,
  permissions   JSONB DEFAULT '["read"]',
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workspaces_updated ON workspaces;
CREATE TRIGGER trg_workspaces_updated
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION log_project_state_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_states (project_id, from_status, to_status, triggered_by, metadata)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      current_setting('app.current_user_id')::UUID,
      jsonb_build_object('auto', TG_OP = 'UPDATE' AND NEW.status IN ('processing', 'deploying'))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_state_change ON projects;
CREATE TRIGGER trg_projects_state_change
  AFTER UPDATE OF status ON projects
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_project_state_change();

CREATE OR REPLACE FUNCTION enforce_workspace_limits()
RETURNS TRIGGER AS $$
DECLARE
  ws_plan VARCHAR(50);
  project_count INT;
  max_projects INT;
BEGIN
  SELECT plan INTO ws_plan FROM workspaces WHERE id = NEW.workspace_id;
  max_projects := CASE
    WHEN ws_plan = 'free' THEN 3
    WHEN ws_plan = 'starter' THEN 15
    WHEN ws_plan = 'pro' THEN 50
    ELSE 999999
  END;
  SELECT COUNT(*) INTO project_count FROM projects WHERE workspace_id = NEW.workspace_id;
  IF project_count >= max_projects THEN
    RAISE EXCEPTION 'Workspace project limit reached (%)', max_projects
      USING HINT = 'Upgrade your plan to create more projects';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_project_limit ON projects;
CREATE TRIGGER trg_enforce_project_limit
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION enforce_workspace_limits();

COMMIT;
