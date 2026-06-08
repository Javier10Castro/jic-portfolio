# Architecture — Web Portfolio + Brief Maestro

## System Overview

Dual-purpose Vercel-deployed site combining a personal portfolio (Javier Ibrahim, Full Stack Developer) with an interactive web discovery tool (Brief Maestro). Both frontends are vanilla HTML/CSS/JS with no build step. Backend consists of two Vercel Serverless Functions that handle form submissions, email delivery via Gmail SMTP, and server-side PDF generation.

## Project Objective

Lead generation and client onboarding through contact forms, AI-powered brief collection, automated email delivery, and PDF brief generation.

## General Architecture

```
User Browser
    │
    ├── index.html ────── POST /api/sendContact ──► Vercel Function ──► Gmail SMTP
    │                                                                    │
    └── brief-maestro.html ── POST /api/sendBrief ──► Vercel Function ──┤
                                                                        ├── Admin: GMAIL_USER (with PDF)
                                                                        └── Client: [email, GMAIL_USER]
```

### Frontend

- **Zero frameworks**: Vanilla HTML, CSS, JavaScript — no build step, no bundler, no TypeScript.
- **Typography**: Google Fonts (Inter + Space Grotesk).
- **Icons**: Inline SVG — no icon library.
- **Styling**: CSS Custom Properties with native dark theme (no toggle). Mobile-first with breakpoints at 900px and 600px.
- **Scroll animations**: `.reveal` class + `IntersectionObserver`, with staggered `.anim-0` through `.anim-4` utilities.
- **Custom cursor**: `#cursor` and `#cursor-ring` elements.
- **Background**: Canvas-based particle network animation.
- **localStorage**: Brief auto-save under key `briefMaestro`, language under `briefMaestroLang`. `currentStep` is not persisted.

### Backend (Vercel Functions)

Two endpoints in `api/`, both deployed as Vercel Serverless Functions (Node.js runtime):

| Endpoint | File | Purpose |
|---|---|---|
| `POST /api/sendContact` | `api/sendContact.js` | Portfolio contact form submission |
| `POST /api/sendBrief` | `api/sendBrief.js` | Brief Maestro submission with PDF attachment |

Both functions use:
- `nodemailer@^8.0.10` with Gmail SMTP (`service: 'gmail'`)
- `transporter.verify()` for SMTP connection validation before sending
- `escapeHTML()` on all user-provided values
- Timezone: `America/Tijuana`

## Agent Pack Pipeline (v1.1.0)

Conceptual prompt processing pipeline for the Agent Pack intelligence layer:

```
INPUT (Prompt Maestro)
    ↓
🧠 VALIDATION — detects missing or weak fields before generation
    ↓
🧭 UX FLOW — builds optimal user journey and page hierarchy dynamically
    ↓
🔍 SEO LAYER — enriches structure with headings, metadata, keywords
    ↓
✍️ COPY BOOST — improves clarity, conversion strength, tone consistency
    ↓
🎨 DESIGN SYSTEM — applies visual identity, components, spacing
    ↓
OUTPUT (Prompt Maestro Final Optimizado)
```

This pipeline is simulated internally during prompt refinement and does not execute as independent services. It transforms the raw Prompt Maestro into an optimized, production-ready brief for the site generator.

---

## Contact Form Flow (index.html → /api/sendContact)

1. User fills form on `index.html` (name, email, company, project, message)
2. Form includes hidden honeypot field (`<input name="bot" style="display:none">`) — frontend checks and skips fetch if filled
3. `fetch()` POST to `/api/sendContact` with JSON body `{ name, email, company?, project?, message, lang }`
4. Vercel Function validates required fields (`name`, `email`, `message`)
5. Creates nodemailer transporter with `GMAIL_USER` / `GMAIL_APP_PASSWORD`
6. Sends **2 emails**:
   - **Admin notification**: `to: GMAIL_USER`, `replyTo: email` — contains message detail as `type: 'admin'`
   - **Client confirmation**: `to: [email, GMAIL_USER]`, `replyTo: GMAIL_USER` — contains same data as `type: 'client'`
7. Returns `{ success: true }` on success, `{ error: string }` on failure

## Brief Maestro Flow (brief-maestro.html → /api/sendBrief)

1. User completes 14-section strategic questionnaire on `brief-maestro.html`
2. Form data auto-saved to `localStorage` key `briefMaestro` on each input
3. On submission, `fetch()` POST to `/api/sendBrief` with JSON body `{ name, email, company?, phone?, prompt, lang, formData }`
4. Vercel Function validates required fields (`name`, `email`)
5. Generates PDF via PDFKit from the `prompt` string
6. Creates nodemailer transporter with `GMAIL_USER` / `GMAIL_APP_PASSWORD`
7. Sends **2 emails**:
   - **Admin notification**: `to: GMAIL_USER`, `replyTo: email` — includes visual summary of form data + PDF attachment (`brief-{biz_name}.pdf`)
   - **Client confirmation**: `to: [email, GMAIL_USER]`, `replyTo: GMAIL_USER` — warm conversational tone with next steps timeline
8. Returns `{ success: true }` on success, `{ error: string }` on failure

## Email Architecture

### Shared Characteristics

- Built with inline styles and table-based layout for email client compatibility
- `bgcolor` fallback for Outlook (which ignores `background: linear-gradient`)
- Dark mode support via `@media (prefers-color-scheme: dark)` with class-based selectors and `!important`
- Gradient header (`#00D4FF → #00FFC8`) with "JIC" logo mark
- Responsive max-width 600px
- `escapeHTML()` on all user-supplied values
- Timestamp formatted with `America/Tijuana` timezone

### Email 1 — Admin Notification

| Property | Contact | Brief |
|---|---|---|
| `from` | `"Javier Ibrahim — Portfolio"` | `"Build a Brief"` |
| `to` | `GMAIL_USER` | `GMAIL_USER` |
| `replyTo` | `email` (client) | `email` (client) |
| Template | `buildContactHTML(data, 'admin')` | `buildEmailHTML(data)` |
| Attachment | None | PDF (`brief-{biz_name}.pdf`) |

### Email 2 — Client Confirmation

| Property | Contact | Brief |
|---|---|---|
| `from` | `"Javier Ibrahim"` | `"Build a Brief"` |
| `to` | `[email, GMAIL_USER]` | `[email, GMAIL_USER]` |
| `replyTo` | `GMAIL_USER` | `GMAIL_USER` |
| Template | `buildContactHTML(data, 'client')` | `buildClientEmailHTML(data)` |
| Attachment | None | None |

**Why `to: [email, GMAIL_USER]` instead of CC**: Gmail SMTP suppresses CC when sender and CC are the same address. Using both recipients in `to:` ensures reliable delivery to both.

## PDF Generation

- Library: `pdfkit@^0.18.0`
- Size: A4, 50px margins
- Content: Full master prompt in monospace (Courier), title "Prompt Maestro", client name/company
- Filename: `brief-{business_name}.pdf` — business name sanitized with `[^a-zA-Z0-9\u00C0-\u024F]`
- Generated server-side in `sendBrief.js` via `generatePDF()` Promise-based function
- Attached to admin notification email only — not sent to client
- Never generated on the client

## Environment Variables

| Variable | Purpose | Used in |
|---|---|---|
| `GMAIL_USER` | Gmail address for SMTP authentication | `sendContact.js:14`, `sendBrief.js:15` |
| `GMAIL_APP_PASSWORD` | Gmail app password | `sendContact.js:15`, `sendBrief.js:16` |

Both must be set in Vercel Dashboard. Never exposed to frontend code. Never hardcoded.

## Project Structure

```
/
├── api/
│   ├── sendBrief.js          # Vercel Function: brief submission (2 emails + PDF)
│   └── sendContact.js        # Vercel Function: contact form (2 emails)
├── .vercel/                   # Vercel cache (auto-generated, ignored by git)
├── node_modules/              # Dependencies (ignored by git)
├── index.html                 # Portfolio landing page
├── brief-maestro.html         # Brief Maestro tool (14 sections)
├── test-data.json             # Test fixture (Salmos Café)
├── icon.ico                   # Favicon
├── package.json               # Project metadata + dependencies
├── package-lock.json          # npm lockfile
├── AGENTS.md                  # Project documentation for AI agents
├── ARCHITECTURE.md            # This file
├── .gitignore                 # Git ignore rules
├── .gitattributes             # Git line ending normalization
└── .git                       # Git repository (initialized)
```

## Deployment Flow (Vercel)

1. Code pushed to GitHub repository
2. Vercel imports from GitHub (or deploys via `vercel --prod`)
3. Vercel detects `api/` directory and deploys each file as a Serverless Function
4. Environment variables (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) set in Vercel Dashboard
5. Static files (`index.html`, `brief-maestro.html`, `test-data.json`, `icon.ico`) served from root
6. No `vercel.json` configuration file — uses Vercel defaults
7. No build step required (pure static + serverless)

## Error Handling

### API Routes

| Scenario | HTTP Status | Response |
|---|---|---|
| Method not POST | 405 | `{ error: "Method Not Allowed" }` |
| Missing required fields | 400 | `{ error: "..." }` |
| Missing env vars | 500 | `{ error: "Email service misconfigured" }` |
| SMTP failure | 502 | `{ error: "Failed to send email" }` |

Both functions log errors to `console.error` (visible in Vercel Dashboard → Deployment → Functions). No retry logic, no queue, no fallback transport.

### Frontend

- Contact form has honeypot (bot check) that prevents fetch if filled
- Brief Maestro has no honeypot
- Both forms display success overlay on `{ success: true }` response
- Both forms show alert on `{ error }` response
- No rate limiting or captcha on either endpoint

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Vanilla HTML/CSS/JS | No build step, zero dependencies, direct deployment |
| Vercel Functions (not Express server) | Serverless, auto-scaling, native Node.js runtime |
| Gmail SMTP via nodemailer | No third-party email service needed; Gmail is free |
| PDFKit server-side | Client-side PDF generation cannot attach to email |
| `to: [email, GMAIL_USER]` | Reliable delivery; Gmail suppresses CC when sender == CC |
| Two separate API functions | Cleaner validation, different payload structures |
| `America/Tijuana` timezone | Consistent timestamps regardless of server location |
| `escapeHTML()` on all output | XSS prevention for email content |
| `transporter.verify()` before send | Fail fast if SMTP credentials are invalid |

## Current System Risks

1. **No rate limiting**: Both endpoints are publicly accessible without throttling — susceptible to abuse
2. **No captcha**: Brief Maestro form lacks honeypot (index.html has one)
3. **Gmail App Password expiration**: Credentials can expire silently, causing 502 errors
4. **No retry logic**: Failed email sends are not retried
5. **No logging infrastructure**: Only `console.error` — no structured logging or monitoring
6. **No input size limits**: Prompt/message fields have no server-side size validation
7. **No CORS configuration**: Vercel Functions accept requests from any origin by default
8. **No CI/CD**: No automated testing or deployment pipeline
9. **Hardcoded SMTP service**: `service: 'gmail'` — switching providers would require code changes

---

## Project Factory Layer

The system has evolved from a **Website Generator** (output: a single HTML site) to a **Production Project Factory** (output: a complete deployable project).

### Evolution

| Phase | Output | Description |
|---|---|---|
| v1.0.0 | Website | Static HTML/CSS/JS site |
| v1.1.0 | Website + Docs | Site + AGENTS.md + ARCHITECTURE.md |
| v1.2.0 | Full Project | Site + docs + project structure + Git readiness |

### Integration

The Project Bootstrap System is the final layer of the Prompt Maestro pipeline:

```
Brief (client input)
    ↓
Prompt Maestro (14-section structured brief)
    ↓
Agent Pack v1 (validation, UX, SEO, copy refinement)
    ↓
Website Generator (HTML/CSS/JS output)
    ↓
Project Bootstrap System (project structure + docs + Git)
    ↓
GitHub-ready deployable product
```

### Output Guarantees

Every generated project includes:

- **Deployable website**: functional HTML/CSS/JS, mobile-first, dark theme
- **Project documentation**: README.md (how to run), AGENTS.md (rules), ARCHITECTURE.md (design), CHANGELOG.md (version)
- **Git readiness**: pre-configured `.gitignore`, `.gitattributes`, and first commit instructions
- **Deployment compatibility**: Vercel-ready by default

---

## Project Scaffold Engine

The `lib/scaffold/` module implements the Project Bootstrap System as real files on disk.

### Module structure

```
/lib/scaffold/
  index.js            → entry point, input normalization
  core/engine.js       → orchestration, file coordination
  generators/          → filesystem functions (fs + path)
  templates/registry.js → single source of truth for templates
```

### Pipeline

```
Project Definition
  { project_name, project_type, prompt_maestro_final }
    ↓ (index.js)
  sanitize + normalize
    ↓ (engine.js)
  decide files to create
    ↓ (generators)
  create directories + write files
    ↓ (templates/registry)
  inject content from templates
    ↓
  Physical project on disk
```

### Constraints

- Node.js native only (`fs`, `path`) — zero external dependencies
- Deterministic: same input always produces same output
- No deployment, no Git, no API calls
- Always validates before overwriting existing directories

---

## Project Plan Engine

The `lib/plan/` module converts a Prompt Maestro string into a **Semantic Intermediate Representation (IR)** — a structured JSON blueprint consumed by the Scaffold Engine.

### Module structure

```
/lib/plan/
  index.js            → semantic compiler (section parser + mapper)
```

### Pipeline

```
prompt_maestro_final (string)
    ↓
  Parse 14 sections (## N. NAME headers)
    ↓
  Extract key-value pairs (**key:** value)
    ↓
  Map to 8 semantic categories
    ↓
  JSON output
```

### Semantic mapping

| IR Category | Source sections | Description |
|---|---|---|
| `identity` | Business, Branding, Essence, Objectives | Business name, mission, vision, values, personality |
| `structure` | Architecture, Objectives | Sitemap, user flow, conversion goal |
| `ui` | Branding, Visual References | Colors, typography, visual style, emotions |
| `content` | Content, Products/Services, Audience | Existing materials, service list, buyer persona |
| `seo` | SEO Strategy, Objectives | Keywords, locations, KPIs |
| `conversion` | Conversion Strategy, Objectives | CTAs, funnel, lead magnet, timeline |
| `assets` | Functionalities, Competition, Social Proof | Features, tools, testimonials, stats |
| `rules` | Essence, Branding | Forbidden elements, constraints |

### Constraints

- No hallucinations: only extracts what exists in the prompt
- No external knowledge: purely structural transformation
- Deterministic: same Prompt Maestro = same JSON
- Zero external dependencies

---

## Decision Layer

The `lib/decision/` module records architectural decisions made during Agent Pack development.

It is NOT for user or generated project logs — only for internal system architecture decisions.

### Module structure

```
/lib/decision/
  index.js            → entry point (fs persistence layer)
```

### API

| Method | Signature | Returns | Description |
|---|---|---|---|
| `registerDecision` | `({ id, title, reason, impact, modules_affected, version })` | `Object` (saved entry) | Persists a new decision. Requires `id` and `title`. |
| `listDecisions` | `()` | `Array` | Returns all decisions in chronological order. |
| `getDecision` | `(id)` | `Object \| null` | Returns a specific decision or `null`. |

### Schema

```json
{
  "id": "arch-003",
  "title": "Decision Layer v1",
  "reason": "Centralized logging for architectural changes",
  "impact": "low",
  "modules_affected": ["lib/decision/index.js"],
  "version": "v1.3.0",
  "timestamp": "2026-06-08T12:00:00.000Z"
}
```

### Storage

- **File**: `data/decisions.json` (auto-created if missing)
- **Persistence**: `fs` native — no database, no external dependencies
- **Guarantee**: Duplicate `id` values are rejected with an error

### Integration points

| Consumer | When | Purpose |
|---|---|---|
| Agent Pack v1 workflow | On architectural changes | Record decision during `git status` → analysis → commit cycle |
| Plan Engine | Optional future | Log when semantic mapping changes |
| Scaffold Engine | Optional future | Log when template structure changes |

---

## Deployment Engine

The `lib/deployment/` module automates the deployment of generated projects to GitHub.

It connects with the **Scaffold Engine** (receives a physical project on disk), the **Decision Layer** (records deployment results), and **GitHub CLI** (optional, for automatic repo creation).

### Module structure

```
/lib/deployment/
  index.js            → entry point (child_process + fs persistence)
```

### API

| Method | Signature | Returns | Description |
|---|---|---|---|
| `initRepository` | `(projectPath)` | `{ success, output }` | `git init` + `git branch -M main` + status check |
| `createGitHubRepo` | `(name, projectPath)` | `{ success, instruction }` | `gh repo create` or manual instructions |
| `commitProject` | `(projectPath)` | `{ success, output }` | `git add .` + `git commit -m "feat: initial deployment"` |
| `pushToRemote` | `(projectPath)` | `{ success, output }` | `git push -u origin main` |
| `registerDeployment` | `({ project_name, repo_url, status, engine_version })` | `Object` (saved entry) | Persists a new deployment record |
| `listDeployments` | `()` | `Array` | All deployment records |
| `deployFullPipeline` | `(projectPath, opts)` | `{ success, status, steps }` | Full pipeline: init → commit → repo → push → register |

### Schema

```json
{
  "id": "deploy-001",
  "project_name": "salmos-cafe",
  "repo_url": "https://github.com/user/salmos-cafe",
  "status": "deployed",
  "engine_version": "v1.0.0",
  "timestamp": "2026-06-08T12:00:00.000Z"
}
```

### Storage

- **File**: `data/deployments.json` (auto-created if missing)
- **Persistence**: `fs` native — no database, no external dependencies

### Pipeline

```
Project path on disk (from Scaffold Engine)
    ↓
1. initRepository — git init + branch main
    ↓
2. commitProject — git add . + git commit
    ↓
3. createGitHubRepo — gh repo create (or instructions)
    ↓
4. pushToRemote — git push origin main
    ↓
5. registerDeployment — persist to deployments.json
    ↓
{ success, status, steps }
```

### Graceful degradation

| Scenario | Behavior |
|---|---|
| Git not installed | Returns `{ success: false, error, instruction }` |
| gh not installed | Returns manual instructions for GitHub creation |
| No remote configured | Returns `{ success: false, error, instruction }` |
| Nothing to commit | Treated as recoverable — pipeline continues |
| Full pipeline with failures | Pipeline stops, registers as `failed` status, returns step-by-step results |

---

## Orchestrator Engine

The `lib/orchestrator/` module is the **central controller** of the Agent Pack v1 system.

It dynamically coordinates all modules (Compiler, Plan, Scaffold, Decision Layer, Deployment) based on the detected input type.

### Module structure

```
/lib/orchestrator/
  index.js            → entry point (input analyzer + pipeline builder + executor)
```

### Input type detection

| Type | Detection | Pipeline |
|---|---|---|
| `raw_email` | Contains `Subject:`/`From:`/`To:` headers or long text (>5000 chars) | `compiler → plan → scaffold` |
| `structured_prompt` | Contains `## N. NAME` headers (Prompt Maestro format) | `plan → scaffold` |
| `json_brief` | Input is an object or string starting with `{`/`[` | `scaffold` |
| `existing_project` | No build pipeline | deployment (if requested) |

### API

| Method | Signature | Returns | Description |
|---|---|---|---|
| `process` | `({ input, type?, deploy?, projectName?, projectType? })` | `{ session_id, status, steps, output }` | Full pipeline execution |
| `detectType` | `(input)` | `'raw_email' \| 'structured_prompt' \| 'json_brief' \| 'existing_project'` | Classify input |
| `buildPipeline` | `(inputType)` | `string[]` | Return step list per type |

### Session output

```json
{
  "session_id": "a1b2c3d4",
  "input_type": "structured_prompt",
  "status": "completed",
  "pipeline": ["plan", "scaffold"],
  "steps": [
    { "name": "plan", "status": "completed", "result": {...} },
    { "name": "scaffold", "status": "completed", "result": {...} }
  ],
  "errors": [],
  "output": { "project_path": "salmos-cafe", "ir": {...}, "compiled": null }
}
```

### Fallback intelligence

- On module failure: auto-register in **Decision Layer** with error details
- Pipeline continues with remaining steps (non-blocking)
- Final status reflects overall result: `completed` / `partial` / `failed`
- Deployment is controlled by the `deploy` option (default: true)

### Constraints

- Zero external dependencies
- No existing module modification
- Deterministic: same input + same options = same output
- No data invention — orchestrates existing modules only

---

## Form Persistence Layer

The `lib/db/formResponses.js` module persists all Brief Maestro form responses to PostgreSQL **before** the Orchestrator pipeline executes.

```
INPUT (Brief Maestro)
    ↓
FORM SAVER (saves sections → form_responses table)
    ↓
ORCHESTRATOR (compiler → plan → scaffold → deploy)
```

### Module structure

```
/lib/db/
  index.js           → Pool, query helper, connection management
  formResponses.js   → Form persistence CRUD
```

### Schema

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

### Field → Section mapping

| Prefix | Section | Sample fields |
|---|---|---|
| `biz_*` | business | biz_name, biz_valores |
| `obj_*` | goals | obj_principal, obj_kpis |
| `comp_*` | competition | comp_directos, comp_problemas |
| `pub_*` | audience | pub_ideal, pub_motivaciones |
| `brand_*` | branding | brand_colores, brand_estilo |
| `arq_*` | site | arq_paginas, arq_flujo |
| `cont_*` | content | cont_fotos, cont_textos |
| `serv_*` | services | serv_estrella, serv_precio |
| `social_*` | social_proof | social_testimonios |
| `func_*` | functionality | func_basicas, func_avanzadas |
| `seo_*` | seo | seo_keywords, seo_geo |
| `ref_*` | references | ref_marcas, ref_favoritos |
| `conv_*` | conversion | conv_cta, conv_lead |
| `ai_*` | essence | ai_diferencia, ai_metafora |

### API

| Method | Input | Returns | Description |
|---|---|---|---|
| `createTable()` | — | — | Creates form_responses table if not exists |
| `saveFormResponse` | `(project_id, section, field_key, value)` | — | Single response insert |
| `saveBulkFormResponses` | `(project_id, formData)` | `Number` | Batch save from formData object |
| `getProjectFormResponses` | `(project_id)` | `Row[]` | All responses for a project |
| `getResponsesGrouped` | `(project_id)` | `Object` | Responses grouped by section |
| `generateProjectId` | `(name, email)` | `String` | Generates unique `proj_<hash>` |

### Integration with Brief Maestro endpoint

In `api/sendBrief.js`, form persistence runs after validation but before any pipeline execution:

```js
// 1. Validate input
// 2. Save form responses to PostgreSQL (non-blocking — failures are logged, not thrown)
// 3. Generate PDF
// 4. Send admin email with PDF attachment
// 5. Send client confirmation
```

### Rules

- Runs **before** the Orchestrator pipeline
- DB failure **does not block** email delivery — errors are logged to `console.error`
- Arrays (checkboxes, tags) are converted to comma-separated strings for storage
- No ORM — raw SQL with `pg`

---

## Project Loader Engine

The `lib/loader/` module reconstructs projects from PostgreSQL and local filesystem data.

It is a **read-only** module — it queries and reconstructs without modifying any data.

### Module structure

```
/lib/loader/
  index.js            → entry point (queries + data reconstruction)
```

### API

| Method | Input | Returns | Description |
|---|---|---|---|
| `loadProject(project_id)` | `string` | `{ meta, responses, grouped }` | Full project data from DB |
| `rebuildPromptMaestro(project_id, lang?)` | `string, string` | `string` | Rebuild Prompt Maestro text from stored responses |
| `getProjectState(project_id)` | `string` | `{ project, form_responses, execution_history, decisions }` | Complete pipeline state |
| `listProjects()` | — | `Array` | All projects with metadata |

### Data sources

| Source | Type | Purpose |
|---|---|---|
| `form_responses` (PostgreSQL) | Existing table | Form responses grouped by section |
| `projects` (PostgreSQL) | Optional table | Project metadata |
| `executions` (PostgreSQL) | Optional table | Pipeline execution history |
| `data/decisions.json` | Local file | Architectural decisions |

### Constraints

- Read-only — never writes to any data source
- Optional tables (`projects`, `executions`) don't block if absent
- Deterministic reconstruction: same DB state = same output
- Zero external dependencies
