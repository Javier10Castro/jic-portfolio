# Deployment Engine — Phase 6

## Architecture

The Deployment Engine is a provider-based system that publishes generated websites with versioning, deployment history, rollback support, and provider abstraction.

```
  Build Artifacts
       │
       ▼
  Deployment Manager
       │
       ├── Provider Registry
       │      ├── Vercel Provider
       │      └── GitHub Provider   ← extend here for new providers
       │
       ├── Deployment History (data/deployments.json)
       ├── Rollback Manager (data/rollbacks.json)
       └── Deployment Report
```

## Deployment Flow

```
  1. Package Build          (buildArtifacts.js)
  2. Select Provider        (provider registry)
  3. Deploy via Provider    (vercelProvider.js / githubProvider.js)
  4. Record History         (deploymentHistory.js)
  5. Generate Report        (deploymentReport.js)
  6. Return Result
```

## Provider Abstraction

Every provider must implement:

| Method       | Input                          | Output                         |
|-------------|--------------------------------|--------------------------------|
| `deploy()`  | `{ buildPath, projectName, version, commitSha }` | `{ deploymentId, url, status }` |
| `status()`  | `deploymentId`                 | `{ deploymentId, status }`      |
| `rollback()`| `deploymentId`                 | `{ success, status }`           |
| `health()`  | —                              | `{ provider, status }`          |

## Rollback

```
  rollbackTo(version)
       │
       ├── Find deployment by version in history
       ├── Create rollback record (data/rollbacks.json)
       ├── Update deployment status to "rolled_back"
       └── Return rollback report
```

## Versioning

Each deployment is tagged with a semantic version (`v1.0.0`, `v1.1.0`, etc.). Versions are tracked in the deployment history and used as rollback targets.

## Build Artifacts

The `buildArtifacts.js` module packages generated files into a structured manifest:

```
{
  projectName, version,
  files: [{ path, size, content }],
  totalFiles, totalSize, packagedAt
}
```

## Deployment Reports

Every deployment produces a report:

```
{
  deploymentId, provider, version, commit,
  url, duration, deployedAt, status,
  simulated, warnings, rollbackAvailable,
  filesDeployed, totalSize
}
```

## Environment Variables

| Variable            | Required For        | Purpose                        |
|--------------------|---------------------|--------------------------------|
| `VERCEL_TOKEN`     | Vercel deploy       | Vercel API authentication      |
| `VERCEL_ORG_ID`    | Vercel deploy       | Vercel team/org ID             |
| `VERCEL_PROJECT_ID`| Vercel deploy       | Vercel project ID              |
| `GITHUB_TOKEN`     | GitHub push         | GitHub API authentication      |

Without these variables, providers run in **simulated mode** — returning realistic responses without making API calls.

## Dry-Run Mode

Pass `{ dryRun: true }` to `deploy()` to simulate a deployment without making any external calls. Returns a report with `dryRun: true` and no side effects.

## Production Mode

Production deployments use real provider credentials. All deployments are recorded in `data/deployments.json` for history and rollback.

## Adding New Providers

1. Create a new file (e.g., `cloudflareProvider.js`, `netlifyProvider.js`)
2. Implement `deploy()`, `status()`, `rollback()`, `health()`
3. Call `registerProvider('cloudflare', { deploy, status, rollback, health })` at the end
4. Use via `deploy({ providerName: 'cloudflare', ... })`

No changes are needed to the deployment manager, history, rollback, reports, or any existing provider.

### Provider Template

```javascript
const { registerProvider } = require('./deploymentProvider');

function deploy({ buildPath, projectName, version, commitSha }) {
  // Implement deployment logic
  return { success: true, provider: 'your-provider', deploymentId, url, status: 'deployed' };
}

function status(deploymentId) {
  return { provider: 'your-provider', deploymentId, status: 'deployed' };
}

function rollback(deploymentId) {
  return { success: true, provider: 'your-provider', status: 'rolled_back' };
}

function health() {
  return { provider: 'your-provider', status: 'ready' };
}

registerProvider('your-provider', { deploy, status, rollback, health });
module.exports = { deploy, status, rollback, health };
```

## File Reference

| File | Purpose |
|------|---------|
| `index.js` | Entry point — exposes deploy, status, history, rollback |
| `deploymentManager.js` | Complete deployment lifecycle orchestration |
| `deploymentProvider.js` | Provider registry — register, get, list, health |
| `vercelProvider.js` | Vercel deploy implementation |
| `githubProvider.js` | GitHub/Git provider implementation |
| `deploymentHistory.js` | Persistence layer for deployment records |
| `rollbackManager.js` | Rollback to previous deployment versions |
| `buildArtifacts.js` | Build artifact packaging and compression |
| `deploymentReport.js` | Deployment report generation and history summary |
