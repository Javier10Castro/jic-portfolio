# Development Rules — Coding Standards, Workflow & Quality

## Naming Conventions

| Element | Convention | Examples |
|---|---|---|
| CSS classes | `kebab-case` | `.nav-logo`, `.btn-primary`, `.hero-eyebrow` |
| CSS custom properties | `--kebab-case` | `--bg`, `--accent`, `--font-sans` |
| HTML IDs | `kebab-case` or `snake_case` | `inp-name`, `err-email`, `cur-step-name` |
| JS variables | `camelCase` | `currentStep`, `formData`, `tagInputs` |
| JS constants | `UPPER_SNAKE_CASE` | `GMAIL_USER`, `SECTIONS`, `AI_PREF_ES` |
| JS functions | `camelCase` | `startApp()`, `renderStep()`, `submitContact()` |
| Form field IDs | `snake_case` (matches JSON keys) | `biz_name`, `obj_principal` |

## CSS Style Rules

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

## JavaScript Style Rules

- Global/script-level code (no IIFE, no modules)
- Inline event handlers in HTML attributes (`onclick`, `oninput`)
- Template literals for HTML generation
- `async/await` in serverless functions
- Arrow functions extensively
- Fetch API for backend calls
- No TypeScript, no linter, no bundler

## Git Commit Conventions

### Message Format
```
<type>: <brief description>

<body> (optional)
```

### Types
| Type | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, config, dependencies |
| `docs` | Documentation changes |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Test additions or changes |
| `audit` | Security or observability audit findings |

### Rules
- First line max 72 characters
- Use imperative mood ("Add feature" not "Added feature")
- Do not reference issue numbers in the subject line
- Reference requestIds or commit hashes in the body when relevant
- One logical change per commit — no mixed concerns

### Branching Strategy
- `main` — production-ready; auto-deploys to Vercel
- Feature branches: `feat/<short-description>`
- Fix branches: `fix/<short-description>`
- No `develop` or `staging` branches — Vercel preview deployments serve as staging
- All changes merge directly to `main` via GitHub

## Module Boundaries

See `ARCHITECTURE.md` (Execution Model → Serverless Memory Isolation) for the architecture rationale.

### `api/` — Serverless Functions
- One file per endpoint, no shared state between files
- Files are independently deployed Vercel Functions — NO shared memory
- Each handler self-contains its validation, execution, and observability logic
- Cross-instance coordination requires Neon PostgreSQL

### `lib/` — Internal Modules
| Module | Responsibility | Dependencies |
|---|---|---|
| `rate-limit.js` | Rate limiter — see ARCHITECTURE.md Execution Model | None (stateless) |
| `request-registry.js` | Lifecycle tracking, Neon persistence | `lib/db/` |
| `logger.js` | Structured logging, trace events | None |
| `tracer.js` | Path tracing, fire-and-forget Neon writes | `lib/db/requestTraces.js` |
| `safeBodyParser.js` | Payload parsing, deploy info extraction | None |
| `db/` | Neon PostgreSQL CRUD | `pg` |
| `plan/` | Plan Engine — see ARCHITECTURE.md Engine Overview | None |
| `scaffold/` | Scaffold Engine — see ARCHITECTURE.md Engine Overview | None |
| `decision/` | Decision Engine — see ARCHITECTURE.md Engine Overview | None |
| `deployment/` | Deployment Engine — see ARCHITECTURE.md Engine Overview | None |
| `design-system/` | Design System Engine — see ARCHITECTURE.md Engine Overview | None |
| `preview/` | Preview Engine — see ARCHITECTURE.md Engine Overview | None |
| `runtime/` | Runtime Engine — see ARCHITECTURE.md Engine Overview | `lib/db/`, `lib/plan/`, etc. |

### `public/` — Static Assets
- All files served directly by Vercel (no build step)
- HTML files are standalone (no framework)
- JS scripts follow the global/script pattern (no modules)
- Dashboard files within `public/` use `dashboard-api.js` as shared API layer

## API Design Rules

Canonical endpoint definitions are in `ARCHITECTURE.md` (API Endpoints section). The following is a developer quick-reference.

### Response Format
```javascript
// Success (sendContact)
{ success: true, mode: 'inline', adminOk: true, clientOk: true }

// Error
{ success: false, error: 'INVALID_REQUEST', message: '...' }
```

### HTTP Status Codes
| Code | Usage |
|---|---|
| 200 | Success |
| 400 | Validation failure (`INVALID_REQUEST`) |
| 429 | Rate limited (`RATE_LIMITED`) |
| 500 | Internal error (`INTERNAL_ERROR`) |

### Headers
- `X-Request-Id` — unique request identifier on every response
- `X-Processing-Mode` — `inline` (current) or `queue` (historical)
- `X-RateLimit-Limit` — rate limit ceiling
- `X-RateLimit-Remaining` — remaining requests in window
- `X-Deploy-SHA` — deployment commit SHA

### Validation Rules
- All user input validated server-side (never trust client)
- Honeypot field: `<input name="bot" style="display:none">` on all forms
- Email validation: regex + DNS-level checks
- Required fields: name, email, message (contact) or prompt (brief)
- `submittedAt` timing check: rejects submissions with timestamps > 60s in the future

## Testing Strategy

### Test Types
| Test | Tool | Frequency |
|---|---|---|
| Smoke tests | `scripts/run-production-tests.js` | Pre-deployment |
| Validation persistence | `npm run audit` | Pre-deployment |
| Coverage matrix | `scripts/run-coverage-matrix.js <url>` | Per-release |
| E2E (manual) | Console helpers (`e2eSalmos()`, `e2eInkognita()`) | Ad-hoc |

### Pre-Deployment Checklist
- [ ] Smoke suite passes (unique emails, coverage check)
- [ ] Validation persistence: 9/9 tests pass (100%)
- [ ] Contact form submits successfully (including retry on 429)
- [ ] Retry UI shows correct language text and attempt counter
- [ ] Validation diagnostics persist through Neon on 400 responses
- [ ] Lifecycle observability: `GET /api/telemetry?type=logs&id=<requestId>` returns `completed`
- [ ] Brief submission sends with PDF attachment
- [ ] Both emails delivered to `[email, GMAIL_USER]`
- [ ] Timezone displays correct `America/Tijuana` time
- [ ] No console errors in browser
- [ ] Trace events persist to Neon on rejected requests
- [ ] Coverage: merged, range, heatmap, timeline all return data
- [ ] No Vercel Function errors (500/502)
- [ ] Both languages (es/en) render correctly
- [ ] `tracer.drain()` is silent in production

### Testing Data
- Load test fixture via browser console:
```javascript
fetch('/test-data.json').then(r => r.json()).then(d => {
  localStorage.setItem('briefMaestroLang', 'es');
  localStorage.setItem('briefMaestro', JSON.stringify(d));
  localStorage.setItem('briefMaestroAuto', '1');
  location.reload();
});
```

## Security Rules

- Protect public endpoints from abuse (rate limiting, dedup) — see ARCHITECTURE.md for throttling thresholds
- Environment variables accessed only through `process.env` — never hardcoded
- No secrets exposed to frontend code
- Keep dependencies updated
- 429 responses are immediate (no processing allocation before rate limit gate)

## UI Naming Conventions

- All client-facing labels must use human, non-technical language
- Internal engine naming (Plan Engine, Scaffold, etc.) must NEVER appear in UI
- Product name in UI: "Your Project Brief"
- All UI text must have clean EN/ES translation mapping
- Avoid technical segmentation jargon (e.g. "buyer personas" → "ideal client")
- Avoid internal tooling references (e.g. "Prompt Maestro for Claude" → "No technical knowledge needed")

## Commit Strategy

### For AI-Generated Commits
1. **One concern per commit** — do not mix refactors with features or fixes
2. **Descriptive subjects** — the subject line should be understandable without reading the body
3. **Scope annotation** — use optional scope in parentheses: `fix(api): correct rate limit overflow`
4. **Group logically** — if changes span multiple files for the same reason, single commit; if changes have different reasons, split
5. **Refactors are separate** — a refactor commit contains zero behavioral changes; pair with the feature commit in sequence

### Rules for Grouping
| Scenario | Action |
|---|---|
| Bug fix + unrelated test update | Split into `fix:` + `test:` |
| Feature + its own tests | Single `feat:` commit |
| Docs + code change | Split into `docs:` + `feat:`/`fix:` |
| Multiple files, same purpose | Single commit |
| Formatting/lint-only changes | `chore:` commit, separate from logic |

## File Modification Policy

- Prefer minimal, surgical edits over rewrites
- Modify only affected sections
- Preserve existing functionality
- Reuse existing code patterns and helpers
- Do not create unnecessary dependencies
- Maintain consistency with current architecture (vanilla HTML/CSS/JS, nodemailer, pdfkit)
- Avoid adding code comments unless the logic is non-obvious

## localStorage Conventions

| Key | Purpose | Persists |
|---|---|---|
| `briefMaestro` | Full form data object | Yes |
| `briefMaestroLang` | Language preference (`es`/`en`) | Yes |
| `briefMaestroAuto` | Auto-navigate flag (test data) | No — deleted after use |
| `currentStep` | NOT persisted — always starts at 0 | No |
