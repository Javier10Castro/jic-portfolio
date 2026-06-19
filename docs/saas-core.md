# SaaS Core — Phase 7.1

## Overview

The SaaS Core provides the multi-tenant, user-facing foundation of the AI Website Generation Platform. It sits above the generation pipeline (Phases 0–7) and below the planned REST API, WebSocket events, and Billing layers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Future: REST API / WebSocket                  │
├─────────────────────────────────────────────────────────────────────┤
│                          SaaS Core (Phase 7.1)                      │
│                                                                     │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │ User       │  │ Organization     │  │ Workspace               │ │
│  │ Manager    │  │ Manager          │  │ Manager                 │ │
│  └─────┬──────┘  └────────┬─────────┘  └───────────┬─────────────┘ │
│        │                  │                         │               │
│        └──────────────────┼─────────────────────────┘               │
│                           │                                         │
│              ┌────────────▼────────────┐                            │
│              │    Project Manager      │                            │
│              └────────────┬────────────┘                            │
│                           │                                         │
│  ┌────────────┐  ┌────────▼────────┐  ┌─────────────────────────┐ │
│  │ Deployment │  │ Authentication  │  │ Session Manager          │ │
│  │ History    │  │ (Email/GitHub/  │  │ (Create/Validate/Revoke) │ │
│  │ (Phase 6)  │  │  Google OAuth)  │  └─────────────────────────┘ │
│  └────────────┘  └─────────────────┘                              │
│                                                                     │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │ API Keys   │  │ Usage Tracker    │  │ Settings Manager         │ │
│  │ (Generate/ │  │ (Projects/Deploy │  │ (Workspace/Project/User) │ │
│  │  Validate) │  │  AI/Storage/BW)  │  └─────────────────────────┘ │
│  └────────────┘  └──────────────────┘                              │
│                                                                     │
│  ┌──────────────────┐  ┌───────────────────────────────────────┐   │
│  │ Authorization    │  │ Audit Log                             │   │
│  │ (RBAC — 4 roles) │  │ (Immutable append-only)               │   │
│  └──────────────────┘  └───────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Storage Manager (Abstract adapter — filesystem / future S3)  │   │
│  └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                     Generation Pipeline (Phases 0–7)                │
│  Orchestrator → Planner → Design → Content → Builder → Deploy     │
└─────────────────────────────────────────────────────────────────────┘
```

## Workspace Model

```
User ── owns ──► Personal Workspace (1 per user)
  │
  └── member of ──► Organization
                      │
                      └── owns ──► Organization Workspace (N per org)
```

- **Personal Workspace**: Created automatically per user. Contains personal projects.
- **Organization Workspace**: Created per organization. Shared among members.
- **Team Workspace**: Type reserved for future team/collaboration expansion.

## RBAC Matrix

| Resource      | Owner | Admin | Editor | Viewer |
|---------------|-------|-------|--------|--------|
| Projects      | CRUD  | CRUD  | CRU    | R      |
| Deployments   | CRUD  | CRUD  | CRU    | R      |
| Settings      | CRUD  | CRU   | -      | -      |
| Billing       | CRUD  | R     | -      | -      |
| Users         | CRUD  | CRU   | -      | -      |
| Audit         | R     | R     | -      | -      |
| API Keys      | CRUD  | CRUD  | R      | R      |

Roles: Owner > Admin > Editor > Viewer. Owner cannot be removed.

## Modules

| Module              | File                           | Purpose                                      |
|---------------------|--------------------------------|----------------------------------------------|
| User Manager        | `userManager.js`               | CRUD, profiles, preferences                  |
| Organization Manager| `organizationManager.js`        | Org membership, roles, invite/remove         |
| Workspace Manager   | `workspaceManager.js`           | Personal/org/team workspace lifecycle        |
| Project Manager     | `projectManager.js`             | Full project lifecycle with deployment+gen history |
| Authorization       | `authorization.js`              | RBAC — 4 roles, 7 resource categories        |
| Authentication      | `authentication.js`             | Provider abstraction (Email/GitHub/Google)   |
| Session Manager     | `sessionManager.js`             | Create, validate, refresh, revoke sessions   |
| API Keys            | `apiKeys.js`                    | Generate, rotate, revoke, validate           |
| Usage Tracker       | `usageTracker.js`               | Track projects, deployments, AI, storage, BW |
| Audit Log           | `auditLog.js`                   | Immutable append-only audit trail            |
| Settings Manager    | `settingsManager.js`            | Scoped settings (workspace/project/org/user) |
| Storage Manager     | `storageManager.js`             | Abstract adapter pattern (filesystem / S3)   |
| Index               | `index.js`                      | Single entry point exporting all modules     |

## Persistence

- **Local/Simulated**: JSON files in `data/` — `users.json`, `organizations.json`, `workspaces.json`, `projects.json`, `sessions.json`, `apiKeys.json`, `usage.json`, `settings.json`, `audit.json`
- **Production**: Neon PostgreSQL via `lib/db/index.js` (future implementation)

## Extension Points

1. **Storage**: Register new adapters via `storageManager.registerAdapter('s3', impl)`
2. **Auth**: Register new providers via `authentication.registerProvider('okta', impl)`
3. **RBAC**: Matrix is data-driven — extend resource categories and role permissions
4. **Usage**: New metric types extend `METRIC_TYPES` object
5. **Billing**: Consumption-based billing reads pre-aggregated data from `usageTracker.getSummary()`
6. **Multi-Tenant**: Organization isolation by `organizationId` on workspace, project, usage, API keys
