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
├── index.html                 # Portfolio landing page
├── brief-maestro.html         # 14-section strategic questionnaire
├── dashboard.html             # Project list (status badges, create, auto-refresh)
├── dashboard-project.html     # Project control center (pipeline tracker, scoring)
├── dashboard-logs.html        # Execution logs + AI decision viewer
├── dashboard-preview.html     # Preview renderer (iframe, approval)
├── dashboard-api.js           # Shared API v1 integration layer
├── test-data.json             # Test fixture (Salmos Café)
├── public/scripts/
│   ├── sendBrief-payload.js        Shared utility — production-grade payload builder (zero E2E dep)
│   ├── e2e-brief-bypass-wizard.js  Testing layer — E2E tooling, uses payload builder
│   └── load-e2e.js                 Legacy dynamic loader
│
├── api/
│   ├── sendContact.js         # Contact form (2 emails, queue-based)
│   ├── sendBrief.js           # Brief submission (2 emails + PDF, queue-based)
│   ├── health.js              # Health + aggregate metrics endpoint
│   ├── logs.js                # Request registry listing
│   ├── projects/              # Dashboard API (legacy)
│   └── v1/                    # SaaS API v1 (tenant-safe)
│
├── lib/
│   ├── queue.js               # BackgroundQueue class (FIFO, concurrency 1, retry 3)
│   ├── rate-limit.js          # EdgeCheck, sliding window, email dedup, honeypot, timing
│   ├── request-registry.js    # Lifecycle registry (memory → Neon → Redis, 3-tier)
│   ├── logger.js              # Structured JSON logging, lifecycle tracing
│   ├── safeBodyParser.js      # Body parser (req.body object/string → stream fallback)
│   ├── compiler/              # Unified Brief Compiler v1
│   ├── plan/                  # Plan Engine v1 (semantic compiler)
│   ├── scaffold/              # Scaffold Engine v1 (filesystem generator)
│   ├── decision/              # Decision Layer v1 (architectural log)
│   ├── orchestrator/          # Orchestrator Engine v1 (central controller)
│   ├── runtime/               # SaaS Runtime Layer v1 (pipeline orchestrator)
│   ├── db/
│   │   ├── index.js           # Pool + query + connection management (Neon PG)
│   │   ├── formResponses.js   # Form Persistence Layer (save brief form data to PG)
│   │   └── requestLogs.js     # Request lifecycle persistence (save/read lifecycle to PG)
│   ├── loader/                # Project Loader Engine v1 (read-only)
│   ├── design-system/         # Design System Engine v1
│   └── preview/               # Visual Preview Engine v1
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

### 5c. Observability Endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/health` | Queue, lifecycle, rate-limit summary, instance info, memory |
| `GET /api/health?section=queue` | Queue depth, active workers, throughput, lifecycle aggregates |
| `GET /api/health?section=rate-limit` | IP entries, email dedup cache, thresholds, window info |
| `GET /api/logs?limit=20` | Recent request registry entries + aggregate metrics |
| `GET /api/logs?id=<requestId>` | Single lifecycle entry (or 404) |

**Important**: Each `api/` file is a separate Vercel Function instance. They do NOT share memory. Health endpoint will NOT see lifecycle data from sendContact's instance.

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Upsert**: `ON CONFLICT (request_id) DO UPDATE SET status = EXCLUDED.status, ...`

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
COMPILER (lib/compiler/) — Unified Brief Compiler
    ↓
PLAN (lib/plan/) — Semantic IR (JSON blueprint)
    ↓
SCAFFOLD (lib/scaffold/) — Filesystem generator (index.html, assets/, README, AGENTS, ARCHITECTURE, CHANGELOG, .gitignore)
    ↓
FORM SAVER (lib/db/formResponses.js) — Persists to Neon (non-blocking, pre-orchestrator)
    ↓
ORCHESTRATOR (lib/orchestrator/) — Central controller, coordinates all engines
    ↓
DEPLOYMENT (lib/deployment/) — Git init, commit, GitHub repo, push (optional)
```

**SaaS Runtime Layer** (`lib/runtime/` + `api/v1/`): Multi-tenant pipeline with workspace isolation, project lifecycle (DRAFT→PROCESSING→PREVIEW→APPROVED→DEPLOYING→DEPLOYED), scoring, preview, and billing.

---

## 17. Known Issues

- Gmail App Password may expire — must regenerate if emails fail to send
- Vercel Serverless Functions do NOT share memory — cross-function observability requires Neon/Redis
- `GET /api/health` and `POST /api/sendContact` are separate instances — health sees 0 lifecycle from contact
- Non-UUID `workspace_id` is rejected immediately with `INVALID_ID_FORMAT` (no hashing, no conversion)

---

## 18. Historical Decisions (Why Things Are This Way)

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

## 19. COPY THIS TO ANOTHER AI — Quick Start

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
```
