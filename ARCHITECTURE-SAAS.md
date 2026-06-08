# SaaS Architecture — Multi-Tenant Website Generation Platform

## Version
v1.6.0 — SaaS Evolution

## Status
Design Document — Not Yet Implemented

---

## Table of Contents

A. [FULL ARCHITECTURE DIAGRAM (text-based)](#a-full-architecture-diagram)
B. [MULTI-TENANT ISOLATION STRATEGY](#b-multi-tenant-isolation-strategy)
C. [SYSTEM ARCHITECTURE LAYERS](#c-system-architecture-layers)
D. [DATABASE SCHEMA (PostgreSQL)](#d-database-schema)
E. [PROJECT LIFECYCLE](#e-project-lifecycle)
F. [GITHUB + VERCEL INTEGRATION](#f-github--vercel-integration)
G. [PREVIEW SYSTEM](#g-preview-system)
H. [DECISION LAYER (AI GOVERNANCE)](#h-decision-layer-ai-governance)
I. [FILE SYSTEM STRATEGY](#i-file-system-strategy)
J. [SCALABILITY MODEL](#j-scalability-model)
K. [RISKS + LIMITATIONS](#k-risks--limitations)

---

## A. FULL ARCHITECTURE DIAGRAM

```
                                  ┌─────────────────────────────────────────────────────────────────┐
                                  │                     CLOUD FLARE / DNS                           │
                                  │          custom-domain.com → Vercel Edge                       │
                                  └─────────────────────────────────────────────────────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
                    ▼                               ▼                               ▼
        ┌───────────────────┐           ┌───────────────────────┐       ┌─────────────────────┐
        │   BROWSER (User)  │           │   BROWSER (Admin)     │       │   BROWSER (Preview)  │
        │                   │           │                       │       │                      │
        │  /app/*           │           │  /dashboard/*         │       │  preview-{id}.vercel │
        │  /brief-maestro   │           │  /admin/*             │       │  .app                │
        └────────┬──────────┘           └──────────┬────────────┘       └─────────────────────┘
                 │                                  │
                 ▼                                  ▼
        ┌─────────────────────────────────────────────────────────────────────────────────────┐
        │                                                                                     │
        │                    VERCEL EDGE NETWORK (CDN + Edge Functions)                        │
        │                                                                                     │
        │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
        │  │   Static Assets  │  │   SSR Pages     │  │  API Routes     │  │ WebSocket     │  │
        │  │   (CSS, JS, img) │  │   (Next.js)     │  │  (/api/*)       │  │ (preview live)│  │
        │  └─────────────────┘  └─────────────────┘  └────────┬────────┘  └───────────────┘  │
        │                                                      │                              │
        └──────────────────────────────────────────────────────┼──────────────────────────────┘
                                                               │
                 ┌─────────────────────────────────────────────┼─────────────────────────────┐
                 │                                             │                             │
                 ▼                                             ▼                             ▼
      ┌────────────────────────────┐               ┌──────────────────────┐      ┌──────────────────────┐
      │     APPLICATION LAYER      │               │    AI ENGINE LAYER   │      │   EXTERNAL SERVICES  │
      │                            │               │                      │      │                      │
      │  ┌──────────────────────┐  │               │  ┌────────────────┐  │      │  ┌────────────────┐  │
      │  │ Auth (NextAuth)      │  │               │  │ Compiler v1     │  │      │  │ GitHub API v3  │  │
      │  │ Multi-tenant RBAC    │  │               │  │ (normalizer)    │  │      │  │ (repo creation) │  │
      │  └──────────────────────┘  │               │  └────────────────┘  │      │  └────────────────┘  │
      │  ┌──────────────────────┐  │               │  ┌────────────────┐  │      │  ┌────────────────┐  │
      │  │ Workspace Manager    │  │               │  │ Plan Engine v1  │  │      │  │ Vercel API     │  │
      │  │ (CRUD + invites)     │  │               │  │ (semantic IR)   │  │      │  │ (deploy trigger)│  │
      │  └──────────────────────┘  │               │  └────────────────┘  │      │  └────────────────┘  │
      │  ┌──────────────────────┐  │               │  ┌────────────────┐  │      │  ┌────────────────┐  │
      │  │ Project Manager      │  │               │  │ Design System  │  │      │  │ Stripe API     │  │
      │  │ (status + lifecycle) │  │               │  │ Engine v1      │  │      │  │ (billing)     │  │
      │  └──────────────────────┘  │               │  └────────────────┘  │      │  └────────────────┘  │
      │  ┌──────────────────────┐  │               │  ┌────────────────┐  │      │  ┌────────────────┐  │
      │  │ Deployment Manager   │  │               │  │ Preview Engine │  │      │  │ Resend/SendGrid│  │
      │  │ (Vercel connector)   │  │               │  │ v1 (simulation) │  │      │  │ (email)        │  │
      │  └──────────────────────┘  │               │  └────────────────┘  │      │  └────────────────┘  │
      │  ┌──────────────────────┐  │               │  ┌────────────────┐  │      │  ┌────────────────┐  │
      │  │ Billing/Subscription │  │               │  │ Scaffold v1    │  │      │  │ Vercel Blob    │  │
      │  │ (Stripe integration) │  │               │  │ (generation)   │  │      │  │ (artifact store)│  │
      │  └──────────────────────┘  │               │  └────────────────┘  │      │  └────────────────┘  │
      │  ┌──────────────────────┐  │               │  ┌────────────────┐  │      │  ┌────────────────┐  │
      │  │ Webhook Receiver     │  │               │  │ Decision Layer │  │      │  │ Redis (Upstash)│  │
      │  │ (Vercel/GitHub)      │  │               │  │ v1 (scoring)   │  │      │  │ (cache + queue)│  │
      │  └──────────────────────┘  │               │  └────────────────┘  │      │  └────────────────┘  │
      │  ┌──────────────────────┐  │               │  ┌────────────────┐  │      │                      │
      │  │ Orchestrator v1      │  │               │  │ Deployment v1  │  │      │                      │
      │  │ (pipeline controller)│  │               │  │ (Git/GitHub)   │  │      │                      │
      │  └──────────────────────┘  │               │  └────────────────┘  │      │                      │
      │  ┌──────────────────────┐  │               │                      │      │                      │
      │  │ Rate Limiter + Guard │  │               │  (Async via Queue)   │      │                      │
      │  └──────────────────────┘  │               │                      │      │                      │
      └──────────────┬─────────────┘               └──────────────────────┘      └──────────────────────┘
                     │                                          │
                     ▼                                          ▼
      ┌────────────────────────────────────────────────────────────────────────────────────────────┐
      │                                                                                            │
      │                              DATA LAYER (PERSISTENCE)                                       │
      │                                                                                            │
      │  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
      │  │                     PostgreSQL (Neon — Serverless PostgreSQL)                          │  │
      │  │                                                                                      │  │
      │  │  workspaces ──1:N── members ──N:1── users                                            │  │
      │  │       │                                                                              │  │
      │  │       └──1:N── projects ──1:N── project_inputs                                       │  │
      │  │                    │──1:N── project_states                                           │  │
      │  │                    │──1:N── previews (versioned)                                     │  │
      │  │                    │──1:N── deployments (env-scoped)                                  │  │
      │  │                    │──1:N── executions (AI pipeline)                                 │  │
      │  │                    │──1:N── decisions (AI scoring)                                   │  │
      │  │                    │──1:N── artifacts (file metadata)                                │  │
      │  └──────────────────────────────────────────────────────────────────────────────────────┘  │
      │                                                                                            │
      │  ┌──────────────────────────────────┐  ┌────────────────────────────────────────────────┐  │
      │  │   Redis (Upstash — Serverless)    │  │   Vercel Blob Storage                         │  │
      │  │                                    │  │                                                │  │
      │  │  • Session cache                   │  │  • Preview HTML snapshots                     │  │
      │  │  • Job queue (Bull)                │  │  • Generated project archives (.zip)          │  │
      │  │  • Rate limiter counters           │  │  • Temporary build artifacts (24h TTL)        │  │
      │  │  • Design system token cache       │  │  • User uploads (images, logos)               │  │
      │  │  • Preview HTML cache (TTL)        │  │  • Deployment artifacts                       │  │
      │  └──────────────────────────────────┘  └────────────────────────────────────────────────┘  │
      │                                                                                            │
      └────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Flow (Detailed)

```
USER (Browser)
   │
   ├── 1. Creates account → POST /api/auth/register
   │        → Creates user + personal workspace
   │
   ├── 2. Creates project → POST /api/projects
   │        → Status: DRAFT
   │        → Generates project_id = proj_{uuid}
   │
   ├── 3. Submits form data → PUT /api/projects/:id/inputs
   │        → Saves to project_inputs table
   │        → Updates project.updated_at
   │
   ├── 4. Triggers AI generation → POST /api/projects/:id/generate
   │        → Status: PROCESSING
   │        → Creates execution record (exec_{uuid})
   │
   │        PIPELINE (async via Bull queue):
   │        │
   │        ├── 4a. SAVE FORM → lib/db/formResponses.js
   │        │       → Persists all inputs to form_responses
   │        │
   │        ├── 4b. ORCHESTRATOR → lib/orchestrator/index.js
   │        │       → detectType(input) → buildPipeline(type)
   │        │
   │        ├── 4c. PLAN ENGINE → lib/plan/index.js
   │        │       → Semantic IR JSON
   │        │       → Stores in projects.plan_ir (JSONB)
   │        │
   │        ├── 4d. DESIGN SYSTEM → lib/design-system/index.js
   │        │       → CSS variables + tokens + theme
   │        │       → Stores in projects.design_system (JSONB)
   │        │
   │        ├── 4e. DECISION LAYER → lib/preview/index.js (+ scoring)
   │        │       → Generates visual preview
   │        │       → Evaluates: contrast, UX, conversion, clarity, SEO
   │        │       → Score: 0-100
   │        │       → If score < 50: auto-regenerate (back to 4c)
   │        │       → Stores in decisions table
   │        │
   │        ├── 4f. PREVIEW → Status: PREVIEW
   │        │       → Saves HTML + CSS to previews table
   │        │       → Stores snapshot of plan_ir + design_system
   │        │       → Generates preview URL
   │        │       → Notifies user via WebSocket
   │        │
   │        └── [USER APPROVES] → POST /api/projects/:id/approve
   │                 │
   │                 ├── 5. SCAFFOLD ENGINE → lib/scaffold/index.js
   │                 │       → Generates project files on disk
   │                 │       → Creates artifact records
   │                 │       → Status: DEPLOYING
   │                 │
   │                 ├── 6. DEPLOYMENT ENGINE → lib/deployment/index.js
   │                 │       → git init → git add → git commit
   │                 │       → GitHub API: creates repo
   │                 │       → git push origin main
   │                 │       → Vercel API: triggers deployment
   │                 │       → Records in deployments table
   │                 │
   │                 └── 7. DEPLOYED → Status: DEPLOYED
   │                         → Sets live_url, github_repo
   │                         → Notifies user
   │                         → Creates project_states entry
   │
   └── [USER REJECTS] → POST /api/projects/:id/reject
           → Status: DRAFT
           → Feedback stored in decisions table
           → User edits inputs and re-triggers
```

---

## B. MULTI-TENANT ISOLATION STRATEGY

### Tenant Model

```
Workspace (ROOT TENANT)
    │
    ├── plan: 'free' | 'starter' | 'pro' | 'enterprise'
    ├── slug: unique identifier (used in subdomains)
    │
    ├── MEMBERS (workspace_members)
    │   ├── role: 'owner' (billing, delete, manage members)
    │   ├── role: 'admin' (all project operations, manage members)
    │   ├── role: 'member' (create/edit own projects)
    │   └── role: 'viewer' (read-only access)
    │
    └── PROJECTS (projects)
        └── All child data scoped via workspace_id FKEY
```

### Isolation Strategies (by tier)

| Tier | Isolation Method | Max Projects | Max Members | Storage |
|---|---|---|---|---|
| Free | RLS only | 3 | 1 | 50 MB |
| Starter | RLS + schema prefix | 15 | 5 | 500 MB |
| Pro | RLS + schema prefix + dedicated connection | 50 | 20 | 5 GB |
| Enterprise | Dedicated database instance | Unlimited | Unlimited | Unlimited |

### Row-Level Security (RLS) Policy

```sql
-- Applied to every tenant-scoped table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_projects ON projects
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = current_setting('app.current_user_id')::UUID
  ));
```

### Workspace Slug Isolation

- Workspace slug is used for subdomain routing: `{slug}.app.domain.com`
- API uses `X-Workspace-Slug` header for middleware resolution
- Every API request resolves user → memberships → allowed workspace_ids
- Middleware injects `req.workspaceIds` into request context

### Data Scope Per Entity

| Entity | Scoped By | Notes |
|---|---|---|
| User | `users.id` | Global identity, no tenant scope |
| Workspace | `workspaces.id` | Top-level tenant root |
| Project | `workspace_id` | All operations filtered by workspace |
| Input | `project_id` → `workspace_id` | Inherited scope |
| State | `project_id` → `workspace_id` | Inherited scope |
| Preview | `project_id` → `workspace_id` | Preview URL includes workspace slug |
| Deployment | `project_id` → `workspace_id` | GitHub org can be workspace-specific |
| Execution | `project_id` → `workspace_id` | AI pipeline logs are tenant-private |
| Decision | `project_id` → `workspace_id` | AI scores scoped per project |
| Artifact | `project_id` → `workspace_id` | Storage path: `/{workspace}/{project}/{file}` |

### Billing Plan Enforcement

```sql
-- Check plan limits before project creation
CREATE FUNCTION check_project_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM projects WHERE workspace_id = NEW.workspace_id
  ) >= (
    SELECT CASE
      WHEN plan = 'free' THEN 3
      WHEN plan = 'starter' THEN 15
      WHEN plan = 'pro' THEN 50
      ELSE 999999
    END FROM workspaces WHERE id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Project limit reached for workspace plan';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## C. SYSTEM ARCHITECTURE LAYERS

### C.1 Frontend Layer

```
/app (Next.js 14 — App Router)
├── /app
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx           ← Workspace switcher + sidebar
│   │   ├── page.tsx             ← Project list (main dashboard)
│   │   ├── settings/
│   │   │   ├── workspace/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── members/page.tsx
│   │   └── projects/
│   │       ├── [id]/
│   │       │   ├── page.tsx     ← Project detail
│   │       │   ├── brief/page.tsx   ← Brief Maestro editor
│   │       │   ├── preview/page.tsx ← Live preview
│   │       │   └── deploy/page.tsx  ← Deployment config
│   │       └── new/page.tsx     ← Create project wizard
│   │
│   └── preview/
│       └── [previewId]/page.tsx ← Public preview (no auth)
│
├── /components
│   ├── ui/                      ← Design system components
│   ├── forms/                   ← Brief Maestro form components
│   ├── preview/                 ← Live preview iframe + controls
│   └── dashboard/               ← Dashboard widgets
│
├── /lib
│   ├── api-client.ts            ← Typed API client
│   ├── auth.ts                  ← NextAuth config
│   └── workspace.ts            ← Workspace context helpers
```

### C.2 API Layer (Vercel Functions)

```
/api (Node.js — Serverless Functions)
├── /auth
│   ├── register.js       ← POST: create user + workspace
│   ├── login.js          ← POST: session creation
│   ├── session.js        ← GET: validate + return user
│   └── webhook.js        ← POST: Stripe billing events
│
├── /workspaces
│   ├── [id].js           ← GET/PUT: workspace detail
│   ├── [id]/members.js   ← GET/POST/DELETE: member management
│   └── [id]/billing.js   ← GET: plan + usage info
│
├── /projects
│   ├── index.js           ← GET: list (paginated), POST: create
│   ├── [id].js            ← GET/PUT/DELETE: project CRUD
│   ├── [id]/inputs.js     ← GET/PUT: form inputs
│   ├── [id]/states.js     ← GET: state history
│   ├── [id]/generate.js   ← POST: trigger AI pipeline
│   ├── [id]/approve.js    ← POST: approve preview → scaffold
│   ├── [id]/reject.js     ← POST: reject → feedback
│   ├── [id]/previews.js   ← GET: list preview versions
│   └── [id]/deployments.js ← GET/POST: deployment management
│
├── /previews
│   ├── [id].js            ← GET: preview HTML + CSS
│   └── [id]/approve.js    ← POST: approve from preview link
│
├── /deployments
│   ├── [id].js            ← GET: deployment detail
│   ├── [id]/redeploy.js   ← POST: trigger redeploy
│   └── [id]/rollback.js   ← POST: rollback to version
│
├── /executions
│   └── [id].js            ← GET: pipeline execution detail
│
├── /admin
│   ├── stats.js           ← GET: platform-wide metrics
│   └── users.js           ← GET: user management
│
└── /webhooks
    ├── vercel.js          ← POST: deployment status updates
    └── github.js          ← POST: push/PR events
```

### C.3 AI Engine Layer (Existing + Extended)

```
/lib (Existing engines — unchanged, extended via orchestration)
├── compiler/index.js       ← Unified Brief Compiler v1
├── plan/index.js           ← Plan Engine v1 (semantic IR)
├── design-system/index.js  ← Design System Engine v1 (tokens + CSS)
├── preview/index.js        ← Visual Preview Engine v1 (simulation)
├── scaffold/index.js       ← Scaffold Engine v1 (filesystem)
├── deployment/index.js     ← Deployment Engine v1 (Git/GitHub)
├── decision/index.js       ← Decision Layer v1 (logging)
├── orchestrator/index.js   ← Orchestrator Engine v1 (pipeline)
├── loader/index.js         ← Project Loader Engine v1 (read-only)
│
├── (NEW) scoring/index.js  ← Decision Scoring Engine v2
│       → evaluate(plan_ir, design_system, preview)
│       → Returns { score, metrics, warnings, passed }
│       → Scoring dimensions: contrast, ux, conversion, clarity, seo
│
├── (NEW) queue/index.js    ← Job Queue Adapter
│       → enqueue(jobType, payload)
│       → onComplete(jobType, callback)
│       → Abstracts Bull/Redis behind interface
│
├── (NEW) storage/index.js  ← Blob Storage Adapter
│       → upload(key, buffer, contentType)
│       → getDownloadUrl(key, ttl)
│       → Abstracts Vercel Blob / S3 behind interface
│
├── (NEW) billing/index.js  ← Billing Adapter
│       → checkLimit(workspaceId, resource)
│       → incrementUsage(workspaceId, resource)
│       → Abstracts Stripe / LemonSqueezy
│
└── (NEW) auth/index.js     ← Auth + RBAC helper
        → validateSession(token) → { user, workspaceIds }
        → checkRole(workspaceId, userId, requiredRole)
        → Abstracts NextAuth / JWT
```

### C.4 External Service Integrations

| Service | Integration Point | Purpose |
|---|---|---|
| GitHub API v3 | `lib/deployment/index.js` | Create repos, push code |
| Vercel API | `lib/deployment/vercel.js` (NEW) | Trigger deployments, get URLs |
| Stripe | `lib/billing/index.js` (NEW) | Subscriptions, usage metering |
| Resend / SendGrid | `api/sendBrief.js`, `api/sendContact.js` | Transactional email (replacing Gmail SMTP) |
| Upstash Redis | `lib/queue/index.js` + `lib/cache/index.js` (NEW) | Job queue, rate limiting, cache |
| Vercel Blob | `lib/storage/index.js` (NEW) | Preview artifacts, project archives |
| Neon PostgreSQL | `lib/db/index.js` | Primary data store |
| OpenAI / Claude API | (Future) `lib/ai-assist/` | AI copywriting, content generation |

---

## D. DATABASE SCHEMA

```sql
-- =============================================================
-- SAAS SCHEMA v1 — Multi-Tenant Website Generation Platform
-- Engine: PostgreSQL 15+ (Neon)
-- =============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TENANTS
-- =============================================================

CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  plan          VARCHAR(50) NOT NULL DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'active',
  usage_storage_bytes BIGINT DEFAULT 0,
  usage_projects_count INT DEFAULT 0,
  usage_executions_count INT DEFAULT 0,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_stripe ON workspaces(stripe_customer_id);

-- =============================================================
-- USERS (global identity — not tenant-scoped)
-- =============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- =============================================================
-- WORKSPACE MEMBERS (tenant bridge + RBAC)
-- =============================================================

CREATE TABLE workspace_members (
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

CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_members_user ON workspace_members(user_id);

-- =============================================================
-- PROJECTS (core entity — tenant-scoped)
-- =============================================================

CREATE TABLE projects (
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
  current_preview_id UUID,          -- FK to previews, set after LOOP complete
  live_url          TEXT,
  preview_url       TEXT,
  github_repo       TEXT,
  github_org        VARCHAR(255),
  vercel_project_id VARCHAR(255),
  vercel_team_id    VARCHAR(255),
  custom_domain     VARCHAR(255),
  design_system     JSONB,          -- Full DS output (CSS vars + tokens + mapping)
  plan_ir           JSONB,          -- Full Plan Engine output
  prompt_maestro    TEXT,           -- Original prompt text
  metadata          JSONB DEFAULT '{}',
  feedback          JSONB DEFAULT '[]', -- User rejection feedback array
  generated_at      TIMESTAMPTZ,
  deployed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);

-- =============================================================
-- PROJECT INPUTS (form responses — structured)
-- =============================================================

CREATE TABLE project_inputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section       VARCHAR(64) NOT NULL,
  field_key     VARCHAR(128) NOT NULL,
  value         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, field_key)
);

CREATE INDEX idx_inputs_project ON project_inputs(project_id);
CREATE INDEX idx_inputs_section ON project_inputs(project_id, section);

-- =============================================================
-- PROJECT STATES (state machine history)
-- =============================================================

CREATE TABLE project_states (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_status   VARCHAR(20),
  to_status     VARCHAR(20) NOT NULL,
  triggered_by  UUID REFERENCES users(id),
  metadata      JSONB DEFAULT '{}',  -- { reason, auto: true, score: 85 }
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_states_project ON project_states(project_id);
CREATE INDEX idx_states_created ON project_states(project_id, created_at DESC);

-- =============================================================
-- PREVIEWS (versioned HTML + CSS snapshots)
-- =============================================================

CREATE TABLE previews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version               INT NOT NULL,
  html_content          TEXT,
  css_content           TEXT,
  design_system_snapshot JSONB,
  plan_ir_snapshot      JSONB,
  decision_score        DECIMAL(5,2),  -- 0.00 - 100.00
  decision_id           UUID,          -- FK to decisions table
  is_approved           BOOLEAN DEFAULT FALSE,
  approved_by           UUID REFERENCES users(id),
  approved_at           TIMESTAMPTZ,
  is_current            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, version)
);

CREATE INDEX idx_previews_project ON previews(project_id, version DESC);
CREATE INDEX idx_previews_current ON previews(project_id) WHERE is_current = TRUE;

-- =============================================================
-- DEPLOYMENTS (environment-scoped)
-- =============================================================

CREATE TABLE deployments (
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

CREATE INDEX idx_deployments_project ON deployments(project_id, environment);
CREATE INDEX idx_deployments_status ON deployments(status);

-- =============================================================
-- EXECUTIONS (AI pipeline logs)
-- =============================================================

CREATE TABLE executions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id    VARCHAR(64) NOT NULL,
  input_type    VARCHAR(30) NOT NULL
                CHECK (input_type IN ('raw_email', 'structured_prompt', 'json_brief')),
  pipeline      TEXT[] NOT NULL,       -- ['plan', 'design_system', 'preview', 'decision']
  status        VARCHAR(20) NOT NULL DEFAULT 'processing'
                CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  steps         JSONB,                -- [{ name, status, duration_ms, result_summary }]
  errors        JSONB DEFAULT '[]',
  duration_ms   INT,
  triggered_by  UUID REFERENCES users(id),
  queue_job_id  VARCHAR(255),
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_executions_project ON executions(project_id);
CREATE INDEX idx_executions_session ON executions(session_id);
CREATE INDEX idx_executions_status ON executions(status);

-- =============================================================
-- DECISIONS (AI governance + scoring)
-- =============================================================

CREATE TABLE decisions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  execution_id  UUID REFERENCES executions(id),
  decision_type VARCHAR(30) NOT NULL
                CHECK (decision_type IN ('validation', 'scoring', 'critic', 'regeneration', 'approval')),
  score         DECIMAL(5,2),         -- 0.00 - 100.00 (overall)
  metrics       JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "contrast": { "score": 85, "weight": 0.25, "details": {...} },
  --   "ux":       { "score": 72, "weight": 0.25, "details": {...} },
  --   "conversion": { "score": 68, "weight": 0.20, "details": {...} },
  --   "clarity":  { "score": 90, "weight": 0.15, "details": {...} },
  --   "seo":      { "score": 75, "weight": 0.15, "details": {...} }
  -- }
  warnings      JSONB DEFAULT '[]',
  passed        BOOLEAN DEFAULT TRUE,
  feedback      TEXT,                 -- Human-readable summary of the evaluation
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_project ON decisions(project_id);
CREATE INDEX idx_decisions_execution ON decisions(execution_id);
CREATE INDEX idx_decisions_type ON decisions(decision_type);

-- =============================================================
-- ARTIFACTS (generated file metadata)
-- =============================================================

CREATE TABLE artifacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  execution_id  UUID REFERENCES executions(id),
  file_path     TEXT NOT NULL,
  file_size     INT,                  -- bytes
  checksum      VARCHAR(64),         -- SHA-256
  content_type  VARCHAR(100),
  storage_url   TEXT,                -- Vercel Blob URL
  storage_key   TEXT,                -- Internal storage key
  is_directory  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_artifacts_execution ON artifacts(execution_id);

-- =============================================================
-- FORM RESPONSES (legacy compatibility — from v1.4.0)
-- =============================================================

CREATE TABLE form_responses (
  id            SERIAL PRIMARY KEY,
  project_id    VARCHAR(64) NOT NULL,
  section       VARCHAR(64) NOT NULL,
  field_key     VARCHAR(128) NOT NULL,
  value         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_responses_project ON form_responses(project_id);
CREATE INDEX idx_form_responses_section ON form_responses(project_id, section);

-- =============================================================
-- WEBHOOK EVENTS (audit log for external service callbacks)
-- =============================================================

CREATE TABLE webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        VARCHAR(50) NOT NULL,  -- 'vercel', 'github', 'stripe'
  event_type    VARCHAR(100) NOT NULL,
  payload       JSONB NOT NULL,
  status        VARCHAR(20) DEFAULT 'received'
                CHECK (status IN ('received', 'processed', 'failed')),
  deployment_id UUID REFERENCES deployments(id),
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_source ON webhook_events(source, created_at DESC);
CREATE INDEX idx_webhooks_deployment ON webhook_events(deployment_id);

-- =============================================================
-- API KEYS (programmatic access)
-- =============================================================

CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES users(id),
  name          VARCHAR(255) NOT NULL,
  key_prefix    VARCHAR(10) NOT NULL, -- e.g., 'jic_abc...'
  key_hash      VARCHAR(255) NOT NULL, -- bcrypt hash of full key
  permissions   JSONB DEFAULT '["read"]',
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- Auto-update updated_at on workspace changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workspaces_updated
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create project_states entry on status change
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

CREATE TRIGGER trg_projects_state_change
  AFTER UPDATE OF status ON projects
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_project_state_change();

-- Enforce workspace plan limits
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

CREATE TRIGGER trg_enforce_project_limit
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION enforce_workspace_limits();
```

---

## E. PROJECT LIFECYCLE

### E.1 State Machine

```
                         ┌──────────┐
                         │   DRAFT  │ ◄──────────┐
                         └────┬─────┘            │
                              │ User clicks      │
                              │ "Generate"       │
                              ▼                  │
                      ┌───────────────┐          │
                      │  PROCESSING   │          │
                      │ (AI pipeline) │          │
                      └───────┬───────┘          │
                              │                  │
                     ┌────────┴────────┐         │
                     ▼                 ▼         │
              ┌──────────┐     ┌──────────┐      │
              │ PREVIEW  │     │  FAILED  │──────┤
              │ (score + │     │ (errors) │      │
              │  review) │     └──────────┘      │
              └─────┬────┘                       │
                    │                             │
           ┌────────┴────────┐                   │
           ▼                 ▼                   │
    ┌──────────┐     ┌──────────┐               │
    │ APPROVED │     │ REJECTED │───────────────┘
    │ (passes) │     │(feedback)│
    └─────┬────┘     └──────────┘
          │
          ▼
    ┌───────────┐
    │ DEPLOYING │──► GitHub repo + Vercel deploy
    └─────┬─────┘
          │
   ┌──────┴──────┐
   ▼             ▼
┌────────┐ ┌──────────┐
│DEPLOYED│ │  FAILED  │──► DRAFT
│ (live) │ └──────────┘
└───┬────┘
    │
    ├── Redeploy → DEPLOYING
    ├── Rollback → DEPLOYING (prev version)
    └── New version → DRAFT (clone inputs)
```

### E.2 Status Transitions

| From | To | Trigger | Conditions |
|---|---|---|---|
| DRAFT | PROCESSING | `POST /generate` | All required inputs present |
| PROCESSING | PREVIEW | AI pipeline completes | Score >= 50 |
| PROCESSING | FAILED | AI pipeline error | Error in any step |
| PREVIEW | APPROVED | `POST /approve` | Score >= 70 OR manual approval |
| PREVIEW | REJECTED | `POST /reject` | With feedback |
| REJECTED | DRAFT | Auto | Clears generation data |
| FAILED | DRAFT | Auto | Clears error state |
| APPROVED | DEPLOYING | `POST /deploy` | Scaffold completes |
| DEPLOYING | DEPLOYED | Vercel webhook | GitHub push + Vercel deploy success |
| DEPLOYING | FAILED | Vercel webhook error | Deployment failure |
| DEPLOYED | DEPLOYING | `POST /redeploy` or `POST /rollback` | Valid version specified |

### E.3 Versioning Model

```
projects.version (INT)
  │
  ├── version 1: Initial generation
  ├── version 2+: New generation iterations
  │
  previews.version (per project)
  ├── Each AI run creates a new preview version
  ├── is_current flag marks the active preview
  ├── Max 10 preview versions stored (older versions auto-clean)
  │
  deployments.version (per project, per environment)
  ├── Deployments track which preview version they originated from
  ├── production deployments always increment the project version
  ├── preview deployments use the same version number
  │
  Rollback:
  ├── `POST /deployments/:id/rollback`
  ├── Creates new deployment with rolled_back_to = previous deployment.id
  ├── Triggers: git checkout <commit> → git push --force → Vercel deploy
  ├── Previous deployment remains in DB (audit trail)
```

### E.4 Rollback Strategy

```sql
-- Rollback creates a new deployment record pointing to the old version
INSERT INTO deployments (
  project_id, version, preview_id, environment, status,
  github_commit_sha, trigger_type, rolled_back_to
) VALUES (
  $project_id,
  (SELECT version + 1 FROM projects WHERE id = $project_id),
  (SELECT preview_id FROM deployments WHERE id = $rollback_to_deployment_id),
  'production',
  'deploying',
  (SELECT github_commit_sha FROM deployments WHERE id = $rollback_to_deployment_id),
  'rollback',
  $rollback_to_deployment_id
);
```

---

## F. GITHUB + VERCEL INTEGRATION

### F.1 Repository Mapping

```
GitHub Organization: {app-name}
  │
  ├── {workspace-slug}-{project-slug}/   (one repo per project)
  │   ├── main branch                     (production)
  │   ├── preview/{preview-id} branch     (preview deployments)
  │   └── .vercel/
  │       └── project.json
  │
  GitHub team structure mirrors workspace roles:
  ├── {workspace-slug}-owners (admin access)
  ├── {workspace-slug}-members (write access)
  └── {workspace-slug}-viewers (read access)
```

### F.2 Auto-Commit Strategy

```javascript
// Structured commit messages
const COMMIT_TEMPLATES = {
  scaffold:     `feat: initial scaffold - v{version}`,
  preview:      `chore: preview v{version} [{score}/100]`,
  approval:     `feat: production release v{version}\n\nApproved preview: {preview_url}\nDecision score: {score}/100`,
  rollback:     `revert: rollback to v{version}\n\nPrevious commit: {sha}`,
  update:       `fix: update {file}\n\nTrigger: {reason}`,
};
```

### F.3 Vercel Integration Flow

```
1. Project created in platform
     │
2. Vercel API → POST /v9/projects
     │  { name: "{slug}", framework: null, rootDirectory: "/" }
     │  → Returns vercel_project_id
     │
3. Vercel API → POST /v9/projects/:id/domains (if custom domain)
     │
4. Vercel API → POST /v1/integrations/git-sources
     │  Link GitHub repo to Vercel project
     │
5. GitHub push (via Deployment Engine)
     │  git push origin main
     │
6. Vercel webhook → POST /api/webhooks/vercel
     │  { type: "deployment", payload: { id, state, url, ... } }
     │  → Updates deployment.status
     │  → Sets deployment.vercel_url
     │  → If production: sets project.live_url + status = DEPLOYED
     │
7. Preview deployments:
     │  Branch: preview/{preview-id}
     │  URL: preview-{id}.{workspace-slug}.vercel.app
     │  Auto-deleted when preview is approved or rejected
```

### F.4 Preview vs Production Deployments

| Feature | Preview | Production |
|---|---|---|
| Branch | `preview/{id}` | `main` |
| Vercel URL | `preview-{id}.vercel.app` | `{custom-domain}.vercel.app` |
| Custom domain | No | Yes |
| GitHub Pages | No | No |
| Auto-delete | On approval/rejection | Never |
| Comment on PR | N/A | N/A (no PR flow) |
| Rollback support | No | Yes |
| Vercel alias | `preview-{id}` | `production` + custom |
| Approval gate | Required for production | Already approved |
| Environment variables | Inherited | Inherited |

### F.5 Vercel API Client

The existing `lib/deployment/index.js` gets an additional adapter:

```javascript
// lib/deployment/vercel.js (NEW — extends Deployment Engine)
class VercelClient {
  constructor(apiToken) { this.token = apiToken; }

  async createProject(name, opts)         → { id, name, ... }
  async triggerDeploy(projectId, branch)  → { id, url, state }
  async getDeployment(deployId)           → { id, url, state, createdAt }
  async assignDomain(projectId, domain)   → { domain, verified }
  async createPreviewDeploy(projectId, branch, previewId) → { url }
  async deletePreviewDeploy(previewId)    → { success }
  async listDeployments(projectId)        → [{ id, url, state, ... }]
  async setEnvironmentVariables(projectId, envVars) → { success }
}
```

---

## G. PREVIEW SYSTEM

### G.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PREVIEW SYSTEM                              │
│                                                                 │
│  ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐  │
│  │ Plan Engine  │────▶│ Preview Engine   │────▶│ Preview     │  │
│  │ (IR JSON)    │     │ (lib/preview)    │     │ Renderer    │  │
│  └─────────────┘     └──────────────────┘     └──────┬──────┘  │
│         │                                             │        │
│         ▼                                             ▼        │
│  ┌─────────────┐                              ┌─────────────┐  │
│  │Design System│                              │  Preview    │  │
│  │ (tokens)    │                              │  Storage    │  │
│  └─────────────┘                              │  (DB+Blob)  │  │
│                                               └─────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            PREVIEW DELIVERY                               │   │
│  │                                                          │   │
│  │  Public URL:  https://preview-{id}.app.domain.com       │   │
│  │  or iframe:   /preview/{id}/embed                       │   │
│  │                                                          │   │
│  │  Edge Cache:  Redis (HTML + CSS, TTL 5 min)            │   │
│  │  Persistent:  previews table (html_content, css_content)│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### G.2 Live Preview Delivery

```javascript
// API Route: GET /api/previews/:id
async function servePreview(req, res) {
  const { id } = req.params;

  // 1. Check Redis cache
  const cached = await redis.get(`preview:${id}`);
  if (cached) return res.type('html').send(cached);

  // 2. Load from DB
  const preview = await db.query(
    'SELECT html_content, css_content FROM previews WHERE id = $1',
    [id]
  );

  if (!preview) return res.status(404).json({ error: 'Preview not found' });

  // 3. Inject design system tokens + preview chrome
  const fullHtml = wrapPreview(preview.html_content, preview.css_content);

  // 4. Cache in Redis (5 min TTL)
  await redis.set(`preview:${id}`, fullHtml, { ex: 300 });

  // 5. Serve
  return res.type('html').send(fullHtml);
}

function wrapPreview(html, css) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${css}</style>
  <style>
    /* Preview chrome overlay — visible only in preview mode */
    .preview-chrome {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(0,0,0,0.85); padding: 8px 16px;
      font-family: system-ui; font-size: 13px; color: #fff;
      display: flex; justify-content: space-between; z-index: 9999;
    }
    @media (max-width: 600px) { .preview-chrome { display: none; } }
  </style>
</head>
<body>
  ${html}
  <div class="preview-chrome">
    <span>🔍 Preview Mode</span>
    <span id="preview-dimensions"></span>
    <button onclick="window.parent.postMessage('approve','*')">✓ Approve</button>
    <button onclick="window.parent.postMessage('reject','*')">✗ Reject</button>
  </div>
  <script>
    document.getElementById('preview-dimensions').textContent =
      window.innerWidth + '×' + window.innerHeight;
  </script>
</body>
</html>`;
}
```

### G.3 Design System Injection

Preview engine injects CSS variables at `:root` level:

```css
:root {
  --color-primary: #00D4FF;
  --color-bg: #0B0F19;
  --color-surface: #131829;
  --color-text: #F3F4F6;
  --color-border: #1E2640;
  --color-hover: #00FFC8;
  --color-text-on-primary: #0B0F19;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Space Grotesk', sans-serif;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 48px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

### G.4 Preview Update Flow (after AI changes)

```
1. User edits form inputs
2. Triggers new generation
3. Orchestrator runs Plan → Design System → Preview
4. Preview Engine generates new HTML + CSS
5. NOT the same session as current preview:
    a. New preview record (version + 1)
    b. Preview URL changes (new ID)
    c. WebSocket notification to dashboard
6. User sees "New preview ready" banner
7. Can compare old vs new (version selector)
8. Approve → new version becomes current
```

### G.5 Approval Gating

| Score Range | Auto-action | Manual override |
|---|---|---|
| 90-100 | Auto-approve + notify | — |
| 70-89 | Auto-approve + recommend review | Skip review |
| 50-69 | Manual review required | Admin approve |
| 0-49 | Auto-reject + regenerate | Force approve (admin only) |

---

## H. DECISION LAYER (AI GOVERNANCE)

### H.1 Scoring Engine v2

The existing `lib/decision/index.js` (architectural logging) is extended with `lib/scoring/index.js` (AI evaluation).

```javascript
// lib/scoring/index.js — Decision Scoring Engine v2

/**
 * Evaluate a generated project preview
 * @param {Object} planIR - Plan Engine output
 * @param {Object} designSystem - Design System Engine output
 * @param {Object} preview - Preview Engine output
 * @returns {Object} { score, metrics, warnings, passed }
 */
function evaluate(planIR, designSystem, preview) {
  const metrics = {
    contrast:    evaluateContrast(designSystem),
    ux:          evaluateUX(planIR, preview),
    conversion:  evaluateConversion(planIR, preview),
    clarity:     evaluateClarity(planIR, preview),
    seo:         evaluateSEO(planIR, preview),
  };

  const weights = {
    contrast:   0.25,
    ux:         0.25,
    conversion: 0.20,
    clarity:    0.15,
    seo:        0.15,
  };

  let totalScore = 0;
  const warnings = [];

  for (const [dimension, result] of Object.entries(metrics)) {
    totalScore += result.score * weights[dimension];
    if (result.warnings) warnings.push(...result.warnings.map(w =>
      ({ dimension, ...w })
    ));
  }

  return {
    score: Math.round(totalScore * 100) / 100,
    metrics,
    warnings,
    passed: totalScore >= 50,
    summary: generateSummary(metrics, totalScore),
  };
}
```

### H.2 Scoring Dimensions

#### Contrast (25%)

| Check | Pass threshold | Weight |
|---|---|---|
| Background vs text contrast | WCAG AA (4.5:1) | 40% |
| Primary vs text contrast | WCAG AA (4.5:1) | 25% |
| Primary vs background | WCAG AA-large (3:1) | 15% |
| Surface vs background | 1.5:1 minimum | 10% |
| Border vs background | 2:1 minimum | 10% |

#### UX Score (25%)

| Check | Pass threshold | Weight |
|---|---|---|
| Hero section present | Required | 25% |
| All pages mapped to sections | 100% | 20% |
| No empty sections | All filled | 20% |
| CTA present in hero | Required | 15% |
| Contact section present | Required | 10% |
| Content length adequate | > 50 chars per section | 10% |

#### Conversion (20%)

| Check | Pass threshold | Weight |
|---|---|---|
| CTA defined and visible | Required | 30% |
| Contact/lead capture present | Required | 25% |
| Value proposition clear | Required in hero | 20% |
| Social proof present | Testimonials or stats | 15% |
| Urgency/offer present | Optional — bonus | 10% |

#### Clarity (15%)

| Check | Pass threshold | Weight |
|---|---|---|
| Business name in hero | Required | 25% |
| Tagline present | Required | 20% |
| Service description clear | > 30 chars | 20% |
| No contradictory information | Semantic check | 20% |
| Reading level appropriate | Simple language | 15% |

#### SEO (15%)

| Check | Pass threshold | Weight |
|---|---|---|
| Keywords defined | > 3 keywords | 30% |
| Meta description present | Required | 25% |
| Semantic HTML structure | h1, h2, nav, main | 25% |
| Location data present | If applicable | 10% |
| Alt-text ready | Required for images | 10% |

### H.3 Automatic Improvement Loop

```
Score < 50:
  1. Log failure in decisions table (type: 'regeneration')
  2. Identify lowest-scoring dimension
  3. Inject improvement hints into Plan Engine input
     (e.g., "Increase contrast ratio: ensure text color has 4.5:1 against background")
  4. Re-run Plan Engine → Design System → Preview → Scoring
  5. Max 2 regeneration attempts (infinite loop prevention)

Score 50-69:
  1. Flag for manual review
  2. Notify workspace admins
  3. Store detailed metrics for reviewer context
  4. Allow force-approve or edit-and-retry

Score >= 70:
  1. Auto-promote to APPROVED (if auto-approve enabled in workspace settings)
  2. Or wait for manual approval (configurable per workspace)
```

### H.4 Feedback Loop Architecture

```
Decision Scoring Engine
    │
    ├── PASS (score >= 70)
    │       └── Auto-approve → Scaffold Engine
    │
    ├── WARN (50-69)
    │       └── Manual review → User edits → Re-run
    │
    └── FAIL (score < 50)
            │
            ├── 1st retry: Auto-inject fixes → Re-run pipeline
            │       └── PASS → Continue
            │       └── FAIL → 2nd retry (different fixes)
            │
            └── 2nd retry: Different fixes → Re-run pipeline
                    └── PASS → Continue
                    └── FAIL → Manual review required
```

---

## I. FILE SYSTEM STRATEGY

### I.1 SaaS Repository (monorepo)

```
/jic-platform/                      ← Platform monorepo (this repo)
├── .github/
│   └── workflows/
│       ├── ci.yml                  ← Tests + lint on PR
│       └── deploy.yml              ← Vercel deploy
│
├── app/                            ← Next.js 14 App Router
│   └── ...                         ← (see Section C.1)
│
├── api/                            ← Vercel Functions
│   ├── auth/                       ← Auth endpoints
│   ├── projects/                   ← Project CRUD + generation
│   ├── workspaces/                 ← Workspace management
│   ├── previews/                   ← Preview serving
│   ├── deployments/                ← Deployment management
│   └── webhooks/                   ← Vercel + GitHub webhooks
│
├── lib/                            ← AI Engines (existing + new)
│   ├── compiler/
│   ├── plan/
│   ├── design-system/
│   ├── preview/
│   ├── scaffold/
│   ├── deployment/
│   │   ├── index.js                ← Git/GitHub operations
│   │   └── vercel.js               ← NEW: Vercel API client
│   ├── decision/
│   ├── orchestrator/
│   ├── loader/
│   ├── db/
│   │   ├── index.js                ← Pool + connection
│   │   └── formResponses.js
│   ├── scoring/                    ← NEW: Decision Scoring Engine v2
│   │   └── index.js
│   ├── queue/                      ← NEW: Job queue adapter
│   │   └── index.js
│   ├── storage/                    ← NEW: Blob storage adapter
│   │   └── index.js
│   ├── billing/                    ← NEW: Stripe adapter
│   │   └── index.js
│   └── auth/                       ← NEW: Auth + RBAC helpers
│       └── index.js
│
├── components/                     ← Shared React components
│   ├── ui/                         ← Design system
│   ├── forms/                      ← Brief Maestro form
│   ├── preview/                    ← Preview iframe + controls
│   └── dashboard/                  ← Dashboard widgets
│
├── data/                           ← Runtime storage
│   ├── decisions.json
│   ├── deployments.json
│   └── migrations/
│       ├── 001_create_form_responses.sql
│       ├── 002_create_projects_executions.sql
│       └── 003_saas_schema.sql     ← NEW: Full SaaS schema
│
├── packages/                       ← Shared packages
│   └── config/                     ← Shared config (eslint, tsconfig)
│
├── public/                         ← Static assets
│   ├── brief-maestro.html          ← Legacy (or migrated to Next.js)
│   ├── dashboard.html              ← Legacy (or migrated to Next.js)
│   ├── index.html                  ← Legacy portfolio (or migrated)
│   └── icon.ico
│
├── scripts/                        ← CLI tools
│   ├── seed.js                     ← Database seeding
│   ├── migrate.js                  ← Run migrations
│   └── dev.js                      ← Development server
│
├── tests/
│   ├── unit/                       ← Engine unit tests
│   ├── integration/                ← API integration tests
│   └── e2e/                        ← Playwright end-to-end
│
├── package.json
├── tsconfig.json                   ← NEW: TypeScript config
├── next.config.js                  ← NEW: Next.js config
├── vercel.json                     ← NEW: Vercel deployment config
├── AGENTS.md
├── ARCHITECTURE.md
├── ARCHITECTURE-SAAS.md            ← THIS FILE
├── CHANGELOG.md
├── .gitignore
└── .gitattributes
```

### I.2 Generated Project Structure (per project)

Stored in GitHub repo + Vercel Blob archive:

```
{workspace-slug}-{project-slug}/
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css               ← Page styles
│   │   └── theme.css               ← Design system CSS variables
│   ├── js/
│   │   └── main.js                 ← App logic + design tokens
│   ├── img/
│   │   └── placeholder.svg
│   └── design-system.json          ← Structured design tokens
├── api/                            ← If applicable
│   └── sendContact.js
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
├── CHANGELOG.md
└── .gitignore
```

### I.3 Temporary Build Artifacts

```
/tmp/jic-builds/                    ← Local disk during scaffold
└── {execution_id}/
    ├── project/                    ← Scaffold output
    ├── preview.tar.gz              ← Compressed preview files
    └── logs.json                   ← Build logs
                                    ← DELETED after Vercel Blob upload

Vercel Blob Storage:
├── /previews/{project_id}/{version}/   ← Preview HTML + CSS snapshots
│   ├── index.html
│   ├── style.css
│   └── preview.json
│
├── /artifacts/{project_id}/{execution_id}/  ← Generated project archives
│   └── project.tar.gz
│
├── /uploads/{workspace_id}/{project_id}/    ← User uploads
│   └── logo.png
│
└── /exports/{project_id}/{version}/        ← Downloadable project exports
    └── {project-slug}-v{version}.zip
```

### I.4 Cleanup Policy

| Artifact Type | Retention | Cleanup Trigger |
|---|---|---|
| Preview HTML (Redis) | 5 minutes | TTL expiry |
| Preview HTML (DB) | Permanent (versioned) | Manual project deletion |
| Temporary build files | 24 hours | Cron job |
| Vercel Blob previews | 30 days | Auto-delete cron |
| Vercel Blob artifacts | Permanent | Manual |
| Old preview versions (>10) | 10 newest kept | On new preview creation |
| User uploads | Permanent | Manual |
| Export archives | 7 days | Auto-delete cron |

---

## J. SCALABILITY MODEL

### J.1 Architecture by Scale

```
┌──────────────────────────┐
│  SINGLE USER (Dev/Free)  │
│                          │
│  All in one Vercel FN    │
│  Synchronous pipeline    │
│  SQLite (local dev)      │
│  No queue                │
│  No cache                │
└──────────────────────────┘

┌──────────────────────────────┐
│  10 WORKSPACES (Starter)     │
│                              │
│  Vercel Functions (sync)     │
│  Neon PostgreSQL             │
│  Basic rate limiting (IP)    │
│  Simple async: setTimeout    │
│  Redis cache (previews)      │
└──────────────────────────────┘

┌────────────────────────────────────┐
│  100 WORKSPACES (Pro)              │
│                                    │
│  Vercel Functions + dedicated FN   │
│  Neon PostgreSQL + PgBouncer       │
│  Bull queue on Upstash Redis       │
│  Redis session cache               │
│  Vercel Blob for artifacts         │
│  Rate limiting (per token/IP)      │
│  WebSocket for live previews       │
└────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  10,000 WORKSPACES (Enterprise)               │
│                                               │
│  Vercel Functions + dedicated workers         │
│  Neon PostgreSQL (scale-to-zero)              │
│  Bull queue + multiple worker pods            │
│  Redis cluster (Upstash)                      │
│  CDN for previews (Vercel Edge)               │
│  Blob storage (Vercel Blob + S3 cold storage) │
│  Rate limiting + DDoS protection              │
│  Separate queues per pipeline stage           │
│  Database read replicas for dashboard         │
│  Horizontal scaling via Vercel auto-scaling   │
└──────────────────────────────────────────────┘
```

### J.2 Async Job Queue

```javascript
// lib/queue/index.js — Queue Adapter

class Queue {
  constructor(redisUrl) {
    this.queue = new Bull('jic-pipeline', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
        timeout: 300000, // 5 min per job
      },
    });
  }

  async enqueue(jobType, payload) {
    // jobType: 'generate', 'regenerate', 'scaffold', 'deploy', 'rollback'
    return this.queue.add(jobType, payload, {
      jobId: `${jobType}-${payload.projectId}-${Date.now()}`,
    });
  }

  async processGenerate(job) { /* Plan → DS → Preview → Scoring */ }
  async processScaffold(job) { /* Generate project files */ }
  async processDeploy(job)   { /* Git → GitHub → Vercel */ }
}

// Queue job types and their concurrency
const JOB_CONFIG = {
  generate:   { concurrency: 5,  timeout: 300000 },  // 5 concurrent
  regenerate: { concurrency: 3,  timeout: 300000 },  // 3 concurrent
  scaffold:   { concurrency: 10, timeout: 120000 },  // 10 concurrent
  deploy:     { concurrency: 5,  timeout: 60000  },  // 5 concurrent
  rollback:   { concurrency: 2,  timeout: 60000  },  // 2 concurrent
};
```

### J.3 Caching Strategy

| Cache Key | Value | TTL | Invalidation |
|---|---|---|---|
| `preview:{id}` | Full HTML page | 5 min | On preview update |
| `ds:{project_id}` | Design system JSON | 1 hour | On regeneration |
| `plan:{project_id}` | Plan IR JSON | 1 hour | On regeneration |
| `workspace:{id}` | Workspace + plan data | 10 min | On subscription change |
| `user:{id}:sessions` | Active sessions | Session TTL | On logout |
| `rate:{key}` | Request counter | 1 min | Auto-reset |
| `project:{id}:deployments` | Deployment list | 2 min | On new deployment |

### J.4 Database Connection Pooling

```javascript
// lib/db/index.js (extended for SaaS scale)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: true },  // Production: verify-full
});

// PgBouncer-compatible session mode
// Neon's built-in pooling handles connection multiplexing

// Query with automatic retry on connection error
async function query(text, params, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)));
    }
  }
}
```

### J.5 Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30,
      "memory": 1024
    },
    "api/projects/generate.js": {
      "maxDuration": 300,
      "memory": 2048
    },
    "api/projects/scaffold.js": {
      "maxDuration": 120,
      "memory": 1024
    }
  },
  "rewrites": [
    { "source": "/preview/:id", "destination": "/api/previews/:id" },
    { "source": "/dashboard/:path*", "destination": "/dashboard.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "env": {
    "NEXT_PUBLIC_APP_URL": "@app_url"
  }
}
```

### J.6 Rate Limiting + Abuse Prevention

```javascript
// api/middleware/rate-limit.js
const redis = require('../../lib/redis');

async function rateLimit(req, res, next) {
  const key = req.headers['x-api-key']
    ? `rate:api:${req.headers['x-api-key']}`
    : `rate:ip:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  const limits = {
    '/api/projects/generate': { free: 2, starter: 10, pro: 50, enterprise: 500 },
    '/api/projects':          { free: 10, starter: 50, pro: 200, enterprise: 1000 },
    '/api/auth':              { free: 5, starter: 20, pro: 100, enterprise: 500 },
    'default':                { free: 30, starter: 100, pro: 500, enterprise: 5000 },
  };

  const pathLimit = limits[req.path] || limits['default'];
  const plan = req.workspace?.plan || 'free';
  const maxRequests = pathLimit[plan] || pathLimit['free'];

  if (current > maxRequests) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: 60,
      limit: maxRequests,
    });
  }

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - current);
  next();
}
```

---

## K. RISKS + LIMITATIONS

### K.1 Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Vercel Function timeout (30s default)** | Pipeline steps exceed limit | Increase maxDuration to 300s for generate endpoint; async queue removes timeout dependency |
| **Neon PostgreSQL connection limits** | Free tier: 10 connections | PgBouncer-style pooling; max pool size per function instance |
| **GitHub API rate limits** | 5000 req/hr per token | Queue deployments; cache repo metadata; use GitHub App tokens |
| **Vercel API rate limits** | 150 req/min per token | Queue deployment triggers; batch operations |
| **Bull queue job loss** | Redis OOM or crash | Bull supports job persistence; configure Redis maxmemory-policy |
| **Scaffold Engine disk I/O** | Vercel Functions have ephemeral /tmp | Always upload to Blob storage; never rely on local disk persistence |
| **Gmail SMTP reliability** | Daily sending limits (~500) | Migrate to Resend or SendGrid for transactional email at scale |
| **Preview storage growth** | 10k projects × 10 previews × ~50KB = ~5GB | 30-day TTL on old previews; compress HTML before storage |
| **Concurrent generation conflicts** | Two users trigger generation on same project | Lock via `SELECT ... FOR UPDATE` or Redis mutex; reject concurrent requests |
| **WebSocket connection limit** | Vercel Serverless can't hold long-lived WS | Use Pusher/Socket.io on dedicated server or Vercel Edge Functions |

### K.2 Architectural Limitations

| Limitation | Reason | Future Solution |
|---|---|---|
| **No real-time collaboration** | Vercel Serverless is request-response | Operational Transform (OT) server or CRDT-based sync |
| **No custom domain per project** | Vercel domain management per project | Vercel API `POST /v9/projects/:id/domains` |
| **No component library** | Scaffold generates flat HTML | Component-based generator (React/Vue templates) |
| **No media optimization** | Images served as-is | Vercel Image Optimization or Cloudinary |
| **No SEO preview** | Preview engine doesn't render meta tags | Add SEO preview panel in dashboard |
| **No mobile preview** | Desktop-only preview | Responsive iframe with device toggle |
| **No A/B testing** | Single version deployed | Deploy to multiple Vercel preview URLs with split testing |
| **No internationalization** | One language per project | i18n support in Plan Engine + Scaffold templates |
| **No backup/restore** | DB snapshots only via Neon | Automated backups to S3 with point-in-time recovery |
| **No API versioning** | Direct function routes | URL prefix: `/api/v1/projects` → `/api/v2/projects` |

### K.3 Scaling Bottlenecks (Projected)

| Bottleneck | At Scale | Solution |
|---|---|---|
| Plan Engine parsing | 10k projects/day | Optimize regex; cache parsed sections |
| Design System computation | 10k projects/day | Memoize by palette hash; pure function — easily parallelized |
| Preview HTML generation | 10k projects/day | Use template caching; pre-compile sections |
| Scaffold file writes | 5k projects/day | Stream files to Blob; async write |
| GitHub repo creation | 1k repos/day | GitHub API has 5000/hr limit — queue |
| Vercel deployment trigger | 1k deploys/day | Queue with batch rate limiting |
| DB writes (inputs + states) | 100k rows/day | Batch inserts; partition by month |
| Email sending | 10k emails/day | Migrate to Resend (100k/day free tier) |

### K.4 Migration Path from Current System

```
Phase 1: Foundation
  ├── Create SaaS database schema (003_saas_schema.sql)
  ├── Implement auth (NextAuth + workspace middleware)
  ├── Create workspace/project CRUD API
  └── Wrap existing lib/ engines with async queue

Phase 2: Preview + Scoring
  ├── Implement Decision Scoring Engine v2 (lib/scoring/)
  ├── Add preview storage + delivery API
  ├── Add approval gating to pipeline
  └── Connect Preview Engine to live preview UI

Phase 3: Deployment
  ├── Implement Vercel API client (lib/deployment/vercel.js)
  ├── GitHub integration (org, team, webhook management)
  ├── Auto-commit + push from Scaffold output
  └── Webhook handling (Vercel deployment status)

Phase 4: Billing
  ├── Stripe subscription integration
  ├── Plan enforcement middleware
  ├── Usage metering + limits
  └── Upgrade/downgrade flows

Phase 5: Dashboard Migration
  ├── Migrate from vanilla dashboard.html to Next.js app
  ├── Real-time preview WebSocket
  ├── Project analytics (usage, deployments, scores)
  └── Member management UI
```
