# Composition Policies

## Overview

Composition Policies define rules, constraints, and workflows that govern the application composition process. They ensure compositions meet organizational standards, comply with resource limits, and follow approval workflows before deployment.

## Policy Model

Each policy has the following structure:

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique policy identifier |
| `name` | String | Human-readable policy name |
| `description` | String | Detailed policy description |
| `rule` | Object | Policy rule definition with conditions and actions |
| `severity` | String | `critical`, `high`, `medium`, `low` |

Example policy:

```json
{
  "id": "max-ai-cost",
  "name": "Maximum AI Cost Per Composition",
  "description": "Ensures total AI provider cost does not exceed budget",
  "rule": {
    "condition": "composition.cost.ai > 100",
    "action": "warn"
  },
  "severity": "high"
}
```

## Constraints

Constraints define hard limits and validation rules:

| Constraint Type | Description | Example |
|---|---|---|
| **Resource** | CPU, memory, storage limits | `maxMemory: "2GB"` |
| **Cost** | Budget and cost thresholds | `maxCost: 100` |
| **Provider** | Allowed/blocked providers | `allowedProviders: ["openai"]` |
| **Version** | Version range requirements | `minVersion: "1.0.0"` |
| **Compatibility** | Module compatibility rules | `incompatibleWith: ["module-x"]` |
| **Security** | Security requirements | `requireEncryption: true` |

## Simulation (Dry-Run)

The `CompositionSimulation` engine enables risk-free validation:

1. Accept a composition definition
2. Execute all validation rules without side effects
3. Evaluate policy conditions against simulated state
4. Report warnings, errors, and recommendations
5. Return simulation results without modifying any state

Simulation stages:

| Stage | Output |
|---|---|
| Schema validation | Structural errors |
| Policy evaluation | Policy violations |
| Constraint validation | Constraint breaches |
| Compatibility check | Incompatibility warnings |
| Resource estimation | Projected resource usage |
| Cost estimation | Projected costs |
| Recommendations | Optimization suggestions |

## Approval Workflow

The `CompositionApproval` engine manages the approval lifecycle for compositions that require authorization:

### Flow

```
Composition Request
    ↓
Policy Evaluation → requires_approval?
    ├── No → Proceed to composition
    └── Yes → Approval Request
                ↓
            Approve/Reject
                ↓
            Notify Result
```

### States

| State | Description |
|---|---|
| **pending** | Approval request created, awaiting decision |
| **approved** | Request approved, composition can proceed |
| **rejected** | Request rejected with reason |
| **expired** | Request timed out without decision |

### API

- `request(compositionId, reason)` — Submit approval request
- `approve(requestId, approver)` — Approve a pending request
- `reject(requestId, approver, reason)` — Reject with reason
- `status(requestId)` — Check approval status
