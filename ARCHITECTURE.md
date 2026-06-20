# Architecture — Web Portfolio + Brief Maestro

## System Overview

Dual-purpose Vercel-deployed site combining a personal portfolio (Javier Ibrahim, Full Stack Developer) with an interactive web discovery tool (Brief Maestro). Both frontends are vanilla HTML/CSS/JS with no build step. Backend consists of three Vercel Serverless Functions handling form submissions, email delivery via Gmail SMTP, server-side PDF generation, and consolidated observability.

### Primary Objective
Lead generation and client onboarding through contact forms, AI-powered brief collection, automated email delivery, PDF brief generation, and telemetry.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | — | Zero frameworks, no build step |
| Typography | Google Fonts | Inter + Space Grotesk | Design system |
| Icons | Inline SVG | — | No icon library |
| Runtime | Node.js | 22.11.0 | Serverless functions |
| Hosting | Vercel | Hobby | Platform & auto-deploy |
| Email | nodemailer | ^8.0.10 | Gmail SMTP transport |
| PDF | pdfkit | ^0.18.0 | Server-side prompt PDF |
| Database | Neon PostgreSQL | — | Persistent lifecycle, traces, form responses |
| Storage | localStorage | — | Brief auto-save |
| Styling | CSS Custom Properties | — | Dark theme, design system |

---

## Project Structure

```
/
├── api/                       # Vercel Serverless Functions
│   ├── sendBrief.js           # Brief: validation → PDF → 2 emails
│   ├── sendContact.js         # Contact: validation → 2 emails
│   ├── telemetry.js           # Observability (logs, traces, health, coverage)
│   └── dashboard-saas.js      # SaaS Dashboard server-side renderer (Phase 7.2)
├── lib/                       # Internal system modules
│   ├── rate-limit.js          # IP sliding window, email dedup, honeypot
│   ├── request-registry.js    # Lifecycle tracking (Neon + memory, 5min TTL)
│   ├── logger.js              # Structured logger (stages, traces, events)
│   ├── tracer.js              # Path tracing (Neon + memory, fire-and-forget)
│   ├── safeBodyParser.js      # Payload parsing + deploy info
│   ├── db/                    # Neon PostgreSQL CRUD
│   │   ├── index.js           # Pool manager
│   │   ├── requestLogs.js     # Lifecycle CRUD
│   │   ├── requestTraces.js   # Trace events CRUD
│   │   └── formResponses.js   # Form response persistence
│   ├── plan/                  # Plan Engine (semantic IR)
│   ├── scaffold/              # Scaffold Engine (file generator)
│   ├── decision/              # Decision Layer (architectural logging)
│   ├── deployment/            # Deployment Engine (Git/GitHub)
│   ├── design-system/         # Design System Engine (CSS tokens)
│   ├── preview/               # Preview Engine (simulation)
│   ├── saas/                  # SaaS Core (Phase 7.1) — RBAC, auth, users, orgs, workspaces, projects, sessions, API keys, usage, audit, settings, storage
│   ├── context/                # Context Builder (Phase 7.3.4) — 12 modules: builder, normalizer, merger, inferer, defaults, entities, assets, history, serializer, validator, events, errors
│   ├── conversation/           # AI Conversation Engine (Phase 7.3.1–7.3.3) — manager, memory, context, summarizer, events, serializer, validator + questions/ sub-module (generator, prioritizer, templates, mapper, scorer, validator)
│   ├── workflows/              # Workflow Execution Engine (Phase 7.9.0)
  │   ├── index.js            # Entry point
  │   ├── workflowManager.js  # CRUD, lifecycle, orchestration
  │   ├── executionEngine.js  # DAG execution, conditional, parallel
  │   ├── workflowDefinition.js # JSON schema validation
  │   ├── workflowStateMachine.js # 10-state machine
  │   ├── workflowEvents.js   # 11 event types
  │   ├── workflowStorage.js  # Persistence layer
  │   ├── checkpointManager.js # Auto-save/load/resume
  │   ├── retryEngine.js      # Backoff strategies
  │   ├── compensationEngine.js # Rollback logic
  │   ├── workflowVersioning.js # Version tracking
  │   ├── workflowMetrics.js  # Execution metrics
  │   ├── executionGraph.js   # DAG graph
  │   └── scheduler/          # Queue, cron, delayed
  │   ├── telemetry/              # Observability & Telemetry Platform (Phase 8.0.0)
  │   │   ├── index.js            # Entry point — 8 exported functions + all classes
  │   │   ├── telemetryManager.js # Central manager, auto-collect, enable/disable
  │   │   ├── telemetryStorage.js # In-memory persistence for all telemetry data
  │   │   ├── metricsCollector.js # Counters, gauges, histograms, tag support
  │   │   ├── tracingEngine.js    # Distributed tracing, spans, parent-child trees
  │   │   ├── logger.js           # Structured JSON logging, 5 levels
  │   │   ├── healthMonitor.js    # Component health (healthy/degraded/offline/unknown)
  │   │   ├── diagnostics.js      # System snapshots, error summaries, dependency graph
  │   │   ├── analytics.js        # Daily/weekly/monthly analytics reports
  │   │   ├── alertManager.js     # Configurable rules, severity, acknowledge/resolve
  │   │   └── eventBus.js         # Event pub/sub with wildcard support
  ├── cluster/                 # Distributed Execution Cluster (Phase 8.1.0)
  │   ├── index.js             # Entry point — 10 exported functions + all classes
  │   ├── clusterManager.js    # Central coordinator
  │   ├── clusterStorage.js    # In-memory persistence
  │   ├── clusterEvents.js     # 11 event types + pub/sub
  │   ├── clusterMetrics.js    # Counters, gauges, histograms
  │   ├── workerManager.js     # Worker lifecycle management
  │   ├── workerRegistry.js    # Worker registration and querying
  │   ├── workerNode.js        # Worker representation + status management
  │   ├── heartbeatMonitor.js  # Offline/stale detection
  │   ├── leaderElection.js    # Active coordinator with failover
  │   ├── taskDispatcher.js    # Task dispatch + retry + dead letter
  │   ├── taskQueue.js         # 6 queue types (priority, FIFO, LIFO, scheduled, delayed, deadLetter)
  │   ├── loadBalancer.js      # 6 dispatch strategies
  │   └── distributedScheduler.js # Schedule tasks across cluster
  ├── events/                  # Global Event Streaming Engine (Phase 8.2.0)
  │   ├── index.js             # Entry point — 20 exported functions + all classes + constants
  │   ├── eventBus.js          # Central pub/sub with sync + async emit + wildcards
  │   ├── eventStream.js       # Real-time streaming (buffered, SSE/WebSocket-ready)
  │   ├── eventStore.js        # Append-only log with type/correlation/source indices
  │   ├── eventReplayEngine.js # Filter, correlation, time-travel, snapshot replay
  │   ├── eventSerializer.js   # Normalize, serialize, validate, clone
  │   ├── eventSchemaRegistry.js # Per-event-type schema validation
  │   ├── eventRouter.js       # Pattern-matching subsystem routes
  │   ├── eventSubscriptions.js # Per-subscriber management
  │   ├── eventFilters.js      # Register, chain, builtin filters
  │   ├── eventCorrelator.js   # Cross-system trace tracking with spans
  │   ├── eventBackpressure.js # Drop/buffer/throttle/block strategies
  │   ├── eventMetrics.js      # Counters, gauges, histograms, throughput
  │   ├── eventDeadLetterQueue.js # Failed event storage + retry
  │   ├── eventVersioning.js   # Schema migration per event type
  │   ├── eventHooks.js        # Integration hooks to existing engines
  │   └── intelligence/        # Event Intelligence Layer (Phase 8.3.0)
  │       ├── index.js         # Exports + attachToEventBus
  │       ├── intelligenceEngine.js # Central orchestrator
  │       ├── patternDetector.js    # Real-time pattern detection
  │       ├── anomalyDetector.js    # Z-score anomaly detection
  │       ├── correlationEngine.js  # Graph-based correlation
  │       ├── insightGenerator.js   # Rule-based insight generation
  │       ├── eventScorer.js        # Importance/urgency/impact scoring
  │       ├── intelligenceStore.js  # In-memory + JSON persistence
  │               └── intelligenceAPI.js    # 5 REST API bindings
  ├── remediation/            # Auto-Remediation Engine (Phase 8.4.0)
  │   ├── index.js             # Entry point — exports + attachToEventBus
  │   ├── remediationEngine.js # Central orchestrator
  │   ├── remediationActions.js# 8 built-in action types + custom registration
  │   ├── remediationPolicies.js# 7 default policies with matching + safety guards
  │   ├── remediationStore.js  # In-memory + JSON persistence
  │   └── remediationAPI.js    # 14 REST API bindings
  ├── cost/                    # Cost Optimization & Resource Governance (Phase 9.0.0)
  │   ├── index.js             # Entry point — exports + getCostEngine
  │   ├── costEngine.js        # Central orchestrator (analyze/optimize/forecast/recommend)
  │   ├── costAnalyzer.js      # 6 analysis domains (AI, cluster, workflow, deploy, storage, API)
  │   ├── pricingModels.js     # Provider pricing (OpenAI/Anthropic/Gemini/Ollama + custom)
  │   ├── budgetManager.js     # Scoped budgets, soft/hard limits, threshold alerts
  │   ├── optimizer.js         # 6 recommendation types with impact scoring
  │   ├── forecastEngine.js    # Linear regression trend projection
  │   ├── recommendationEngine.js # Scored recommendations by impact/category
  │   ├── quotaManager.js      # 6 tracked resources with limit enforcement
  │   ├── policyEngine.js      # 5 default policies (max cost, preferred providers, etc.)
  │   └── costEvents.js        # 8 event types with EventBus integration
  ├── security/                # Enterprise Identity & Security Platform (Phase 9.1.0)
  │   ├── index.js             # Entry point — exports + getDefaultEngine
  │   ├── identityManager.js   # Central orchestrator
  │   ├── authentication/      # 7 providers: JWT, API Key, OAuth, SAML, MFA, Password, Session
  │   ├── authorization/       # 5 modules: RBAC, Permissions, Policies, Roles, Resource Access
  │   ├── organizations/       # 5 modules: Org, Tenant, Team, Membership, Invitations
  │   ├── audit/               # 4 modules: Logger, Events, Search, Compliance
  │   ├── sessions/            # 4 modules: Session, Device, Token Rotation, Login History
  │   ├── directory/           # 5 modules: SCIM, LDAP, AD, Google Workspace, Entra
  │   ├── security/            # 4 modules: Secrets, Key Rotation, Encryption, Signatures
  │   └── threats/             # 4 modules: Threat Detector, Risk Scorer, Anomaly, Account Protection
  ├── billing/                 # Billing & Subscription Platform (Phase 9.2.0)
  │   ├── index.js             # Entry point — exports + getDefaultEngine + createEngine
  │   ├── billingManager.js    # Central orchestrator — 30+ sub-module references
  │   ├── subscriptionManager.js # Subscription lifecycle (create/cancel/change/renew)
  │   ├── customerManager.js   # Customer CRUD
  │   ├── invoiceManager.js    # Invoice lifecycle (draft/open/paid/failed/void)
  │   ├── paymentManager.js    # Payment processing with provider abstraction
  │   ├── checkoutManager.js   # Checkout session management
  │   ├── usageMeter.js        # Usage tracking per customer/metric
  │   ├── pricingEngine.js     # Flat/seat/usage pricing calculation
  │   ├── taxEngine.js         # Regional tax calculation
  │   ├── discountEngine.js    # Coupons and promotions
  │   ├── creditManager.js     # Credit management with expiry
  │   ├── refundManager.js     # Refund processing
  │   ├── webhookProcessor.js  # Webhook dispatch with handlers
  │   ├── billingEvents.js     # 20+ billing event types + pub/sub
  │   ├── billingStorage.js    # In-memory storage layer
  │   ├── plans/               # Plan registry, features, limits, versions, trials
  │   ├── usage/               # Tracker, aggregator, quota calculator, overage calculator
  │   ├── payments/providers/  # Base, Stripe, PayPal, Manual, Mock providers
  │   ├── invoices/            # Generator, PDF, numbering, exporter
  │   ├── customers/           # Portal, billing profile, payment methods, addresses
  │   └── analytics/           # MRR, ARR, Churn, LTV, Cohort, Revenue Forecast
  └── runtime/                # SaaS pipeline orchestrator
├── ui/                        # Dashboard UI (Phase 7.2) + Control Plane (Phase 8.5.0)
│   ├── dashboard/             # 15 components, 10 pages, 1 layout, entry point + CSS
│   └── control-plane/         # Control Plane Dashboard + Cost Optimization (Phase 8.5.0/9.0.0)
│       ├── index.js           # SSR page renderer with 6 widgets
│       ├── controlPlane.css   # Widget styles, SSE indicator, severity badges, timeline
│   ├── cost.js            # SSR page renderer with 5-tab Cost Optimization page
│   ├── cost.css           # Cost tab styles, gauge widgets, progress bars
│   ├── security.js        # SSR page renderer with 6-tab Security Dashboard page
│   ├── security.css       # Security tab styles, metric cards, threat badges
│       └── billing.js         # SSR page renderer with 5-tab Billing Dashboard page
├── public/                    # Static assets
│   ├── index.html             # Portfolio landing page
│   ├── brief-maestro.html     # Brief Maestro tool (14 sections)
│   ├── dashboard*.html        # Observability dashboards
│   ├── dashboard-api.js       # Shared API client
│   ├── icon.ico               # Favicon
│   └── scripts/               # JS helpers (payload builder, E2E tools)
├── data/                      # Runtime storage (not committed)
│   ├── decisions.json         # Architectural decision records
│   ├── deployments.json       # Deployment records
│   ├── users.json             # SaaS Core — user profiles
│   ├── organizations.json     # SaaS Core — orgs & members
│   ├── workspaces.json        # SaaS Core — workspace registry
│   ├── projects.json          # SaaS Core — project lifecycle
│   ├── sessions.json          # SaaS Core — auth sessions
│   ├── apiKeys.json           # SaaS Core — API key registry
│   ├── usage.json             # SaaS Core — usage metrics
│   ├── settings.json          # SaaS Core — scoped settings
│   ├── audit.json             # SaaS Core — immutable audit log
│   └── migrations/            # SQL migration scripts
├── docs/
│   ├── deployment-engine.md   # Deployment Engine architecture (Phase 6)
│   ├── saas-core.md           # SaaS Core architecture (Phase 7.1)
│   ├── dashboard-ui.md        # Dashboard UI architecture (Phase 7.2)
│   ├── conversation-engine.md # Conversation Engine architecture (Phase 7.3.1)
│   ├── observability.md       # Observability Platform architecture (Phase 8.0.0)
│   ├── distributed-cluster.md # Distributed Execution Cluster architecture (Phase 8.1.0)
│   ├── cost-engine.md         # Cost Optimization & Resource Governance architecture (Phase 9.0.0)
│   ├── security-platform.md   # Enterprise Identity & Security Platform architecture (Phase 9.1.0)
│   └── billing-platform.md    # Billing & Subscription Platform architecture (Phase 9.2.0)
├── scripts/                   # CLI tools and test scripts
├── package.json
├── ARCHITECTURE.md            # This file — single source of truth
├── ENGINE_RULES.md            # AI pipeline behavior rules
├── DEVELOPMENT_RULES.md       # Coding standards & workflow
├── DEPLOYMENT.md              # Deployment & infrastructure
├── .gitignore
└── .gitattributes
```

---

## Architecture Diagram

```
BROWSER
  │
  ├─ index.html (portfolio)
  ├─ brief-maestro.html (14-section wizard)
  ├─ dashboard*.html (observability)
  └─ Console (E2E test helpers)
       │
       │ POST /api/sendBrief
       │ POST /api/sendContact
       │ GET  /api/telemetry
       │ GET  /api/traces
       ▼
┌──────────────────────────────────────────────────────────┐
│                 VERCEL SERVERLESS FUNCTIONS                │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │ sendBrief│   │sendContact│   │telemetry │             │
│  └─────┬────┘   └────┬─────┘   └──────────┘             │
│        │              │                                   │
│  ┌─────▼──────────────▼────────────────────────────────┐ │
│  │              RATE LIMIT GATE                         │ │
│  │  IP sliding window · Email dedup                     │ │
│  │  Honeypot · Timing check · Field validation          │ │
│  └─────────────────────┬────────────────────────────────┘ │
│                        │ passed                           │
│  ┌─────────────────────▼────────────────────────────────┐ │
│  │              INLINE SMTP EXECUTION                    │ │
│  │  Promise.allSettled([ admin email, client email ])    │ │
│  │  5s timeout per email · No retry                     │ │
│  └─────────────────────┬────────────────────────────────┘ │
│                        │                                   │
│  ┌─────────────────────▼────────────────────────────────┐ │
│  │              OBSERVABILITY                            │ │
│  │  request-registry.js (lifecycle tracking)             │ │
│  │  tracer.js (path tracing, memory + Neon)              │ │
│  │  logger.js (structured logging)                       │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

---

> **Legend**: Sections marked with `⚡` describe the **current production system**. Sections marked with `🔮` describe **future/SaaS design (not implemented)**.

---

## ⚡ Execution Model (Two-Layer Architecture)

The system implements a strict two-layer pipeline with an ingestion boundary. The boundary between "outside" and "inside" the system is the rate limit check.

### Layer 1: Network Gate (Rate Limit / Edge Protection)

Pre-boundary — operates BEFORE any processing state is allocated:

```
├── IP sliding window (soft 30, hard 60 req/60s)
├── Email dedup (1 req/300s per address)
├── Honeypot detection (silent 200 for bots)
├── Timing check (submittedAt validation)
└── Field validation (name, email, message/prompt)
```

- **Failure mode**: 429 RATE_LIMITED or 400 INVALID_REQUEST — immediate response
- **State**: Per-instance in-memory Map (sliding window)
- **Observability**: `X-RateLimit-*` headers, `/api/telemetry?type=health&section=rate-limit`

### Layer 2: Execution Layer (Inline SMTP)

Post-boundary — only receives requests that passed Layer 1:

```
├── Inline SMTP via Promise.allSettled (admin + client in parallel)
├── 5s timeout per email (sendWithTimeout)
├── Transport verify before sending (transporter.verify())
├── Lifecycle tracing (request-registry + tracer)
└── Trace drain before response (tracer.drain())
```

- **Failure mode**: 500 INTERNAL_ERROR (SMTP failure)
- **Response header**: `X-Processing-Mode: inline`
- **Observability**: `X-Request-Id` header, lifecycle traces via `/api/telemetry`

### Ingestion Boundary Core Rules

1. **Rate limit decisions are independent of queue state** — queue depth does not influence rate limit thresholds
2. **429 responses are immediate** — no allocation before the boundary
3. **The gate absorbs traffic spikes**; the execution layer only sees steady-state flow
4. **Validation failures persist pre-boundary** — `persistImmediate()` awaits Neon INSERT before returning (Vercel may freeze after response)

### Serverless Memory Isolation (Critical)

Each `api/` file is an independent Vercel Function. They DO NOT share memory, singleton instances, or module state. Cross-instance observability requires Neon PostgreSQL.

```
sendBrief.js ──┐
sendContact.js ─┤  (isolated memory — no shared state)
telemetry.js ──┘
```

---

## ⚡ API Endpoints

### `POST /api/sendBrief`
- **Payload**: `{ name, email, company?, phone?, prompt, lang, formData }`
- **Response**: `{ success: true }` or `{ error: string }`
- **Flow**: Validate → persist form responses to Neon → generate PDF (PDFKit) → send 2 emails inline:
  1. Admin notification with PDF attachment (`brief-{biz_name}.pdf`) + visual summary
  2. Client confirmation to `[email, GMAIL_USER]` with premium template

### `POST /api/sendContact`
- **Payload**: `{ name, email, company?, project?, message, lang }`
- **Response**: `{ success: true, mode: 'inline', adminOk, clientOk }` or `{ error: string }`
- **Flow**: Validate → send 2 emails inline via Promise.allSettled:
  1. Admin notification to `GMAIL_USER`
  2. Client confirmation to `[email, GMAIL_USER]`

### `GET /api/dashboard-saas` — SaaS Dashboard (Phase 7.2)
- **Response**: Full server-rendered HTML page
- **Parameters**: `page` (home/projects/projectDetails/deployments/workspace/settings/profile/apiKeys/usage/auditLog), `workspaceId`, `userId`, `projectId`, `status`, `search`, `view`, `resource`, `actor`, `limit`
- **Flow**: Route → page renderer → SaaS Core data → component composition → layout → full HTML

### `GET /api/telemetry` — Consolidated observability
| Parameter | Returns |
|---|---|
| `?type=logs&limit=N` | Recent lifecycle entries + aggregate metrics (max 200) |
| `?type=logs&id=X` | Single lifecycle entry by requestId |
| `?type=traces&id=X` | Merged trace events (memory + Neon) |
| `?type=coverage` | System path coverage (memory + Neon merged, 27+ paths) |
| `?type=range&hours=N` | Time-bucket trace analytics |
| `?type=health` | System health (queue depth, lifecycle, rate-limit, memory) |
| `?type=health&section=queue` | Queue-specific metrics |
| `?type=health&section=rate-limit` | Rate limit state |

### `GET /api/traces` — Backward-compatible trace events
| Parameter | Returns |
|---|---|
| `?id=X` | Merged trace events, deduplicated |
| `?coverage=true` | Merged coverage (memory + Neon, 24h) |
| `?range=24h` | Per-path hit counts, first/last seen, hourly buckets |
| `?heatmap=true&hours=24` | Failure aggregation by (path_id, endpoint, stage) |
| `?timeline=true&hours=24&limit=200` | Chronological request lifecycle ordering |

---

## Request Lifecycle Observability

### States

| State | When | Transition |
|---|---|---|
| `queued` | After validation passes | → `processing` |
| `processing` | SMTP send starts | → `completed` or `failed` |
| `completed` | Both emails sent successfully | Terminal |
| `failed` | Email failure (one or both timed out) | Terminal |
| `rejected` | Pre-execution failure (validation/rate-limit) | Terminal |

**Timestamps**: `receivedAt`, `queuedAt`, `executionStartedAt`, `executionFinishedAt`
**Derived metrics**: `queueWaitTimeMs`, `executionDurationMs`, `totalLifecycleTimeMs`
**TTL**: 5-minute TTL, periodic cleanup every 60s, on-lookup and on-aggregate expiry

### Validation Persistence
Validation failures persist to Neon `request_logs` BEFORE the HTTP response via `persistImmediate()` — necessary because Vercel may freeze the function immediately after the response. All early-return paths (12 in sendBrief, 13 in sendContact) call `await registry.persistImmediate()` before returning.

### Path Coverage
33 total trace paths across both endpoints covering validation failures, rate limit, configuration errors, handler errors, and success submissions.

---

## Email Architecture

### Shared Standards
- Table-based HTML layout with inline styles for email client compatibility
- `bgcolor` fallback for Outlook
- Dark mode via `@media (prefers-color-scheme: dark)` with `!important`
- Gradient header (`#00D4FF → #00FFC8`) with "JIC" logo mark
- Responsive max-width 600px
- `escapeHTML()` on all user-provided values
- Timestamps in `America/Tijuana` timezone
- Human, conversational tone — no AI-style or corporate jargon

### Admin Notification

| Property | Contact | Brief |
|---|---|---|
| `from` | `"Javier Ibrahim — Portfolio"` | `"Build a Brief"` |
| `to` | `GMAIL_USER` | `GMAIL_USER` |
| `replyTo` | `email` (client) | `email` (client) |
| Attachment | None | PDF (`brief-{biz_name}.pdf`) |

### Client Confirmation

| Property | Contact | Brief |
|---|---|---|
| `from` | `"Javier Ibrahim"` | `"Build a Brief"` |
| `to` | `[email, GMAIL_USER]` | `[email, GMAIL_USER]` |
| `replyTo` | `GMAIL_USER` | `GMAIL_USER` |

**Why `to: [email, GMAIL_USER]` instead of CC**: Gmail SMTP suppresses CC when sender and CC are the same address. Using both recipients in `to:` ensures reliable delivery.

### SMTP Configuration
- `nodemailer@^8.0.10`, transport: `service: 'gmail'`
- Pre-send: `transporter.verify()` with 5s timeout; send: `sendWithTimeout()` with 5s timeout, parallel via `Promise.allSettled()`
- No retry at handler level (timeout → returns false, logged as partial failure)

---

## PDF Generation

- Library: `pdfkit@^0.18.0`, A4 size, 50px margins
- Content: Full master prompt in Courier, title "Prompt Maestro", client name/company
- Filename: `brief-{business_name}.pdf` — sanitized with `[^a-zA-Z0-9\u00C0-\u024F]`
- Generated server-side in `sendBrief.js` via Promise-based `generatePDF()`
- Attached to admin notification email only — never on the client

---

## Engine Overview

These modules form the Agent Pack v1 pipeline — converting client briefs into deployable projects. All engines are native Node.js (zero external dependencies except `pg`). See `ENGINE_RULES.md` for detailed behavior rules.

| Engine | Directory | Status | Purpose |
|---|---|---|---|
| **Plan** | `lib/plan/` | Implemented | Prompt Maestro → Semantic IR JSON (14 sections → 8 categories) |
| **Scaffold** | `lib/scaffold/` | Implemented | Generates project files on disk from Plan IR |
| **Design System** | `lib/design-system/` | Implemented | CSS variable generation, design tokens |
| **Preview** | `lib/preview/` | Implemented | Visual preview simulation |
| **Decision** | `lib/decision/` | Implemented | Architectural decision records |
| **Deployment** | `lib/deployment/` | Implemented | Provider-based deployment: Vercel, GitHub, versioning, rollback, history, dry-run |
| **SaaS Core** | `lib/saas/` | Implemented | 12 modules: RBAC, auth (Email/GitHub/Google), users, orgs, workspaces, projects, sessions, API keys, usage tracking, audit log, settings, storage abstraction |
| **Dashboard UI** | `ui/dashboard/` | Implemented | 10 server-rendered pages (+ 1 conversation page), 15 reusable components, 1 layout, served via `api/dashboard-saas.js` |
| **Conversation Engine** | `lib/conversation/` | Implemented | 9 base modules + 6 question sub-modules: intent→question mapping, 4-dimension scoring, prioritization (blocking/high/optional), missing-field detection, events |
| **Context Builder** | `lib/context/` | Implemented | 12 modules: full pipeline — load conversation, normalize, infer, merge defaults, validate, serialize, emit events, convert to Plan IR |
| **Runtime** | `lib/runtime/` | Implemented | SaaS pipeline orchestrator with Neon persistence |
| **Form Persistence** | `lib/db/formResponses.js` | Implemented | Brief Maestro responses to Neon |
| **AI Provider Layer** | `lib/ai/` | Implemented | Phase 7.7.0 — Multi-provider AI routing: 4 providers (OpenAI, Anthropic, Gemini, Ollama), 5 routing strategies, fallback chains, load balancing, cost/latency/quality optimization, streaming, token estimation, event integration |
| **Platform API** | `lib/api/` | Implemented | Phase 7.5.0 — RESTful public API: middleware stack, 12 controllers, 12 route files, OpenAPI-ready, Express app with Vercel wrapper |
| **Multi-Agent System** | `lib/agents/` | Implemented | Phase 7.8.0 — Multi-Agent Orchestration System: 10 specialized agents, DAG-based execution graph, shared/working/agent memory, message bus, consensus engine, conflict resolver, full workflow orchestration |
| **Workflow Engine** | `lib/workflows/` | Implemented | Phase 7.9.0 — Durable Workflow Execution Engine: 10-state machine, DAG execution, checkpoints, scheduler, retry (exponential/linear/fixed), compensation, versioning, metrics, 11 event types, priority queue, delayed/cron/periodic scheduling, 11 API endpoints, dashboard page |
| **Telemetry Platform** | `lib/telemetry/` | Implemented | Phase 8.0.0 — Observability & Telemetry Platform: metrics (counter/gauge/histogram), distributed tracing with nested spans, structured logging (5 levels), health monitoring (11 components), diagnostics (snapshots, error summaries), analytics (daily/weekly/monthly), alert manager (configurable rules, 4 severity levels), event bus (8 telemetry event types), 8 API endpoints, dashboard observability page |
| **Distributed Cluster** | `lib/cluster/` | Implemented | Phase 8.1.0 — Distributed Execution Cluster: 14 modules, worker lifecycle management, 6 queue types (priority/FIFO/LIFO/scheduled/delayed/deadLetter), 6 load balancing strategies, leader election with automatic failover, heartbeat monitoring (offline/stale detection), task dispatch with retry + dead letter, distributed scheduler, cluster-wide metrics, 11 event types, 8 API endpoints, dashboard cluster page, 190 tests |
| **Event Streaming** | `lib/events/` | Implemented | Phase 8.2.0 — Global Event Streaming Engine: 15 modules, event bus with sync+async emit + wildcards, event stream with buffered SSE/WebSocket-ready output, append-only event store with type/correlation/source/time-range queries, event replay engine with filter/correlation/time-travel + snapshots, event serializer with normalize/serialize/validate/clone, event schema registry, event router with pattern-matching subsystem routes, event subscriptions with per-subscriber management, event filters with register/chain/builtins, event correlator with cross-system trace tracking + spans, event backpressure with drop/buffer/throttle/block strategies, event metrics with counters/gauges/histograms/throughput, event dead letter queue with push/retry/stats, event versioning with schema migration per event type; integration hooks wiring to Workflow Engine, Telemetry, Cluster, AI Router, Agent events without modifying any existing engine; 129 tests |
| **Event Intelligence** | `lib/events/intelligence/` | Implemented | Phase 8.3.0 — Event Intelligence Layer: 8 modules, central intelligence engine consuming all events via EventBus wildcard, pattern detector (6 patterns: repeated_failures, retry_loops, cluster_imbalance, ai_fallback_chains, latency_bursts, unexpected_transitions), anomaly detector with rolling-window z-score approximation (error_rate_spike, volume_spike, latency_anomaly, invalid_transitions, orphaned_correlations), correlation engine with graph-based nodes+edges (temporal/causal/dependency relationships), insight generator with 7 rule-based detection→recommendation rules (retry_backoff, cluster_scale, provider_degradation, error_rate, latency, state_transition, system_stable), event scorer (importance/urgency/systemImpact 0–100), intelligence store with in-memory + JSON persistence, intelligence API (5 endpoints: insights, patterns, anomalies, correlation-graph, health-intelligence), attachToEventBus hook (filters intelligence.* events to prevent loops), 87 tests, verified <5ms per event average |
| **Cost Optimization** | `lib/cost/` | Implemented | Phase 9.0.0 — Cost Optimization & Resource Governance Engine: 11 modules, cost engine orchestrator with analyze/optimize/forecast/recommend, cost analyzer (6 domains: AI token usage, cluster utilization, workflow cost, deployment cost, storage usage, API consumption), pricing models (OpenAI, Anthropic, Gemini, Ollama + custom provider support), budget manager (scoped budgets, soft/hard limits, threshold alerts), optimizer (6 recommendation types: provider/model/batch/parallel/cache/worker), forecast engine (linear regression trend, daily/monthly/quarterly/yearly projections), recommendation engine (scored by impact/category with expected savings/risk/confidence), quota manager (6 tracked resources: tokens/requests/deployments/storage/workflows/cluster minutes), policy engine (5 default policies: max cost/preferred providers/min quality/latency threshold/green computing), cost events (8 event types with EventBus integration); 12 API endpoints; cost dashboard page with 5 tabs (Overview, Budgets, Forecast, Optimization Center, Usage Explorer); 176 tests |
| **Security Platform** | `lib/security/` | Implemented | Phase 9.1.0 — Enterprise Identity & Security Platform: 38+ modules across 9 subdirectories. Authentication (7 providers: JWT, API Key, OAuth, SAML, MFA/TOTP, Password, Session), Authorization (5 modules: RBAC, Permissions, Policy Engine, Role Manager, Resource Access), Organizations (5 modules: Org Manager, Tenant Isolation, Teams, Membership, Invitations), Audit (4 modules: Audit Logger, Security Events, Audit Search, Compliance Exporter), Sessions (4 modules: Session Manager, Device Manager, Token Rotation, Login History), Directory (5 providers: SCIM 2.0, LDAP, Active Directory, Google Workspace, Entra ID), Security (4 modules: Secret Manager, Key Rotation, Encryption, Signature), Threats (4 modules: Threat Detector, Risk Scorer, Anomaly Detector, Account Protection); Identity Manager orchestrator; 25 API endpoints at /api/v1/security/; Security Dashboard UI (6 tabs); 287 tests |
| **Billing Platform** | `lib/billing/` | Implemented | Phase 9.2.0 — Billing & Subscription Platform: 30+ modules across 7 subdirectories. Core: BillingManager orchestrator, SubscriptionManager (full lifecycle: create/cancel/change/renew/pause/resume), CustomerManager, InvoiceManager (draft/open/paid/failed/void), PaymentManager (provider abstraction), CheckoutManager, UsageMeter, PricingEngine, TaxEngine, DiscountEngine, CreditManager, RefundManager, WebhookProcessor, BillingEvents (20+ types), BillingStorage. Plans: PlanRegistry (5 default plans Free/Starter/Professional/Business/Enterprise + custom), PlanFeatures, PlanLimits, PlanVersions, TrialManager. Usage: UsageTracker, UsageAggregator, QuotaCalculator, OverageCalculator. Payments: 5 providers (Base/Stripe/PayPal/Manual/Mock). Invoices: InvoiceGenerator, InvoicePdf, InvoiceNumbering, InvoiceExporter. Customers: CustomerPortal, BillingProfile, PaymentMethods, Addresses. Analytics: MrrCalculator, ArrCalculator, ChurnCalculator, LtvCalculator, CohortAnalyzer, RevenueForecast. 19 API endpoints at /api/v1/billing/; Billing Dashboard UI (5 tabs); 255 tests |
| **Orchestrator** | `lib/orchestrator/` | Implemented | Brief → Plan IR (intent, tone, features, structure) |
| **Planner** | `lib/planner/` | Implemented | Plan IR → Project Blueprint (pages, nav, sections, components) |
| **Content Generator** | `lib/content-generator/` | Implemented | Blueprint + Design Strategy → Content Pack (copy, SEO, CTAs) |
| **Website Builder** | `lib/generator/` | Implemented | Content Pack + Design Strategy → Deployable HTML/CSS/JS website |
| **Project Loader** | `lib/loader/` | Planned | Read-only project reconstruction from DB |

### Pipeline Flow
```
Brief (client input)
    ↓
Prompt Maestro (14-section structured brief)
    ↓
Agent Pack (validation, UX, SEO, copy refinement)
    ↓
Plan Engine (semantic IR JSON)
    ↓
Design System Engine (CSS variables + design tokens)
    ↓
Preview Engine (visual simulation)
    ↓
Scaffold Engine (physical files on disk)
    ↓
    Deployment Engine (provider abstraction → Vercel/GitHub → versioning + rollback)
```
**Note**: This pipeline is for the Agent Pack project generation system. The contact/brief email system (`api/sendBrief`, `api/sendContact`) operates independently and does not use this pipeline.

### AI Website Generator Pipeline (Phase 1–7.5.0)

```
HTTP Client (Dashboard, CLI, SDK, curl)
    ↓
```

/api/v1/* — Platform API (Phase 7.5.0)
```
    ↓
    Middleware: CORS → RequestId → Logging → RateLimit → Auth → Authorization → Validation
    ↓
    Controllers: conversation, project, pipeline, deployment, dashboard, workspace, apikey, generation, context, planner, health
    ↓
```

Existing Engines
```
Brief (client form data)  ←  Conversation Engine / Context Builder
    ↓
Orchestrator (Plan IR — intent, tone, features, structure)
    ↓
Planner (Project Blueprint — pages, nav, sections, components)
    ↓
Design Strategy (visual system + tone — personality, layout, imagery, interaction, brand)
    ↓
Content Generator (Content Pack — page copy, SEO, CTAs, tone-aware)
    ↓
    Website Builder (Deployable HTML/CSS/JS — /dist/ static site)
    ↓
    Deployment Engine (Vercel/GitHub — provider abstraction, versioning, rollback)
    ↓
    SaaS Core (Phase 7.1 — RBAC, auth, users, orgs, workspaces, projects, sessions, API keys, usage, audit, settings, storage)
    ↓
    Dashboard UI (Phase 7.2 — 11 pages, 15 components, Server-side rendered via api/dashboard-saas.js)
    ↓
    Conversation Engine (Phase 7.3.1 — 9 infrastructure modules, deterministic summarization, no LLM calls)
    ↓
    Intent Detection (Phase 7.3.2 — intent classification, entity extraction)
    ↓
    Question Generator (Phase 7.3.3 — missing-field detection, intelligent questioning, prioritization, scoring)
    ↓
    Context Builder (Phase 7.3.4 — conversation → canonical Project Context → Plan IR → feeds Planner)
    ↓
    Pipeline Orchestrator (Phase 7.4.0 — 11-stage end-to-end pipeline orchestration, caching, recovery, metrics, events, visualization)
    ↓
    AI Provider Layer (Phase 7.7.0 — Multi-provider routing: OpenAI/Anthropic/Gemini/Ollama, fallback chains, load balancing, streaming, cost optimization)
    ↓
    Multi-Agent System (Phase 7.8.0 — 10 specialized agents: architect, designer, developer, content, seo, accessibility, performance, deployment, reviewer, qa; DAG execution; consensus engine; conflict resolution; memory management)
    ↓
    Workflow Engine (Phase 7.9.0 — 10-state machine, DAG execution, checkpoints, scheduler, retry, compensation, versioning, metrics)
    ↓
    Telemetry Platform (Phase 8.0.0 — metrics, tracing, logging, health monitoring, diagnostics, analytics, alerts, event bus)
    ↓
    Distributed Cluster (Phase 8.1.0 — workers, queues, leader election, failover, load balancing)
    ↓
    Event Streaming Engine (Phase 8.2.0 — event bus, store, replay, routing, correlation, backpressure, subscriptions, filters, metrics, versioning, schema registry, dead letter queue)
    ↓
    Event Intelligence Layer (Phase 8.3.0 — pattern detection, anomaly detection, correlation graph, insight generation, event scoring, intelligence API)
    ↓
    Auto-Remediation Engine (Phase 8.4.0 — self-healing policies, 8 remediation actions, approval gates, cooldowns, action history)
    ↓
    Control Plane Dashboard (Phase 8.5.0 — real-time unified visibility: event stream, intelligence insights, anomalies, remediation, cluster health, workflow traces)
    ↓
    Cost Optimization Engine (Phase 9.0.0 — pricing models, budgets, forecasts, quotas, policies, recommendations, optimization)
    ↓
    Security & Identity Platform (Phase 9.1.0 — authentication, authorization, RBAC, organizations, audit, sessions, directory sync, threat detection, secrets, encryption)
    ↓
    Billing & Subscription Platform (Phase 9.2.0 — subscriptions, invoices, payments, usage billing, quotas, discounts, credits, refunds, revenue analytics)
```

---

## Design Strategy Engine

### Purpose

Transform a validated Project Blueprint into a deterministic Design Strategy. The Design Strategy defines the creative direction — visual personality, layout philosophy, imagery direction, interaction patterns, and branding consistency — without generating any HTML, CSS, JS, or design tokens.

### Input

Validated Project Blueprint from the Planner (`lib/planner/`):

```
{
  meta, project, pages, navigation,
  sections: { registry[{id, required, label, components[]}], pageMap{} },
  components: { global[], reusable[], pageSpecific{} },
  userFlow, hierarchy, priorities, constraints
}
```

### Output

Design Strategy JSON:

```
{
  meta:    { generatedAt, version, source, blueprintVersion },
  project: { name, type },
  visual:  { visualPersonality, designStyle, sophisticationLevel },
  layout:  { spacing, layoutStyle, gridType, containerWidth },
  imagery: { photographyStyle, iconography, illustrationStyle, imageDensity },
  interaction: { animationStyle, transitionType, hoverStyle, scrollBehavior, pageTransition },
  brand:   { brandTone, brandValues[], consistencyLevel, accessibilityPriority, brandVoice{} }
}
```

### Execution Order

```
designStrategy(blueprint)
  ├── analyzeVisualDirection()  → visual personality, design style, sophistication level
  ├── layoutStrategy()          → spacing, layout style, grid type, container width
  ├── imageryStrategy()         → photography style, iconography, illustration, image density
  ├── interactionStrategy()     → animation, transition, hover, scroll, page transition
  ├── brandingStrategy()        → brand tone, values, voice, consistency, accessibility
  ├── generateDesignStrategy()  → assemble full strategy
  └── validateDesignStrategy()  → schema validation (throws DesignStrategyValidationError)
```

### Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| Entry | `lib/design-strategy/index.js` | Exposes `designStrategy(blueprint)` |
| Visual Direction | `lib/design-strategy/analyzeVisualDirection.js` | Analyzes project type + components to determine visual personality and design style |
| Layout Strategy | `lib/design-strategy/layoutStrategy.js` | Determines spacing, grid type, container width from project type and page count |
| Imagery Strategy | `lib/design-strategy/imageryStrategy.js` | Defines photography, iconography, and illustration direction |
| Interaction Strategy | `lib/design-strategy/interactionStrategy.js` | Defines animation, transition, hover, and scroll behaviors |
| Branding Strategy | `lib/design-strategy/brandingStrategy.js` | Derives brand tone, values, voice, and accessibility priority |
| Strategy Generator | `lib/design-strategy/generateDesignStrategy.js` | Orchestrates all strategies and assembles the full strategy object |
| Strategy Validator | `lib/design-strategy/validateDesignStrategy.js` | Schema validation — ensures all required fields exist and are valid |

### Determinism

Fully deterministic. Given the same Blueprint, the Design Strategy output is always identical. All decisions are rule-based on project type, component requirements, and page structure.

### Relationship with Pipeline

```
  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐
  │ Orchestrator │ →  │   Planner   │ →  │ Design Strategy  │
  │  (Plan IR)   │    │ (Blueprint) │    │   (Strategy)     │
  └─────────────┘    └─────────────┘    └──────────────────┘
                                               ↓
                                        Design System Engine
                                        (future — tokens/CSS)
```

The Design Strategy feeds into the future Design System Engine (currently `lib/design-system/`), which will translate these creative decisions into concrete design tokens and CSS variables.

### Isolation

The Design Strategy engine is completely independent. It does not access any API handler, frontend code, database, or email system. It is not yet called in any production flow.

---

## Content Generator Engine

### Purpose

Transform a validated Project Blueprint and Design Strategy into a structured Content Pack — deterministic, conversion-focused, tone-aware website copy for every page and section defined in the Blueprint.

### Input

- **Project Blueprint** — from the Planner (`lib/planner/`)
- **Design Strategy** — from the Design Strategy Engine (`lib/design-strategy/`)

### Output

Content Pack JSON:

```
{
  meta:  { generatedAt, version, source, blueprintVersion, designStrategyVersion, language },
  pages: [{
    path, title,
    seo: { title, description },
    sections: [{ id, heading, subheading, body, cta }]
  }],
  global: {
    brandVoice: { tone, values[], profile{} },
    ctaLibrary: [{ text }],
    seoDefaults: { siteName, siteDescription, language }
  }
}
```

### Execution Order

```
generateContent(blueprint, designStrategy)
  ├── buildToneProfile()        → formality, warmth, directness, inspiration, technicality scores
  ├── detectLanguage()          → lang (currently 'en'; ES content templates exist)
  ├── pageContent()             → iterate pages from Blueprint
  │   ├── sectionContent()      → generate copy per section type (< 40 section types)
  │   │   ├── tone-aware templates (EN/ES)
  │   │   └── CTA picker        → context + tone-aware CTAs from library
  │   └── seoForPage()          → page-level seo.title + seo.description
  ├── buildGlobalCtaLibrary()   → site-wide CTA catalogue
  └── validateContentPack()     → schema validation (throws ContentPackValidationError)
```

### Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| Entry | `lib/content-generator/index.js` | Orchestrates page iteration, tone, SEO, validation |
| Page Content | `lib/content-generator/pageContentGenerator.js` | Generates page-level content + SEO + section orchestration per page |
| Section Content | `lib/content-generator/sectionContentGenerator.js` | ~40 section-type generators (hero, about, services, etc.) with EN/ES templates |
| Tone Engine | `lib/content-generator/toneEngine.js` | Builds tone profile from Design Strategy brand voice (5 dimensions, 1-5 scale) |
| SEO Generator | `lib/content-generator/seoGenerator.js` | Page-level title + description templates per project type, toned |
| Content Validator | `lib/content-generator/validateContentPack.js` | Schema validation — ensures pages, sections, SEO, and global structure |

### Section Content Coverage

The generator handles ~40 section types including:
- **Structural**: hero, about, services, portfolio, products, testimonials, contact, footer
- **About pages**: story, mission, team, values
- **Services**: overview, list, cta, benefits, process, pricing, plans, comparison
- **Portfolio**: grid, filter, featured, description, testimonial, gallery, related, share
- **E-commerce**: shop, products, categories, items, cart, checkout, payment, summary, profile, orders, settings
- **Features**: booking, calendar, confirmation, blog, faq, search, content

### Tone Enforcement

The Tone Engine evaluates 5 dimensions from Design Strategy's brandVoice:

| Dimension | Scale | Source |
|---|---|---|
| Formality | 1-5 | voice.formal + brandTone |
| Warmth | 1-5 | voice.warm + brandTone |
| Directness | 1-5 | voice.direct + brandTone |
| Inspiration | 1-5 | voice.inspirational + brandTone |
| Technicality | 1-5 | voice.technical + brandTone |

Each dimension adjusts vocabulary tier, sentence structure, CTA style (direct_action / invitation / benefit_driven / polished_request), and emphasis approach (aspirational / empathetic / visionary / direct_value).

### Supported Languages

- EN — primary (all templates complete)
- ES — secondary (all templates have es variants for hero, about, services, etc.)

Language detection currently defaults to `'en'`. The ES templates are ready for multi-language switching without code changes.

### Determinism

Fully deterministic. Given the same Blueprint + Design Strategy, the Content Pack output is always identical. No randomness, no LLM calls, no filler — every string is rule-generated from project data, section type, and tone profile.

### Relationship with Pipeline

```
  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐
  │ Orchestrator │ →  │   Planner   │ →  │ Design Strategy  │ →  │ Content Generator│
  │  (Plan IR)   │    │ (Blueprint) │    │   (Strategy)     │    │  (Content Pack)  │
  └─────────────┘    └─────────────┘    └──────────────────┘    └──────────────────┘
                                                                         ↓
                                                                  Design System Engine
                                                                  (future — tokens/CSS)
```

The Content Pack feeds into the future Design System Engine, which will translate these copy decisions into final rendered pages.

### Isolation

The Content Generator engine is completely independent. It does not access any API handler, frontend code, database, or email system. It is not yet called in any production flow.

---

## AI Generation Layer (Website Builder Engine)

### Purpose

Transform a validated Content Pack + Design Strategy + Blueprint into real, deployable static HTML/CSS/JS websites. This is the final transformation layer that converts structured AI output into a production-ready multi-page website.

### Input

- **Content Pack** — from the Content Generator (`lib/content-generator/`)
- **Design Strategy** — from the Design Strategy Engine (`lib/design-strategy/`)
- **Blueprint** — from the Planner (`lib/planner/`)

### Output

Deployable static website files:

```
/dist/index.html          # Home page
/dist/about.html          # About page
/dist/contact.html        # Contact page
/dist/services.html       # Services page
/dist/shop.html           # Shop page (ecommerce)
/dist/cart.html           # Cart page (ecommerce)
/dist/checkout.html       # Checkout page (ecommerce)
/dist/account.html        # Account page (ecommerce)
/dist/privacy.html        # Privacy policy
/dist/terms.html          # Terms of service
/dist/assets/styles.css   # Design system CSS
/dist/assets/script.js    # Site JS (smooth scroll, interactions)
```

Return JSON:

```
{
  files: {
    "/dist/index.html": "<!DOCTYPE html>...",
    "/dist/about.html": "...",
    "/dist/assets/styles.css": ":root{...}"
  },
  meta: {
    pagesGenerated: number,
    componentsRendered: number,
    buildTimeMs: number
  }
}
```

### Execution Order

```
generateWebsite(contentPack, blueprint, designStrategy)
  │
  ├── STEP 1 — Layout Engine
  │   ├── defineLayout(page, pages) → layout template per page type
  │   ├── buildNavigation(pages) → nav item list (deduplicated, ordered)
  │   └── layoutConfig(layout, navItems) → rendering config
  │
  ├── STEP 2 — Component Mapping
  │   ├── mapSection(section, pageType) → HTML component string
  │   ├── Handles ~45 section types (hero, about, services, products, etc.)
  │   └── Every section type has a dedicated HTML template
  │
  ├── STEP 3 — HTML Generation
  │   ├── generateHtmlPage(pageContent, layoutConfig, designStrategy)
  │   ├── Full DOCTYPE with lang, head meta, SEO, font links
  │   ├── Fixed header with navigation (active page highlighted)
  │   ├── Main content with hero, filtered sections per layout mode
  │   ├── Optional sidebar for ecommerce pages
  │   └── Footer with copyright
  │
  ├── STEP 4 — CSS Generation
  │   ├── generateCss(designStrategy) → full stylesheet
  │   ├── Design tokens from palette (10 color schemes × brandTone)
  │   ├── Typography from designStyle (Inter, Playfair Display)
  │   ├── Spacing from layout.spacing (compact/balanced/generous)
  │   ├── Component styles for all section types
  │   ├── Responsive breakpoints (768px, 480px)
  │   └── Animations from interaction settings
  │
  ├── STEP 5 — Asset Injection
  │   ├── injectAssets(html, pageContent) → scripts, meta
  │   └── generateScriptFile() → smooth scroll JS (438 bytes)
  │
  └── STEP 6 — Output Validation
      ├── validateOutput({ files, meta })
      ├── Ensures all required files exist
      ├── Validates DOCTYPE, html tags, navigation, CSS tokens
      └── Throws GeneratedWebsiteValidationError on failure
```

### Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| Entry | `lib/generator/index.js` | Orchestrates 6-step pipeline, builds file output |
| Layout Engine | `lib/generator/layoutEngine.js` | Page layout templates (10 types), navigation builder |
| Component Mapper | `lib/generator/componentMapper.js` | ~45 section types → HTML components with content |
| HTML Generator | `lib/generator/htmlGenerator.js` | Full HTML page assembly, SEO, fonts, nav, footer |
| CSS Generator | `lib/generator/cssGenerator.js` | Design tokens → complete stylesheet from Design Strategy |
| Asset Injector | `lib/generator/assetInjector.js` | Meta tags, scripts, SEO verification |
| Output Validator | `lib/generator/validateOutput.js` | Schema validation, HTML structure checks |

### Design Token System

The CSS Generator converts Design Strategy concepts into real CSS values deterministically:

| Design Strategy Property | CSS Output | Example |
|---|---|---|
| `brandTone` | Color palette (10 schemes) | `persuasive_professional` → blue/navy |
| `visualPersonality` | Color fallback palette | `creative_showcase` → purple/pink |
| `designStyle` | Font families, sizes | `editorial_flow` → Playfair + Inter |
| `layout.spacing` | Spacing scale (xs-xl) | `compact` → 0.5-5rem, `generous` → 1-8rem |
| `interaction.transitionType` | Transition speed | `quick_ease` → 0.15s |
| `interaction.hoverStyle` | Hover effects | `scale_highlight` → scale(1.02) |
| `interaction.scrollBehavior` | Scroll behavior | `parallax` → smooth |
| `interaction.pageTransition` | Page animation | `fade` → fadeIn keyframes |

### Page Type → Layout Mapping

| Blueprint Type | HTML Template | Hero | Sidebar | Width |
|---|---|---|---|---|
| `home` | full | Yes | No | full |
| `landing` | full | Yes | No | full |
| `about` | standard | No | No | contained |
| `contact` | split | No | No | contained |
| `services` | grid | No | No | contained |
| `ecommerce` | grid | No | Yes | wide |
| `portfolio` | grid | No | No | full |
| `legal` | minimal | No | No | narrow |
| `content` | standard | No | Yes | contained |
| `feature` | standard | No | No | contained |

### Supported Section Types (~45)

- **Structural**: hero, about, services, portfolio, products, testimonials, contact, footer
- **Content**: story, mission, team, values, overview, benefits, process, content
- **Interactive**: form, info, cta, booking, calendar, confirmation, faq, search
- **E-commerce**: products, categories, items, cart, checkout, payment, summary, profile, orders, settings
- **Portfolio**: grid, gallery, filter, featured, description, testimonial, related, share
- **Pricing**: pricing, plans, comparison

### Determinism

Fully deterministic. Given the same Blueprint + Design Strategy + Content Pack, the generated website output is always identical. No randomness in color selection, layout assignment, or component rendering.

### Isolation

The Website Builder engine is completely independent. It does not access any API handler, frontend code, database, or email system. It is not yet called in any production flow.

---

## Deployment Engine

### Purpose

Publish generated websites to production with versioning, deployment history, rollback support, and provider abstraction. The Deployment Engine is the final step in the generation pipeline — it takes the build output from the Website Builder and deploys it to a hosting provider.

### Architecture

```
  Build Artifacts (from Website Builder)
       │
       ▼
  Deployment Manager
       │
       ├── Provider Registry
       │      ├── Vercel Provider   (production default)
       │      └── GitHub Provider   (source control + releases)
       │
       ├── Deployment History  (data/deployments.json)
       ├── Rollback Manager    (data/rollbacks.json)
       └── Deployment Report
```

### Provider Abstraction

Every provider implements four methods — `deploy()`, `status()`, `rollback()`, `health()`. New providers (Cloudflare Pages, Netlify, AWS Amplify, etc.) can be added without modifying any existing code by calling `registerProvider()`.

### Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| Entry | `lib/deployment/index.js` | Exposes deploy, status, history, rollback |
| Manager | `lib/deployment/deploymentManager.js` | Orchestrates complete deployment lifecycle |
| Provider | `lib/deployment/deploymentProvider.js` | Provider registry — register, get, list, health |
| Vercel | `lib/deployment/vercelProvider.js` | Vercel deploy, status, rollback, health (simulated without credentials) |
| GitHub | `lib/deployment/githubProvider.js` | GitHub repo create, push, tag releases (simulated without gh CLI) |
| History | `lib/deployment/deploymentHistory.js` | Persistence layer for deployment records |
| Rollback | `lib/deployment/rollbackManager.js` | Rollback to previous versions |
| Artifacts | `lib/deployment/buildArtifacts.js` | Package build files into deployable bundles |
| Reports | `lib/deployment/deploymentReport.js` | Deployment report generation and history summaries |

### Deployment Flow

```
  1. deploy({ buildPath, projectName, version, providerName })
  2.   ├── packageBuild()        → scan files, build manifest
  3.   ├── provider.deploy()     → call selected provider
  4.   ├── history.record()      → persist deployment record
  5.   ├── report.generate()     → build deployment report
  6.   └── return result
```

### Execution Modes

| Mode | Trigger | Behavior |
|---|---|---|
| Dry-run | `{ dryRun: true }` | Simulates deployment — no external calls, no persistence |
| Production | default | Real deployment via provider, persisted to history |
| Simulated | missing credentials | Provider returns realistic simulated responses |

### Determinism

The deployment engine itself is deterministic — the same inputs produce the same deployment metadata. Provider responses may vary based on external API state.

### Isolation

The Deployment Engine is independent. It does not access API handlers, frontend code, databases, or email systems. It consumes the build output from the Website Builder.

---

## Project Planner

### Purpose

Transform a validated Plan IR into a complete Project Blueprint. The Planner defines the full structure of a future website — pages, navigation, sections, components, user flow, and priorities — without generating any HTML, CSS, or JavaScript.

### Input

Validated Plan IR from the Orchestrator (`lib/orchestrator/`):

```
{
  meta:      { generatedAt, version, source },
  project:   { name, tagline, type, existingSite, ... },
  audience:  { description, problems, motivations, ... },
  tone:      { style, brandPersonality[], brandFeeling[] },
  structure: { sections[{id, required}], priorityPages[], userFlow },
  features:  { contact_form, analytics, booking_system, ... },
  design:    { logoStatus, visualStyle[], colors, ... },
  constraints: { forbiddenVisuals, extraContext }
}
```

### Output

Project Blueprint:

```
{
  meta:        { generatedAt, version, source, planIRVersion },
  project:     { name, tagline, type },
  pages:       [{ id, title, path, type, priority, sections[], children[] }],
  navigation:  { primary[], footer[], utility[] },
  sections:    { registry[{id, label, description, components[]}], pageMap{} },
  components:  { global[], reusable[], pageSpecific{} },
  userFlow:    { entryPoints[], primaryPath[], secondaryPaths[], conversionPoints[] },
  hierarchy:   { root, tree{} },
  priorities:  { critical[], high[], medium[], low[] },
  constraints: {}
}
```

### Execution Order

```
planProject(planIR)
  ├── pagePlanner.planPages()        → Build page list from project type + features
  ├── sectionPlanner.planSections()  → Map sections to pages + build registry
  ├── navigationPlanner.planNavigation() → Generate primary/footer/utility nav
  ├── componentPlanner.planComponents()  → Identify global/reusable/page-specific components
  ├── generateBlueprint()            → Assemble + build userFlow + hierarchy + priorities
  └── validateBlueprint()            → Schema validation (throws BlueprintValidationError)
```

### Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| Entry | `lib/planner/index.js` | Exposes `planProject(planIR)` |
| Page Planner | `lib/planner/pagePlanner.js` | Determines page list based on project type (ecommerce, portfolio, service_business, landing_page) and enabled features |
| Section Planner | `lib/planner/sectionPlanner.js` | Builds section registry with labels/descriptions/components and maps sections to pages |
| Navigation Planner | `lib/planner/navigationPlanner.js` | Generates primary, footer, and utility navigation from page list |
| Component Planner | `lib/planner/componentPlanner.js` | Identifies global, reusable, and page-specific components needed |
| Blueprint Generator | `lib/planner/generateBlueprint.js` | Orchestrates all planners and builds userFlow, hierarchy, and priorities |
| Blueprint Validator | `lib/planner/validateBlueprint.js` | Schema validation — ensures all required fields exist |

### Determinism

The Planner is fully deterministic. Given the same Plan IR, the Blueprint output is always identical. No AI calls, no external dependencies, no random state.

### Isolation

The Planner runs independently from `api/sendBrief`. It is not yet called during the brief submission flow. Integration will occur in a later phase after full validation.

---

## Telemetry & Observability

### Two-Tier Storage

| Tier | Storage | Lifetime | Purpose |
|---|---|---|---|
| L1 (Memory) | In-memory Map | 5min TTL | Fast reads, per-instance |
| L2 (Neon) | `request_traces` table | Persistent | Cross-instance, historical |

- All trace writes are fire-and-forget (non-blocking)
- `tracer.drain()` in `finally` block flushes pending writes — silent (no console.log per request)

### Diagnostics
- `GET /api/sendContact?id=<requestId>` — single request lifecycle record
- `GET /api/telemetry?type=health&section=queue` — lifecycle aggregates
- Neon `request_logs` table — persistent lifecycle records with validation diagnostics

### Client Retry (Contact Form)
- Automatic retry with exponential backoff on HTTP 429
- Max 4 total attempts, backoff: 0ms → 1s → 2s → 4s
- UI shows language-aware status: `"Reintentando... (Intento X de 4)"`
- Non-429 errors surface immediately — no retries

---

## Dashboard

Four HTML files under `public/` provide observability:

| File | Purpose |
|---|---|
| `dashboard.html` | Project list, telemetry overview |
| `dashboard-logs.html` | Request lifecycle log viewer |
| `dashboard-project.html` | Project control center |
| `dashboard-preview.html` | Preview renderer |

All dashboards read from `GET /api/telemetry`. The shared `dashboard-api.js` module provides the API client layer.

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `GMAIL_USER` | Gmail address for SMTP authentication | Yes |
| `GMAIL_APP_PASSWORD` | Gmail app password | Yes |
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |

**Rules**: Never expose to frontend code, never hardcode, always access through `process.env`.

---

## Version History

| Version | Date | Summary |
|---|---|---|
| v1.0.0 | 2026-06-08 | Initial Agent Pack system + Prompt Maestro |
| v1.1.0 | 2026-06-08 | Intelligent Brief Validation, UX Flow, SEO, Copy engines |
| v1.2.0 | 2026-06-08 | Project Scaffold + Plan engines (semantic IR) |
| v1.3.0 | 2026-06-08 | Decision Layer + Deployment Engine |
| v1.4.0 | 2026-06-08 | Form Persistence Layer (Neon PostgreSQL) |
| v1.5.0 | 2026-06-08 | Project Loader Engine design |
| v1.6.0 | 2026-06-08 | SaaS multi-tenant architecture design |
| v1.7.0 | 2026-06-08 | SaaS Runtime Layer v1 (pipeline orchestrator) |
| v1.0.10 | 2026-06-10 | CLI testing fixes, queue stability |
| v1.0.11 | 2026-06-10 | Observability clarification, Vercel runtime notes |
| v1.0.15 | 2026-06-10 | Client-side retry with exponential backoff for 429 |
| v1.1.0 | 2026-06-10 | Request lifecycle observability (queue tracking, derived metrics) |
| v1.2.0 | 2026-06-10 | Observability hardening (TTL, lifecycle.complete, single executionStartedAt) |
| v1.2.1 | 2026-06-10 | Derived metric persistence + aggregate TTL purge |
| v1.2.2 | 2026-06-10 | E2E helper loader, Inkognita Agency dataset |
| v1.3.0 | 2026-06-11 | Neon PostgreSQL persistent lifecycle (request_logs) |
| v1.3.1–2 | 2026-06-11 | Unified payload builder, favicon consistency |
| v1.4.0 | 2026-06-11 | Shared payload builder decoupled from E2E testing |
| v1.4.1–4 | 2026-06-11 | Validation diagnostics, persistence audit (9/9 100%) |
| v1.5.0 | 2026-06-12 | Persistent trace observability (Neon request_traces) |
| v1.6.0 | 2026-06-12 | Consolidated telemetry endpoint (3 functions saved) |
| v1.7.0 | 2026-06-12 | Request tracing audit, auto-table-creation, silent drain |
| v1.7.1 | 2026-06-12 | Observability stabilization (handlerError traces, 27 paths) |
| v1.8.0 | 2026-06-12 | Heatmap, timeline, coverage matrix script, leakage audit |
| v1.8.1 | 2026-06-12 | Queue worker fix (Vercel freeze root cause, waitUntilEmpty) |
| v1.8.2 | 2026-06-12 | Production acceptance validation (58% coverage, closeout) |
| v1.9.0 | 2026-06-10 | x-test-mode header, health sections, detailed stats |
| v1.9.1 | 2026-06-10 | Per-email progress stages, retry traces, rate-limit headers |
| v2.0.0 | 2026-06-18 | Documentation consolidation (4 canonical docs) |
| v2.1.0 | 2026-06-18 | Phase 7.1 — SaaS Core foundation (12 modules: RBAC, auth, users, orgs, workspaces, projects, sessions, API keys, usage, audit, settings, storage) |
| v2.2.0 | 2026-06-18 | Phase 7.2 — Dashboard UI (11 server-rendered pages, 15 reusable components, 1 layout, served via api/dashboard-saas.js) |
| v2.3.0 | 2026-06-18 | Phase 7.3.1 — Conversation Engine foundation (9 modules: manager, session, store, memory, context, summarizer, events, serializer, validator) |
| v2.4.0 | 2026-06-18 | Phase 7.3.3 — Question Generator Engine (6 sub-modules: generator, prioritizer, templates, mapper, scorer, validator; 8 intent-specific mappings; priority system; event integration) |
| v2.5.0 | 2026-06-19 | Phase 7.3.4 — Context Builder Engine (12 modules: builder, normalizer, merger, inference, defaults, entities, assets, history, serializer, validator, events + ContextValidationError; full conversation→Plan IR pipeline) |
| v2.6.0 | 2026-06-19 | Phase 7.4.0 — Pipeline Orchestrator (12 modules: manager, executor, state, events, logger, cache, metrics, validator, serializer, visualizer, recovery, PipelineError; 11-stage E2E pipeline; 8-state machine; TTL cache; checkpoint recovery; retry with exponential backoff; dashboard page) |
| v2.7.0 | 2026-06-19 | Phase 7.5.0 — Platform API (Express REST API; middleware: CORS, requestId, logging, rateLimiter, authentication, authorization, validation, errorHandler; 11 controllers; 11 route files; 6 error classes; 2 response helpers; OpenAPI-ready; Vercel-deployed) |
| v2.8.0 | 2026-06-19 | Phase 7.7.0 — AI Provider Routing Layer (4 providers: OpenAI, Anthropic, Gemini, Ollama; 5 routing strategies: quality, cost, latency, hybrid, intent; fallback chains; load balancer: round-robin, latency, cost, hybrid; token estimation; cost optimizer; streaming; 5 API endpoints; integration wrappers for Planner/Generator/Content Engine) |
| v2.9.0 | 2026-06-19 | Phase 7.8.0 — Multi-Agent Orchestration System (10 specialized agents: architect, designer, developer, content, seo, accessibility, performance, deployment, reviewer, qa; DAG execution graph; shared/working/agent memory; message bus; consensus engine; conflict resolver; full workflow orchestration with sequential/parallel/review/QA modes; 6 API endpoints; dashboard agents page) |
| v3.0.0 | 2026-06-19 | Phase 7.9.0 — Workflow Execution Engine (16 modules: state machine with 10 states/transitions, DAG execution engine, JSON workflow definitions with 8 typed steps, auto-checkpoint system, retry engine with exponential/linear/fixed backoff, compensation engine, versioning with migration/diff, execution metrics, visual execution graph, scheduler with priority queue/delayed/cron/periodic, 11 event types, 11 API endpoints, dashboard workflows page; 136 tests; integrates with Multi-Agent Orchestrator) |
| v3.1.0 | 2026-06-19 | Phase 8.0.0 — Observability & Telemetry Platform (11 modules: telemetry manager, metrics collector with counters/gauges/histograms, distributed tracing engine with nested spans, structured JSON logger with 5 levels, health monitor with 11 components, diagnostics with system snapshots/error summaries/dependency graph, analytics engine with daily/weekly/monthly reports, alert manager with configurable rules and 4 severity levels, telemetry event bus with 8 event types, telemetry storage; 8 API endpoints; dashboard observability page; 108 tests; full API test suite: 437 tests passing) |
| v3.2.0 | 2026-06-19 | Phase 8.1.0 — Distributed Execution Cluster (14 modules: cluster manager, storage, events (11 types), metrics (counters/gauges/histograms), worker manager, registry, node model, heartbeat monitor (offline/stale detection), leader election (automatic failover), task dispatcher (retry + dead letter), task queue (6 types: priority/FIFO/LIFO/scheduled/delayed/deadLetter), load balancer (6 strategies: round_robin/least_busy/weighted/latency/cost/sticky), distributed scheduler; local simulation of 100 workers and 1000 concurrent tasks; 8 API endpoints; dashboard cluster center page; 190 tests; full test suite: 627 tests passing) |
| v3.3.0 | 2026-06-19 | Phase 8.2.0 — Global Event Streaming Engine (15 modules: event bus, stream, store, replay engine, serializer, schema registry, router, subscriptions, filters, correlator, backpressure, metrics, dead letter queue, versioning; integration hooks to Workflow/Telemetry/Cluster/AI/Agent; 129 tests; full test suite: 756 tests passing) |
| v3.3.0 | 2026-06-19 | Phase 8.3.0 — Event Intelligence Layer (8 modules: intelligence engine, pattern detector, anomaly detector with z-score, correlation engine with graph-based model, insight generator with 7 rules, event scorer, intelligence store, intelligence API with 5 endpoints); 87 tests; <5ms per event; full test suite: 843 tests passing |
| v3.4.0 | 2026-06-19 | Phase 8.4.0 — Auto-Remediation Engine (6 modules: remediation engine, 8 built-in actions, 7 default policies with safety guardrails, store with history/state, API with 14 endpoints, EventBus integration); 75 tests; full test suite: 918 tests passing |
| v3.5.0 | 2026-06-19 | Phase 8.5.0 — Control Plane Dashboard Layer (10 API endpoints: overview, events, insights, anomalies, patterns, cluster, workflows, remediation policies/history/approvals; SSE real-time event stream; SSR dashboard page with 6 widgets; sidebar integration); 24 tests; full test suite: 942 tests passing |
| v4.0.0 | 2026-06-19 | Phase 9.0.0 — Cost Optimization & Resource Governance Engine (11 modules: cost engine orchestrator, cost analyzer with 6 analysis domains, pricing models for 4 providers + custom, budget manager with scoped budgets/soft+hard limits/threshold alerts, optimizer with 6 recommendation types, forecast engine with linear regression trend, recommendation engine with scored recommendations, quota manager with 6 tracked resources, policy engine with 5 default policies, cost events with 8 event types; 12 API endpoints; cost dashboard page with 5 tabs; 176 tests; full test suite: 1118 tests passing) |
| v4.1.0 | 2026-06-19 | Phase 9.1.0 — Enterprise Identity & Security Platform (38+ modules across 9 subdirectories: 7 authentication providers, 5 authorization modules including RBAC, 5 organization modules, 4 audit modules, 4 session modules, 5 directory providers, 4 security modules, 4 threat modules; Identity Manager orchestrator; 25 API endpoints; Security Dashboard UI with 6 tabs; 287 tests; full test suite: 1405 tests passing) |
| v4.2.0 | 2026-06-19 | Phase 9.2.0 — Billing & Subscription Platform (30+ modules across 7 subdirectories: BillingManager orchestrator, SubscriptionManager, CustomerManager, InvoiceManager, PaymentManager, CheckoutManager, UsageMeter, PricingEngine, TaxEngine, DiscountEngine, CreditManager, RefundManager, WebhookProcessor, BillingEvents, BillingStorage; PlanRegistry with 5 default plans; 5 payment providers; analytics suite with MRR/ARR/Churn/LTV/Cohort/Forecast; 19 API endpoints at /api/v1/billing/; Billing Dashboard UI with 5 tabs; 255 tests; full test suite: 780 tests passing) |
---

## Historical Architecture Decisions

### 2026-06 — Netlify → Vercel
Native Node.js runtime compatibility with Nodemailer and PDFKit. Vercel supports `api/` directory auto-detection without configuration.

### 2026-06 — Nodemailer upgraded to 8.0.10
Security updates and compatibility improvements.

### 2026-06 — Email Delivery Strategy
Client confirmation emails use `to: [clientEmail, GMAIL_USER]` (not CC) for reliable Gmail SMTP delivery.

### 2026-06 — Queue → Inline SMTP
The in-memory BackgroundQueue was removed (commit `1e93884`). Emails now send inline via `Promise.allSettled()` with 5s timeout per email. This eliminates Vercel function freeze issues where `setImmediate` callbacks never fired after response completion.

### 2026-06 — Workspace Resolution Architecture
`workspace_id` MUST be a valid UUID v4 — non-UUID throws `INVALID_ID_FORMAT` (no hashing, no conversion). `workspace_slug` resolves via `WHERE slug = $1` directly. `project_id` and `execution_id` are flexible (UUID or string).

---

## ⚡ SaaS Core (Phase 7.1 — Implemented)

The SaaS Core is implemented in `lib/saas/` — 12 modules providing the user-facing foundation. See `docs/saas-core.md` for full details.

### Implemented Modules

| Module | Purpose |
|---|---|
| `authorization.js` | RBAC — Owner/Admin/Editor/Viewer, 7 resource categories, 24 permission cells |
| `auditLog.js` | Immutable append-only audit trail to `data/audit.json` |
| `storageManager.js` | Abstract adapter registry with built-in filesystem adapter |
| `userManager.js` | User CRUD, profiles, preferences, email lookup |
| `organizationManager.js` | Orgs, members, role-based invite/remove/change |
| `workspaceManager.js` | Personal/org/team workspace lifecycle |
| `projectManager.js` | Full project lifecycle (create, update, delete, duplicate, archive, list) |
| `authentication.js` | Provider abstraction — Email, GitHub OAuth, Google OAuth |
| `sessionManager.js` | Session create, validate, refresh, revoke, multi-device support |
| `apiKeys.js` | Generate, rotate, revoke, validate with hashed storage |
| `usageTracker.js` | Track projects, deployments, AI generations, storage, bandwidth |
| `settingsManager.js` | Scoped settings (workspace/project/org/user) with defaults |

### Remaining (Future — Not Implemented)
- **Multi-tenant isolation**: Row-Level Security (RLS) on PostgreSQL
- **Billing tiers**: Free (3 projects), Starter (15), Pro (50), Enterprise (unlimited)
- **Preview system**: Live preview with Redis TTL caching, approval gating
- **Async job queue**: Bull/Redis for non-blocking AI pipeline
- **REST API layer**: ✅ Implemented — Phase 7.5.0 `lib/api/` (Express, middleware stack, 11 controllers, 11 route files, OpenAPI-ready, Vercel-deployed via `api/platform-api.js`)
- **WebSocket events**: Real-time pipeline progress

---

## Documentation Map

| File | Role | Status |
|---|---|---|
| **`ARCHITECTURE.md`** | Single source of truth for system architecture, structure, endpoints, lifecycle, email/PDF, telemetry, version history, design decisions, and risks | ✅ Active — this file |
| **`ENGINE_RULES.md`** | AI pipeline behavior rules: engine specifications, scoring system, state machine, validation rules, approval logic | ✅ Active |
| **`DEVELOPMENT_RULES.md`** | Developer workflow: naming conventions, CSS/JS style, Git commits, module boundaries, API design, testing strategy, security | ✅ Active |
| **`DEPLOYMENT.md`** | Infrastructure: Vercel deployment, CI/CD, environment setup, rollback, rate limits, CLI reference | ✅ Active |
| **`docs/dashboard-ui.md`** | Dashboard UI architecture: 11 pages, 15 components, navigation map, responsive strategy, accessibility | ✅ Active — Phase 7.2 |
| **`docs/conversation-engine.md`** | Conversation Engine architecture: 9 base + 6 question sub-modules, lifecycle, storage, event flow, validation, examples | ✅ Active — Phase 7.3.1–7.3.3 |
| **`docs/question-generator.md`** | Question Generator architecture: scoring system, mapping logic, priority rules, 8 intent mappings, integration, test cases | ✅ Active — Phase 7.3.3 |
| **`docs/context-builder.md`** | Context Builder architecture: pipeline, normalization rules, inference rules, defaults, page derivation, Plan IR conversion | ✅ Active — Phase 7.3.4 |
| **`docs/pipeline-orchestrator.md`** | Pipeline Orchestrator architecture: 11 stages, state machine, recovery strategy, cache strategy, metrics, examples, extension guide | ✅ Active — Phase 7.4.0 |
| **`docs/platform-api.md`** | Platform API: architecture, authentication, authorization, endpoint catalog, response format, pagination, errors, rate limits, versioning, SDK support | ✅ Active — Phase 7.5.0 |
| **`docs/ai-provider-layer.md`** | AI Provider Routing Layer: architecture, providers, routing flow, selection strategies, fallback system, load balancing, cost model, streaming, integration, API endpoints | ✅ Active — Phase 7.7.0 |
| **`docs/multi-agent-system.md`** | Multi-Agent Orchestration System: 10 agents, DAG execution flow, memory management, coordination, consensus engine, conflict resolution, API endpoints | ✅ Active — Phase 7.8.0 |
| **`docs/workflow-engine.md`** | Workflow Execution Engine: architecture, state machine, step types, checkpoint system, retry policies, compensation, scheduling, API endpoints, example definitions, extension guide | ✅ Active — Phase 7.9.0 |
| **`docs/observability.md`** | Observability Platform: architecture, metrics types, distributed tracing, structured logging, health monitoring, alerts, analytics, diagnostics, API endpoints, instrumentation guide | ✅ Active — Phase 8.0.0 |
| **`docs/distributed-cluster.md`** | Distributed Execution Cluster: architecture, cluster topology, worker lifecycle, queues, scheduling, leader election, failover, metrics, API, scaling and deployment guides | ✅ Active — Phase 8.1.0 |
| **`docs/event-streaming.md`** | Global Event Streaming Engine: architecture, event lifecycle, replay system, cross-system correlation, performance strategy, extension guide | ✅ Active — Phase 8.2.0 |
| **`docs/event-intelligence.md`** | Event Intelligence Layer: architecture, detection models, correlation graph, scoring system, API endpoints, real-world use cases, extension guide | ✅ Active — Phase 8.3.0 |
| **`docs/auto-remediation.md`** | Auto-Remediation Engine: architecture, built-in actions, default policies, safety model (cooldowns, rate limits, approval gates), API reference, extension guide | ✅ Active — Phase 8.4.0 |
| **`docs/cost-engine.md`** | Cost Optimization & Resource Governance: architecture, pricing model, forecast algorithm, optimization strategy, quota model, policy engine, examples | ✅ Active — Phase 9.0.0 |
| **`ui/control-plane/`** | Control Plane Dashboard (SSR page + 2 files): real-time event stream (SSE), 6 system widgets (events, insights, anomalies, remediation, cluster, workflows), remediation policy toggles, StatsCard metrics grid | ✅ Active — Phase 8.5.0 |
| `AGENTS.md` | Former agent operations manual — content distributed across all 4 canonical files | ❌ Deprecated (deleted) |
| `CHANGELOG.md` | Former detailed version history — compressed to Version History table in this file | ❌ Deprecated (deleted) |
| `ARCHITECTURE-SAAS.md` | Former SaaS design document — compressed to SaaS Architecture section in this file | ❌ Deprecated (deleted) |
| `docs/CONTEXT.md` | Former Ingestion Boundary description — merged into Execution Model section in this file | ❌ Deprecated (deleted) |
| `docs/archive/` | Historical audit reports — all content superseded by canonical docs | ❌ Deprecated (deleted) |

---

## System Risks

1. **Gmail App Password expiration** — credentials expire silently, causing 502 errors
2. **No SMTP retry at handler level** — timeout = partial failure (one email may fail independently)
3. **Vercel cold starts** — after ~60s idle, all in-memory state is lost
4. **No captcha** on any endpoint (honeypot on contact form only)
5. **Gmail daily sending limits** (~500/day) — not suitable for high volume
6. **Serverless memory isolation** — cross-instance state requires Neon PostgreSQL
