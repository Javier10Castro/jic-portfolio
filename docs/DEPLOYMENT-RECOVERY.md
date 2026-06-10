# Deployment Recovery Runbook
## Web Portfolio — Vercel Serverless

```yaml
Version: 1.0
Target: https://web-portfolio-kappa-wheat.vercel.app
Project: web-portfolio (prj_K1esY3G2utN5Mci2LHXugPR9PH26)
Team: javier-ibrahim-s-projects
Runtime: Node.js 24.x
```

---

## 1. Detect Broken Deployment

### 1.1 Symptoms
- `404` on routes that should exist (`/scripts/e2e-brief-bypass-wizard.js`, `/api/sendContact`)
- `502` or `500` on API endpoints
- Stale content (old commit still live after push)
- Vercel Dashboard shows ❌ Error status on latest deployment

### 1.2 Detection Commands

```powershell
# List all deployments with status
vercel list

# Inspect latest production deployment
vercel inspect <latest-production-url>

# Check deployment logs for errors
vercel logs <latest-production-url> --follow

# Check health endpoint (requires vercel curl for auth)
vercel curl https://web-portfolio-kappa-wheat.vercel.app/api/health
```

Expected health output:
```json
{"status":"ok","timestamp":"...","instance":{"sha":"..."}}
```

### 1.3 Verify Commit vs Deployment Mismatch
```powershell
# Get deployed SHA from health endpoint
vercel curl https://web-portfolio-kappa-wheat.vercel.app/api/health
# → instance.sha = deployed git hash

# Compare with latest local commit
git log --oneline -1
# → SHA should match instance.sha

# If mismatch: deployment is stale
```

---

## 2. Detect Webhook Failure

### 2.1 No Git Integration
If `vercel git connect` fails or was never configured:
```powershell
# Check if Git integration exists
vercel git connect "https://github.com/Javier10Castro/jic-portfolio"
# → "Failed to connect" means Git is NOT integrated
```

### 2.2 Webhook Not Triggering
Check Vercel Dashboard:
1. Navigate to: https://vercel.com/javier-ibrahim-s-projects/web-portfolio/settings/git
2. Verify "Git Provider" shows a connected repository
3. Check "Deploy Hooks" section for recent activity
4. Verify "Auto-deploy" is enabled for the target branch

### 2.3 GitHub Side
1. Go to: https://github.com/Javier10Castro/jic-portfolio/settings/hooks
2. Look for Vercel webhook (should point to `https://api.vercel.com/webhooks/...`)
3. Check recent deliveries for failures (red ❌)

---

## 3. Force Deploy via CLI

### 3.1 Production Deploy
```powershell
# Deploy current working directory to production
vercel --prod
# → Prompts for: existing project, confirm deploy
# → Returns: https://<random>.vercel.app
```

### 3.2 Deploy with Specific Commit (detached)
```powershell
# Checkout the target commit first
git checkout <target-sha>

# Deploy that version
vercel --prod

# Return to main branch
git checkout main
```

### 3.3 Deploy Preview (non-production)
```powershell
# Creates preview deployment (no production traffic)
vercel
# → Returns preview URL like https://web-portfolio-<hash>.vercel.app
```

### 3.4 Promote Preview to Production
```powershell
# After preview is verified
vercel promote <preview-url>
# → Makes preview the production deployment
```

---

## 4. Verify Latest Commit Deployed

### 4.1 Via Health Endpoint
```powershell
# Get deployed commit SHA
vercel curl https://web-portfolio-kappa-wheat.vercel.app/api/health
# → extract instance.sha value
```

### 4.2 Via Vercel Dashboard
1. Go to: https://vercel.com/javier-ibrahim-s-projects/web-portfolio/deployments
2. Find the latest production deployment (🚀 badge)
3. Click to expand — inspect "Source" to see commit SHA

### 4.3 Via CLI
```powershell
vercel list
# → Find latest production deployment
vercel inspect <deployment-id> | Select-String -Pattern "commit|sha|source"
```

### 4.4 Verify Against Local
```powershell
git rev-parse HEAD
# → Compare with deployed SHA from health endpoint
```

---

## 5. Debug Missing Static Assets

### 5.1 Symptom
`GET /scripts/e2e-brief-bypass-wizard.js` → 404 in production

### 5.2 Root Causes
| Cause | Check |
|---|---|
| File not in public/ directory | `Test-Path "public/scripts/e2e-brief-bypass-wizard.js"` |
| File not committed | `git ls-files public/scripts/` |
| Deployed from old commit | `vercel list` + `vercel inspect` mismatch |
| Deployment Protection | `vercel curl` bypasses auth → check real status |

### 5.3 Fix Steps
```powershell
# 1. Verify file exists locally
Test-Path "public/scripts/e2e-brief-bypass-wizard.js"

# 2. Verify file is tracked by git
git ls-files public/scripts/

# 3. If not tracked, add it
git add public/scripts/e2e-brief-bypass-wizard.js
git commit -m "fix: add missing static asset"

# 4. Redeploy
vercel --prod

# 5. Verify in production
vercel curl https://web-portfolio-kappa-wheat.vercel.app/scripts/e2e-brief-bypass-wizard.js | Select-Object -First 3
```

### 5.4 Common Pitfall: Vercel Public Directory
- Vercel serves static files from the project root AND `public/`
- Files in `scripts/` are NOT served (only `public/scripts/` works)
- `vercel.json` `rewrites` can remap, but public/ is the standard approach

---

## 6. Validate API Endpoints in Production

### 6.1 Endpoint Checklist
```powershell
# Health
vercel curl https://web-portfolio-kappa-wheat.vercel.app/api/health
# Expected: {"status":"ok",...}

# sendContact (validate)
vercel curl -X POST "https://web-portfolio-kappa-wheat.vercel.app/api/sendContact" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test\",\"email\":\"test@test.com\",\"message\":\"test\",\"lang\":\"es\"}'
# Expected: {"success":true,"requestId":"...","queuePosition":...}

# sendBrief (validate)
vercel curl -X POST "https://web-portfolio-kappa-wheat.vercel.app/api/sendBrief" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test\",\"email\":\"test@test.com\",\"prompt\":\"test\",\"lang\":\"es\"}'
# Expected: {"success":true,"requestId":"..."}
```

### 6.2 Rate Limit Test (verify 429 behavior)
```powershell
# Send 70+ rapid requests
for ($i=0; $i -lt 70; $i++) {
  vercel curl -X POST "https://web-portfolio-kappa-wheat.vercel.app/api/sendContact" `
    -H "Content-Type: application/json" `
    -d '{\"name\":\"Load$i\",\"email\":\"load$i@test.com\",\"message\":\"test\",\"lang\":\"es\"}'
}
# Some should return 429 after ~30 requests
```

---

## 7. Full Recovery Procedure

### 7.1 No Git Integration (Current State)
```
1. CONNECT GIT
   ├─ Dashboard: Settings → Git → Configure Git Provider
   ├─ Authorize Vercel GitHub App for Javier10Castro
   └─ Select jic-portfolio → Enable auto-deploy

2. DEPLOY
   └─ Push to main → auto-deploy triggers (OR) vercel --prod

3. VERIFY
   ├─ GET /api/health → instance.sha matches latest commit
   ├─ GET /scripts/e2e-brief-bypass-wizard.js → 200
   └─ POST /api/sendContact → 200 with requestId
```

### 7.2 Git Integrated But Stale Deploy
```
1. CHECK PUSH STATUS
   ├─ Vercel Dashboard: latest deployment shows "Building" or "Error"
   └─ GitHub: verify webhook delivery status

2. RETRY
   ├─ Push a no-op commit: git commit --allow-empty -m "chore: retry deploy"
   └─ git push origin main

3. FALLBACK (force deploy)
   └─ vercel --prod

4. VERIFY
   └─ Same as 7.1 step 3
```

### 7.3 Production Down (API returning 5xx)
```
1. CHECK LOGS
   └─ vercel logs <production-url> --follow

2. ROLLBACK
   ├─ vercel list → find last known-good deployment
   └─ vercel promote <good-deployment-url>

3. DIAGNOSE
   ├─ Check env vars: GMAIL_USER, GMAIL_APP_PASSWORD
   ├─ Check DB: DATABASE_URL connectivity
   └─ Inspect recent commit for breaking changes

4. FIX + REDEPLOY
   ├─ git revert <bad-commit>
   ├─ git push origin main
   └─ vercel --prod
```

### 7.4 Static Assets 404
```
1. CHECK FILE
   └─ Test-Path "public/<asset-path>"

2. ADD IF MISSING
   ├─ Copy file to public/
   ├─ git add + commit
   └─ vercel --prod

3. VERIFY
   └─ vercel curl https://.../public/<asset-path>
```

---

## 8. Emergency Contacts

| Resource | Value |
|---|---|
| Vercel Dashboard | https://vercel.com/javier-ibrahim-s-projects/web-portfolio |
| Vercel Deployments | https://vercel.com/javier-ibrahim-s-projects/web-portfolio/deployments |
| Vercel Logs | https://vercel.com/javier-ibrahim-s-projects/web-portfolio/logs |
| GitHub Repo | https://github.com/Javier10Castro/jic-portfolio |
| Production URL | https://web-portfolio-kappa-wheat.vercel.app |
| Vercel Project ID | `prj_K1esY3G2utN5Mci2LHXugPR9PH26` |
| Vercel Team ID | `team_ZpOyCgcvEf4BxnvGKHZUHBAe` |
