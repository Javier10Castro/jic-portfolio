# Environment Management

## Overview

The Environment Manager provides full CRUD operations for deployment environments with lifecycle tracking, promotion flows, and environment-specific configuration. It supports 5 built-in environments plus custom user-defined environments.

## 5 Built-in Environments + Custom

| Environment | Purpose | Default Promotion Target |
|---|---|---|
| **Dev** | Local development and feature work | Preview |
| **Preview** | Pre-review staging for testing | QA |
| **QA** | Quality assurance and validation | Staging |
| **Staging** | Production-like pre-release environment | Production |
| **Production** | Live customer-facing environment | — |

Custom environments can be created with user-defined names, promotion targets, and configuration overrides.

## Environment Lifecycle

```
Active → Inactive → Archived
```

| State | Description |
|---|---|
| `active` | Environment is operational and accepting deployments |
| `inactive` | Environment exists but is paused — no deployments accepted |
| `archived` | Environment is retired — historical data preserved, no operations allowed |

## Promotion Flow Between Environments

```
Dev ──[promote]──→ Preview ──[promote]──→ QA ──[promote]──→ Staging ──[promote]──→ Production
```

Each promotion step supports three approval modes:
- **Manual**: Requires explicit user approval
- **Governance**: Requires policy-based approval with compliance checks
- **Automatic**: Auto-promotes on successful verification

Pre-promotion checks include:
- Policy validation (runtime policies)
- Runtime validation (health checks, configuration consistency)
- Deployment verification (smoke tests, integration tests)

## Environment Configuration

Each environment stores:
- Unique identifier and display name
- Environment type (built-in or custom)
- Current state (active/inactive/archived)
- Deployment target configuration
- Environment-specific feature flags and configuration overrides
- Connection strings and service endpoints
- Promotion target reference
- Audit log of all environment operations
