# Deployment — Vercel, CI/CD & Infrastructure

## Platform

- **Host**: Vercel (Hobby plan)
- **Runtime**: Node.js 22.11.0
- **Static files**: Served from `public/` directory
- **Serverless functions**: `api/` directory (auto-detected)
- **Function slots**: 12 total — 4 used (sendBrief, sendContact, telemetry, platform-api)

## Deployment Methods

### Primary: Git Push (CI/CD)
```bash
git push origin main
```
- Vercel GitHub App detects push to `main`
- Auto-builds and deploys to production
- No manual steps required (after initial GitHub integration)

### Fallback: Vercel CLI
```bash
vercel --prod
```
- Manual deployment when CI/CD is unavailable
- Returns deployment URL: `https://<project>.vercel.app`

## Environment Variables

See `ARCHITECTURE.md` for the canonical list of variables and their purposes.

### Vercel CLI Setup
```powershell
vercel env add GMAIL_USER production
vercel env add GMAIL_USER preview
vercel env add GMAIL_USER development
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

## CI/CD Flow

```
git push origin main
    │
    ▼
GitHub → Vercel GitHub App webhook
    │
    ▼
Vercel builds:
  ├── Static assets (public/) — copied as-is
  ├── API functions (api/) — deployed as serverless
  └── Environment variables injected
    │
    ▼
Production URL: https://web-portfolio-kappa-wheat.vercel.app
```

### GitHub Integration
- Repo: `Javier10Castro/jic-portfolio`
- Vercel project: `web-portfolio`
- Auto-deploy on push to `main`
- Preview deployments on PR branches (if configured)
- Reconnection: Vercel Dashboard → Settings → Git → Configure Git Provider

## Rollback Strategy

### Method 1: Vercel Dashboard
1. Navigate to Vercel Dashboard → Deployments
2. Find the last known-good deployment
3. Click "..." → "Promote to Production"

### Method 2: Git Revert
```bash
git revert HEAD
git push origin main
```
- Triggers a new deployment with the reverted code
- Preserves history — no force push

### Recovery Limitations
- Vercel Hobby plan retains deployment history for 30 days
- Database schema changes are NOT automatically rolled back — manual migration required
- Environment variable changes require manual re-entry

## Constraints

See `ARCHITECTURE.md` (Execution Model) for the canonical definitions of rate limiting, SMTP timeouts, and lifecycle timing.

| Constraint | Limit | Scope |
|---|---|---|
| IP rate limit | 60 req/60s (soft 30) | Per Vercel instance |
| Email dedup | 1 req/300s per address | Per instance |
| SMTP timeout | 5s per email | Per send |
| Vercel function timeout | 10s (Hobby), 60s (Pro) | Per request |
| Gmail daily send limit | ~500 emails/day | Account-level |
| Vercel Hobby functions | 12 max | Project-level |
| Cold start | ~1-3s after 60s idle | Per instance |

## Production Monitoring

Health endpoints, lifecycle logs, trace events, and coverage reports are documented in `ARCHITECTURE.md` (Telemetry & Observability section).

## API Routing Architecture

The Platform API (`lib/api/`) is served through a single Express app exported from `api/platform-api.js`.

### Route Path Resolution

```
Browser / Client
    │
    ▼
https://example.com/api/v1/studio/health
    │
    ▼ (rewrite via vercel.json)
Vercel routing layer
    Rewrite: /api/v1/(.*) → /api/platform-api
    URL preserved in browser: /api/v1/studio/health
    │
    ▼
api/platform-api.js (Express app)
    Middleware: strips /api/platform-api prefix if present
    │
    ▼
Express internal: /api/v1/studio/health
    app.use('/api/v1', apiRouter)
    │
    ▼
Route: router.get('/studio/health', handler)
```

### Configuration

- `vercel.json` — rewrites `/api/v1/*` to the Express function
- `api/platform-api.js` — Vercel entrypoint; strips function prefix, exports Express app
- `lib/api/server.js` — mounts API router at `/api/v1` prefix
- `lib/api/router.js` — registers all subsystem route files on the API router

### Route Registration

Each subsystem route file registers paths relative to the subsystem prefix. For example, Studio routes register `/studio`, `/studio/project`, etc. The full URL path is built as:

```
/api/v1 + /studio/health  →  /api/v1/studio/health
/api/v1 + /studio/project →  /api/v1/studio/project
```

### Debugging Routes

At startup, the Express app logs the full route table:

```
[API] 35 routes (prefix=/api/v1)
[API]   GET /api/v1/health
[API]   GET /api/v1/studio/health
[API]   POST /api/v1/studio/project
...
```

Check Vercel deployment logs via `vercel logs` to verify routes are registered.

### Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| `404` on `/api/v1/studio` | Vercel doesn't route path to Express | Verify `vercel.json` exists with rewrite rule |
| `404` on all `/api/v1/*` | Vercel function path mismatch | Check `api/platform-api.js` url-stripping middleware |
| Routes missing in startup log | Express router not built | Check `buildRouter()` in `lib/api/router.js` |

### Vercel CLI Logs
```powershell
# Stream logs (current deployment)
vercel logs

# Stream logs for specific deployment
vercel logs <deployment-url>

# Follow with filtering
vercel logs --follow | Select-String -Pattern "429|error|rate.limit"

# Time range
vercel logs --since=5m
```

## Vercel CLI Reference (Windows)

```powershell
# List deployments
vercel list

# Inspect deployment
vercel inspect <deployment-url-or-id>

# Promote preview to production
vercel promote <deployment-url>

# Local development
vercel dev
# Access at http://localhost:3000
```

### Common Windows Mistakes
| Mistake | Correct |
|---|---|
| `vercel logs <deployment-name>` | `vercel logs <full-deployment-url>` |
| `vercel logs \| grep 429` | `vercel logs \| Select-String -Pattern "429"` |
| `curl` for API testing | `Invoke-RestMethod` or `node scripts/loadtest.js` |
| `npm run build` before deploy | Vercel builds automatically — just `vercel --prod` |

## See Also

- **`ARCHITECTURE.md`** — System risks, email architecture, SMTP configuration, environment variables, health endpoints
- **`DEVELOPMENT_RULES.md`** — Testing strategy, pre-deployment checklist
