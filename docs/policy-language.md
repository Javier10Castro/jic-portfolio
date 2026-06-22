# Policy DSL Reference

## Policy JSON Schema

```json
{
  "id": "string (unique identifier)",
  "name": "string (human-readable name)",
  "description": "string (detailed explanation)",
  "type": "string (ai|agent|workflow|deployment|billing|security|plugin|integration|developer|data)",
  "enforcement": "string (hard|soft|audit)",
  "severity": "string (critical|high|medium|low)",
  "enabled": "boolean",
  "conditions": [
    {
      "field": "string (dot-notation path)",
      "operator": "string (see operators below)",
      "value": "any (type depends on operator)"
    }
  ],
  "actions": [
    {
      "type": "string (deny|block|warn|notify|log|flag|quarantine|require_approval)",
      "message": "string (human-readable message)",
      "params": "object (optional: channel, target, timeout, etc.)"
    }
  ],
  "tags": ["string (optional categorization tags)"],
  "approval": {
    "workflowId": "string (optional, for require_approval actions)",
    "autoApprove": "boolean (optional, default false)"
  },
  "version": "number (auto-incremented)",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
}
```

## Condition Syntax

Each condition has three parts:
- **field** — Dot-notation path to the data value (e.g., `ai.request.tokens`, `user.role`, `deployment.environment`)
- **operator** — Comparison operator
- **value** — Comparison value (type depends on operator; some operators like `exists` do not require a value)

### Condition Operators

| Operator | Value Type | Description | Example |
|---|---|---|---|
| eq | any | Field equals value | `{ "field": "user.role", "operator": "eq", "value": "admin" }` |
| neq | any | Field does not equal value | `{ "field": "status", "operator": "neq", "value": "banned" }` |
| gt | number | Field greater than value | `{ "field": "cost.total", "operator": "gt", "value": 1000 }` |
| gte | number | Field greater than or equal | `{ "field": "usage.count", "operator": "gte", "value": 100 }` |
| lt | number | Field less than value | `{ "field": "tokens", "operator": "lt", "value": 50000 }` |
| lte | number | Field less than or equal | `{ "field": "deployments", "operator": "lte", "value": 5 }` |
| contains | any | Array/string contains value | `{ "field": "tags", "operator": "contains", "value": "production" }` |
| not_contains | any | Array/string does not contain value | `{ "field": "blocked_ips", "operator": "not_contains", "value": "10.0.0.1" }` |
| in | array | Field value is in array | `{ "field": "env", "operator": "in", "value": ["staging", "production"] }` |
| not_in | array | Field value is not in array | `{ "field": "provider", "operator": "not_in", "value": ["deprecated"] }` |
| exists | none | Field exists in data | `{ "field": "metadata.audit_id", "operator": "exists" }` |
| not_exists | none | Field does not exist | `{ "field": "error", "operator": "not_exists" }` |
| matches | string (regex) | Field matches regex pattern | `{ "field": "email", "operator": "matches", "value": "^.*@company.com$" }` |
| starts_with | string | Field starts with value | `{ "field": "deployment.name", "operator": "starts_with", "value": "prod-" }` |
| ends_with | string | Field ends with value | `{ "field": "file", "operator": "ends_with", "value": ".exe" }` |

## Action Syntax

Each action has:
- **type** — The action to take
- **message** — Human-readable explanation
- **params** (optional) — Additional configuration

### Action Types

| Type | Effect | Optional Params |
|---|---|---|
| deny | Reject request entirely | `channel`, `code` |
| block | Block specific operation | `channel`, `target` |
| warn | Allow with warning | `channel` |
| notify | Send notification | `channel`, `target`, `template` |
| log | Log occurrence | `channel`, `level` |
| flag | Flag for review | `channel`, `reviewQueue` |
| quarantine | Quarantine resource | `channel`, `quarantineScope` |
| require_approval | Require approval workflow | `workflowId`, `timeout` |

## Enforcement Modes

| Mode | Behavior | Typical Use |
|---|---|---|
| hard | Deny on violation, log, notify | Security, cost limits |
| soft | Warn, allow, log | Gradual policy rollout |
| audit | Allow, log only | Monitoring, tuning |

## Severity Levels

| Level | Description |
|---|---|
| critical | Immediate action required, system integrity at risk |
| high | Significant impact, should be addressed promptly |
| medium | Moderate impact, plan to address |
| low | Minor issue, informational |

## Tags

Tags provide free-form categorization. Common tags: `cost`, `security`, `compliance`, `production`, `staging`, `experimental`, `auto-remediation`.

## Approval Config

Policies with `require_approval` action can include:

```json
{
  "approval": {
    "workflowId": "deployment-approval",
    "autoApprove": false
  }
}
```

## Example Policies

### AI — Token Limit (hard enforcement)
```json
{
  "id": "ai-token-limit",
  "name": "AI Token Limit",
  "type": "ai",
  "enforcement": "hard",
  "severity": "high",
  "enabled": true,
  "conditions": [{ "field": "ai.request.tokens", "operator": "gt", "value": 100000 }],
  "actions": [{ "type": "deny", "message": "Token limit exceeded" }],
  "tags": ["cost", "limits"]
}
```

### Security — IP Whitelist (hard enforcement)
```json
{
  "id": "security-ip-whitelist",
  "name": "IP Whitelist",
  "type": "security",
  "enforcement": "hard",
  "severity": "critical",
  "enabled": true,
  "conditions": [{ "field": "request.ip", "operator": "not_in", "value": ["10.0.0.0/8", "172.16.0.0/12"] }],
  "actions": [{ "type": "deny", "message": "IP not whitelisted" }],
  "tags": ["security", "network"]
}
```

### Deployment — Production Approval (soft enforcement)
```json
{
  "id": "deploy-prod-approval",
  "name": "Production Deployment Approval",
  "type": "deployment",
  "enforcement": "soft",
  "severity": "high",
  "enabled": true,
  "conditions": [{ "field": "deployment.environment", "operator": "eq", "value": "production" }],
  "actions": [{ "type": "require_approval", "message": "Production deployment requires approval" }],
  "approval": { "workflowId": "deployment-approval" },
  "tags": ["deployment", "approval"]
}
```

### Billing — Monthly Spend Limit (hard enforcement)
```json
{
  "id": "billing-monthly-limit",
  "name": "Monthly Spend Limit",
  "type": "billing",
  "enforcement": "hard",
  "severity": "high",
  "enabled": true,
  "conditions": [{ "field": "billing.monthlySpend", "operator": "gt", "value": 5000 }],
  "actions": [{ "type": "deny", "message": "Monthly spend limit exceeded" }],
  "tags": ["billing", "cost"]
}
```

### Agent — Execution Timeout (hard enforcement)
```json
{
  "id": "agent-execution-timeout",
  "name": "Agent Execution Timeout",
  "type": "agent",
  "enforcement": "hard",
  "severity": "medium",
  "enabled": true,
  "conditions": [{ "field": "agent.executionTime", "operator": "gt", "value": 300000 }],
  "actions": [{ "type": "deny", "message": "Agent execution timeout exceeded" }],
  "tags": ["agent", "performance"]
}
```

## Compilation Process

The PolicyCompiler transforms declarative JSON policies into executable rule objects:

```
Declarative JSON → Parse & validate schema → Normalize field paths
  → Compile conditions (string operators → function references)
  → Compile actions (type strings → action handler lookups)
  → Assemble executable policy object → Return to PolicyRegistry
```

The compiled form resolves operator strings to optimized comparison functions and pre-computes field accessor paths for fast dot-notation resolution during evaluation.
