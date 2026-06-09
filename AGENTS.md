# AGENTS.md — Web Portfolio + Brief Maestro

## Project Overview

Dual-purpose site deployed on Vercel combining a professional portfolio and an interactive web discovery tool.

### Portfolio (`index.html`)
- Personal portfolio for Javier Ibrahim (Full Stack Developer)
- Sections: services, projects, testimonials, contact form
- Contact form submits to `/api/sendContact`

### Brief Maestro (`brief-maestro.html`)
- 14-section strategic questionnaire for defining a web project
- Generates a master prompt (ready for Claude AI)
- Auto-saves progress to `localStorage`
- Submits to `/api/sendBrief`
- Generates server-side PDF attached to admin email notification

### Primary Objective
Lead generation and client onboarding through contact forms, AI-powered brief collection, automated email delivery, and PDF brief generation.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | — | Zero frameworks, no build step |
| Typography | Google Fonts | Inter + Space Grotesk | Design system |
| Icons | Inline SVG | — | No icon library |
| Runtime | Node.js | 22.11.0 | Serverless functions |
| Hosting | Vercel | — | Platform & deployment |
| Email | nodemailer | ^8.0.10 | Gmail SMTP transport |
| PDF | pdfkit | ^0.18.0 | Server-side prompt PDF |
| Storage | localStorage | — | Brief auto-save |
| Styling | CSS Custom Properties | — | Dark theme, design system |

---

## Project Structure

```
/
├── api/
│   ├── sendBrief.js          # Vercel Function: brief submission (2 emails + PDF)
│   └── sendContact.js        # Vercel Function: contact form (2 emails)
├── .vercel/                   # Vercel cache (auto-generated, ignore)
├── node_modules/              # Dependencies (npm install)
├── lib/                       # Internal system modules
│   ├── compiler/              # Unified Brief Compiler v1
│   ├── plan/                  # Plan Engine v1 (semantic compiler)
│   ├── scaffold/              # Scaffold Engine v1 (filesystem generator)
│   ├── decision/              # Decision Layer v1 (architectural log)
│   ├── orchestrator/          # Orchestrator Engine v1 (central controller)
│   ├── db/                    # Database modules (Neon PostgreSQL)
│   ├── loader/                # Project Loader Engine v1 (read-only)
│   ├── design-system/         # Design System Engine v1 (CSS vars + tokens)
│   ├── preview/               # Visual Preview Engine v1 (simulation)
│   └── runtime/               # SaaS Runtime Layer v1 (pipeline orchestrator)
├── data/                      # Runtime storage (not committed)
│   ├── decisions.json         # Architectural decision records
│   ├── deployments.json       # Deployment records
│   └── migrations/            # SQL migration scripts
├── api/                       # Vercel Serverless Functions
│   ├── sendBrief.js           # Brief submission (2 emails + PDF)
│   ├── sendContact.js         # Contact form (2 emails)
│   ├── projects/              # Dashboard API (legacy)
│   └── v1/                    # SaaS API v1 (tenant-safe)
├── dashboard-api.js           # Shared API v1 integration layer (workspace auth, polling)
├── dashboard.html             # Project list with status badges, create form, auto-refresh
├── dashboard-project.html     # Project control center (pipeline tracker, scoring, controls)
├── dashboard-logs.html        # Live execution logs + AI decision viewer
├── dashboard-preview.html     # Preview renderer (iframe, version selector, approval)
├── index.html                 # Portfolio landing page
├── brief-maestro.html         # Brief Maestro tool (14 sections)
├── test-data.json             # Test fixture (Salmos Café)
├── icon.ico                   # Favicon
├── package.json               # Project metadata + dependencies
├── package-lock.json          # npm lockfile
├── AGENTS.md                  # This file
├── ARCHITECTURE.md            # System architecture
├── CHANGELOG.md               # Version history
├── ARCHITECTURE-SAAS.md       # SaaS multi-tenant architecture design
├── .gitignore                 # Ignores .vercel, node_modules, data/
└── .gitattributes             # Line ending normalization
```
/
├── api/
│   ├── sendBrief.js          # Vercel Function: brief submission (2 emails + PDF)
│   └── sendContact.js        # Vercel Function: contact form (2 emails)
├── .vercel/                   # Vercel cache (auto-generated, ignore)
├── node_modules/              # Dependencies (npm install)
├── lib/                       # Internal system modules
│   ├── compiler/              # Unified Brief Compiler v1
│   ├── plan/                  # Plan Engine v1 (semantic compiler)
│   ├── scaffold/              # Scaffold Engine v1 (filesystem generator)
│   ├── decision/              # Decision Layer v1 (architectural log)
│   ├── orchestrator/          # Orchestrator Engine v1 (central controller)
│   ├── db/                    # Database modules (Neon PostgreSQL)
│   │   ├── index.js           # Pool + query + connection management
│   │   └── formResponses.js   # Form Persistence Layer v1
│   ├── loader/                # Project Loader Engine v1 (read-only)
│   ├── design-system/         # Design System Engine v1 (CSS vars + tokens)
│   ├── preview/               # Visual Preview Engine v1 (simulation)
│   ├── runtime/               # SaaS Runtime Layer v1 (pipeline orchestrator)
│   ├── scoring/               # (planned) Decision Scoring Engine v2
│   ├── queue/                 # (planned) Bull/Redis job queue adapter
│   ├── storage/               # (planned) Blob storage adapter
│   ├── billing/               # (planned) Stripe subscription adapter
│   └── auth/                  # (planned) Auth + RBAC helpers
├── data/                      # Runtime storage (not committed)
│   ├── decisions.json         # Architectural decision records
│   ├── deployments.json       # Deployment records
│   └── migrations/            # SQL migration scripts
├── index.html                 # Portfolio landing page
├── brief-maestro.html         # Brief Maestro tool (14 sections)
├── test-data.json             # Test fixture (Salmos Café)
├── dashboard-api.js           # Shared API v1 integration layer (workspace auth, polling)
├── dashboard.html             # Project list with status badges, create form, auto-refresh
├── dashboard-project.html     # Project control center (pipeline tracker, scoring, controls)
├── dashboard-logs.html        # Live execution logs + AI decision viewer
├── dashboard-preview.html     # Preview renderer (iframe, version selector, approval)
├── icon.ico                   # Favicon
├── package.json               # Project metadata + dependencies
├── package-lock.json          # npm lockfile
├── AGENTS.md                  # This file
├── ARCHITECTURE.md            # System architecture
├── CHANGELOG.md               # Version history
├── ARCHITECTURE-SAAS.md       # SaaS multi-tenant architecture design
├── .gitignore                 # Ignores .vercel, node_modules, data/
└── .gitattributes             # Line ending normalization
```

---

## Code Conventions

### Naming

| Element | Convention | Examples |
|---|---|---|
| CSS classes | `kebab-case` | `.nav-logo`, `.btn-primary`, `.hero-eyebrow` |
| CSS custom properties | `--kebab-case` | `--bg`, `--accent`, `--font-sans` |
| HTML IDs | `kebab-case` or `snake_case` | `inp-name`, `err-email`, `cur-step-name` |
| JS variables | `camelCase` | `currentStep`, `formData`, `tagInputs` |
| JS constants | `UPPER_SNAKE_CASE` | `GMAIL_USER`, `SECTIONS`, `AI_PREF_ES` |
| JS functions | `camelCase` | `startApp()`, `renderStep()`, `submitContact()` |
| Form field IDs | `snake_case` (matches JSON keys) | `biz_name`, `obj_principal` |

### CSS Style
- Compact single-line rule blocks (no newlines between declarations)
- Flat selectors (no nesting)
- Grouped by component with section comments (`/* NAV */`, `/* HERO */`)
- CSS Grid + Flexbox layout
- Mobile-first with breakpoints at 900px and 600px
- Native dark theme via `:root` (no toggle)
- `.reveal` + `IntersectionObserver` for scroll animations
- `.anim-0` through `.anim-4` staggered animation utilities
- Custom cursor (`#cursor`, `#cursor-ring`)
- Canvas-based particle network background

### JavaScript Style
- Global/script-level code (no IIFE, no modules)
- Inline event handlers in HTML attributes (`onclick`, `oninput`)
- Template literals for HTML generation
- `async/await` in serverless functions
- Arrow functions extensively
- Fetch API for backend calls
- No TypeScript, no linter, no bundler

### Email Templates
- Table-based HTML layout for email client compatibility
- Inline styles with `bgcolor` fallback for Outlook
- Dark mode via `@media (prefers-color-scheme: dark)`
- Inline translations via `t(es, en)` helper
- `escapeHTML()` on all user-provided values
- "JIC" logo with gradient `#00D4FF → #00FFC8` in header and signature
- Client confirmation uses human, conversational tone (no AI-style or corporate jargon)

---

## API Endpoints

### `POST /api/sendBrief`
- **Payload**: `{ name, email, company?, phone?, prompt, lang, formData }`
- **Response**: `{ success: true }` or `{ error: string }`
- **Action**: Validates → generates PDF via PDFKit → sends 2 emails:
  1. Admin notification with PDF attachment (`brief-{biz_name}.pdf`) + visual summary
  2. Client confirmation to `[email, GMAIL_USER]` with premium template

### `POST /api/sendContact`
- **Payload**: `{ name, email, company?, project?, message, lang }`
- **Response**: `{ success: true }` or `{ error: string }`
- **Action**: Validates → sends 2 emails:
  1. Admin notification to `GMAIL_USER`
  2. Client confirmation to `[email, GMAIL_USER]`

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GMAIL_USER` | Gmail address for SMTP authentication |
| `GMAIL_APP_PASSWORD` | Gmail app password (not regular password) |

**Rules:**
- Never expose to frontend code
- Never hardcode credentials
- Always access through `process.env`

---

## Email Standards

All emails must follow the JIC visual identity:

- Gradient header (`#00D4FF → #00FFC8`)
- "JIC" logo mark in header and signature
- Responsive layout (max-width 600px)
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Human, conversational tone — no AI-style wording, no corporate jargon
- Timestamp using `America/Tijuana` timezone
- `escapeHTML()` on all user-supplied values

---

## PDF Standards

- Generated server-side in `sendBrief.js` via PDFKit
- A4 size, 50px margins
- Filename format: `brief-{business_name}.pdf`
- Sanitize business name with `[^a-zA-Z0-9\u00C0-\u024F]`
- Never generate PDFs on the client

---

## localStorage Keys

| Key | Purpose | Persists |
|---|---|---|
| `briefMaestro` | Full form data object | Yes |
| `briefMaestroLang` | Language preference (`es`/`en`) | Yes |
| `briefMaestroAuto` | Auto-navigate flag (test data) | No — deleted after use |

`currentStep` is NOT persisted — always starts at 0 on reload.

---

## Testing with Test Data

Load Salmos Café test fixture in browser console at `brief-maestro.html`:

```javascript
fetch('/test-data.json')
  .then(r => r.json())
  .then(d => {
    localStorage.setItem('briefMaestroLang', 'es');
    localStorage.setItem('briefMaestro', JSON.stringify(d));
    localStorage.setItem('briefMaestroAuto', '1');
    location.reload();
  });

// After reload — auto-navigate to contact form:
if (localStorage.getItem('briefMaestroAuto')) {
  localStorage.removeItem('briefMaestroAuto');
  let i = setInterval(() => {
    let a = document.getElementById('app'), c = document.getElementById('contact-page');
    if (a && c && getComputedStyle(a).display !== 'none') {
      clearInterval(i);
      a.classList.remove('active');
      c.classList.add('active');
      window.scrollTo(0, 0);
    }
  }, 100);
}
```

---

## Security Rules

- Validate all user input on the server
- Protect public endpoints from abuse
- Use honeypot field (contact form already has `<input name="bot" style="display:none">`)
- Keep dependencies updated
- Run security reviews before production deployments

---

## Deployment Rules

- Target: **Vercel only**
- Do not introduce infrastructure requiring Netlify Functions, Cloudflare Workers, AWS Lambda, or Docker unless explicitly requested
- Use `vercel --prod` for production deployment
- Environment variables must be set in Vercel Dashboard

---

## Testing Checklist

Before deployment, verify:

- [ ] Contact form submits successfully
- [ ] Brief submission sends successfully
- [ ] PDF attachment generated and attached to admin email
- [ ] Admin email delivered to `GMAIL_USER`
- [ ] Client confirmation delivered to both `[email, GMAIL_USER]`
- [ ] Timezone displays correct `America/Tijuana` time
- [ ] No console errors in browser
- [ ] No Vercel Function errors (500/502)
- [ ] Both languages (es/en) render correctly
- [ ] Dark mode renders correctly in email clients

---

## Agent Workflow

When receiving a task:

1. **Analyze** — Understand the request, its context, and dependencies
2. **Identify affected files** — Determine which files will change (frontend, API, styles, translations)
3. **Explain the plan** — Present the implementation approach before coding
4. **Estimate risks** — Identify breaking changes, regressions, or security concerns
5. **Implement** — Only after approval for substantial changes

---

## File Modification Policy

- Prefer minimal, surgical edits over rewrites
- Modify only affected sections
- Preserve existing functionality
- Reuse existing code patterns and helpers
- Do not create unnecessary dependencies
- Maintain consistency with current architecture (vanilla HTML/CSS/JS, nodemailer, pdfkit)
- Keep explanations concise to minimize context and token consumption

---

## Versioning System

The Agent Pack follows semantic versioning:

- `v1.0.0` — Initial stable system
- `v1.1.0` — Improvements without breaking changes
- `v1.6.0` — SaaS multi-tenant architecture design (design phase)
- `v1.7.0` — SaaS Runtime Layer v1 + API v1 implementation
- `v2.0.0` — Architecture changes or new agent system

---

## Agent Pack v1.1.0 — Intelligence Layer

### New Internal Agents (Simulated)

- **🧠 Validator Agent**
  Detects missing or weak fields in the brief before generation.

- **🧭 UX Flow Agent**
  Builds optimal user journey and page hierarchy dynamically.

- **🔍 SEO Layer Agent**
  Automatically enriches structure with SEO optimization (headings, metadata, keywords).

- **✍️ Copy Booster Agent**
  Improves clarity, conversion strength, and tone consistency of all generated copy.

---

## Architecture Reference

Este proyecto tiene un archivo `ARCHITECTURE.md` que describe:

- Flujo del sistema
- APIs
- Email system
- PDF generation
- Variables de entorno

En caso de duda técnica, consultar `ARCHITECTURE.md` antes de modificar código.

---

## Historical Decisions

### 2026-06 — Netlify → Vercel

Reason: Native Node.js runtime compatibility with Nodemailer and PDFKit.

---

### 2026-06 — Nodemailer upgraded to 8.0.10

Reason: Security updates and compatibility improvements.

---

### 2026-06 — Email Delivery Strategy

Client confirmation emails must be sent using:

```
to: [clientEmail, GMAIL_USER]
```

Do not use CC.

Reason: More reliable delivery behavior when using Gmail SMTP.

---

### 2026-06 — Timezone Standard

All timestamps must use:

```
America/Tijuana
```

---

### 2026-06 — PDF Generation

Brief PDFs are generated server-side using PDFKit and attached to the admin notification email.

---

### 2026-06 — Workspace Resolution Architecture (Designed & Fixed)

The workspace resolution flow was redesigned on 2026-06-09 to eliminate "Workspace not found" errors caused by uuidv5 hashing of non-UUID workspace_ids.

#### Architecture Rules (Fixed)

| Rule | Description |
|---|---|
| **STRICT ID POLICY** | `workspace_id` MUST be a valid UUID v4. Non-UUID throws `INVALID_ID_FORMAT`. No hashing, no conversion. |
| **SLUG FIRST-CLASS** | `workspace_slug` resolves via `WHERE slug = $1` — no normalization, no UUID conversion. |
| **PRIORITY** | `workspace_id` (if valid UUID) → `workspace_slug` → throw `INVALID_INPUT` |
| **BOTH PRESENT** | If workspace_id is provided but invalid → throws `INVALID_ID_FORMAT` immediately (slug is NOT fallback) |

#### Resolution matrix

| Input pattern | What happens | Works? |
|---|---|---|
| `workspace_id: "00000000-...0001"` | UUID → assertUUID → `WHERE id = seed.id` | ✅ |
| `workspace_id: "ws_demo_001"` | not UUID → `INVALID_ID_FORMAT` (never reaches DB) | ❌ early fail |
| `workspace_slug: "test-workspace"` | slug → `WHERE slug = 'test-workspace'` | ✅ |
| `workspace_id: "0000...0001" + workspace_slug: "test"` | UUID takes priority → `WHERE id` | ✅ |
| Neither provided | `INVALID_INPUT: workspace_id or workspace_slug is required` | ❌ early fail |

#### ID Contract (STRICT vs FLEXIBLE)

| Entity | Field | Validation | Behavior |
|---|---|---|---|
| **workspace** | `workspace_id` | STRICT UUID v4 | `assertUUID` → throws `INVALID_ID_FORMAT` on non-UUID |
| **workspace** | `workspace_slug` | First-class string | `WHERE slug = $1` — no normalization |
| **project** | `project_id` | FLEXIBLE (UUID or string) | `normalizeProjectId()` → accepts any non-empty string; `resolveProject()` resolves UUID→id, string→slug |
| **execution** | `execution_id` | FLEXIBLE (UUID or string) | `normalizeProjectId()` — non-UUID auto-converted to UUID for DB |
| **user** | `user_id` | STRICT UUID v4 | `normalizeId()` → throws `INVALID_ID_FORMAT` on non-UUID |

#### Code changes (2026-06-09)

| File | Change |
|---|---|
| `lib/runtime/id-normalizer.js` | `normalizeId`: removed uuidv5 hashing — throws `INVALID_ID_FORMAT` on non-UUID; `normalizeProjectId`: new function accepts any non-empty string (no UUID enforcement); `safeUUID`: returns `null` on non-UUID |
| `lib/runtime/validators.js:29-30` | `assertUUID`: updated message, removed "auto-normalized" reference |
| `lib/runtime/index.js:234` | `createProject`: replaced `normalizeId(workspaceId)` with `if (workspaceId) assertUUID()` |
| `lib/runtime/index.js:256` | `runPipeline`: replaced `normalizeId(projectId)` with `normalizeProjectId()` for flexible project_id |
| `lib/runtime/index.js:258` | `runPipeline`: replaced `normalizeId(executionId)` with `normalizeProjectId()` + UUID fallback for DB |
| `lib/runtime/index.js:174-178` | `getProjectById`: added 22P02 catch → returns `null` (project not found) for non-UUID project_ids |
| `lib/runtime/index.js:267` | `runPipeline`: replaced `getProjectById` with `resolveProject()` — dual-path id/slug resolution; reassigns `projectId = project.id` (DB UUID) for all downstream ops |
| `lib/runtime/index.js:403` | `approveProject`: same pattern — `resolveProject()` + `projectId = project.id` reassignment |
| `lib/runtime/project-resolver.js` | **New file**: `resolveProject({ project_id, workspace_id })` — if UUID → `WHERE p.id = $1`, if string → `WHERE p.slug = $1`. Throws `NOT_FOUND` directly. |
| `test-runtime-safe.js` | 7 tests updated: error codes, 4 uuidv5 conversion → strict throw, 5 new normalizeProjectId tests |

---

## Project Bootstrap System (v1.0)

El sistema ahora genera **proyectos completos**, no solo sitios web. Cada output es un producto deployable inmediatamente con estructura estándar, Git-ready y documentación auto-generada.

### Estructura de output estándar

```
/
├── index.html
├── assets/
├── api/ (si aplica)
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── .gitignore
```

### Git & GitHub readiness

Cada proyecto generado es compatible con:

- `git init`
- `git add .`
- `git commit -m "feat: initial site generation"`
- `gh repo create <project-name> --public --source=. --push`

### Principio central

> "The system generates deployable products, not static websites"

---

## Project Scaffold Engine (v1)

El módulo `lib/scaffold/` implementa físicamente el Project Bootstrap System.

Convierte un Project Definition en una estructura real de archivos en disco:

```
/lib/scaffold/
  index.js            → entry point
  core/engine.js       → orchestration logic
  generators/          → filesystem functions (node fs)
  templates/registry.js → single source of truth for templates
```

**Input**: `{ project_name, project_type, prompt_maestro_final }`  
**Output**: Carpeta con `index.html`, `assets/`, `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `.gitignore`

Reglas:
- Solo Node.js nativo (`fs`, `path`) — 0 dependencias externas
- Determinista: misma entrada = mismo output
- No hace deploy, no toca Git, no llama APIs

---

## Project Plan Engine (v1)

El módulo `lib/plan/` convierte un Prompt Maestro en un **Semantic Intermediate Representation (IR)** — un JSON estructurado que sirve como blueprint para el Scaffold Engine.

```
/lib/plan/
  index.js            → semantic compiler (section parser + mapper)
```

**Input**: `prompt_maestro_final` (string)  
**Output**: JSON con `project.identity`, `.structure`, `.ui`, `.content`, `.seo`, `.conversion`, `.assets`, `.rules`

Reglas:
- Determinista: misma entrada = mismo JSON
- Sin dependencias externas
- No genera archivos, solo estructura datos
- Mapea las 14 secciones del Prompt Maestro a 8 categorías semánticas

---

## Decision Layer (v1)

El módulo `lib/decision/` registra decisiones arquitectónicas del sistema Agent Pack v1.

No es para logs de usuarios ni proyectos generados — solo para decisiones internas de arquitectura.

```
/lib/decision/
  index.js            → entry point (fs persistence)
  /data/decisions.json → almacenamiento local
```

**API**:
- `registerDecision({ id, title, reason, impact, modules_affected, version })` — registra una decisión
- `listDecisions()` — devuelve todas en orden cronológico
- `getDecision(id)` — devuelve una específica o `null`

**Campos**:
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único (ej: `arch-003`) |
| `title` | string | Título descriptivo |
| `reason` | string | Motivación de la decisión |
| `impact` | low / medium / high | Impacto estimado |
| `modules_affected` | string[] | Módulos involucrados |
| `version` | string | Versión del sistema en que se tomó |
| `timestamp` | string (ISO) | Auto-generado |

Reglas:
- `id` y `title` son obligatorios
- `impact` válido: `low`, `medium`, `high`
- No permite IDs duplicados
- Sin dependencias externas — `fs` nativo
- Persistencia en `data/decisions.json` (creación automática)

---

## Deployment Engine (v1)

El módulo `lib/deployment/` automatiza el deployment de proyectos generados a GitHub.

Conecta con:
- **Scaffold Engine** — recibe el proyecto físico ya generado en disco
- **Decision Layer** — registra el resultado del deployment
- **GitHub CLI** — opcional, para creación automática de repos

```
/lib/deployment/
  index.js            → entry point (child_process + fs persistence)
  /data/deployments.json → registro de deploys
```

**API**:

| Función | Input | Output | Descripción |
|---|---|---|---|
| `initRepository(path)` | projectPath | `{ success, output }` | `git init` + `git branch -M main` |
| `commitProject(path)` | projectPath | `{ success, output }` | `git add .` + `git commit` |
| `createGitHubRepo(name, path)` | name, projectPath | `{ success, repo_url }` | `gh repo create` o instrucciones |
| `pushToRemote(path)` | projectPath | `{ success, output }` | `git push -u origin main` |
| `registerDeployment(data)` | deployment object | entry object | Persiste en `deployments.json` |
| `listDeployments()` | — | `Array` | Todos los deploys registrados |
| `deployFullPipeline(path, opts)` | projectPath, opts | `{ success, steps }` | Pipeline completo |

**Schema deployment**:
```
{
  id: "deploy-001",
  project_name: "salmos-cafe",
  repo_url: "https://github.com/user/salmos-cafe",
  status: "deployed" | "failed" | "pending",
  engine_version: "v1.0.0",
  timestamp: "ISO date"
}
```

Reglas:
- Solo Node.js nativo — `child_process` + `fs`
- Sin dependencias externas
- Si Git no está instalado: devuelve error con instrucciones
- Si `gh` no está instalado: devuelve instrucciones para crear repo manualmente
- Determinista: misma entrada = mismo resultado (o fallo esperado)

---

## Orchestrator Engine (v1)

El módulo `lib/orchestrator/` es el **controlador central** del sistema Agent Pack v1.

Coordina dinámicamente todos los módulos (Compiler, Plan, Scaffold, Decision Layer, Deployment) según el tipo de input detectado.

```
/lib/orchestrator/
  index.js            → entry point (input analyzer + pipeline builder + executor)
```

### Input types

| Tipo | Detección | Pipeline |
|---|---|---|
| `raw_email` | Contiene cabeceras (Subject:/From:/To:) o texto largo (>5000 chars) | `compiler → plan → scaffold` |
| `structured_prompt` | Contiene `## N. NOMBRE` (Prompt Maestro format) | `plan → scaffold` |
| `json_brief` | Input es objeto JSON o string que empieza con `{`/`[` | `scaffold` |
| `existing_project` | No tiene pipeline de build | `deployment` (si se solicita) |

**API** pública:

| Función | Input | Output | Descripción |
|---|---|---|---|
| `process(opts)` | `{ input, type?, deploy?, projectName?, projectType? }` | `{ session_id, status, steps, output }` | Ejecuta pipeline completo según tipo de input |
| `detectType(input)` | string/object | `'raw_email' \| 'structured_prompt' \| 'json_brief' \| 'existing_project'` | Analiza y clasifica el input |
| `buildPipeline(inputType)` | string | `string[]` | Devuelve lista de pasos para el tipo |

### Session output

```json
{
  "session_id": "a1b2c3d4",
  "input_type": "structured_prompt",
  "status": "completed",
  "pipeline": ["plan", "scaffold"],
  "steps": [
    { "name": "plan", "status": "completed", "result": { "project": {...} } },
    { "name": "scaffold", "status": "completed", "result": { "path": "...", "files": [...] } }
  ],
  "errors": [],
  "output": { "project_path": "...", "ir": {...}, "compiled": {...} }
}
```

### Fallback intelligence

- Si un paso falla, se registra automáticamente en **Decision Layer**
- El pipeline continúa con los pasos restantes
- El estado final refleja el resultado: `completed` / `partial` / `failed`
- Deployment es opcional (controlado por flag `deploy`)

### Reglas

- Sin dependencias externas
- No modifica módulos existentes
- Determinístico: mismo input + mismas opciones = mismo resultado
- No inventa datos — solo orquesta módulos existentes

---

## Form Persistence Layer (v1)

El módulo `lib/db/formResponses.js` persiste **todas las respuestas del formulario Brief Maestro** en PostgreSQL antes de que el Orchestrator ejecute cualquier pipeline.

```
INPUT (Brief Maestro)
    ↓
FORM SAVER (guarda secciones → form_responses)
    ↓
ORCHESTRATOR (compiler → plan → scaffold → deploy)
```

### Schema PostgreSQL

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

Cada campo del formulario se asigna automáticamente a una sección según su prefijo:

| Prefijo | Sección | Ejemplos |
|---|---|---|
| `biz_*` | business | biz_name, biz_valores, biz_personalidad |
| `obj_*` | goals | obj_principal, obj_kpis, obj_conversion |
| `comp_*` | competition | comp_directos, comp_problemas |
| `pub_*` | audience | pub_ideal, pub_motivaciones |
| `brand_*` | branding | brand_colores, brand_estilo, brand_nivel |
| `arq_*` | site | arq_paginas, arq_flujo |
| `cont_*` | content | cont_fotos, cont_textos |
| `serv_*` | services | serv_estrella, serv_precio |
| `social_*` | social_proof | social_testimonios, social_clientes |
| `func_*` | functionality | func_basicas, func_avanzadas |
| `seo_*` | seo | seo_keywords, seo_geo |
| `ref_*` | references | ref_marcas, ref_favoritos |
| `conv_*` | conversion | conv_cta, conv_lead |
| `ai_*` | essence | ai_diferencia, ai_metafora |

### API del módulo

| Función | Input | Output | Descripción |
|---|---|---|---|
| `createTable()` | — | — | Crea la tabla form_responses si no existe |
| `saveFormResponse(project_id, section, field_key, value)` | — | — | Guarda una respuesta individual |
| `saveBulkFormResponses(project_id, formData)` | project_id, formData object | count | Guarda todo el formData en lotes |
| `getProjectFormResponses(project_id)` | string | Row[] | Recupera todas las respuestas de un proyecto |
| `getResponsesGrouped(project_id)` | string | Object | Respuestas agrupadas por sección |
| `generateProjectId(name, email)` | name, email | `proj_<hash>` | Genera ID único por proyecto |

### Reglas

- Se ejecuta **antes** del pipeline del Orchestrator
- Fallo en DB **no bloquea** el flujo de email — los errores solo se loggean
- Arrays (checkboxes, tags) se convierten a comma-separated string
- No requiere ORM — SQL directo con `pg`

---

## Project Loader Engine (v1)

El módulo `lib/loader/` reconstruye proyectos desde PostgreSQL y archivos del sistema.

Es un módulo **read-only** — no modifica datos, solo los consulta y reconstruye.

```
/lib/loader/
  index.js            → entry point (queries + data reconstruction)
```

**API**:

| Función | Input | Output | Descripción |
|---|---|---|---|
| `loadProject(project_id)` | string | `{ meta, responses, grouped }` | Carga proyecto completo desde DB |
| `rebuildPromptMaestro(project_id, lang?)` | string, string | string | Reconstruye Prompt Maestro desde respuestas |
| `getProjectState(project_id)` | string | `{ project, form_responses, execution_history, decisions }` | Estado completo del proyecto |
| `listProjects()` | — | Array | Lista todos los proyectos con metadata |

### Fuentes de datos

| Fuente | Tipo | Propósito |
|---|---|---|
| `form_responses` (PostgreSQL) | Tabla existente | Respuestas del formulario agrupadas por sección |
| `projects` (PostgreSQL) | Tabla opcional | Metadata del proyecto (auto-creación) |
| `executions` (PostgreSQL) | Tabla opcional | Historial de ejecuciones del pipeline |
| `data/decisions.json` | Archivo local | Decisiones arquitectónicas del sistema |

### Reglas

- Solo lectura de datos, nunca escribe
- Tablas opcionales (`projects`, `executions`) no bloquean si no existen
- Reconstrucción determinística: misma DB = mismo output
- Sin dependencias externas

---

## SaaS Architecture (v1.6.0 — Design Phase)

The system has been extended with a full multi-tenant SaaS architecture design. See `ARCHITECTURE-SAAS.md` for complete documentation.

### Key Extensions

- **Workspace model** with `owner`, `admin`, `member`, `viewer` roles
- **Project lifecycle**: DRAFT → PROCESSING → PREVIEW → APPROVED → DEPLOYING → DEPLOYED
- **Decision Scoring Engine v2** (`lib/scoring/`) — 5-dimension AI evaluation (contrast, UX, conversion, clarity, SEO)
- **Async job queue** via Bull/Redis for non-blocking AI pipeline
- **Vercel API client** (`lib/deployment/vercel.js`) for automated deployments
- **Stripe billing adapter** (`lib/billing/`) with plan enforcement
- **Preview system** with versioned HTML/CSS snapshots, TTL caching, approval gating
- **Full PostgreSQL schema** with 14 tables, RLS, triggers, and plan enforcement

### Compatibility Rules

- All existing `lib/` engines remain unchanged — new SaaS modules extend, never replace
- Existing `api/` endpoints remain functional — new SaaS endpoints are additive
- Legacy `form_responses` table preserved — `project_inputs` is the new standard
- Existing `data/decisions.json` remains for architectural decisions; `decisions` table is for AI governance
- Dashboard API routes (`/api/projects/*`) remain for backward compat — new SaaS API at `/api/v1/*`
- `lib/runtime/index.js` is a new module that orchestrates all engines — it does not replace `lib/orchestrator/`

### SaaS Architecture Reference

| Document | Purpose |
|---|---|
| `ARCHITECTURE-SAAS.md` | Full architecture: layers, DB schema, lifecycle, GitHub/Vercel, preview, scoring, scalability |
| `data/migrations/003_saas_schema.sql` | PostgreSQL schema: 14 tables, RLS, triggers, plan enforcement |
| `lib/runtime/index.js` | SaaS Runtime Layer v1 — full pipeline orchestrator with DB persistence |
| `api/v1/` | 7 REST endpoints: projects CRUD, pipeline trigger, approve, preview, executions |
| `lib/scoring/` (planned) | Decision Scoring Engine v2 |
| `lib/deployment/vercel.js` (planned) | Vercel API client |
| `lib/queue/` (planned) | Bull/Redis job queue adapter |
| `lib/billing/` (planned) | Stripe subscription adapter |

### Known Issues

- Gmail App Password may expire — must regenerate if email sending fails.

### Monitoring

- Logs: Vercel Dashboard → Deployment → Functions
- Common errors: 500 (env vars misconfigured), 502 (SMTP failure)
