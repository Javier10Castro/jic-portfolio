# Session Context — 2026-06-10

## Project

Web Portfolio + Brief Maestro. Dual-purpose Vercel site.
- Portfolio: `index.html` (contact form -> POST /api/sendContact)
- Brief Maestro: `brief-maestro.html` (14-section wizard -> POST /api/sendBrief)
- SaaS Dashboard: `dashboard*.html` + `/api/v1/*` endpoints

## What Was Done This Session

### 1. Audit: Request Lifecycle Observability (sendContact)

**Files:** `lib/request-registry.js`, `lib/queue.js`, `api/sendContact.js`

Verified 6 features from v1.2.0/v1.2.1 changelog:

| Feature | Status | Description |
|---|---|---|
| F13 TTL Enforcement | PASS | `ENTRY_TTL_MS=300000`, periodic cleanup 60s, `lookupRequest()` invalidates expired |
| F2 lifecycle.complete | PASS | Emitted from single source (`queue.js:_process()`), not from handler |
| F1 single executionStartedAt | PASS | Captured at `queue.js:52`, not duplicated in handler |
| F3 pre-queue rejection (12 pts) | PASS | All 12 early-return points register `{ status: 'rejected', reason }` |
| C2 derived metrics persistence | PASS | `executionDurationMs`, `queueWaitTimeMs`, `totalLifecycleTimeMs` stored in Map |
| M1 TTL purge in aggregates | PASS | `getAggregateMetrics()` calls `_evictExpired()` before computing |

**Commits:** `894c3f8`, `6dada3b` (these implemented the features; the audit verified them)

### 2. Brief Maestro Frontend Audit

**File created:** `docs/audits/brief-maestro-frontend-audit.md`

Traced complete submission flow:

- `SECTIONS[ ]` (line 647) / `EN_SECTIONS[ ]` (line 822) — 14 sections of questions
- `formData` global (line 1131) — central state object
- `submitForm()` (line 1470) — final wizard step, shows contact page
- `submitContact()` (line 1664) — **exact POST function**
- `generatePrompt()` (line 1477) — builds markdown prompt from formData
- Payload: `{ name, email, company?, phone?, prompt, lang, formData }`
- Endpoint: `POST /api/sendBrief`
- Validations: name required, email regex, then POST via fetch

**Risks identified:**
- `requestId` from response body is ignored by frontend
- No fetch timeout (`AbortController`)
- No honeypot in brief-maestro.html (exists in index.html)

### 3. E2E Test Script Created

**File created:** `scripts/e2e-brief-bypass-wizard.js`

Two modes available via `window.runBriefE2E()`:

- **Mode 1** (`runBriefE2E(1)`): Populates `formData` global, shows contact page, fills fields, calls internal `submitContact()`
- **Mode 2** (`runBriefE2E(2)`): Pure API bypass — builds exact payload, calls `/api/sendBrief` directly, logs `requestId`, `queuePosition`, `queueDepth`, `status`

**Encoding bug (fixed in `c9ddd6f`):** Original file had 742 non-ASCII characters. When copy-pasted into DevTools from terminals with poor Unicode support, the IIFE would fail silently. Fixed by rewriting as pure ASCII.

**Asset exposure (fixed in `f1aaff5`):** Script was in `scripts/` but Vercel didn't serve it. Copied to `public/scripts/`. Now accessible at `GET /scripts/e2e-brief-bypass-wizard.js`.

### 4. Commits (3 total for this session)

```
f1aaff5 fix: publish E2E script as static asset
c9ddd6f fix: E2E script encoding corruption - pure ASCII rewrite
3681f84 feat: add Brief Maestro frontend audit and E2E bypass script
```

### 5. Files Created/Modified

| File | Action | Purpose |
|---|---|---|
| `docs/audits/brief-maestro-frontend-audit.md` | New | Full frontend flow audit |
| `scripts/e2e-brief-bypass-wizard.js` | New → Modified | E2E test script (pure ASCII rewrite + public copy) |
| `public/scripts/e2e-brief-bypass-wizard.js` | New | Public copy for Vercel static serving |
| `CHANGELOG.md` | Modified | Added entries for audit, E2E script, and fixes |

### 6. Key Architectural Rules

- **Two-layer pipeline** (sendContact): Rate limit gate (Layer 1) → Queue execution (Layer 2). 429 = rejected before queue.
- **In-memory state**: Rate limit windows, request registry, queue — all per-instance, lost on cold start.
- **No build step**: Vanilla HTML/CSS/JS, no bundler, no TypeScript.
- **Nodemailer + PDFKit**: Server-side only, in `api/` serverless functions.
- **Workspace resolution**: UUID v4 strict for workspace_id, flexible (id or slug) for project_id.

### 7. Known Issues

- E2E script not referenced from any HTML — must be loaded manually in DevTools
- Cross-instance observability gaps (Vercel multi-instance)
- No `requestId` feedback in Brief Maestro success UI
