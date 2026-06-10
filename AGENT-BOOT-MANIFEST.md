# AGENT BOOT MANIFEST v1.0
## Web Portfolio + Brief Maestro + SaaS Dashboard (Vercel Serverless)

```
System ID:    jic-portfolio
Domain:       https://web-portfolio-kappa-wheat.vercel.app
Runtime:      Vercel Serverless (Node.js 24.x)
Stack:        Vanilla HTML/CSS/JS + Node.js (Nodemailer, PDFKit, PostgreSQL)
State Model:  Stateless (in-memory state per-instance, ephemeral)
Deploy Mode:  Manual (vercel --prod) — Git integration NOT connected
```

---

## 1. SYSTEM OVERVIEW

### 1.1 Purpose
Lead generation and client onboarding through:
- **Portfolio** (`index.html`): Contact form → `POST /api/sendContact`
- **Brief Maestro** (`brief-maestro.html`): 14-section project questionnaire → `POST /api/sendBrief`
- **SaaS Dashboard** (`dashboard*.html`): Project management + pipeline orchestration → `/api/v1/*`

### 1.2 Repository Structure
```
/
├── index.html                 # Portfolio landing page
├── brief-maestro.html         # 14-section wizard (formData, submitContact, generatePrompt)
├── dashboard*.html            # SaaS UI layer (list, project, logs, preview)
├── api/                       # Vercel Serverless Functions
│   ├── sendContact.js         # Contact form (2 emails: admin + client)
│   ├── sendBrief.js           # Brief wizard (2 emails + PDF attachment)
│   ├── health.js              # System health + observability
│   └── v1/                    # SaaS REST API (projects, executions, events)
├── lib/                       # Internal modules (runtime, db, orchestrator, registry)
├── public/                    # Static assets served by Vercel
│   └── scripts/
│       └── e2e-brief-bypass-wizard.js  # E2E test harness (ASCII-safe)
├── scripts/                   # Non-public scripts (source copies)
├── docs/                      # Documentation
├── data/                      # Runtime local storage (not committed)
├── vercel.json                # Function config (maxDuration: 60s, memory: 1024MB)
└── AGENTS*.md                 # Agent context manifests
```

### 1.3 Technology Map
| Layer | Tech | Notes |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | No build step, no bundler, no TypeScript |
| Typography | Inter + Space Grotesk (Google Fonts) | Design system |
| Serverless | Node.js 24.x (Vercel) | Serverless Functions |
| Email | Nodemailer ^8.0.10 (Gmail SMTP) | Server-side only |
| PDF | PDFKit ^0.18.0 | Server-side only, A4 format |
| Database | PostgreSQL (Neon) | Form persistence, project storage |
| Queue | In-memory FIFO | Max depth 100, concurrency 1 |
| Registry | In-memory Map | 1000 entries, 5min TTL, per-instance |

---

## 2. ARCHITECTURE LAYERS

### 2.1 Network Gate (Layer 1)
```
INCOMING REQUEST
       │
       ▼
┌──────────────────────────┐
│   INGESTION BOUNDARY     │
│   (Rate Limit Gate)      │
│                          │
│   ALLOWED ──► Queue      │
│   REJECTED ──► 429       │
└──────────────────────────┘
```

**Constraints:**
- IP sliding window: soft 30, hard 60 req/60s
- Email dedup: 1 req/300s per address
- Honeypot detection: silent 200 for bots
- Timing check: `submittedAt` validation

### 2.2 Execution Layer (Layer 2)
- FIFO in-memory queue (depth ≤ 100, concurrency 1)
- Background SMTP worker (admin + client emails)
- Retry: 3 attempts, exponential backoff 2s/4s/8s
- Lifecycle tracing: 7+ stages with `deltaMs`

### 2.3 SaaS Runtime Layer (Structured Pipeline)
- `lib/runtime/index.js` orchestrates: compiler → plan → scaffold → deploy
- API v1 at `/api/v1/*` (projects CRUD, pipeline, preview, executions)
- Project lifecycle: DRAFT → PROCESSING → PREVIEW → APPROVED → DEPLOYING → DEPLOYED

---

## 3. REQUEST LIFECYCLE

### 3.1 States
| State | Description | Terminal |
|---|---|---|
| `queued` | Admitted by rate limit gate, waiting in queue | No |
| `processing` | Queue worker picked up execution | No |
| `completed` | Both emails sent successfully | Yes |
| `failed` | Email failure after retries exhausted | Yes |
| `rejected` | Pre-queue rejection (validation/rate-limit/bad-request) | Yes |

### 3.2 Lifecycle Events (emitted from queue layer only)
```
received → queued → executionStarted → executionFinished → lifecycle.complete
```

**Rules:**
- `executionStartedAt` captured at `queue.js:52` (single source of truth)
- `lifecycle.complete` emitted at `queue.js:_process()` (not in handler)
- Pre-queue rejections registered with `{ status: 'rejected', reason }`

### 3.3 Derived Metrics (persisted)
- `queueWaitTimeMs = executionStartedAt - queuedAt`
- `executionDurationMs = executionFinishedAt - executionStartedAt`
- `totalLifecycleTimeMs = executionFinishedAt - receivedAt`

### 3.4 TTL Enforcement
- `ENTRY_TTL_MS = 300000` (5 minutes)
- Periodic cleanup every 60s via `setInterval`
- `lookupRequest()` checks TTL on every call — expired entries return `null`
- `getAggregateMetrics()` purges expired entries before computing aggregates

---

## 4. QUEUE BEHAVIOR

### 4.1 Specification
| Parameter | Value |
|---|---|
| Max depth | 100 |
| Concurrency | 1 |
| Retry attempts | 3 |
| Backoff | Exponential: 2s, 4s, 8s |
| Overflow behavior | 503 QUEUE_OVERFLOW |
| State | In-memory (lost on cold start) |

### 4.2 Queue States
- Queue is NOT shared across instances
- 429 responses bypass queue entirely
- Queue depth reflects admitted traffic only

---

## 5. OBSERVABILITY MODEL

### 5.1 Endpoints
| Endpoint | Purpose |
|---|---|
| `GET /api/health` | System health + queue + lifecycle + rate limit + memory |
| `GET /api/health?section=queue` | Queue-specific metrics with lifecycle aggregates |
| `GET /api/health?section=rate-limit` | Rate limit state |
| `GET /api/sendContact?id=<requestId>` | Per-request lifecycle trace |
| `GET /api/sendBrief?id=<requestId>` | Per-request lifecycle trace (brief) |

### 5.2 Response Headers
- `X-RateLimit-Remaining`, `X-RateLimit-Limit`, `X-RateLimit-Reset`
- `X-Queue-Position`, `X-Queue-Depth`

### 5.3 Diagnostics
- `?debug=true` on POST returns lifecycle + perf metrics
- `?id=<uuid>` on GET returns full registry entry or `null`

### 5.4 Known Observability Gaps
- Cross-instance: registry is per-instance, not shared
- Max 1000 entries in registry Map
- 5 minute TTL — entries older than 5min are lost

---

## 6. DEPLOYMENT STRATEGY

### 6.1 Current State (CRITICAL)
```
Git Integration:    NOT CONNECTED
Deploy Method:      Manual (vercel --prod)
CI/CD Pipeline:     NONE
Auto-deploy:        DISABLED
Production URL:     https://web-portfolio-kappa-wheat.vercel.app
Latest Commit:      befbed6 ("test public file")
Instance SHA:       befbed67f8905bba32a0a9cb7a2515778b157b43
Region:             iad1
```

### 6.2 Deploy Commands
```powershell
# Force production deploy (current method)
vercel --prod

# List deployments
vercel list

# Inspect deployment
vercel inspect <deployment-url>

# Stream logs (production)
vercel logs --follow

# Stream logs with filter
vercel logs --follow | Select-String -Pattern "429|error|rate.limit"
```

### 6.3 Required Fix
GitHub repo `Javier10Castro/jic-portfolio` is public. Vercel project `web-portfolio` exists under `javier-ibrahim-s-projects`. Git integration must be connected via Vercel Dashboard:
1. Go to Vercel Dashboard → web-portfolio → Settings → Git
2. Click "Configure Git Provider"
3. Authorize Vercel GitHub App for `Javier10Castro` account
4. Select `jic-portfolio` repository
5. Enable "Auto-deploy" for `main` branch

### 6.4 Environment Variables
| Variable | Source | Required by |
|---|---|---|
| `GMAIL_USER` | Vercel Dashboard → Settings → Environment Variables | sendContact, sendBrief |
| `GMAIL_APP_PASSWORD` | Vercel Dashboard | sendContact, sendBrief |
| `DATABASE_URL` | Vercel Dashboard | lib/db (Neon PostgreSQL) |
| `UPSTASH_REDIS_REST_URL` | Vercel Dashboard | Queue (planned) |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel Dashboard | Queue (planned) |

All must be set for Production, Preview, and Development environments.

---

## 7. E2E TESTING SYSTEM

### 7.1 Test Script
**File:** `public/scripts/e2e-brief-bypass-wizard.js`
**Access:** `GET /scripts/e2e-brief-bypass-wizard.js` (confirmed serving)
**Function:** `window.runBriefE2E(mode, contactInfo?)`

### 7.2 Modes
| Mode | Method | Requires DOM | Description |
|---|---|---|---|
| 1 | Internal `submitContact()` | Yes | Populates `formData`, fills inputs, calls real handler |
| 2 | Fetch to `/api/sendBrief` | No | Builds exact payload, logs response lifecycle |

### 7.3 Load Method
```javascript
// DevTools console
fetch('/scripts/e2e-brief-bypass-wizard.js')
  .then(r => r.text())
  .then(code => { eval(code); runBriefE2E(2); });
```

### 7.4 Test Data Fixture
File: `test-data.json` — Salmos Cafe (14 sections populated in Spanish)

### 7.5 Known Issues
- Script NOT referenced from any HTML — must be loaded manually
- Cross-instance observability not testable from single-browser E2E
- No automated test runner configured

---

## 8. KNOWN ISSUES

| ID | Severity | Description | Impact |
|---|---|---|---|
| K01 | CRITICAL | Git integration NOT connected — CI/CD missing | Manual deploys only |
| K02 | HIGH | In-memory state per Vercel instance | State lost on cold start, not shared across instances |
| K03 | HIGH | Deployment Protection enabled (Vercel auth) | Blocks automated health checks |
| K04 | MEDIUM | E2E script not referenced from HTML | Must be loaded manually in DevTools |
| K05 | MEDIUM | Cross-instance observability gaps | Registry/queue metrics per-instance only |
| K06 | LOW | No `requestId` feedback in Brief Maestro success UI | User cannot track submission |
| K07 | LOW | No fetch timeout in frontend (no AbortController) | Request hangs indefinitely |

---

## 9. BOOT INSTRUCTIONS

### 9.1 First-Time Setup
```powershell
# Clone + install
git clone https://github.com/Javier10Castro/jic-portfolio.git
cd jic-portfolio
npm install

# Set up env (create .env file in project root)
# GMAIL_USER=your-email@gmail.com
# GMAIL_APP_PASSWORD=your-app-password

# Run local dev server
vercel dev
# → http://localhost:3000
```

### 9.2 Quick Health Check
```powershell
# Production
vercel curl https://web-portfolio-kappa-wheat.vercel.app/api/health

# Local
curl http://localhost:3000/api/health
```

### 9.3 E2E Test
```javascript
// In brief-maestro.html DevTools:
await runBriefE2E(2);
// → logs requestId, queuePosition, queueDepth, status
```

### 9.4 Deployment
```powershell
vercel --prod
```

---

## 10. CONTRACT

### 10.1 File Modification Rules
- Do NOT change business logic unless required
- Do NOT refactor queue or registry unless explicitly broken
- Keep system compatible with Vercel serverless constraints (maxDuration 60s, memory 1024MB)
- Do NOT introduce infrastructure requiring non-Vercel hosting

### 10.2 Naming Conventions
- CSS: `kebab-case`
- JS: `camelCase` (variables), `UPPER_SNAKE_CASE` (constants)
- HTML IDs: `kebab-case` or `snake_case`
- Form field IDs: `snake_case` (matches JSON keys)

### 10.3 API Contract
- All endpoints return JSON `{ success: true }` or `{ error: string }`
- All user-supplied values must be `escapeHTML()` sanitized
- Email templates: table-based HTML, inline styles, dark mode support
- Timezone: `America/Tijuana` for all timestamps

### 10.4 Error States
| HTTP | Error Code | Meaning |
|---|---|---|
| 200 | OK | Success |
| 400 | VALIDATION_ERROR | Missing/invalid fields |
| 429 | RATE_LIMITED | Rate limit exceeded (Layer 1 rejection) |
| 503 | QUEUE_OVERFLOW | Queue at capacity (Layer 2 rejection) |
| 500 | INTERNAL_ERROR | Unhandled exception |
