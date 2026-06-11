# Architecture Overview — JIC Web Platform

## System Boundaries

The platform runs as a Vercel serverless deployment with four distinct layers:

| Layer | Technology | Lifetime | Persistence |
|---|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | Per-session (browser) | localStorage |
| API (Vercel Functions) | Node.js 22 | Per-request (cold start ~60s idle) | None |
| Queue | In-memory FIFO | Per-instance (lost on freeze) | None |
| Neon PostgreSQL | Managed Postgres | Persistent | Full ACID |

## ASCII Architecture Diagram

```
BROWSER
  │
  ├─ index.html (portfolio)
  ├─ brief-maestro.html (14-section wizard)
  ├─ dashboard-logs.html (observability)
  └─ Console (runBriefE2EConsole)
       │
       │ POST /api/sendBrief
       │ POST /api/sendContact
       │ GET  /api/logs
       │ GET  /api/health
       ▼
┌────────────────────────────────────────────┐
│         VERCEL SERVERLESS FUNCTION          │
│                                              │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│  │ sendBrief│   │sendContact│   │  logs   │  │
│  └─────┬────┘   └────┬─────┘   └────┬────┘  │
│        │              │              │       │
│  ┌─────▼──────────────▼──────────────▼─────┐ │
│  │         RATE LIMIT GATE                 │ │
│  │  IP sliding window · Email dedup        │ │
│  │  Honeypot · Timing check               │ │
│  └─────────────────┬──────────────────────┘ │
│                    │ passed                 │
│  ┌─────────────────▼──────────────────────┐ │
│  │         BACKGROUND QUEUE               │ │
│  │  FIFO · max 100 · concurrency 1        │ │
│  │  Retry 3x (2s/4s/8s backoff)          │ │
│  └─────────────────┬──────────────────────┘ │
│                    │                        │
│  ┌─────────────────▼──────────────────────┐ │
│  │         REQUEST REGISTRY               │ │
│  │  Memory cache (fast reads)             │ │
│  │  Neon PostgreSQL (source of truth)     │ │
│  └─────────────────┬──────────────────────┘ │
└────────────────────┼─────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   NEON POSTGRESQL        │
        │   request_logs table     │
        │   form_responses table   │
        │   projects/workspaces    │
        └─────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   SMTP (Gmail)           │
        │   Admin email + PDF     │
        │   Client confirmation   │
        └─────────────────────────┘
```

## Request Lifecycle (sendBrief example)

```
POST /api/sendBrief
  │
  ├── 1. BODY PARSE ─── parseBody(req)
  │
  ├── 2. EDGE GATE
  │     ├── Honeypot check (silent 200 for bots)
  │     ├── Timing check (submittedAt validation)
  │     ├── Name/Email/Prompt validation
  │     └── Rate limit (IP sliding window 30/60 req per 60s)
  │
  ├── 3. QUEUE ENQUEUE ─── BackgroundQueue.enqueue()
  │     ├── registerLifecycle(status='queued')  → memory + Neon (async)
  │     └── Response: 202 Accepted + requestId
  │
  ├── 4. WORKER PROCESS ─── BackgroundQueue._process()
  │     ├── registerLifecycle(status='processing')
  │     ├── SMTP handler (retry up to 3x)
  │     │     ├── Admin email (with PDF attachment)
  │     │     └── Client confirmation email
  │     └── registerLifecycle(status='completed')
  │
  └── 5. OBSERVABILITY
        ├── /api/logs → listEntries() → Neon + memory merge
        ├── /api/logs?id=X → lookupRequest() → memory first, Neon fallback
        └── /api/health?section=queue → getDetailedStats()
```

## Layer Responsibilities

### 1. Frontend Layer

```
public/
├── sendBrief-payload.js (Shared Utility — Production + Testing)
├── e2e-brief-bypass-wizard.js (Testing Layer only — E2E tooling)
└── brief-maestro.html (Production Layer — loads sendBrief-payload.js)
```

The frontend is organized into three sub-layers:

#### 1a. Production Layer

Files that ship to real users:

- **Portfolio** (`index.html`): Landing page, contact form, services, projects
- **Brief Maestro** (`brief-maestro.html`): 14-section wizard, generates prompt, submits to `/api/sendBrief`
- **Dashboards**: Project management, execution logs, preview, pipeline control

Zero dependency on any E2E/testing script. All production flows use only `sendBrief-payload.js`.

#### 1b. Shared Utilities Layer

- **Payload Builder** (`public/scripts/sendBrief-payload.js`): Single source of truth for all `/api/sendBrief` payloads. Defines `window.buildSendBriefPayload()`. Pure function — no DOM, no globals, no E2E dependencies. Loaded on all pages.

#### 1c. Testing Layer

- **E2E Testing** (`public/scripts/e2e-brief-bypass-wizard.js`): Global script loaded on all pages, exposes `runBriefE2E`, `runBriefE2EConsole`, `ensureE2E`. Uses `window.buildSendBriefPayload` (from shared utility layer). Can fail to load without affecting production.

No frameworks, no build step, no TypeScript.

### 2. API Layer (Vercel Functions)

| Endpoint | Method | Purpose | Key Files |
|---|---|---|---|
| `/api/sendBrief` | POST | Submit brief, trigger 2 emails + PDF | `api/sendBrief.js`, `lib/queue.js` |
| `/api/sendContact` | POST | Contact form, 2 confirmation emails | `api/sendContact.js`, `lib/queue.js` |
| `/api/logs` | GET | Lifecycle entries + aggregate metrics | `api/logs.js`, `lib/request-registry.js` |
| `/api/health` | GET | System health, queue stats, lifecycle | `api/health.js`, `lib/queue.js` |

#### Validation Pipeline (both sendBrief and sendContact)

```
Body Parse → Honeypot → Timing Check → Name/Email Validate
  → Prompt Validate → Rate Limit (edge) → Email Dedup → Queue
```

### 3. Queue Layer

- **Type**: In-memory FIFO, concurrency 1, max depth 100
- **Retry**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **Lifetime**: Per-instance — lost on Vercel cold start (~30-60s idle)
- **Observability**: Lifecycle events logged via registry on enqueue, processing, and completion

See `lib/queue.js`.

### 4. Registry & Persistence Layer

See `lib/request-registry.js` and `lib/db/requestLogs.js`.

#### Read Strategy (priority order)

| Source | Used when | Speed |
|---|---|---|
| In-memory Map | Always checked first | <1ms |
| Neon PostgreSQL | Memory miss or list/aggregate queries | ~50-200ms |
| Redis (Upstash) | Fallback only if configured (currently inactive) | N/A |

#### Write Strategy

- `registerLifecycle()` writes to memory synchronously
- Fires async `_neonSave()` — never awaited (fire-and-forget)
- UPSERT on conflict (`request_id`) — incremental state updates work correctly

#### Validation Failure Persistence

Validation failures (rejected requests) carry diagnostic fields that must survive across Vercel function instances:

**Flow**: `sendBrief` → `request-registry` (memory Map) → `_neonSave()` (async) → `request_logs` table → `api/logs` → `dashboard-logs.html`

**New columns** (migration `007_add_validation_columns.sql`):

| Column | maps from entry | Example |
|---|---|---|
| `validation_stage` | `entry.validationStage` | `validateEmail` |
| `validation_field` | `entry.validationField` | `email` |
| `validation_reason` | `entry.validationReason` | `invalid_format` |

**Why needed**: `sendBrief` and `logs` are separate Vercel function instances. The in-memory registry Map is per-instance. Without Neon persistence, validation details from `sendBrief` are invisible to `logs`.

**Backward compatibility**: Old rows have `NULL` for the 3 columns. The dashboard renders validation details only when `status === 'rejected'` and at least one validation field is non-null.

#### Key Constants

| Setting | Value |
|---|---|
| MAX_ENTRIES (memory) | 1000 |
| ENTRY_TTL (memory) | 5 minutes |
| CLEANUP_INTERVAL | 60 seconds |
| Neon pool max connections | 5 |
| Neon idle timeout | 30s |
| Neon connect timeout | 5s |
| Neon maxUses per connection | 75000 |

### 5. Testing Layer

See `docs/E2E_SYSTEM.md` for full documentation.

| Function | Scope | DOM Dependency |
|---|---|---|
| `runBriefE2E(1)` | brief-maestro.html only | Yes (formData, inputs) |
| `runBriefE2E(2)` | brief-maestro.html (wizard) | Yes (formData, generatePrompt) |
| `runBriefE2E(2)` | Any page (standalone) | No |
| `runBriefE2EConsole()` | Any page | No |
| `buildSendBriefPayload()` | Any page | No — pure function |

## Key Differences: Production vs Testing

| Aspect | Production | Testing |
|---|---|---|
| Requests | Real users via brief-maestro.html | Console API via `runBriefE2EConsole` |
| Data | Real projects, contacts, form data | Test fixtures (Salmos Cafe mock data) |
| Emails | Real Gmail SMTP delivery | Same pipeline — real emails sent |
| Rate Limit | Applied (30 hard / 60 window) | Applied (same gate) |
| Queue | Same FIFO queue | Same queue |
| Neon persistence | Full persistence | Full persistence (test data persists) |
| Dashboard visibility | Real data visible | Test data visible (same /api/logs) |

## Critical Warnings

1. **In-memory state is ephemeral** — Queue, rate limit counters, and registry memory cache all reset on Vercel cold start. Only Neon data survives.
2. **Async writes are fire-and-forget** — `registerLifecycle()` does not await Neon. If the function terminates before the write completes, the entry is lost for that call. Subsequent calls read from memory cache first.
3. **Redis is inactive** — Upstash Redis v1.38.0 is installed but `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set. All Redis code paths silently no-op.
4. **Test data is real data** — E2E submissions via `runBriefE2EConsole` produce real API calls with real email delivery and real Neon persistence. Use responsibly.
5. **No CORS enforcement** — API endpoints return `Access-Control-Allow-Origin: *`. Not suitable for production with sensitive data without additional auth.

## File Map

```
api/
├── sendBrief.js        Brief submission (PDF + 2 emails)
├── sendContact.js      Contact form (2 emails)
├── logs.js             Lifecycle registry reader
└── health.js           System health endpoint
lib/
├── queue.js            Background FIFO queue
├── request-registry.js Lifecycle tracking (Neon + memory)
├── rate-limit.js       Edge gate (IP, timing, dedup, honeypot)
├── logger.js           Structured logger
├── safeBodyParser.js   Payload parsing
├── db/
│   ├── index.js        Pool manager
│   ├── requestLogs.js  Neon CRUD for lifecycle
│   └── formResponses.js Form response persistence
public/
├── index.html          Portfolio
├── brief-maestro.html  Brief wizard
├── dashboard.html      SaaS project list
├── dashboard-project.html  Project control center
├── dashboard-logs.html Execution logs dashboard
├── dashboard-preview.html  Visual preview renderer
├── icon.ico            Site favicon
├── scripts/
│   ├── sendBrief-payload.js        Shared utility — production payload builder (zero E2E dep)
│   ├── e2e-brief-bypass-wizard.js  Testing layer — E2E tooling, uses payload builder
│   └── load-e2e.js                 Legacy dynamic loader (load-e2e)
data/
└── migrations/              SQL migration scripts (versioned)
    ├── 001_create_form_responses.sql
    ├── 002_create_projects_executions.sql
    ├── 003_saas_schema.sql
    ├── 004_normalize_execution_status.sql
    ├── 005_narrow_project_status_check.sql
    ├── 006_request_logs.sql
    └── 007_add_validation_columns.sql
docs/
├── ARCHITECTURE_OVERVIEW.md  This file
├── E2E_SYSTEM.md             E2E module documentation
└── TESTING_GUIDE.md          Usage examples and commands
```

---

## Database Migration Strategy

### Location

All migrations live in `data/migrations/` as sequential SQL files prefixed with a 3-digit number (`001_`, `002_`, …). Each file is additive — no destructive operations (`DROP`, `DELETE`).

```tree
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

The `$DATABASE_URL` environment variable must point to the Neon PostgreSQL connection string.

### How to validate

```sql
-- Check migration was applied by inspecting the schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'request_logs'
ORDER BY ordinal_position;
```

The new columns (`validation_stage`, `validation_field`, `validation_reason`) should appear in the result. Each migration should document which query validates its changes.

### Naming conventions

| Rule | Example |
|---|---|
| Prefix with 3-digit sequence | `007_add_validation_columns.sql` |
| Use snake_case for the description | `add_validation_columns`, not `AddValidationColumns` |
| Use `IF NOT EXISTS` / `IF EXISTS` for idempotency | `ADD COLUMN IF NOT EXISTS …` |
| One concern per file | Never bundle unrelated schema changes |

### .gitignore rule

Migrations are tracked by a negation rule:

```gitignore
data/*
!data/migrations/
!data/migrations/*
```

This ignores runtime data (`data/decisions.json`, `data/deployments.json`) while keeping all migration scripts versioned. New migration files must be placed in `data/migrations/` and will be automatically picked up by git. New runtime data files in `data/` remain ignored.```
