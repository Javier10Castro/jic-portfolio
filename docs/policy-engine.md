# Policy Engine

## Overview

The GovernanceManager orchestrates 12 core modules that form the backbone of the Enterprise Policy & Governance Platform. The policy engine handles the full policy lifecycle from creation through enforcement and auditing.

## Modules

| Module | Responsibility |
|---|---|
| PolicyRegistry | CRUD operations — register, unregister, get, list, search, count |
| PolicyCompiler | Compile declarative JSON policies into executable rule sets |
| PolicyEvaluator | Evaluate compiled conditions against runtime data using 16 operators |
| PolicyExecutor | Execute matched policy actions — deny, block, warn, notify, log, flag, quarantine, require_approval |
| PolicyStorage | Namespaced key-value persistence layer |
| PolicyEvents | 20 event types (POLICY_CREATED, POLICY_VIOLATION, COMPLIANCE_SCAN, etc.) |
| PolicyMetrics | Metric recording and aggregation |
| PolicyScheduler | Scheduled policy evaluation and compliance scans |
| PolicySimulator | Side-effect-free policy simulation |
| PolicyReporter | Report generation with JSON/CSV export |

## Policy Lifecycle

```
create → register → compile → evaluate → execute → audit
```

1. **Create** — Define policy as JSON document (conditions + actions)
2. **Register** — Store in PolicyRegistry with versioning
3. **Compile** — PolicyCompiler transforms declarative JSON into executable rules
4. **Evaluate** — PolicyEvaluator checks compiled rules against runtime data
5. **Execute** — PolicyExecutor applies the matched action (deny/warn/audit/require_approval)
6. **Audit** — AuditEngine records the evaluation and execution result

## Condition Operators

| Operator | Description | Example |
|---|---|---|
| eq | Equals | `{ "field": "user.role", "operator": "eq", "value": "admin" }` |
| neq | Not equals | `{ "field": "status", "operator": "neq", "value": "banned" }` |
| gt | Greater than | `{ "field": "cost.total", "operator": "gt", "value": 1000 }` |
| gte | Greater than or equal | `{ "field": "usage.count", "operator": "gte", "value": 100 }` |
| lt | Less than | `{ "field": "tokens", "operator": "lt", "value": 50000 }` |
| lte | Less than or equal | `{ "field": "deployments", "operator": "lte", "value": 5 }` |
| contains | Array/string contains | `{ "field": "tags", "operator": "contains", "value": "production" }` |
| not_contains | Array/string does not contain | `{ "field": "blocked_ips", "operator": "not_contains", "value": user.ip }` |
| in | Value in array | `{ "field": "env", "operator": "in", "value": ["staging", "production"] }` |
| not_in | Value not in array | `{ "field": "provider", "operator": "not_in", "value": ["deprecated"] }` |
| exists | Field exists | `{ "field": "metadata.audit_id", "operator": "exists" }` |
| not_exists | Field does not exist | `{ "field": "error", "operator": "not_exists" }` |
| matches | Regex match | `{ "field": "email", "operator": "matches", "value": "^.*@company.com$" }` |
| starts_with | String starts with | `{ "field": "deployment.name", "operator": "starts_with", "value": "prod-" }` |
| ends_with | String ends with | `{ "field": "file", "operator": "ends_with", "value": ".exe" }` |

## Action Types

| Action | Description | Effect |
|---|---|---|
| deny | Reject request entirely | Request blocked + violation logged |
| block | Block specific operation | Operation prevented, parent flow continues |
| warn | Allow with warning | Warning attached to response, logged |
| notify | Send notification | Notification dispatched, request proceeds |
| log | Log occurrence | Entry written to audit log, request proceeds |
| flag | Flag for review | Item marked, review workflow triggered |
| quarantine | Quarantine resource | Resource isolated pending review |
| require_approval | Require approval | Approval workflow created, request pending |

## Enforcement Modes

| Mode | Behavior | Use Case |
|---|---|---|
| hard | Deny on violation, always enforce | Security policies, spend limits |
| soft | Warn on violation, allow with warning | Migration periods, testing |
| audit | Allow always, log only | Observability, policy tuning |

## Example Policy

```json
{
  "id": "ai-max-tokens",
  "name": "AI Max Tokens Per Request",
  "description": "Limits AI token usage per request to prevent runaway costs",
  "type": "ai",
  "enforcement": "hard",
  "severity": "high",
  "enabled": true,
  "conditions": [
    {
      "field": "ai.request.tokens",
      "operator": "gt",
      "value": 100000
    }
  ],
  "actions": [
    {
      "type": "deny",
      "message": "Token limit exceeded: max 100,000 tokens per request"
    }
  ],
  "tags": ["cost", "ai", "limits"],
  "version": 1
}
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/v1/governance/policies | Create policy |
| GET | /api/v1/governance/policies | List policies |
| GET | /api/v1/governance/policies/:id | Get policy |
| PUT | /api/v1/governance/policies/:id | Update policy |
| DELETE | /api/v1/governance/policies/:id | Delete policy |
| PUT | /api/v1/governance/policies/:id/toggle | Enable/disable policy |
| POST | /api/v1/governance/evaluate | Evaluate policies against data |
| POST | /api/v1/governance/execute | Execute matched policies |
