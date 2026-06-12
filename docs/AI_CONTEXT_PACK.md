# AI Context Pack — JIC Portfolio + Brief Maestro + SaaS Pipeline

> Single-source-of-truth for external AI agents. Read this when starting work on this project.

## 1. Project Identity

- **Purpose**: Dual-purpose Vercel site: (a) professional portfolio for Javier Ibrahim a.k.a. JIC, (b) Brief Maestro web discovery tool, (c) SaaS project pipeline with dashboards.
- **Primary Objective**: Lead generation + client onboarding via contact forms, AI brief collection, automated email, PDF brief generation, and AI-powered project scaffolding.
- **Repo name**: `build-a-brief`
- **Domain**: `javiers.work` (Vercel)
- **Hosting**: Vercel (Serverless Functions, auto-deploy from `git push origin main`)

---

## 2. Architecture Overview

```
Browser (vanilla HTML/CSS/JS)
    │
    ├── index.html ────────── POST /api/sendContact ──► Vercel Function ──► Gmail SMTP
    │                                                       │
    └── brief-maestro.html ── POST /api/sendBrief ──────────┤
                                                            │
    dashboard-*.html ─────── GET /api/health ───────────────┤
                            GET /api/logs ──────────────────┤
                            GET /api/v1/* ──────────────────► lib/runtime (SaaS)
```

**Two-layer execution model** (critical mental model):

```
Layer 1 — Network Gate (Rate Limit / Edge Protection)
  ├── IP sliding window (soft 30, hard 60 req/60s)
  ├── Email dedup (1 req/300s per address)
  ├── Honeypot detection (silent 200 for bots)
  └── Timing check (submittedAt validation)

Layer 2 — Execution Layer (Internal Queue Scheduler)
  ├── FIFO in-memory queue (max depth 100, concurrency 1)
  ├── Background SMTP worker (admin + client emails)
  ├── Retry logic (3 attempts, exponential backoff 2s/4s/8s)
  └── Lifecycle tracing (7+ stages with deltaMs)
```

**Cardinal Rule**: Rate limit is independent of queue. 429 is NOT queued. Queue only sees traffic that passed the gate.

---

## 3. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | No frameworks, no build step, no bundler |
| Typography | Google Fonts (Inter + Space Grotesk) | — |
| Icons | Inline SVG | No icon library |
| Styling | CSS Custom Properties | Native dark theme (no toggle), mobile-first |
| Runtime | Node.js 22.11.0 | Serverless Functions |
| Hosting | Vercel | Auto-deploy, no `vercel.json` needed |
| Email | nodemailer ^8.0.10 | Gmail SMTP (`service: 'gmail'`) |
| PDF | pdfkit ^0.18.0 | Server-side only, never client-side |
| Database | Neon PostgreSQL (serverless) | `pg` ^8.21.0 |
| Cache | Upstash Redis (optional) | `@upstash/redis` ^1.38.0 |
| Storage | localStorage | Brief auto-save (`briefMaestro`) |

---

## 4. Project Structure

```
/
├── public/
│   ├── index.html                 # Portfolio landing page
│   ├── brief-maestro.html         # 14-section strategic questionnaire
│   ├── dashboard.html             # Project list (status badges, create, auto-refresh)
│   ├── dashboard-project.html     # Project control center (pipeline tracker, scoring)
│   ├── dashboard-logs.html        # Execution logs + AI decision viewer
│   ├── dashboard-preview.html     # Preview renderer (iframe, approval)
│   ├── dashboard-api.js           # Shared API v1 integration layer
│   ├── test-data.json             # Test fixture (Salmos Café)
│   ├── icon.ico                   # Favicon
│   ├── scripts/
│   │   ├── sendBrief-payload.js        Shared utility — production-grade payload builder
│   │   ├── e2e-brief-bypass-wizard.js  Testing layer — E2E tooling, uses payload builder
│   │   └── load-e2e.js                 Legacy dynamic loader
│   ├── icon.ico                   # Favicon
│
├── api/
│   ├── sendContact.js         # Contact form (2 emails, queue-based)
│   ├── sendBrief.js           # Brief submission (2 emails + PDF, queue-based)
│   ├── health.js              # Health + aggregate metrics endpoint
│   ├── logs.js                # Request registry listing
│   └── v1/                    # SaaS API v1 (tenant-safe)
│
├── lib/
│   ├── queue.js               # BackgroundQueue class (FIFO, concurrency 1, retry 3)
│   ├── rate-limit.js          # EdgeCheck, sliding window, email dedup, honeypot, timing
│   ├── request-registry.js    # Lifecycle registry (memory → Neon → Redis, 3-tier)
│   ├── logger.js              # Structured JSON logging, lifecycle tracing
│   ├── safeBodyParser.js      # Body parser (req.body object/string → stream fallback)
│   ├── plan/                  # Plan Engine v1 (semantic compiler)
│   ├── scaffold/              # Scaffold Engine v1 (filesystem generator)
│   ├── decision/              # Decision Layer v1 (architectural log)
│   ├── runtime/               # SaaS Runtime Layer v1 (pipeline orchestrator)
│   ├── db/
│   │   ├── index.js           # Pool + query + connection management (Neon PG)
│   │   ├── formResponses.js   # Form Persistence Layer (save brief form data to PG)
│   │   └── requestLogs.js     # Request lifecycle persistence (save/read lifecycle to PG)
│   ├── compiler/              # (planned) Unified Brief Compiler v1
│   ├── orchestrator/          # (planned) Orchestrator Engine v1 (central controller)
│   ├── loader/                # (planned) Project Loader Engine v1 (read-only)
│   ├── design-system/         # Design System Engine v1
│   ├── preview/               # Visual Preview Engine v1
│
├── data/
│   ├── decisions.json         # Architectural decision records
│   ├── deployments.json       # Deployment records
│   └── migrations/            # SQL migration scripts
│
├── docs/
│   ├── AI_CONTEXT_PACK.md     # ← This file. Start here.
│   ├── ARCHITECTURE_OVERVIEW.md
│   ├── E2E_SYSTEM.md
│   ├── TESTING_GUIDE.md
│   ├── API_FLOW.md
│   ├── ARCHITECTURE.md
│   ├── CI-CD-VERCEL-GITHUB.md
│   ├── DEPLOYMENT-RECOVERY.md
│   ├── CONTEXT.md
│   └── sendContact-context.md
│
├── AGENTS.md                  # Operational instructions (1010 lines, broad scope)
├── ARCHITECTURE.md            # Legacy architecture (667 lines, partially outdated)
├── ARCHITECTURE-SAAS.md       # SaaS multi-tenant design
├── CHANGELOG.md               # Version history
└── package.json               # Dependencies: nodemailer, pdfkit, pg, @upstash/redis, dotenv
```

---

## 5. API Endpoints

### 5a. `POST /api/sendContact` — Contact Form

**Payload**:
```json
{
  "name": "string (required, validated + sanitized)",
  "email": "string (required, valid email format)",
  "company": "string (optional)",
  "project": "string (optional)",
  "message": "string (required, not empty)",
  "lang": "es|en",
  "submittedAt": "number (timestamp, required for timing check)"
}
```

**Honeypot field** (hidden in form, bots fill it): `<input name="bot" style="display:none">`

**Validation order**: body parse → honeypot → timing → name sanitize → email validate → message validate → edge rate limit → email dedup

**Responses**:
| Code | Body | Meaning |
|---|---|---|
| 200 | `{ success: true, status: "processed", requestId }` | Bots (honeypot) — silent success |
| 202 | `{ success: true, status: "queued", requestId, queuePosition, queueDepth }` | Queued for async processing |
| 400 | `{ success: false, error: "INVALID_BODY" or "INVALID_REQUEST" }` | Validation failure |
| 429 | `{ success: false, error: "RATE_LIMITED", retryAfterMs }` | Rate limit hit |
| 500 | `{ success: false, error: "Email service misconfigured" }` | Missing env vars |

**Emails sent** (by queue worker):
1. Admin notification → `GMAIL_USER` (to)
2. Client confirmation → `[email, GMAIL_USER]` (to) — NOT CC

**GET `?id=<requestId>`**: Returns lifecycle record or 404.

### 5b. `POST /api/sendBrief` — Brief Maestro Submission

**Payload**:
```json
{
  "name": "string (required, validated + sanitized)",
  "email": "string (required, valid email)",
  "company": "string (optional)",
  "phone": "string (optional)",
  "prompt": "string (required, generated by generatePrompt())",
  "lang": "es|en",
  "formData": "object (all 14 sections, saved to Neon form_responses)",
  "submittedAt": "number (timestamp)"
}
```

**Same validation pipeline** as sendContact + prompt validation.

**Responses**: Same codes as sendContact (202 → async queue, 400 → validation, 429 → rate limit).

**Emails sent** (by queue worker):
1. Admin notification with PDF attachment → `GMAIL_USER`
2. Client confirmation → `[email, GMAIL_USER]`

**Before queue**: PDF generated synchronously, form responses persisted to Neon `form_responses` table (non-blocking, best-effort — failure does not block email).

### 5c. Observability Endpoints (Consolidated)

All observability is served by a single endpoint to save serverless function slots:

| Endpoint | Returns |
|---|---|
| `GET /api/telemetry?type=logs&limit=20` | Recent request registry entries + aggregate metrics |
| `GET /api/telemetry?type=logs&id=<requestId>` | Single lifecycle entry (or 404) |
| `GET /api/telemetry?type=traces&id=<requestId>` | Validation path trace events (merged: memory + Neon) |
| `GET /api/telemetry?type=coverage` | True system coverage: 27 pathIds, merged memory + 24h Neon history |
| `GET /api/telemetry?type=range&hours=24` | Aggregated trace analytics: per-path hit counts, hourly buckets |
| `GET /api/telemetry?type=health` | Queue, lifecycle, rate-limit summary, instance info, memory |
| `GET /api/telemetry?type=health&section=queue` | Queue depth, active workers, throughput, lifecycle aggregates |
| `GET /api/telemetry?type=health&section=rate-limit` | IP entries, email dedup cache, thresholds, window info |

**Important**: Each `api/` file is a separate Vercel Function instance. They do NOT share memory. Telemetry bridges cross-instance gaps via Neon persistence — e.g. `?type=coverage` merges per-instance memory with cross-instance Neon data.

**Removed endpoints (v1.6.0)**: `GET /api/health`, `GET /api/logs`, `GET /api/traces` — all consolidated into `GET /api/telemetry`.

---

## 6. Lifecycle State Machine

Every request gets a `requestId` (UUID), tracing through these states:

| State | Description | Terminal |
|---|---|---|
| `queued` | Passed rate gate, enqueued in FIFO | No |
| `processing` | Worker dequeued, SMTP in progress | No |
| `completed` | Both emails sent successfully | Yes |
| `failed` | Email failure after 3 retries | Yes |
| `rejected` | Pre-queue (validation, rate-limit, bad-request, honeypot) | Yes |

**Timestamps captured**: `receivedAt`, `queuedAt`, `executionStartedAt`, `executionFinishedAt`

**Derived metrics** (computed + persisted): `queueWaitTimeMs`, `executionDurationMs`, `totalLifecycleTimeMs`

**`lifecycle.complete` emission**: Single point in `queue.js:_process()` — fires on both `completed` and `failed` (after retry exhaustion or queue exception).

**`executionStartedAt` single source**: `queue.js:52` — set when work leaves queue, not when handler starts.

---

## 7. Rate Limiting

### Edge Protection (IP-based sliding window)
- **Soft limit**: 30 requests / 60 seconds — emits `X-RateLimit-Soft` headers, does not block
- **Hard limit**: 60 requests / 60 seconds — blocks with 429
- State: per-instance in-memory Map (`ipLog`)
- Cleanup: every 5 minutes, evicts entries older than 2 windows

### Email Dedup
- 1 request per email per 300 seconds
- State: per-instance in-memory Map
- 429 on duplicate

### Honeypot
- Hidden field `bot` — if filled, returns 200 with `success: true` (silent block)

### Timing Check
- Client sends `submittedAt` (epoch ms)
- If the elapsed time (now - submittedAt) exceeds a threshold, rejects as bot
- 400 response

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 15  (seconds until window reset)
Retry-After: 15
X-RateLimit-Scope: edge
```

### Soft Limit Headers (added when soft threshold crossed)
```
X-RateLimit-Soft: 1
X-RateLimit-Soft-Remaining: 28
X-RateLimit-Soft-Limit: 30
```

### Redis Rate Limiting (sendBrief only)
- Falls back to Redis-based sliding window if `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set
- Returns `null` if Redis unavailable (falls through to in-memory)

---

## 8. Email System

### Transport
- Nodemailer with Gmail SMTP (`service: 'gmail'`)
- `transporter.verify()` before sending
- 5-second timeout per email (`EMAIL_TIMEOUT_MS = 5000`)
- Retries: 3 attempts (2s / 4s / 8s exponential backoff)

### Email Templates
- Table-based HTML layout for email client compatibility
- Inline styles with `bgcolor` fallback for Outlook
- Dark mode via `@media (prefers-color-scheme: dark)`
- Inline translations via `t(es, en)` helper function
- `escapeHTML()` on all user-provided values
- "JIC" logo with gradient `#00D4FF → #00FFC8` in header and signature
- Client confirmation uses human, conversational tone (no AI-style or corporate jargon)
- Timestamp in `America/Tijuana` timezone

### Email Delivery Rule
Client confirmation sent as:
```
to: [clientEmail, GMAIL_USER]
```
NOT CC. (More reliable delivery with Gmail SMTP.)

---

## 9. PDF Generation

- **When**: Generated synchronously in `sendBrief.js` before queue enqueue
- **Library**: PDFKit (`pdfkit` ^0.18.0)
- **Page**: A4, 50px margins
- **Filename**: `brief-{business_name}.pdf` (business name sanitized: `[^a-zA-Z0-9\u00C0-\u024F]`)
- **Content**: Renders the full prompt as a formatted document
- **Attached to**: Admin notification email only
- **Never**: Generated on client side

---

## 10. Database Schema

### 10a. `request_logs` (Neon PostgreSQL) — Lifecycle persistence

```sql
CREATE TABLE request_logs (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  endpoint VARCHAR(64),
  received_at BIGINT,
  queued_at BIGINT,
  execution_started_at BIGINT,
  execution_finished_at BIGINT,
  queue_position INT,
  queue_depth INT,
  queue_wait_ms INT,
  execution_duration_ms INT,
  total_lifecycle_ms INT,
  payload_sanitized TEXT,
  error_reason TEXT,
  validation_stage TEXT,
  validation_field TEXT,
  validation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Upsert**: `ON CONFLICT (request_id) DO UPDATE SET status = EXCLUDED.status, ...`

**Validation fields** (added via migration `007_add_validation_columns.sql`): `validation_stage`, `validation_field`, `validation_reason`. Populated by `sendBrief.js` when a request is rejected with `status: 'rejected'`. Exposed via `_rowToApi()` and rendered in `dashboard-logs.html` when `status === 'rejected'`. Backward compatible — old rows have `NULL`.

### 10b. `form_responses` (Neon PostgreSQL) — Brief form data

```sql
CREATE TABLE form_responses (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  section VARCHAR(64) NOT NULL,
  field_key VARCHAR(128) NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Field→Section mapping** (auto-detected by prefix):

| Prefix | Section |
|---|---|
| `biz_*` | business |
| `obj_*` | goals |
| `comp_*` | competition |
| `pub_*` | audience |
| `brand_*` | branding |
| `arq_*` | site |
| `cont_*` | content |
| `serv_*` | services |
| `social_*` | social_proof |
| `func_*` | functionality |
| `seo_*` | seo |
| `ref_*` | references |
| `conv_*` | conversion |
| `ai_*` | essence |

---

## 11. Data Persistence Layers (3-tier)

| Tier | Storage | Purpose | TTL |
|---|---|---|---|
| **Memory** | `Map()` in `request-registry.js` | Fastest, per-instance | 5 min (1,000 max entries) |
| **Neon PG** | `request_logs` table | Source of truth, cross-instance | Permanent |
| **Redis** | Upstash Redis | Fallback if Neon unavailable | 7 days |

**Write flow**: write(entry) → memory → Redis → Neon (async, fire-and-forget, never blocks API)

**Read flow**: read(requestId) → memory (fast) → Neon (source of truth) → Redis (fallback)

**Cleanup**: Memory eviction every 60s, on lookup expiry, on aggregate computation.

### Validation Failure Persistence

Validation failures (`status: 'rejected'`) carry 3 diagnostic fields that must survive across Vercel function instances:

**Flow**: `sendBrief.js` / `sendContact.js` → `request-registry.registerLifecycle()` → in-memory Map → `persistImmediate()` (awaited) → `request_logs` table (columns `validation_stage`, `validation_field`, `validation_reason`) → `api/logs` (reads from Neon) → `dashboard-logs.html` (`renderRegistryEntry()`)

**New columns**:

| Column | maps from `entry.*` | Example |
|---|---|---|
| `validation_stage` | `validationStage` | `validateEmail` |
| `validation_field` | `validationField` | `email` |
| `validation_reason` | `validationReason` | `invalid_format` |

**Why cross-instance persistence matters**: `sendBrief.js` and `logs.js` are separate Vercel function instances. The in-memory registry Map is per-instance. Without Neon persistence, a request to `logs.js` (different instance) cannot see validation details written by `sendBrief.js`. Neon bridges this gap as the shared source of truth.

### Trace Event Persistence (v1.5.0)

Each validation rejection path records a deterministic trace event to `request_traces` table (Neon):

| Field | Type | Example |
|---|---|---|
| `request_id` | VARCHAR(64) | `0195d8c0-...` |
| `path_id` | VARCHAR(128) | `sendContact:validateEmail` |
| `endpoint` | VARCHAR(32) | `sendContact` |
| `stage` | VARCHAR(64) | `validateEmail` |
| `timestamp` | BIGINT | `1718200000123` |

**Two-tier architecture**: In-memory Map (fast, 5min TTL) + Neon `request_traces` (persistent, cross-instance).

**Non-blocking guarantee**: Trace writes are ALWAYS fire-and-forget — unlike `persistImmediate()` which awaits Neon on validation reject paths. Tracing never impacts request latency.

**Unique constraint**: `UNIQUE (request_id, path_id)` — a single request cannot produce duplicate trace events for the same path.

**Coverage**: `GET /api/telemetry?type=coverage` returns merged coverage from memory (live) + Neon (24h history), producing `source: 'merged'` with breakdown.

**Range analytics**: `GET /api/telemetry?type=range&hours=24` returns per-path hit counts, first/last seen, and hourly bucket stats.

**Files**:
- `lib/tracer.js` v2 — in-memory + Neon persistence
- `lib/db/requestTraces.js` — Neon CRUD for request_traces
- `data/migrations/008_request_traces.sql` — table + indexes
- `api/traces.js` v2 — merged traces + range analytics

**Backward compatibility**: Old `request_logs` rows have `NULL` for all 3 validation columns. The dashboard renderer checks for their presence before displaying.

**Production verification**: Both endpoints verified in production:
- `docs/VALIDATION_PERSISTENCE_VERIFICATION.md` — sendBrief (commit `42efb28`), all 11 paths covered
- `docs/SENDCONTACT_PERSISTENCE_VERIFICATION.md` — sendContact (commit `94c5a8b`), 7/8 reachable paths confirmed PASS
- `docs/REQUEST_PERSISTENCE_AUDIT_FINAL.md` — final release audit confirming 100% deterministic persistence across 23 total paths

---

## 12. Client Retry Strategy (Contact Form)

Frontend auto-retry on 429:

| Attempt | Delay | Cumulative |
|---|---|---|
| 1 | 0ms | 0ms |
| 2 | 1,000ms | 1,000ms |
| 3 | 2,000ms | 3,000ms |
| 4 | 4,000ms | 7,000ms |

- Only HTTP 429 triggers retries. Other errors surface immediately.
- Each retry is a fresh HTTP request (must pass rate limit gate independently).
- UI shows localized countdown: `"Reintentando envío... (Intento 2 de 4)"`.

---

## 13. E2E Testing

Global functions available on all pages:

### Architecture: Shared Utility + Testing Layer

The payload builder lives in **`public/scripts/sendBrief-payload.js`** (shared utility, production-grade, zero E2E dependencies). The E2E testing layer lives in **`public/scripts/e2e-brief-bypass-wizard.js`** and depends on the shared utility — not the other way around.

| Layer | File | Purpose |
|---|---|---|
| Shared Utility | `sendBrief-payload.js` | Defines `window.buildSendBriefPayload()` — used by production and testing |
| Testing Layer | `e2e-brief-bypass-wizard.js` | Defines `runBriefE2E()`, `runBriefE2EConsole()`, `ensureE2E()` — uses builder from shared utility |

`brief-maestro.html` loads `sendBrief-payload.js` first, then the E2E script. If the E2E script fails to load, `submitContact()` continues working because the payload builder is already on `window`.

### `buildSendBriefPayload(opts)` — Unified Payload Builder (in `sendBrief-payload.js`)
Single source of truth for all `/api/sendBrief` payloads. Called by wizard, direct API, and console flows. Always includes `submittedAt: Date.now()`, deep copies `formData` (no mutation), emits `[PAYLOAD:SOURCE]` debug logs. Parameters: `{ name, email, company, phone, message, prompt, formData, lang, source }`.

### `runBriefE2E(mode, contactInfo?, dataOverride?)` (in `e2e-brief-bypass-wizard.js`)
- **Mode 1**: Via `submitContact()` DOM function (requires brief-maestro.html)
- **Mode 2**: Direct API fetch (works from any page, delegates to shared builder)

### `runBriefE2EConsole(data)` (in `e2e-brief-bypass-wizard.js`)
- Self-contained console API (no DOM, no globals). Uses shared builder via `window.buildSendBriefPayload()`. Returns `{ response, body, elapsed, validation }`. Never generates null/empty prompt — defaults to `"E2E validation prompt for brief submission testing"`.

### `ensureE2E()`
- Verifies E2E module loaded correctly

---

### Diagnosing INVALID_REQUEST

Every `/api/sendBrief` validation failure registers in the request registry with the exact stage. Query via `GET /api/telemetry?type=logs&id=<requestId>`:

```json
{
  "requestId": "uuid",
  "status": "rejected",
  "reason": "validation",
  "validationStage": "validatePrompt",
  "validationField": "prompt",
  "validationReason": "Prompt cannot be empty",
  "receivedAt": 1718000000000
}
```

| Field | Possible values |
|---|---|
| `validationStage` | `timingCheck`, `sanitizeAndValidateName`, `validateEmail`, `validatePrompt` |
| `validationField` | `submittedAt`, `name`, `email`, `prompt` |
| `validationReason` | Human-readable failure description |

The same data is also logged to Vercel stdout as `{ "type": "observability", "event": "validation.failed", "stage": "...", ... }` for real-time tailing via `vercel logs --follow`.

---

## 14. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GMAIL_USER` | Yes | Gmail address for SMTP auth |
| `GMAIL_APP_PASSWORD` | Yes | Gmail app password |
| `DATABASE_URL` | For Neon | PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | Optional | Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Redis REST token |
| `RL_EDGE_SOFT` | No | Soft limit (default 30) |
| `RL_EDGE_HARD` | No | Hard limit (default 60) |
| `RL_EDGE_WINDOW_MS` | No | Window in ms (default 60000) |
| `DEBUG_API` | No | Enable debug logging (`true`) |
| `DEBUG_RATE_LIMIT` | No | Enable rate-limit debug headers |
| `VERCEL_REGION` | Auto | Set by Vercel |

---

## 15. Browser localStorage Keys

| Key | Purpose | Persists |
|---|---|---|
| `briefMaestro` | Full form data object | Yes |
| `briefMaestroLang` | Language (`es`/`en`) | Yes |
| `briefMaestroAuto` | Auto-navigate flag (test data) | No — deleted after use |

`currentStep` is NOT persisted — always starts at 0 on reload.

---

## 16. Engine Pipeline (Agent Pack v1.1+)

```
INPUT (raw_email / structured_prompt / json_brief)
    ↓
COMPILER (lib/compiler/) — (planned) Unified Brief Compiler
    ↓
PLAN (lib/plan/) — Semantic IR (JSON blueprint)
    ↓
SCAFFOLD (lib/scaffold/) — Filesystem generator (index.html, assets/, README, AGENTS, ARCHITECTURE, CHANGELOG, .gitignore)
    ↓
FORM SAVER (lib/db/formResponses.js) — Persists to Neon (non-blocking, pre-orchestrator)
    ↓
ORCHESTRATOR (lib/orchestrator/) — (planned) Central controller, coordinates all engines
    ↓
DEPLOYMENT (lib/deployment/) — Git init, commit, GitHub repo, push (optional)
```

**SaaS Runtime Layer** (`lib/runtime/` + `api/v1/`): Multi-tenant pipeline with workspace isolation, project lifecycle (DRAFT→PROCESSING→PREVIEW→APPROVED→DEPLOYING→DEPLOYED), scoring, preview, and billing.

---

## 17. Known Issues

- Gmail App Password may expire — must regenerate if emails fail to send
- Vercel Serverless Functions do NOT share memory — cross-function observability requires Neon/Redis
- `GET /api/telemetry` and `POST /api/sendContact` are separate instances — telemetry sees 0 lifecycle from contact's in-memory registry (Neon persists cross-instance for logs/traces)
- Non-UUID `workspace_id` is rejected immediately with `INVALID_ID_FORMAT` (no hashing, no conversion)
- **Body parse fail path (sendContact path 2)**: Vercel edge intercepts invalid JSON before the function runs. When `Content-Type: application/json` body is not valid JSON, Vercel returns 400 with empty body — our code never executes. This is a platform limitation, not a bug.

---

## 18. Database Migration Strategy

### Location

All migrations live in `data/migrations/` as sequential SQL files prefixed with a 3-digit number. Each file is additive — no destructive operations.

```
data/migrations/
├── 001_create_form_responses.sql
├── 002_create_projects_executions.sql
├── 003_saas_schema.sql
├── 004_normalize_execution_status.sql
├── 005_narrow_project_status_check.sql
├── 006_request_logs.sql
├── 007_add_validation_columns.sql
└── migration-005-report.md
```

### How to execute

```bash
# Apply a single migration
psql $DATABASE_URL -f data/migrations/006_request_logs.sql

# Apply all pending migrations (in order)
for f in data/migrations/[0-9][0-9][0-9]_*.sql; do
  echo "Applying $f..."
  psql $DATABASE_URL -f "$f"
done
```

`$DATABASE_URL` must be the Neon PostgreSQL connection string.

### How to validate

```sql
-- Check migration was applied
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'request_logs'
ORDER BY ordinal_position;
```

New columns (`validation_stage`, `validation_field`, `validation_reason`) should appear in the result.

### Naming conventions

| Rule | Example |
|---|---|
| Prefix with 3-digit sequence | `007_add_validation_columns.sql` |
| Use snake_case for the description | `add_validation_columns` |
| Use `IF NOT EXISTS` / `IF EXISTS` for idempotency | `ADD COLUMN IF NOT EXISTS …` |
| One concern per file | Never bundle unrelated schema changes |

### .gitignore rule

Migrations are tracked by negation — runtime data is ignored, scripts are not:

```gitignore
data/*
!data/migrations/
!data/migrations/*
```

New migration files placed in `data/migrations/` are automatically picked up by git.

---

## 19. Historical Decisions (Why Things Are This Way)

| Date | Decision | Rationale |
|---|---|---|
| 2026-06 | Netlify → Vercel | Native Node.js runtime for Nodemailer + PDFKit |
| 2026-06 | Nodemailer 8.0.10 | Security updates |
| 2026-06 | `to: [client, GMAIL_USER]` not CC | More reliable Gmail SMTP delivery |
| 2026-06 | `America/Tijuana` timezone | Owner's location |
| 2026-06 | Strict UUID for workspace, flexible for project | Eliminated uuidv5 hashing errors |
| 2026-06 | Queue + Rate limit as separate layers | 429 must never allocate queue state |
| 2026-06 | 3-tier persistence (memory → Neon → Redis) | Best-effort persistence must never block API |

---

## 20. COPY THIS TO ANOTHER AI — Quick Start

If you need to give this context to another AI agent, copy sections 1–7 and 10 above. The minimal set is:

```
Project: Vercel-deployed portfolio + brief builder. Two API endpoints (sendContact, sendBrief)
with a two-layer pipeline: rate-limit gate (IP+email sliding window, honeypot, timing) → 
async FIFO queue (concurrency 1, 3 retries) → SMTP. Lifecycle tracing through 5 states 
(queued/processing/completed/failed/rejected) persisted to memory→Neon→Redis. PDF generated 
server-side via PDFKit. Email via nodemailer + Gmail SMTP. Vanilla HTML/CSS/JS frontend.
3-tier observability: per-instance memory Map (5min TTL), Neon PostgreSQL (permanent), 
Upstash Redis (7 day fallback). Each api/* file is an isolated Vercel Function instance 
with no shared memory. Key env vars: GMAIL_USER, GMAIL_APP_PASSWORD, DATABASE_URL.
Validation persistence: Both sendBrief (11 paths) and sendContact (12 paths) persist validationStage/validationField/
validationReason to Neon via await persistImmediate() before returning 400/405/429/503 
responses — 100% deterministic across all 23 early-return paths. GET /api/telemetry?type=logs&id=<requestId> 
returns full diagnostics cross-instance. One platform limitation: Vercel edge intercepts invalid 
JSON before sendContact runs (path 2, body parse fail — no requestId returned).

Request tracing: 27 pathIds across both endpoints, each instrumented with tracer.trace() before 
every early return, on success (submitted), and on unexpected handler errors (handlerError). 
Two-tier storage: in-memory Map (5min TTL) + Neon request_traces table (auto-created on cold 
start via _ensureTable()). Drain is deterministic (array splice + finally block, silent in 
production). Coverage endpoint: /api/telemetry?type=coverage returns merged (memory + Neon 24h) 
across all 27 paths. Current coverage: ~30% (8/27) — remaining paths require diverse inputs 
(non-POST, bot patterns, invalid JSON, IP burst, PDF failure) not yet seen in testing.

---

## 21. Full Context Prompt (Ready to Copy)

If you want to give another AI the **complete context** of this project, copy the entire contents of this file (`docs/AI_CONTEXT_PACK.md`) and paste it as a system message or first message. The AI will then:

- Understand the two-layer execution model (rate gate → async queue)
- Know the 5 lifecycle states and 3-tier persistence
- Recognize the validation persistence pattern for both endpoints (23 total paths)
- Understand the request tracing architecture (25 pathIds, two-tier storage, auto-table-creation)
- Be aware of the Vercel platform limitations (no shared memory, body parse edge intercept)
- Know the project structure, API endpoints, DB schemas, email/PDF standards
- Understand the validation order and all reject paths
- Be able to diagnose INVALID_REQUEST responses via `/api/telemetry?type=logs&id=`
- Know the retry strategy, E2E testing utilities, and localStorage keys
- Be aware of the latest production-verified state (v1.7.0, audit scripts at `scripts/audit-validation-coverage.js` and `scripts/run-production-tests.js`)

---

## 22. Audit Script

An automated validation persistence audit tool exists at `scripts/audit-validation-coverage.js`.

```bash
# Run the audit (no dependencies required)
npm run audit

# Or directly:
node scripts/audit-validation-coverage.js
```

The script tests 9 validation reject scenarios across both endpoints, verifying that each one:
1. Returns an HTTP error with `requestId`
2. Persists `validationStage`, `validationField`, `validationReason` to Neon
3. Makes diagnostics available cross-instance via `GET /api/telemetry?type=logs&id=<requestId>`

Exit code: 0 if all pass, 1 if any fail. See `docs/REQUEST_PERSISTENCE_AUDIT_FINAL.md` for full audit documentation.

### Production Smoke Suite

A complementary test suite exists at `scripts/run-production-tests.js`:

```bash
node scripts/run-production-tests.js
```

This tests 4 end-to-end scenarios with unique email per run (`RUN_ID` env var):
1. Valid brief submission → 202
2. Valid contact submission → 202
3. Invalid email (brief) → 400 + trace persistence
4. Missing name (contact) → 400 + trace persistence

Also validates coverage endpoint returns `source: 'merged'` and trace events survive cross-instance lookup.

