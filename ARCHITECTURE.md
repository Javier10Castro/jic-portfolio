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
│   └── telemetry.js           # Observability (logs, traces, health, coverage)
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
│   └── runtime/               # SaaS pipeline orchestrator
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
│   └── migrations/            # SQL migration scripts
├── docs/                      # (reserved — no active files)
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
| **Deployment** | `lib/deployment/` | Implemented | Git init, commit, GitHub repo creation, push |
| **Runtime** | `lib/runtime/` | Implemented | SaaS pipeline orchestrator with Neon persistence |
| **Form Persistence** | `lib/db/formResponses.js` | Implemented | Brief Maestro responses to Neon |
| **Orchestrator** | `lib/orchestrator/` | Implemented | Brief → Plan IR (intent, tone, features, structure) |
| **Planner** | `lib/planner/` | Implemented | Plan IR → Project Blueprint (pages, nav, sections, components) |
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
Deployment Engine (Git → GitHub → Vercel)
```
**Note**: This pipeline is for the Agent Pack project generation system. The contact/brief email system (`api/sendBrief`, `api/sendContact`) operates independently and does not use this pipeline.

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

## 🔮 SaaS Architecture (Future — Not Implemented)

Design for a multi-tenant website generation platform. This section summarizes the key design elements — full details were in the (now consolidated) design document.

### Key Design Elements
- **Multi-tenant isolation**: Row-Level Security (RLS) on PostgreSQL, workspace-scoped data
- **14-table schema**: workspaces, users, workspace_members, projects, project_inputs, project_states, previews, deployments, executions, decisions, artifacts, webhook_events, api_keys, form_responses
- **Billing tiers**: Free (3 projects), Starter (15), Pro (50), Enterprise (unlimited)
- **Preview system**: Live preview with Redis TTL caching, design token injection, approval gating
- **Async job queue**: Bull/Redis for non-blocking AI pipeline
- **User roles**: owner, admin, member, viewer per workspace
- **State machine**: DRAFT → PROCESSING → PREVIEW → APPROVED → DEPLOYING → DEPLOYED (with FAILED and REJECTED branches)
- **Decision Engine**: 5-dimension evaluation (contrast 25%, UX 25%, conversion 20%, clarity 15%, SEO 15%) — archived in ENGINE_RULES.md
- **Auto-improvement**: Up to 2 regeneration attempts on score < 50

---

## Documentation Map

| File | Role | Status |
|---|---|---|
| **`ARCHITECTURE.md`** | Single source of truth for system architecture, structure, endpoints, lifecycle, email/PDF, telemetry, version history, design decisions, and risks | ✅ Active — this file |
| **`ENGINE_RULES.md`** | AI pipeline behavior rules: engine specifications, scoring system, state machine, validation rules, approval logic | ✅ Active |
| **`DEVELOPMENT_RULES.md`** | Developer workflow: naming conventions, CSS/JS style, Git commits, module boundaries, API design, testing strategy, security | ✅ Active |
| **`DEPLOYMENT.md`** | Infrastructure: Vercel deployment, CI/CD, environment setup, rollback, rate limits, CLI reference | ✅ Active |
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
