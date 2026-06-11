# SaaS System Manual — Agent Pack v1

## Architecture Overview

The system converts **Brief Maestro** form submissions into deployable web projects through a multi-step pipeline orchestrated by the SaaS Runtime Layer. It is a multi-tenant (workspace) system with PostgreSQL persistence, event-driven real-time updates via SSE, and a full REST API.

### High-Level Flow

```
Brief Maestro (HTML form)
        │
        ▼
POST /api/v1/projects/create  ──►  createProject()
        │                              │
        │                    ┌─────────┴──────────┐
        │                    ▼                    ▼
        │            project_inputs        projects (state: draft)
        │            (PostgreSQL)          (PostgreSQL)
        │
        ▼
POST /api/v1/projects/:id/run  ──►  runPipeline()
        │                              │
        │                    ┌─────────┴──────────┐
        │                    ▼                    ▼
        │              Plan Engine           Design System
        │           (prompt → IR JSON)    (IR → CSS tokens)
        │                    │                    │
        │                    ▼                    ▼
        │              Preview Engine          Scoring Engine
        │           (HTML/CSS snapshots)    (5-dimension score)
        │                    │                    │
        │                    ▼                    ▼
        │              executions            previews
        │           (PostgreSQL)          (PostgreSQL)
        │
        ▼
POST /api/v1/projects/:id/approve  ──►  approveProject()
        │
        ├──► Scaffold Engine (filesystem project generator)
        ├──► Deployment Engine (Git init + GitHub + Vercel)
        └──► project status → deployed
```

## Module Map

### SaaS Layer (`lib/runtime/`)
Central orchestrator for all multi-tenant, production-grade operations.

| File | Exports | Purpose |
|---|---|---|
| `lib/runtime/index.js` | 14 exports | Full state machine orchestrator: `createProject`, `runPipeline`, `approveProject`, `getProjectById`, `getProjectInputs`, `listWorkspaceProjects`, `getExecutionById`, `getProjectPreviews`, `getPreviewById`, `getDecisionsForProject`, `getProjectStates`, `extractRuntimeState`, `events`, `makeError` |
| `lib/runtime/bootstrap.js` | 1 (auto) | Safe dotenv init: idempotent, production-safe, descriptive error if DATABASE_URL missing |
| `lib/runtime/validators.js` | 8 exports | Pure-JS validation: `assertRequired`, `assertString`, `assertUUID`, `validateCreateProject`, `validateRunPipeline`, `validateApproveProject`, `assertEnum`, `makeError` |

### Workspace Resolver (`lib/resolver/`)
Multi-tenant identity resolution with caching.

| File | Exports | Purpose |
|---|---|---|
| `lib/resolver/index.js` | 4 exports | `resolveWorkspace(slugOrId)` — UUID or slug lookup + 60s in-memory LRU cache (1000 entries). `resolveUser(userId, workspaceId)` — membership + role validation. `resolveContext(slugOrId, userId?)` — combined. `clearCache()` — evict all |

### Event System (`lib/events/`)
In-memory pub/sub + optional PostgreSQL persistence for real-time dashboard updates.

| File | Exports | Purpose |
|---|---|---|
| `lib/events/index.js` | `RuntimeEventBus` class | 9 valid event types. `on(event, cb)`, `onAny(cb)`, `onProject(projectId, cb)`, `onWorkspace(workspaceId, cb)`, `getEventsAfter(since)`, `getProjectEvents(projectId)`. DB persistence via auto-created `runtime_events` table (IF NOT EXISTS). Silent 500-entry bounded memory fallback |

### Engine Modules (`lib/*/`)

| Module | Purpose | API |
|---|---|---|---|
| `lib/compiler/` | (planned) Unified Brief Compiler v1 — bridges raw email/notes → structured brief | `compile(input)` → structured object |
| `lib/plan/` | Plan Engine v1 — converts Prompt Maestro → Semantic Intermediate Representation (JSON) | `compile(prompt)` → `{ project: { identity, structure, ui, content, seo, conversion, assets, rules } }` |
| `lib/scaffold/` | Scaffold Engine v1 — generates filesystem project from IR | `generate(projectDef)` → `{ path, files[] }` |
| `lib/decision/` | Decision Layer v1 — architectural decision records (system-level, not user-level) | `registerDecision({ id, title, reason, impact, modules_affected, version })`, `listDecisions()`, `getDecision(id)`. Persists to `data/decisions.json` |
| `lib/deployment/` | Deployment Engine v1 — Git/GitHub/Vercel automation | `initRepository(path)`, `commitProject(path)`, `createGitHubRepo(name, path)`, `pushToRemote(path)`, `deployFullPipeline(path, opts)`. Persists to `data/deployments.json` |
| `lib/orchestrator/` | (planned) Orchestrator Engine v1 — single-project pipeline builder | `process({ input, type, deploy? })`, `detectType(input)`, `buildPipeline(inputType)` |
| `lib/loader/` | (planned) Project Loader Engine v1 — read-only project reconstruction from DB | `loadProject(projectId)`, `rebuildPromptMaestro(projectId, lang?)`, `getProjectState(projectId)`, `listProjects()` |
| `lib/design-system/` | Design System Engine v1 — CSS variables + tokens from brand input | `generateTokens(brandData)` → `{ css, variables, typography, spacing }` |
| `lib/preview/` | Visual Preview Engine v1 — HTML/CSS simulation | `renderPreview(projectDef)` → `{ html, css }` |
| `lib/db/` | Database layer (PostgreSQL) | `index.js` — pool + query connection management. `formResponses.js` — Form Persistence Layer: `saveFormResponse`, `saveBulkFormResponses`, `getProjectFormResponses`, `getResponsesGrouped`, `generateProjectId` |

## State Machine

Valid project status transitions:

```
draft ──► processing ──► preview ──► approved ──► deploying ──► deployed
  │                        │                              │
  └──► failed              └──► failed                    └──► failed
```

Enforced by `validTransition(from, to)` with 8 valid paths. Any illegal transition throws `INVALID_STATE` error.

## Pipeline Steps (runPipeline)

Base pipeline (4 steps, sequential):

| Step | Module | Timeout | Retries | Description |
|---|---|---|---|---|
| `plan` | `lib/plan/` | 120s | 3 | Prompt Maestro → Semantic IR JSON |
| `design_system` | `lib/design-system/` | 120s | 3 | IR → CSS tokens + design variables |
| `preview` | `lib/preview/` | 120s | 3 | IR + tokens → visual HTML/CSS snapshot |
| `scoring` | inline in runtime | 120s | 3 | 5-dimension evaluation (contrast, UX, conversion, clarity, SEO) |

Each step records: `{ name, status, started_at, completed_at, duration_ms, summary, error? }` in `executions.steps`.

Scaffold + Deploy triggered separately by `approveProject()`.

### Scoring Dimensions

| Dimension | Weight | Evaluation |
|---|---|---|
| Contrast | 25% | WCAG AA check (color pairs) |
| UX | 25% | Responsive, mobile-first, semantic structure |
| Conversion | 20% | CTA clarity, lead capture, social proof |
| Clarity | 15% | Information hierarchy, readability |
| SEO | 15% | Semantic HTML, metadata, keywords |

Score ≥ 50 passes. Score persisted in `executions.score`.

### Retry Logic

- 3 attempts per step
- Exponential backoff: 1s, 2s, 4s delays
- Max 8s delay cap
- 120s timeout per attempt via `Promise.race`

## API v1 Endpoints

Base path: `/api/v1`

All endpoints require `workspace_id` and `user_id` (query params or body). Membership is validated on every request.

### Projects

| Method | Path | Auth Role | Description |
|---|---|---|---|
| GET | `/api/v1/projects` | owner/admin/member/viewer | Paginated listing (max 100/page). `?page=1&per_page=20` |
| POST | `/api/v1/projects/create` | owner/admin/member | Create project + optionally trigger pipeline. Body: `{ name, formData, autoRun? }`. Auto-run defaults to true |
| GET | `/api/v1/projects/:id` | owner/admin/member/viewer | Full project state. `?include=inputs,previews,states,decisions` |
| POST | `/api/v1/projects/:id/run` | owner/admin/member | Trigger pipeline. 409 if already processing. Returns `{ execution_id, status, score? }` |
| POST | `/api/v1/projects/:id/approve` | owner/admin | Approve preview → scaffold → deploy. Status must be `preview`. 409 otherwise |
| GET | `/api/v1/projects/:id/preview` | owner/admin/member/viewer | Preview output. `?format=json|html|css`, `?version=N` |

### Executions

| Method | Path | Auth Role | Description |
|---|---|---|---|
| GET | `/api/v1/executions/:id` | owner/admin/member/viewer | Execution detail + AI decisions |

### Events

| Method | Path | Auth Role | Description |
|---|---|---|---|
| GET | `/api/v1/events/stream` | owner/admin/member/viewer | SSE stream (`text/event-stream`) or JSON (`?poll=1`). Keepalive 15s, poll 2s, timeout 55s |

### Error Format

All API errors follow this structure:

```json
{
  "error": true,
  "code": "INVALID_INPUT | NOT_FOUND | CONFLICT | INVALID_STATE | FORBIDDEN | SERVER_ERROR",
  "message": "Human-readable description",
  "field": "field_name",
  "timestamp": "2026-06-08T12:00:00.000Z"
}
```

## Database Schema (SaaS)

### Core Entities (from `003_saas_schema.sql`)

**workspaces**
`id UUID PK, slug VARCHAR(50) UNIQUE, name VARCHAR(255), plan VARCHAR(20) DEFAULT 'free', status VARCHAR(20) DEFAULT 'active', created_at, updated_at`

**users**
`id UUID PK, email VARCHAR(255) UNIQUE, name VARCHAR(255), avatar_url TEXT, auth_provider VARCHAR(50), auth_provider_id VARCHAR(255), created_at`

**workspace_members**
`workspace_id UUID FK→workspaces, user_id UUID FK→users, role VARCHAR(20) CHECK(owner|admin|member|viewer), invited_by UUID, joined_at`

**projects**
`id UUID PK, workspace_id UUID FK, name VARCHAR(255), status VARCHAR(20) DEFAULT 'draft', current_execution_id UUID, created_by UUID, created_at, updated_at`

**project_inputs**
`id UUID PK, project_id UUID FK, form_data JSONB NOT NULL, prompt_maestro TEXT, created_at`

**executions**
`id UUID PK, project_id UUID FK, workspace_id UUID FK, status VARCHAR(20) DEFAULT 'processing', steps JSONB DEFAULT '[]', score DECIMAL(5,2), errors JSONB DEFAULT '[]', started_by UUID, started_at, completed_at`

**previews**
`id UUID PK, project_id UUID FK, execution_id UUID, version INT, html_content TEXT, css_content TEXT, tokens JSONB, score DECIMAL(5,2), approved BOOLEAN DEFAULT FALSE, created_at`

**decisions**
`id UUID PK, execution_id UUID FK, source VARCHAR(50), category VARCHAR(50), title TEXT, description TEXT, impact VARCHAR(20), metadata JSONB, created_at`

**project_states**
`id UUID PK, project_id UUID FK, from_status VARCHAR(20), to_status VARCHAR(20), triggered_by UUID, reason TEXT, created_at`

### Legacy Tables (preserved)

**form_responses** — `id SERIAL, project_id VARCHAR(64), section VARCHAR(64), field_key VARCHAR(128), value TEXT, created_at`

### Indexes (9 total)

- `workspace_members`: composite on (workspace_id, user_id) UNIQUE, user_id, role
- `projects`: workspace_id + status, created_by, created_at DESC
- `project_inputs`: project_id
- `executions`: project_id + status, workspace_id, started_at DESC
- `previews`: project_id + version UNIQUE, execution_id, approved
- `decisions`: execution_id, source + category
- `runtime_events`: (event_type, created_at), (workspace_id, created_at), (project_id, created_at)

## Real-Time Updates (SSE + Polling)

### Architecture

```
Browser (EventSource)
        │
        ▼
GET /api/v1/events/stream?workspace_id=X&user_id=Y
        │
        ├──► SSE mode (default): text/event-stream
        │       ├── Keepalive every 15s (type: "keepalive")
        │       ├── Poll DB every 2s for new events
        │       └── Timeout after 55s (EventSource auto-reconnects)
        │
        └──► Poll mode (?poll=1): regular JSON response
                └── Returns all events since given timestamp
```

### Dashboard Integration

| Dashboard | SSE Subscription | Fallback |
|---|---|---|
| `dashboard.html` | `subscribeToWorkspaceEvents(wsId, cb)` — live status badges per project | Project polling (5s) when processing/deploying projects exist |
| `dashboard-project.html` | `subscribeToProjectEvents(id, callbacks)` — live pipeline steps + scoring cards | Execution polling (2s) |
| `dashboard-logs.html` | `subscribeToProjectEvents(id, callbacks)` — append-mode decisions + step diffs | Execution polling (2s) |

### Event Types (9)

1. `status.change` — project status transition
2. `pipeline.start` — pipeline execution begins
3. `pipeline.step` — individual step status update
4. `pipeline.complete` — full pipeline finished (success)
5. `pipeline.fail` — pipeline failed
6. `preview.ready` — new preview version available
7. `scoring.complete` — scoring dimension results
8. `deployment.start` — deploy begins
9. `deployment.complete` — deploy finished

### Client Callback Object

```javascript
{
  onEvent(data)          // any of the 9 event types
  onPipelineStep(step, data)  // step name + event data
  onScoring(payload)     // { contrast, ux, conversion, clarity, seo, total }
  onDeployment(data)     // { status, repo_url?, deploy_url? }
  onError(data)          // { code, message }
}
```

## Dashboard System

### `dashboard.html` — Workspace Dashboard
- Stats cards: total, active (processing/preview), deployed, failed
- Project table: name (link to project), status badge (color-coded + glow), last updated, action buttons
- Create form: inline name input + "New Project" button
- Auto-refresh: SSE-backed status badge updates; falls back to project polling (5s interval) when projects are processing or deploying
- Status badge colors: draft=gray, processing=blue+glow, preview=purple+glow, approved=indigo, deploying=amber+glow, deployed=green, failed=red

### `dashboard-project.html` — Project Control Dashboard
- Project detail panel: name, status, workspace, timestamps
- Pipeline step tracker: 6 DOM-identified steps (`step-plan`, `step-design_system`, `step-preview`, `step-scoring`, `step-scaffold`, `step-deploy`). States: pending (gray), active (blue+glow pulse), done (green check), fail (red)
- Scoring cards: 5 dimension cards + total score prepend with `fadeSlideIn` animation on new events
- Preview renderer: iframe + JSON + CSS panels; version selector; approve button
- Execution history: previous runs table
- Controls: Run Pipeline, Approve, Delete
- Live SSE: `startLiveEvents()` runs on page load if project is processing/deploying, and on pipeline start

### `dashboard-logs.html` — Execution Logs
- Decision history trail: AI decisions with source, category, impact badge, timestamp
- Execution step monitor: current/recent pipeline steps with status + duration
- Append-mode: new decisions prepend with CSS animation; steps diff re-rendered only when step count changes
- SSE: `startLogEvents()` for live updates. `diffSteps(steps)` keeps DOM in sync with execution steps array

### `dashboard-preview.html` — Preview Renderer
- 3 panels (tabs): JSON (formatted), HTML (iframe sandbox), CSS (syntax-highlighted)
- Version selector dropdown (versions from DB)
- Approval button (POST to approve endpoint)
- Regenerate button (POST to run endpoint)

## Security & Tenancy

### Workspace Membership Roles

| Role | Create | Run | Approve | View | Delete |
|---|---|---|---|---|---|
| owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ | ✓ | ✗ |
| member | ✓ | ✓ | ✗ | ✓ | ✗ |
| viewer | ✗ | ✗ | ✗ | ✓ | ✗ |

### Tenant Isolation
- All queries JOIN against `projects.workspace_id`
- API endpoints validate workspace membership before any operation
- SSE stream filters by workspace_id + validates membership
- Resolver layer enforces role checks at DB level

### Input Validation
- All runtime API functions validate input BEFORE any DB operation
- UUID format checked via regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- Required fields: name, workspace_id, user_id, project_id
- Structured error format: `{ error, code, message, field?, timestamp }`

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `GMAIL_USER` | For email | Gmail address for SMTP |
| `GMAIL_APP_PASSWORD` | For email | Gmail app password |
| `NODE_ENV` | No | Set to `production` in Vercel (suppresses dotenv) |

## Test Suite

`test-runtime-safe.js` — 34 tests, all pass without DB connection:

- **Resolver tests** (7): exports integrity, no-args throws, single-arg throws, valid UUID accepted, invalid UUID rejected, clearCache exists, clearCache no-op on empty cache
- **Validator tests** (14): assertRequired, assertString, assertUUID, makeError format, validateCreateProject (missing name, missing formData, missing workspace_id, missing user_id, empty name, all valid), validateRunPipeline, validateApproveProject
- **Runtime tests** (10): exports count, createProject validation (missing/empty/invalid inputs), runPipeline validation, approveProject validation, engine isolation (plan, design-system have expected exports)
- **Bootstrap test** (1): idempotency test
- **Event bus test** (1): exports check
- **Resolved context test** (1): exports check

## Known Issues

1. **Git not installed** on dev machine — `lib/deployment/` graceful degradation triggers but git operations fail silently
2. **Plan Engine** only parses `**key:** value` format (Prompt Maestro v1). Unified Brief Compiler bridges `key: value` format as separate preprocessing step
3. **Full pipeline test** requires workspace_members + workspaces rows in PostgreSQL — validation-layer tests (34) pass without DB
4. **Gmail App Password** may expire — must regenerate if email sending fails
5. **Runtime inline scoring** is tightly coupled — planned extraction to `lib/scoring/` v2

## Deployment

- Target: **Vercel only**
- Deploy: `vercel --prod`
- Environment variables set in Vercel Dashboard
- Node.js 22.11.0 runtime
- No Docker, no Netlify Functions, no Cloudflare Workers, no AWS Lambda

## Version History

| Version | Description |
|---|---|
| v1.0.0 | Initial stable system: compiler, plan, scaffold, decision layer, orchestrator, deployment, loader, DB layer |
| v1.1.0 | Intelligence layer: Validator, UX Flow, SEO, Copy Booster agents (simulated in brief-maestro.html) |
| v1.6.0 | SaaS multi-tenant architecture design (ARCHITECTURE-SAAS.md + migration 003) |
| v1.7.0 | SaaS Runtime Layer v1 + API v1 + scoring engine + event system + SSE + dashboard live updates + Workspace Resolver Layer v1 |

## Load Testing & Monitoring

- **Monitoring**: Vercel Dashboard → Deployment → Functions
- **Common errors**: 500 (env vars misconfigured), 502 (SMTP failure), 409 (state conflict)
- **Logging**: Vercel Function logs for API endpoints; execution step logs in PostgreSQL `executions.steps`
- **Scoring**: all results persisted in `executions.score` and `previews.score`
- **Audit trail**: `project_states` table tracks every state transition; `decisions` table tracks AI decisions
