# CI/CD Reconnect Guide: GitHub ↔ Vercel
## Web Portfolio Project

```yaml
GitHub Repo:  Javier10Castro/jic-portfolio
Vercel Team:  javier-ibrahim-s-projects
Vercel Project: web-portfolio
Current State: Git integration CONNECTED (since 2026-06-10)
Integration Type: GitHub App
Production Branch: main
Auto-deploy: ENABLED
Preview Deployments: ENABLED
Repo ID: 1263203153
Git Credential ID: cred_7beb34f358c57626b729f99be5703565c6c2fd01
Link created: 2026-06-10T22:10:59.569Z
```

---

## 1. Prerequisites

| Requirement | Check |
|---|---|
| Vercel CLI authenticated | `vercel whoami` → returns username |
| GitHub repo exists and is public | https://github.com/Javier10Castro/jic-portfolio |
| GitHub CLI authenticated | `gh auth status` → logged in |
| Git remote configured | `git remote -v` → origin points to GitHub |
| Local branch is `main` | `git branch --show-current` → `main` |
| Working tree clean | `git status` → nothing to commit |

---

## 2. Step-by-Step Reconnect

### 2.1 Option A: Vercel Dashboard (Recommended)

1. **Open Vercel Dashboard**
   - URL: https://vercel.com/javier-ibrahim-s-projects/web-portfolio

2. **Navigate to Git Settings**
   - Click **Settings** tab
   - Click **Git** in left sidebar
   - URL: https://vercel.com/javier-ibrahim-s-projects/web-portfolio/settings/git

3. **Connect Repository**
   - Click **Configure Git Provider**
   - Select **GitHub**
   - If prompted, authorize the **Vercel for GitHub** app:
     - Repository access: Select `Javier10Castro/jic-portfolio` only
     - Click **Install & Authorize**
   - After authorization, you'll be redirected to Vercel

4. **Select Repository**
   - From the dropdown, select `Javier10Castro/jic-portfolio`
   - Choose branch: `main`
   - Enable **Auto-deploy** (automatic deployments on push)

5. **Save Configuration**
   - Click **Save**
   - Vercel will create a webhook in GitHub

### 2.2 Option B: Vercel CLI

```powershell
# 1. Verify authentication
vercel whoami
# Expected output: javiercastro9912-1887 (or your username)

# 2. Verify local Git remote
git remote -v
# Expected:
# origin  https://github.com/Javier10Castro/jic-portfolio.git (fetch)
# origin  https://github.com/Javier10Castro/jic-portfolio.git (push)

# 3. Attempt Git connection
vercel git connect "https://github.com/Javier10Castro/jic-portfolio"
# If this fails with "Failed to connect", use Option A (Dashboard)
# The CLI fails when Vercel GitHub App is not installed on the account
```

**Known CLI limitation:** `vercel git connect` fails with error `"Failed to connect Javier10Castro/jic-portfolio to project"` even for public repos when the Vercel GitHub App has not been installed on the GitHub account. This requires the Dashboard approach.

### 2.3 Option C: Import Existing Project (Fresh)

If the Vercel project needs to be re-created:

```powershell
# 1. Remove existing Vercel project link
Remove-Item -Recurse -Force ".vercel" -ErrorAction SilentlyContinue

# 2. Import from GitHub (creates new project + Git integration)
vercel import https://github.com/Javier10Castro/jic-portfolio
# Follow prompts: team = javier-ibrahim-s-projects
# This automatically sets up Git integration and webhook

# 3. Re-link environment variables
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add DATABASE_URL
```

---

## 3. After Connection: Verification Checklist

### 3.1 Webhook Verification

```powershell
# Check GitHub webhooks
gh api repos/Javier10Castro/jic-portfolio/hooks --jq '.[] | select(.name=="vercel") | {id, active, url, last_response}'
# Expected: one active webhook pointing to vercel.com
```

Or via browser: https://github.com/Javier10Castro/jic-portfolio/settings/hooks

### 3.2 Auto-deploy Test

```powershell
# 1. Make a no-op commit
git commit --allow-empty -m "chore: test auto-deploy pipeline"

# 2. Push to main
git push origin main

# 3. Wait 30-60 seconds

# 4. Verify new deployment triggered
vercel list
# → Should show a new deployment from "Git Push" source

# 5. Check deployment status
vercel inspect <new-deployment-url> | Select-String -Pattern "state|status"
# → Should show "READY"
```

### 3.3 Production URL Verification

```powershell
# After auto-deploy completes, verify production URL updated
vercel list
# → The latest production deployment should have the new commit's SHA

# Health check
vercel curl https://web-portfolio-kappa-wheat.vercel.app/api/health
# → instance.sha should match the latest git commit
```

### 3.4 Static Asset Verification

```powershell
vercel curl https://web-portfolio-kappa-wheat.vercel.app/scripts/e2e-brief-bypass-wizard.js | Select-Object -First 3
# → Should return the script content
```

### 3.5 API Endpoints

```powershell
vercel curl https://web-portfolio-kappa-wheat.vercel.app/api/health
# → {"status":"ok","instance":{"sha":"<latest-commit>"}}
```

---

## 4. Verification Checklist

| # | Check | Command / Action | Expected |
|---|---|---|---|
| 1 | Git integration active | Vercel Dashboard → Settings → Git | Shows connected repo |
| 2 | Webhook exists | GitHub → Settings → Hooks | Vercel webhook present and ✅ |
| 3 | Auto-deploy enabled | Vercel Dashboard → Settings → Git | "Auto-deploy" ON for main |
| 4 | Push triggers build | `git push origin main` | Vercel Dashboard shows "Building" |
| 5 | Build succeeds | `vercel list` | Status = ● Ready |
| 6 | Commit SHA matches | `vercel curl /api/health` → instance.sha | Matches `git rev-parse HEAD` |
| 7 | Static assets serve | `vercel curl /scripts/...` | HTTP 200, content returned |
| 8 | API endpoints work | `vercel curl /api/health` | `{"status":"ok"}` |

---

## 5. Common Failure Cases

### 5.1 Wrong Branch
```
Symptom: Git push produces no deployment
Fix:    Vercel Dashboard → Settings → Git → Production Branch → "main"
Verify: git branch --show-current → main
```

### 5.2 Missing GitHub Permissions
```
Symptom: Vercel GitHub App not authorized
Fix:    Go to https://github.com/settings/installations
        Find "Vercel" → Configure → Add repository "jic-portfolio"
```

### 5.3 Stale Vercel Token
```
Symptom: vercel git connect → permission error
Fix:    vercel logout
        vercel login
        Then retry dashboard connection
```

### 5.4 Project Already Linked (Wrong Team)
```
Symptom: vercel --prod deploys but to wrong team/account
Fix:    Remove .vercel directory
        Remove-Item -Recurse -Force ".vercel"
        Run vercel --prod to re-link
```

### 5.5 Environment Variables Missing
```
Symptom: API returns 500 after deployment
Fix:    Check Vercel Dashboard → Settings → Environment Variables
        Verify GMAIL_USER, GMAIL_APP_PASSWORD, DATABASE_URL are set
        These are NOT pushed via git — must be set in Vercel Dashboard
```

### 5.6 Deployment Protection Blocking Checks
```
Symptom: curl returns Vercel auth page instead of content
Fix:    Use vercel curl instead of raw curl/powershell
        Or disable Deployment Protection in Vercel Dashboard → Settings → Deployment Protection
```

---

## 6. Rollback Procedure

If auto-deploy introduces a bug:

```powershell
# 1. List deployments
vercel list

# 2. Find last known-good deployment URL
# 3. Promote it to production
vercel promote <good-deployment-url>

# 4. Revert the bad commit
git revert HEAD
git push origin main

# 5. Verify
vercel list
```

---

## 7. Architecture Reference

```
GitHub Push (main)
     │
     ▼
GitHub Webhook ──────► Vercel API
     │                      │
     │                      ▼
     │              Vercel Build System
     │                      │
     │              1. Install deps (npm install)
     │              2. Detect framework (None)
     │              3. Build (skip — no build step)
     │              4. Deploy to Edge Network
     │                      │
     │                      ▼
     │              Vercel Edge Network
     │              ├── Static assets (public/)
     │              ├── Serverless Functions (api/)
     │              └── Production URL updated
     │
     └──────► Deployment Status Callback
                  ├── Email notification (if configured)
                  └── Vercel Dashboard updated
```
