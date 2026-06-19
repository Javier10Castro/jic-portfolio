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
│   ├── saas/                  # SaaS Core (Phase 7.1) — RBAC, auth, users, orgs, workspaces, projects, sessions, API keys, usage, audit, settings, storage
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
│   └── saas-core.md           # SaaS Core architecture (Phase 7.1)
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
| **Deployment** | `lib/deployment/` | Implemented | Provider-based deployment: Vercel, GitHub, versioning, rollback, history, dry-run |
| **SaaS Core** | `lib/saas/` | Implemented | 12 modules: RBAC, auth (Email/GitHub/Google), users, orgs, workspaces, projects, sessions, API keys, usage tracking, audit log, settings, storage abstraction |
| **Runtime** | `lib/runtime/` | Implemented | SaaS pipeline orchestrator with Neon persistence |
| **Form Persistence** | `lib/db/formResponses.js` | Implemented | Brief Maestro responses to Neon |
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

### AI Website Generator Pipeline (Phase 1-7.1)

```
Brief (client form data)
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
- **REST API layer**: Express/Fastify over the SaaS Core modules
- **WebSocket events**: Real-time pipeline progress

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
