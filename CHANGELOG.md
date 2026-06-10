# Changelog

## [v1.2.1] - 2026-06-10

### Fixed
- [2026-06-10] - C2: Derived metrics now persisted in registry Map (audit finding)
  - `registerLifecycle()` stores `executionDurationMs`, `queueWaitTimeMs`, `totalLifecycleTimeMs` alongside raw fields
  - `getAggregateMetrics()` now computes correct `averageExecutionTimeMs` and `averageQueueWaitTimeMs` instead of always 0
  - `lookupRequest()` and diagnostic endpoint continue to work identically (both use `_computeDerived`)
  - Files: `lib/request-registry.js`
  - Reason: derived fields were computed on return copy but never persisted — aggregates always returned 0
  - Impact: `averageExecutionTimeMs` and `averageQueueWaitTimeMs` now reflect actual averages within the same instance
- [2026-06-10] - M1: TTL purge in `getAggregateMetrics()` (audit finding)
  - `getAggregateMetrics()` now calls `_evictExpired()` at start, so stale entries are excluded from aggregates
  - Files: `lib/request-registry.js`
  - Reason: expired entries inflated `totalRequests` until next periodic cleanup (up to 60s)
  - Impact: aggregates always reflect only non-expired entries, consistent with `lookupRequest()` behavior

### Added
- [2026-06-10] - Brief Maestro frontend audit + E2E bypass script
  - Full frontend flow audit: `docs/audits/brief-maestro-frontend-audit.md`
    - Identifies all key functions and line numbers (SECTIONS, formData, submitContact, generatePrompt)
    - Maps complete flow: wizard → contact page → POST /api/sendBrief → response handling
    - Documents risks: requestId ignored, no fetch timeout, missing honeypot
  - E2E test script: `scripts/e2e-brief-bypass-wizard.js`
    - Mode 1: invokes internal `submitContact()` after populating formData directly
    - Mode 2: pure API bypass — builds payload, calls fetch, logs requestId/queuePosition/queueDepth
    - No manual wizard navigation required
  - Reason: enable rapid testing of /api/sendBrief without clicking through 14 sections

### Fixed
- [2026-06-10] - E2E script encoding corruption
  - Original file had 742 non-ASCII chars (emoji, box-drawing, Spanish accents)
  - Caused silent IIFE failure when copy-pasted via terminals with encoding issues
  - Rewrote as pure ASCII: replaced emoji with [OK]/[ERR]/[WARN]/[SEND]/[RECV]/[INFO],
    box-drawing with regular ASCII chars, kept Spanish data via unaccented equivalents
  - Verified: `node --check` passes, `window.runBriefE2E` exports correctly,
    file is pure ASCII (0 non-ASCII printable chars), 285 lines, proper `})();` closure
  - Files: `scripts/e2e-brief-bypass-wizard.js`
- [2026-06-10] - E2E script not accessible in production (404)
  - Script existed only in `scripts/` directory; Vercel does not serve from there
  - Copied to `public/scripts/e2e-brief-bypass-wizard.js` for Vercel static serving
  - Verified: `GET /scripts/e2e-brief-bypass-wizard.js` returns HTTP 200 (via `vercel curl`)
  - Files: `public/scripts/e2e-brief-bypass-wizard.js` (new)
  - Reason: Vercel only serves static assets from root and `public/` directory
- [2026-06-10] - Git integration NOT connected — CI/CD missing
  - Vercel project had no Git provider linked; all deploys manual via `vercel --prod`
  - `vercel git connect` failed because Vercel GitHub App was not installed on `Javier10Castro` account
  - Root cause: Vercel GitHub App authorization was missing from GitHub account
  - Fix: Installed Vercel GitHub App on `Javier10Castro` account, granting access to `jic-portfolio`
  - After install: `vercel git connect` succeeded with `"already connected"`
  - Integration confirmed via Vercel API: `link.type=github`, `link.productionBranch=main`
  - Auto-deploy verified: `git push origin main` → deployment auto-triggered (commit `4369dc5` → deploy `oivpci6kp`)
  - Files: `docs/CI-CD-VERCEL-GITHUB.md` (updated)

### Changed
- [2026-06-10] - Deployment strategy updated from manual-only to CI/CD
  - Before: All deploys via `vercel --prod` only
  - After: `git push origin main` auto-deploys to production
  - Production URL preserved: `https://web-portfolio-kappa-wheat.vercel.app`
  - Existing deployments preserved (20+ history)
  - No business logic, API behavior, or runtime modified
  - `vercel --prod` still works as fallback deploy method

### Added
- [2026-06-10] - Production deployment documentation suite
  - `AGENT-BOOT-MANIFEST.md` — formal production-grade system spec (10 sections)
  - `docs/DEPLOYMENT-RECOVERY.md` — runbook for deployment recovery (7 procedures)
  - `docs/CI-CD-VERCEL-GITHUB.md` — step-by-step reconnect guide for GitHub ↔ Vercel
  - Reason: Git integration was never connected; deployment pipeline was manual only;
    recovery procedures were undocumented
  - Impact: zero — documentation only, no business logic changes

### Changed
- [2026-06-10] - Architecture audit: Git integration status confirmed NOT connected
  - Vercel project `web-portfolio` under `javier-ibrahim-s-projects` has no Git provider linked
  - GitHub repo `Javier10Castro/jic-portfolio` is public and accessible
  - `vercel git connect` fails with "Failed to connect" — Vercel GitHub App not installed
  - All deploys are manual via `vercel --prod` by user `javiercastro9912-1887`
  - Latest production deploy at commit `befbed6` ("test public file")
  - No CI/CD pipeline exists; Git pushes do NOT trigger deployments
  - Reconnection requires Vercel Dashboard (Settings → Git → Configure Git Provider)

## [v1.2.0] - 2026-06-10

### Fixed
- [2026-06-10] - Observability hardening (audit findings F1, F2, F3, F13)
  - **F13 — TTL enforcement**: TTL now applied independently of registry size. Periodic cleanup via `setInterval` (60s). `lookupRequest()` invalidates expired entries (deletes + returns null).
  - **F2 — lifecycle.complete unified source**: Moved structured log emission from `sendContact.js` handler to `queue.js:_process()`. Guarantees terminal event even on retry exhaustion, queue exception, or handler throw.
  - **F1 — Single executionStartedAt**: Removed duplicate `executionStartedAt` capture in `sendContact.js` handler. Queue's `queue.js:52` is the sole source of truth (moment work leaves queue).
  - **F3 — Pre-queue failure registration**: All 12 early-return points (405/400/429/500/503) now register with `{ status: 'rejected', reason: 'validation'|'rate_limit'|'bad_request', receivedAt }`.
  - Files: `lib/request-registry.js` (rewritten), `lib/queue.js` (modified), `api/sendContact.js` (modified)
  - Reason: audit findings from `docs/audits/request-lifecycle-observability-audit.md`
  - Impact: deterministic TTL, no gap in lifecycle.complete, single source of truth for executionStartedAt, pre-queue visibility in diagnostic endpoint

## [v1.1.0] - 2026-06-10

### Added
- [2026-06-10] - Request Lifecycle Observability (end-to-end requestId tracking)
  - **`lib/request-registry.js`** — In-memory request lifecycle registry (MAX_ENTRIES=1000, TTL=5min)
  - **Execution lifecycle timestamps**: `receivedAt`, `queuedAt`, `executionStartedAt`, `executionFinishedAt`
  - **Derived metrics**: `queueWaitTimeMs`, `executionDurationMs`, `totalLifecycleTimeMs`
  - **Execution states**: `queued`, `processing`, `completed`, `failed` with documented transitions
  - **Structured logging**: `lifecycle.complete` stage with full payload on every request completion
  - **Diagnostic endpoint**: `GET /api/sendContact?id=<requestId>` — returns full lifecycle data for recent requests
  - **Queue health metrics**: `totalRequests`, `completedRequests`, `failedRequests`, `averageExecutionTimeMs`, `averageQueueWaitTimeMs` exposed via `/api/health?section=queue`
  - Reason: ability to reconstruct full request lifecycle from requestId alone
  - Impact: 1 new module + 3 modified core files (queue, sendContact, health)

## [v1.0.15] - 2026-06-10

### Added
- [2026-06-10] - Client-side retry with exponential backoff for 429 responses in contact form
  - Retry strategy: attempt 1 immediate, 2 (1s), 3 (2s), 4 (4s) — max 4 total
  - UI status: "Reintentando envío... (Intento X de 4)" / "Retrying... (Attempt X of 4)"
  - Console logging: `requestId`, `retryAttempt`, `retryDelayMs` per retry
  - Zero backend changes — only frontend `index.html` modified
  - Reason: transparent 429 recovery without user-facing errors

## [v1.0.11] - 2026-06-10

### Observability Clarification Patch
- Clarified queue vs execution behavior in Vercel runtime
- Documented rate limit activation timing relative to queue admission
- Improved CLI testing reproducibility notes

## [v1.0.10] - 2026-06-10
- Fixed CLI testing inconsistencies under PowerShell
- Improved queue stability under burst traffic
- Confirmed rate-limit enforcement behavior
- Fixed documentation path confusion in repo structure

## [v1.9.0] - 2026-06-10

### Added
- [2026-06-10T06:45:00Z] - `x-test-mode` header support (validation | rate-limit | queue | load)
  Reason: enable test-aware instrumentation without breaking production flow
  Impact: test classifiers appear in lifecycle traces, structured logs, events, and debug responses
- [2026-06-10T06:45:00Z] - `GET /api/health?section=rate-limit` — detailed rate limit introspection
  Reason: expose current IP usage, email dedup cache size, window reset times, and hard limit thresholds for production observability (consolidated into health endpoint to respect Vercel Hobby 12-function cap)
  Impact: same data as a dedicated endpoint, zero additional functions
- [2026-06-10T06:45:00Z] - `GET /api/health?section=queue` — queue health with oldest request age
  Reason: expose queue depth, active worker count, oldest request age for backlog diagnostics (consolidated into health endpoint)
  Impact: same data as a dedicated endpoint, zero additional functions
- [2026-06-10T06:45:00Z] - `log.getTraceWithDeltas()` — per-stage ms delta computation
  Reason: improve debug mode with precise timing deltas between lifecycle steps (not just cumulative ms)
  Impact: developers can see exactly how many ms each stage takes, not just position from start
- [2026-06-10T06:45:00Z] - `rate-limit.getDetailedSnapshot()` — expanded rate limit state
  Reason: expose oldest entry age and window reset times alongside existing counters
  Impact: health and rate-limit-status endpoints show when windows will actually reset
- [2026-06-10T06:45:00Z] - `queue.getDetailedStats()` — oldest request tracking
  Reason: capture enqueue timestamps on every item to compute oldest request age
  Impact: queue-status endpoint reports backlog age in ms, sec, and min

### Changed
- [2026-06-10T06:45:00Z] - Debug mode lifecycle output: cumulative `ms` now paired with `deltaMs` per step
  Reason: developers need stage-level granularity, not just position-in-pipeline
  Impact: `?debug=true` response now includes `deltaMs` on every lifecycle entry (backward-compatible: `ms` preserved)
- [2026-06-10T06:45:00Z] - `log.structured()` and `log.event()` automatically include `testMode` when `req._testMode` is set
  Reason: eliminate repetitive parameter passing — test mode classification propagates naturally through all observability channels
  Impact: every structured log and event for test-mode requests carries `testMode` field automatically
- [2026-06-10T06:45:00Z] - `BackgroundQueue._process()` tracks `_activeItems` for accurate oldest-request computation
  Reason: without active-item tracking, items currently being processed are invisible to `getDetailedStats()`
  Impact: oldest request age now correctly reflects items in-flight, not just queued

### Removed
- [2026-06-10T06:45:00Z] - `api/rate-limit-status.js` — consolidated into `api/health.js?section=rate-limit`
  Reason: Vercel Hobby plan caps at 12 Serverless Functions; consolidation avoids plan upgrade
  Impact: zero data loss — same fields, same structure, accessed via `/api/health?section=rate-limit`
- [2026-06-10T06:45:00Z] - `api/queue-status.js` — consolidated into `api/health.js?section=queue`
  Reason: same consolidation strategy
  Impact: zero data loss — accessed via `/api/health?section=queue`
- [2026-06-10T06:45:00Z] - `api/sendBrief-upstash.js` — dead code (requires `@upstash/redis`, never installed)
  Reason: unused experimental variant occupying a function slot
  Impact: frees 1 function slot, no production effect

## [v1.9.1] - 2026-06-10

### Added
- [2026-06-10T07:10:00Z] - Per-email progress stages: `email.admin.start`, `email.admin.complete`, `email.client.start`, `email.client.complete`
  Reason: long-running SMTP sends for admin + client emails had no intermediate progress indicators — failures in one email masked the other's status
  Impact: four new lifecycle stages with per-email ok/timeout status; `email.sendEnd` now reports `ok` (both succeeded) or `partial` (at least one timed out)
- [2026-06-10T07:10:00Z] - `email.retry` lifecycle traces on SMTP failure with attempt tracking
  Reason: retries were logged via `log.warn` but invisible in lifecycle traces — structured logs now capture each retry attempt with attempt number, delay, and error
  Impact: `email.retry` lifecycle stage with `attempt_1|2|3`, `success_attempt_N`, `fail_attempt_N`, `failover_attempt_N` statuses; structured log entries at every retry stage
- [2026-06-10T07:10:00Z] - `X-RateLimit-Remaining` and `X-RateLimit-Limit` headers on 202 success responses
  Reason: clients need to know their remaining rate limit budget after a successful submission, not just after a 429 block
  Impact: every 202 response now includes `X-RateLimit-Limit: 60` and `X-RateLimit-Remaining: <N>` headers (backward-compatible, additive)

### Changed
- [2026-06-10T07:10:00Z] - Background email sending: replaced single `email.sendStart`/`email.sendEnd` with per-email progress (admin → client)
  Reason: two sequential SMTP operations with different timeouts — granular tracking isolates which email fails
  Impact: `email.sendEnd` is now the terminal summary after both emails complete; `email.sendStart` removed (replaced by `email.admin.start`)
- [2026-06-10T07:10:00Z] - `sendWithTimeout` return value now used to determine per-email status in lifecycle traces
  Reason: previous code ignored the boolean return of `sendWithTimeout` — timed-out emails were invisible in traces
  Impact: `email.admin.complete` and `email.client.complete` report `ok` or `timeout` based on actual send result

### Backward Compatibility
- `email.sendStart` trace removed (replaced by `email.admin.start`) — only affects background debug traces, never part of HTTP response contract
- All existing response fields, headers, and error codes preserved
- `email.sendEnd` still present but now reports `ok` or `partial` instead of always `ok`

---

## [v1.9.0] - 2026-06-10

### Added
- [2026-06-10T06:45:00Z] - `x-test-mode` header support (validation | rate-limit | queue | load)
  Reason: enable test-aware instrumentation without breaking production flow
  Impact: test classifiers appear in lifecycle traces, structured logs, events, and debug responses
- [2026-06-10T06:45:00Z] - `GET /api/health?section=rate-limit` — detailed rate limit introspection
  Reason: expose current IP usage, email dedup cache size, window reset times, and hard limit thresholds for production observability (consolidated into health endpoint to respect Vercel Hobby 12-function cap)
  Impact: same data as a dedicated endpoint, zero additional functions
- [2026-06-10T06:45:00Z] - `GET /api/health?section=queue` — queue health with oldest request age
  Reason: expose queue depth, active worker count, oldest request age for backlog diagnostics (consolidated into health endpoint)
  Impact: same data as a dedicated endpoint, zero additional functions
- [2026-06-10T06:45:00Z] - `log.getTraceWithDeltas()` — per-stage ms delta computation
  Reason: improve debug mode with precise timing deltas between lifecycle steps (not just cumulative ms)
  Impact: developers can see exactly how many ms each stage takes, not just position from start
- [2026-06-10T06:45:00Z] - `rate-limit.getDetailedSnapshot()` — expanded rate limit state
  Reason: expose oldest entry age and window reset times alongside existing counters
  Impact: health and rate-limit-status endpoints show when windows will actually reset
- [2026-06-10T06:45:00Z] - `queue.getDetailedStats()` — oldest request tracking
  Reason: capture enqueue timestamps on every item to compute oldest request age
  Impact: queue-status endpoint reports backlog age in ms, sec, and min

### Changed
- [2026-06-10T06:45:00Z] - Debug mode lifecycle output: cumulative `ms` now paired with `deltaMs` per step
  Reason: developers need stage-level granularity, not just position-in-pipeline
  Impact: `?debug=true` response now includes `deltaMs` on every lifecycle entry (backward-compatible: `ms` preserved)
- [2026-06-10T06:45:00Z] - `log.structured()` and `log.event()` automatically include `testMode` when `req._testMode` is set
  Reason: eliminate repetitive parameter passing — test mode classification propagates naturally through all observability channels
  Impact: every structured log and event for test-mode requests carries `testMode` field automatically
- [2026-06-10T06:45:00Z] - `BackgroundQueue._process()` tracks `_activeItems` for accurate oldest-request computation
  Reason: without active-item tracking, items currently being processed are invisible to `getDetailedStats()`
  Impact: oldest request age now correctly reflects items in-flight, not just queued

### Removed
- [2026-06-10T06:45:00Z] - `api/rate-limit-status.js` — consolidated into `api/health.js?section=rate-limit`
  Reason: Vercel Hobby plan caps at 12 Serverless Functions; consolidation avoids plan upgrade
  Impact: zero data loss — same fields, same structure, accessed via `/api/health?section=rate-limit`
- [2026-06-10T06:45:00Z] - `api/queue-status.js` — consolidated into `api/health.js?section=queue`
  Reason: same consolidation strategy
  Impact: zero data loss — accessed via `/api/health?section=queue`
- [2026-06-10T06:45:00Z] - `api/sendBrief-upstash.js` — dead code (requires `@upstash/redis`, never installed)
  Reason: unused experimental variant occupying a function slot
  Impact: frees 1 function slot, no production effect

### Backward Compatibility
- `/api/health` default response (no `?section=`) is identical to v1.8.0 — zero breaking changes
- `?section=queue` and `?section=rate-limit` are additive query params on existing endpoint
- No existing response fields removed
- No existing logging APIs changed — `getTraceWithDeltas()` is a new export, `getTrace()` unchanged
- `x-test-mode` header is fully optional — absent header = `req._testMode = null`, no behavioral change
- `_activeItems` is internal state — no public API change to BackgroundQueue

---

### Added
- [2026-06-10T00:00:00Z] - Global structured logging via `log.structured()`
  Reason: production-grade observability with consistent timestamp, requestId, stage, status, durationMs across all lifecycle events
- [2026-06-10T00:00:00Z] - Lifecycle stage `queue.waitStart`
  Reason: measure queue entry latency (time between queue.assign and worker pickup)
- [2026-06-10T00:00:00Z] - Lifecycle stage `queue.waitEnd`
  Reason: measure queue wait duration (time spent in queue before processing)
- [2026-06-10T00:00:00Z] - Lifecycle stage `email.sendStart`
  Reason: track when SMTP transmission begins for performance monitoring
- [2026-06-10T00:00:00Z] - Lifecycle stage `email.sendEnd`
  Reason: track SMTP completion and detect silent failures
- [2026-06-10T00:00:00Z] - Performance metrics per response: `totalRequestTimeMs`, `queueWaitTimeMs`, `processingTimeMs`
  Reason: expose request timing to clients for latency diagnostics
- [2026-06-10T00:00:00Z] - Rate limit response fields: `resetTime` (ISO timestamp), `retryAfterSeconds`
  Reason: give clients precise timing information for retry scheduling
- [2026-06-10T00:00:00Z] - Health endpoint `GET /api/health`
  Reason: expose queue state, rate limit snapshot, instance metadata, and memory usage for production monitoring
- [2026-06-10T00:00:00Z] - `rate-limit.getSnapshot()` for health endpoint data
  Reason: expose internal rate limiter state without breaking encapsulation

### Backward Compatibility
- No existing response fields removed
- No existing logging APIs changed
- New fields additive to existing response payloads
- `log.event()` unchanged — `log.structured()` is an additional output channel

---

## [v1.7.0] - 2026-06-08

### Added
- SaaS Runtime Layer v1 (lib/runtime/index.js) — central runtime orchestrator
- Full pipeline execution: Plan → Design System → Preview → Scoring → Scaffold → Deploy
- State machine enforcement with valid transition checks (draft→processing→preview→approved→deploying→deployed)
- PostgreSQL persistence at every step (executions, project_states, decisions, previews)
- Retry logic with exponential backoff (up to 3 attempts per step)
- Step timeout protection (120s per step)
- Project state rollback on pipeline failure
- 5-dimension scoring engine inline: contrast, UX, conversion, clarity, SEO
- Automatic preview record creation with version tracking
- Decision records with full metrics and warnings
- API v1 (api/v1/) — 7 clean REST endpoints:
  - POST /api/v1/projects/create — create project + trigger pipeline
  - GET /api/v1/projects — list projects per workspace (tenant-safe)
  - GET /api/v1/projects/:id — full project state with ?include=inputs,previews,states,decisions
  - POST /api/v1/projects/:id/run — manually trigger pipeline execution
  - POST /api/v1/projects/:id/approve — approve preview → scaffold → deploy
  - GET /api/v1/projects/:id/preview — preview output (JSON, HTML, or CSS format)
  - GET /api/v1/executions/:id — pipeline logs with AI decisions
- Tenant safety on every API route: workspace_id isolation + user membership validation
- Form data extraction and persistence to project_inputs table on project creation
- Branding color extraction from formData (supports branding_colors object and brand_colores string)
- extractRuntimeState() — unified project state with previews, states, decisions, inputs

### Notes
This is the first runtime release (v1.7.0) that converts the architectural design from v1.6.0 into executable code. Existing engines remain unchanged — the runtime orchestrates them through a unified pipeline.

---

## [v1.6.0] - 2026-06-08

### Added
- Complete multi-tenant SaaS architecture design (ARCHITECTURE-SAAS.md)
- Full PostgreSQL schema with 14 tables: workspaces, users, workspace_members, projects, project_inputs, project_states, previews, deployments, executions, decisions, artifacts, webhook_events, api_keys, form_responses (legacy)
- Row-Level Security (RLS) tenant isolation strategy with workspace-scoped data
- Decision Scoring Engine v2 specification — 5-dimension AI evaluation (contrast 25%, UX 25%, conversion 20%, clarity 15%, SEO 15%)
- Automatic improvement loop with up to 2 regeneration attempts on score < 50
- Project lifecycle state machine: DRAFT → PROCESSING → PREVIEW → APPROVED → DEPLOYING → DEPLOYED (with FAILED and REJECTED branches)
- Workspace model with 4 roles: owner, admin, member, viewer
- Billing plan tiers: Free (3 projects), Starter (15), Pro (50), Enterprise (unlimited)
- GitHub + Vercel integration design — auto-repo creation, auto-commit, preview vs production branches
- Live preview system with Redis TTL caching, design system token injection, approval gating
- Async job queue architecture via Bull/Redis for non-blocking AI pipeline
- Vercel API client specification (lib/deployment/vercel.js)
- Stripe billing adapter specification (lib/billing/)
- Rate limiting middleware with per-plan limits
- SQL migration script (data/migrations/003_saas_schema.sql) — 14 tables + triggers + functions + indexes
- Versioning model with rollback support (deployments store commit SHAs)
- Preview versioning (max 10 per project, auto-cleanup)
- Amplified pipeline flow from user input through GitHub repo creation to Vercel deployment

### Notes
This is a design-phase release (v1.6.0). No engines were modified — the existing system remains fully compatible. All new modules are documented in ARCHITECTURE-SAAS.md and ready for implementation.

---

## [v1.5.0] - 2026-06-08

### Added
- Project Loader Engine v1 (lib/loader/index.js) — read-only project reconstruction from PostgreSQL
- loadProject() — full project data with section-grouped form responses
- rebuildPromptMaestro() — reconstructs Prompt Maestro string from stored data
- getProjectState() — complete pipeline state combining DB + filesystem sources
- listProjects() — enumerates all projects in the database
- SQL migration (data/migrations/002_create_projects_executions.sql) — optional
- Multi-source data reconstruction: form_responses + decisions.json + optional tables
- Spanish/English bilingual Prompt Maestro reconstruction
- 65+ field labels for human-readable key mapping

### Notes
This version adds the final read layer, completing the full CRUD cycle: Compiler → Plan → Scaffold → Persist → Load.

---

## [v1.4.0] - 2026-06-08

### Added
- Form Persistence Layer v1 (lib/db/formResponses.js) — saves all Brief Maestro responses to PostgreSQL
- Database connection module (lib/db/index.js) — Neon PostgreSQL pool with SSL
- SQL migration script (data/migrations/001_create_form_responses.sql)
- form_responses table with project_id, section, field_key, value columns
- Automatic field-to-section mapping by prefix (biz_*, obj_*, brand_*, etc.)
- Array-to-comma-separated conversion for checkboxes and tags
- Non-blocking persistence in api/sendBrief.js (DB failure doesn't block email)
- generateProjectId() for unique project identification
- getResponsesGrouped() for section-grouped queries

### Notes
This version adds the persistence layer before the Orchestrator pipeline, ensuring all user responses are stored in PostgreSQL for analysis and auditing.

---

## [v1.3.0] - 2026-06-08

### Added
- Decision Layer v1 (lib/decision/index.js) — architectural decision recording system
- Deployment Engine v1 (lib/deployment/index.js) — automated Git/GitHub pipeline
- Orchestrator Engine v1 (lib/orchestrator/index.js) — central controller for all modules
- Persistent storage via data/deployments.json (auto-creating)
- initRepository(), commitProject(), createGitHubRepo(), pushToRemote() API
- deployFullPipeline() for end-to-end deployment orchestration
- Graceful degradation when Git or GitHub CLI is unavailable
- Deployment status tracking (deployed/failed/pending)
- Dynamic input type detection (raw_email, structured_prompt, json_brief, existing_project)
- Dynamic pipeline building based on input type
- Session-based state management with step-by-step results
- Automatic Decision Layer logging on module failure

### Notes
This version adds the complete deployment pipeline and central orchestrator, finalizing the Project Factory system.

---

## [v1.2.0] - 2026-06-08

### Added
- Project Scaffold Engine v1 (lib/scaffold/)
- Project Plan Engine v1 (lib/plan/) — semantic compiler
- Deterministic filesystem project generator
- Modular architecture: engine.js, generators/, templates/registry.js
- Template system with html, readme, agents, architecture, changelog, gitignore
- Zero external dependencies (native Node.js only)
- Semantic IR mapping (14 sections → 8 semantic categories)

### Notes
This version adds both the physical (scaffold) and logical (plan) layers for project generation.

---

## [v1.1.0] - 2026-06-08

### Added
- Intelligent Brief Validation Engine
- UX Flow Engine (dynamic user journey optimization)
- SEO Auto-Layer system
- Copy Quality Booster
- Enhanced Agent Pack internal reasoning system

### Improved
- Prompt Maestro output quality
- Site structure consistency
- Conversion-oriented copywriting
- SEO readiness by default

### Notes
This version transforms Agent Pack from a static generator into a structured intelligence system for website creation.

---

## [v1.0.0] - 2026-06-08

### Added
- Initial Agent Pack system
- Prompt Maestro structured system (14 sections)
- AGENTS.md workflow rules system
- ARCHITECTURE.md system design documentation
- Git-based version control integration

### Notes
Initial stable version of AI site generation system.
