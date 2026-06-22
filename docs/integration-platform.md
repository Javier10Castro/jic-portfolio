# Enterprise Integration Hub — Phase 9.4.0

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     Integration Manager                                                          │
│                                                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Registry     │  │  Loader      │  │  Installer    │  │  Validator    │  │  Events      │  │  Storage     │  │
│  │──────────────│  │──────────────│  │───────────────│  │───────────────│  │──────────────│  │──────────────│  │
│  │ register     │  │ load         │  │ install       │  │ validate      │  │ on/off/emit  │  │ get/set      │  │
│  │ unregister   │  │ unload       │  │ uninstall     │  │ validateAuth  │  │ wildcard '*' │  │ namespaced   │  │
│  │ list         │  │ isLoaded     │  │               │  │ 6 auth types  │  │ history      │  │ providerData │  │
│  │ getProvider  │  │ getInstance  │  │               │  │               │  │ 8 events     │  │              │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  └───────────────┘  └──────────────┘  └──────────────┘  │
│                                                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Permissions │  │  Health      │  │  Scheduler    │  │  Sync         │  │  Webhook     │  │  Secrets     │  │
│  │──────────────│  │──────────────│  │───────────────│  │───────────────│  │──────────────│  │──────────────│  │
│  │ grant/revoke │  │ recordSucc   │  │ schedule      │  │ startSync     │  │ registerIn   │  │ store/get    │  │
│  │ hasPerm      │  │ recordFail   │  │ cancel        │  │ completeSync  │  │ registerOut  │  │ rotate       │  │
│  │ getPerms     │  │ rateLimit    │  │ tick          │  │ failSync      │  │ processIn    │  │ delete/list  │  │
│  │ 6 constants  │  │ uptime       │  │ list          │  │ retry         │  │ sendOut      │  │ base64 enc   │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  └───────────────┘  └──────────────┘  └──────────────┘  │
│                                                                                                                  │
│  ┌──────────────┐  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Audit       │  │                              Providers (14+)                                               │ │
│  │──────────────│  │  github, gitlab, bitbucket, vercel, netlify, slack, teams, discord, notion, jira,          │ │
│  │ log/query    │  │  linear, trello, asana, dropbox, google (drive/docs/sheets/oauth), office365               │ │
│  │ getStats     │  │  (onedrive/outlook), aws (s3/secretsmanager), cloudflare (pages/dns/kv),                   │ │
│  │ byProvider   │  │  postgres, mysql, mongodb, redis                                                           │ │
│  └──────────────┘  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Module Map

| # | Module | File | Key Methods | Description |
|---|---|---|---|---|
| 1 | `IntegrationManager` | `integrationManager.js` | `connect`, `disconnect`, `getStatus`, `clear` | Central orchestrator |
| 2 | `IntegrationRegistry` | `integrationRegistry.js` | `register`, `unregister`, `listIntegrations`, `getCount` | Integration state |
| 3 | `IntegrationLoader` | `integrationLoader.js` | `load`, `unload`, `isLoaded`, `getInstance` | Instance management |
| 4 | `IntegrationInstaller` | `integrationInstaller.js` | `install`, `uninstall` | Provider install/uninstall |
| 5 | `IntegrationValidator` | `integrationValidator.js` | `validate`, `validateAuth` | Config validation |
| 6 | `IntegrationEvents` | `integrationEvents.js` | `on`, `off`, `emit`, `history` | Pub/sub with history |
| 7 | `IntegrationStorage` | `integrationStorage.js` | `get`, `set`, `delete`, `getNamespaced` | Key-value storage |
| 8 | `IntegrationPermissions` | `integrationPermissions.js` | `grant`, `revoke`, `hasPermission` | Permission model |
| 9 | `IntegrationHealth` | `integrationHealth.js` | `recordSuccess`, `recordFailure`, `recordRateLimit` | Health tracking |
| 10 | `IntegrationScheduler` | `integrationScheduler.js` | `schedule`, `cancel`, `tick`, `list` | Cron-like scheduling |
| 11 | `IntegrationSync` | `integrationSync.js` | `startSync`, `completeSync`, `failSync`, `retry` | Data sync engine |
| 12 | `IntegrationWebhook` | `integrationWebhook.js` | `registerIncoming`, `registerOutgoing`, `processIncoming` | Webhook engine |
| 13 | `IntegrationSecrets` | `integrationSecrets.js` | `store`, `get`, `delete`, `rotate` | Encrypted secrets |
| 14 | `IntegrationAudit` | `integrationAudit.js` | `log`, `query`, `getStats` | Audit trail |

## Provider Matrix

| Provider | Type | AuthType | Features |
|---|---|---|---|
| GitHub | source-control | oauth2 | Repos, Actions, PRs, Issues, Webhooks |
| GitLab | source-control | oauth2 | Repos, Pipelines, MRs |
| Bitbucket | source-control | oauth2 | Repos |
| Vercel | deployment | pat | Projects, Deployments, Domains |
| Netlify | deployment | oauth2 | Sites, Deployments |
| Slack | messaging | oauth2 | Channels, Messages, Notifications, Commands |
| Microsoft Teams | messaging | oauth2 | Channels, Messages |
| Discord | messaging | pat | Channels, Messages |
| Notion | documentation | oauth2 | Pages, Databases, Search |
| Jira | project-management | pat | Issues, Projects |
| Linear | project-management | api-key | Teams, Issues |
| Trello | project-management | api-key | Boards, Lists, Cards |
| Asana | project-management | pat | Projects, Tasks |
| Dropbox | storage | oauth2 | Files, Folders |
| Google Drive | storage | oauth2 | Files, Folders |
| Google Docs | productivity | oauth2 | Documents |
| Google Sheets | productivity | oauth2 | Spreadsheets |
| OneDrive | storage | oauth2 | Files, Folders |
| Outlook | email | oauth2 | Email |
| AWS S3 | storage | api-key | Buckets, Objects |
| AWS Secrets Manager | security | api-key | Secrets |
| Cloudflare Pages | deployment | api-key | Projects, Deployments |
| Cloudflare DNS | networking | api-key | Zones, Records |
| Cloudflare KV | storage | api-key | Key-Value |
| PostgreSQL | database | password | Tables, Schema, Sync |
| MySQL | database | password | Tables, Schema, Sync |
| MongoDB | database | password | Collections, Documents |
| Redis | cache | password | Key-Value, Pub/Sub |

## API Catalog

All routes under `/api/v1/integrations/`:

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| GET | `/integrations` | `listIntegrations` | List all integrations |
| GET | `/integrations/installed` | `listInstalled` | List connected integrations |
| GET | `/integrations/providers` | `listProviders` | List all providers |
| GET | `/integrations/providers/:provider` | `getProvider` | Get provider details |
| POST | `/integrations/connect` | `connectIntegration` | Connect a provider |
| POST | `/integrations/disconnect` | `disconnectIntegration` | Disconnect a provider |
| POST | `/integrations/sync` | `syncIntegration` | Start a sync |
| POST | `/integrations/webhook` | `processWebhook` | Process a webhook |
| GET | `/integrations/health` | `getHealth` | Get health status |
| GET | `/integrations/events` | `getEvents` | Get event history |
| GET | `/integrations/status` | `getStatus` | Get system status |

## OAuth Flow

```
┌─────────┐         ┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│  Plugin  │         │  Integration │         │  Provider   │         │   OAuth      │
│   SDK    │         │  Manager     │         │  Instance   │         │   Server     │
└────┬─────┘         └──────┬───────┘         └──────┬──────┘         └──────┬───────┘
     │                      │                        │                      │
     │  connect(provider)   │                        │                      │
     │─────────────────────>│                        │                      │
     │                      │  validate(config)      │                      │
     │                      │───────────────────────>│                      │
     │                      │                        │                      │
     │                      │  result ← validation   │                      │
     │                      │<───────────────────────│                      │
     │                      │                        │                      │
     │                      │  ProviderClass()       │                      │
     │                      │───────────────────────>│                      │
     │                      │                        │  authorize redirect  │
     │                      │                        │─────────────────────>│
     │                      │                        │<─── auth code ───────│
     │                      │                        │                      │
     │                      │                        │  exchange code ──────>│
     │                      │                        │<─── tokens ──────────│
     │                      │                        │                      │
     │                      │  connect() result      │                      │
     │                      │<───────────────────────│                      │
     │                      │                        │                      │
     │                      │  register(integration) │                      │
     │                      │  load(integration)     │                      │
     │                      │  audit.log()           │                      │
     │                      │  events.emit(CONNECTED)│                      │
     │  { success, instance}│                        │                      │
     │<─────────────────────│                        │                      │
```

## Webhook Flow

```
┌──────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  External    │     │  Integration │     │  Webhook    │     │  Subscribers │
│  Service     │     │  Manager     │     │  Engine     │     │  (Events)    │
└──────┬───────┘     └──────┬───────┘     └──────┬──────┘     └──────┬───────┘
       │                    │                     │                    │
       │  incoming webhook  │                     │                    │
       │─────────────────────>                    │                    │
       │                    │  POST /webhook       │                    │
       │                    │─────────────────────>│                    │
       │                    │                     │                    │
       │                    │                     │ verifySignature    │
       │                    │                     │ (HMAC-SHA256)      │
       │                    │                     │                    │
       │                    │                     │ if valid:          │
       │                    │                     │ emit(WEBHOOK_RCVD) │
       │                    │                     │───────────────────>│
       │                    │                     │                    │
       │                    │                     │ process handlers   │
       │                    │                     │                    │
       │  { processed:true }│                     │                    │
       │<────────────────────│<────────────────────│                    │
```

## Sync Engine

```
┌──────────┐   startSync    ┌────────────┐   completeSync   ┌────────────┐
│  Manager │──────────────> │  Sync      │─────────────────>│  Complete  │
│          │                │  Engine    │                  │  (data)    │
│          │                │            │   failSync        │            │
│          │                │            │─────────────────>│  Failed    │
│          │                │            │                  │  (error)   │
│          │                │            │                  │            │
│          │   retrySync    │            │   startSync      │            │
│          │<───────────────│            │<─────────────────│  Retry     │
└──────────┘                └────────────┘                  └────────────┘

Sync Types: incremental, full
Events Emitted: integration.synced, integration.failed
Health: records success/failure per provider
```

## Security Model

- **Secrets**: Base64-encoded at rest via `IntegrationSecrets`, namespaced per provider
- **Token Rotation**: `rotate()` generates cryptographically random replacement tokens
- **Permissions**: 6 permission constants (`integrations.read`, `integrations.write`, `integrations.admin`, `webhooks`, `sync`, `secrets`)
- **Webhook Signatures**: HMAC-SHA256 verification on incoming webhooks
- **Audit Trail**: Every connect/disconnect/sync operation logged with timestamp
- **Auth Types**: oauth2, oauth-pkce, pat, api-key, jwt, none — validated on connect

## Integration with Other Platform Phases

| Phase | Integration Point |
|---|---|
| 9.3.0 Plugin SDK | `Plugin.registerIntegration()` / `registerWebhook()` / `registerOAuthProvider()` |
| 9.2.0 Control Plane | Integration status dashboard, provider cards, metrics |
| 9.1.0 API Gateway | `/api/v1/integrations/*` REST endpoints |
| 9.0.0 Events System | Integration events flow through `IntegrationEvents` to platform event bus |
| 8.0.0 Storage | `IntegrationStorage` namespaced per provider for config/state persistence |

## Example Usage

```js
const { IntegrationManager } = require('../lib/integrations');
const manager = new IntegrationManager();

const result = manager.connect('github', {
  name: 'My GitHub',
  auth: { type: 'oauth2' },
  token: 'ghp_xxx'
});

if (result.success) {
  const sync = manager.startSync('github', 'incremental');
  manager.completeSync(sync.syncId, { rows: 42 });

  manager.registerIncomingWebhook('github', {
    path: '/webhooks/github',
    secret: 'whsec_xxx'
  });

  console.log('Status:', manager.getStatus());
  console.log('Health:', manager.getHealth('github'));
}
```
