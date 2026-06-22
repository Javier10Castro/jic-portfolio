# Plugin SDK & Marketplace — Phase 9.3.0

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              Plugin Manager                                     │
│                                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Registry     │  │  Loader       │  │  Validator       │  │  Compatibility  │  │
│  │──────────────│  │───────────────│  │──────────────────│  │────────────────│  │
│  │ register     │  │ load          │  │ validate(manifest) │  │ check(plugin)  │  │
│  │ unregister   │  │ unload        │  │ validateHooks    │  │ checkDeps      │  │
│  │ listPlugins  │  │ isLoaded      │  │                   │  │ semver helpers │  │
│  │ getCategories│  │ getInstance   │  │                   │  │                │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Installer   │  │  Uninstaller  │  │  Lifecycle       │  │  Permissions   │  │
│  │──────────────│  │───────────────│  │──────────────────│  │────────────────│  │
│  │ install      │  │ uninstall     │  │ enable/disable   │  │ grant/revoke   │  │
│  │ validate+load│  │ unload+remove │  │ reload           │  │ hasPermission  │  │
│  │              │  │ storage clean │  │ getState         │  │ 16 constants   │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Sandbox     │  │  Events       │  │  Storage         │  │  Resolver      │  │
│  │──────────────│  │───────────────│  │──────────────────│  │────────────────│  │
│  │ wrap/execute │  │ on/off/emit   │  │ namespaced KV    │  │ resolve/find   │  │
│  │ callAPI      │  │ wildcard '*'  │  │ per-plugin data  │  │ resolveDeps    │  │
│  │ requirePerm  │  │ history query │  │ pluginData query │  │ dependency     │  │
│  │ timeout      │  │ 10 event types│  │                  │  │  resolution    │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Dependency   │  │  Version Mgr  │  │  Marketplace     │  │  Search        │  │
│  │    Graph     │  │───────────────│  │──────────────────│  │────────────────│  │
│  │──────────────│  │ registerVsn   │  │ publish/list     │  │ search (union) │  │
│  │ buildGraph   │  │ getVersion    │  │ verify/featured  │  │ searchByCat    │  │
│  │ getCycles    │  │ getLatest     │  │ topRated/updated │  │ installed+mp   │  │
│  │ installOrder │  │ semver compare│  │ download tracking│  │                │  │
│  │ getDependents│  │               │  │                  │  │                │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────┐│
│  │  Ratings & Reviews                                                          ││
│  │  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ ││
│  │  │  PluginRatings           │  │  PluginReviews                            │ ││
│  │  │  1-5 scoring, average    │  │  CRUD, title+body+rating, count          │ ││
│  │  │  per-user rating lookup  │  │  cross-plugin review lookup              │ ││
│  │  └──────────────────────────┘  └──────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                              Plugin SDK                                          │
│                                                                                  │
│  require('lib/plugin-sdk') → { Plugin, Hook, Command, Widget, ApiExtension,      │
│                                WorkflowExtension, AgentExtension,                 │
│                                GeneratorExtension, StorageExtension,              │
│                                PluginLogger, PluginConfig }                      │
│                                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Plugin      │  │  Hook         │  │  Command         │  │  Widget        │  │
│  │──────────────│  │───────────────│  │──────────────────│  │────────────────│  │
│  │ registerHook │  │ register(pri) │  │ execute(args)    │  │ render(data)   │  │
│  │ registerCmd  │  │ execute(ctx)  │  │ name/desc/usage  │  │ title/width/   │  │
│  │ registerWid  │  │ priority sort │  │ category         │  │ height/cat     │  │
│  │ extendAPI    │  │ handlerCount  │  │ handler setter   │  │ renderer set   │  │
│  │ extendWork   │  │               │  │                  │  │                │  │
│  │ extendAgent  │  │               │  │                  │  │                │  │
│  │ onLoad/Unload│  │               │  │                  │  │                │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  ApiExt      │  │  WorkflowExt  │  │  AgentExt        │  │  GeneratorExt  │  │
│  │──────────────│  │───────────────│  │──────────────────│  │────────────────│  │
│  │ path/method  │  │ type          │  │ type             │  │ name/template  │  │
│  │ handle(req)  │  │ execute(ctx)  │  │ execute(task)    │  │ generate(input)│  │
│  │ auth flag    │  │ name/desc     │  │ name/desc        │  │ name/desc      │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │  StorageExtension          │  │  PluginLogger / PluginConfig               │  │
│  │────────────────────────────│  │────────────────────────────────────────────│  │
│  │ get/set/delete/has/getAll  │  │ Logger: info/warn/error/debug, 1000 cap    │  │
│  │ namespaced per plugin ID   │  │ Config: get/set/onChange/reset/toJSON      │  │
│  └────────────────────────────┘  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Manifest Specification

Every plugin requires a `plugin.json` manifest file:

| Field | Required | Type | Description |
|---|---|---|---|
| `id` | Yes | string | Lowercase alphanumeric with hyphens/underscores (`/^[a-z0-9_-]+$/`) |
| `name` | Yes | string | Human-readable plugin name |
| `version` | Yes | string | Semver (e.g. `1.0.0`) |
| `description` | No | string | Short plugin description |
| `author` | No | string | Publisher/author name |
| `license` | No | string | SPDX license identifier |
| `type` | Yes | string | One of: `widget`, `agent`, `workflow`, `api`, `theme`, or custom |
| `permissions` | Yes* | string[] | Required permissions (not required for `theme` type) |
| `hooks` | No | object | Hook name → plugin hook config |
| `categories` | No | string[] | Category tags for filtering |
| `tags` | No | string[] | Arbitrary searchable keywords |
| `keywords` | No | string[] | Additional search keywords |
| `dependencies` | No | object | `{ "plugin-id": "version" }` — plugin dependencies |
| `minimumPlatformVersion` | No | string | Minimum platform version (e.g. `4.0.0`) |
| `maximumPlatformVersion` | No | string | Maximum platform version (e.g. `5.0.0`) |
| `homepage` | No | string | Project homepage URL |
| `repository` | No | string | Source repository URL |

### Example Minimal Manifest

```json
{
  "id": "my-analytics",
  "name": "My Analytics",
  "version": "1.0.0",
  "type": "widget",
  "permissions": ["core.read"],
  "hooks": {},
  "categories": ["analytics"]
}
```

## Hook Catalog

21 well-known hooks registered via `HOOKS` constants:

| Constant | Hook Name | Trigger |
|---|---|---|
| `BEFORE_GENERATION` | `beforeGeneration` | Before code generation runs |
| `AFTER_GENERATION` | `afterGeneration` | After code generation completes |
| `BEFORE_DEPLOYMENT` | `beforeDeployment` | Before deployment executes |
| `AFTER_DEPLOYMENT` | `afterDeployment` | After deployment completes |
| `BEFORE_WORKFLOW` | `beforeWorkflow` | Before workflow execution |
| `AFTER_WORKFLOW` | `afterWorkflow` | After workflow execution |
| `BEFORE_BILLING` | `beforeBilling` | Before billing operation |
| `AFTER_BILLING` | `afterBilling` | After billing operation |
| `BEFORE_AUTHENTICATION` | `beforeAuthentication` | Before authentication attempt |
| `AFTER_AUTHENTICATION` | `afterAuthentication` | After authentication result |
| `BEFORE_REMEDIATION` | `beforeRemediation` | Before auto-remediation |
| `AFTER_REMEDIATION` | `afterRemediation` | After auto-remediation |
| `SYSTEM_STARTUP` | `systemStartup` | Platform startup |
| `SYSTEM_SHUTDOWN` | `systemShutdown` | Platform shutdown |
| `BEFORE_COST` | `beforeCost` | Before cost calculation |
| `AFTER_COST` | `afterCost` | After cost calculation |
| `BEFORE_SECURITY` | `beforeSecurity` | Before security check |
| `AFTER_SECURITY` | `afterSecurity` | After security check |
| `BEFORE_PLUGIN_LOAD` | `beforePluginLoad` | Before a plugin loads |
| `AFTER_PLUGIN_LOAD` | `afterPluginLoad` | After a plugin loads |

Unknown hooks are rejected at registration time.

## Permission Model

16 named permission constants:

| Constant | String | Scope |
|---|---|---|
| `CORE_READ` | `core.read` | Read core platform data |
| `CORE_WRITE` | `core.write` | Write core platform data |
| `API_ACCESS` | `api.access` | Access API endpoints |
| `WEBHOOKS` | `webhooks` | Send/receive webhooks |
| `FILESYSTEM_READ` | `filesystem.read` | Read local files |
| `FILESYSTEM_WRITE` | `filesystem.write` | Write local files |
| `NETWORK` | `network` | Make network requests |
| `STORAGE` | `storage` | Access storage |
| `EVENTS` | `events` | Subscribe/emit events |
| `AGENTS` | `agents` | Interact with agents |
| `WORKFLOWS` | `workflows` | Execute/modify workflows |
| `BILLING` | `billing` | Access billing data |
| `SECURITY` | `security` | Access security data |
| `COST` | `cost` | Access cost data |
| `TELEMETRY` | `telemetry` | Access telemetry data |
| `ADMIN` | `admin` | All permissions (wildcard) |

`ADMIN` permission grants access to all operations. Permissions are granted per-plugin via `PluginManager.grantPermission()`.

## Plugin Types

| Type | SDK Class | Description |
|---|---|---|
| `widget` | `Widget` | Renders UI via `render(data)` — returns HTML string |
| `agent` | `AgentExtension` | Extends agent capabilities via `execute(task, context)` |
| `workflow` | `WorkflowExtension` | Adds workflow steps via `execute(context)` |
| `api` | `ApiExtension` | Registers API endpoints via `handle(req, res)` |
| `theme` | `Widget` | Provides visual theme via CSS/widget renderer |
| `generator` | `GeneratorExtension` | Adds code generation templates via `generate(input, context)` |
| `command` | `Command` | Registers CLI commands via `execute(args, context)` |

## Events

10 plugin lifecycle events via `EVENTS` constants:

| Constant | Event Name |
|---|---|
| `PLUGIN_INSTALLED` | `plugin.installed` |
| `PLUGIN_UPDATED` | `plugin.updated` |
| `PLUGIN_REMOVED` | `plugin.removed` |
| `PLUGIN_LOADED` | `plugin.loaded` |
| `PLUGIN_UNLOADED` | `plugin.unloaded` |
| `PLUGIN_FAILED` | `plugin.failed` |
| `PLUGIN_ENABLED` | `plugin.enabled` |
| `PLUGIN_DISABLED` | `plugin.disabled` |
| `PLUGIN_PERMISSION_DENIED` | `plugin.permission.denied` |
| `PLUGIN_COMPATIBILITY_FAILED` | `plugin.compatibility.failed` |

Wildcard listener (`'*'`) receives all events. History is queryable.

## Sandbox

The plugin sandbox wraps each instance at load time with:

- **`execute(fn, ...args)`** — Executes with configurable timeout (default 30s)
- **`callAPI(endpoint, method, body)`** — Sandboxed API call wrapper
- **`requirePermission(perm)`** — Checks plugin manifest permissions at runtime
- **`getPermissions()`** — Returns manifest-declared permission list

## Dependency Graph

- **Cycle detection**: `getCycles()` returns all circular dependency chains
- **Installation order**: `getInstallationOrder()` produces topological sort
- **Dependent lookup**: `getDependents()` finds all reverse dependencies for safe uninstall

## API Catalog

All routes under `/api/v1/plugins/`:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/plugins` | List all installed plugins |
| GET | `/plugins/installed` | List installed plugins (alias) |
| GET | `/plugins/marketplace` | List marketplace listings |
| GET | `/plugins/:id` | Get plugin details |
| POST | `/plugins/install` | Install a plugin |
| POST | `/plugins/uninstall` | Uninstall a plugin |
| PUT | `/plugins/:id/update` | Update plugin manifest |
| POST | `/plugins/:id/enable` | Enable a plugin |
| POST | `/plugins/:id/disable` | Disable a plugin |
| POST | `/plugins/:id/reload` | Reload a plugin |
| GET | `/plugins/search` | Search plugins (installed + marketplace) |
| GET | `/plugins/categories` | List all categories |

## Integration

- **Plugin SDK**: `require('lib/plugin-sdk')` — Consumer-grade API for plugin authors
- **Plugin Manager**: Central orchestrator in `lib/plugins/` — dependency injectable, independently testable
- **Control Plane**: SSR plugins page with Installed/Marketplace/Categories tabs + 4 metric cards
- **API**: REST endpoints at `/api/v1/plugins/` with 12 routes
- **Events**: 10 event types for lifecycle tracking
- **Marketplace**: Publish, search, verify, featured, top-rated, recently updated, download tracking
- **Examples**: 5 example plugins demonstrate widget, agent, workflow, API, and theme types
