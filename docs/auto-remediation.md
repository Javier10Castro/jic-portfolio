# Auto-Remediation Engine — Phase 8.4.0

The Auto-Remediation Engine is the system's self-healing layer. It consumes intelligence insights, patterns, and anomalies via the EventBus, matches them against configurable policies, and executes remediation actions with safety guardrails.

## Architecture

```
EventBus (intelligence.* events)
    │
    ▼
RemediationEngine.ingest(event)
    │
    ├──► RemediationPolicies.evaluate(event)
    │       │
    │       ├── No match → skip
    │       └── Match
    │               ├── Approval required → create pending approval → emit remediation.approval.required
    │               └── Auto-execute
    │                       │
    │                       ▼
    │               RemediationActions.execute(actionKey, params)
    │                       │
    │                       ▼
    │               RemediationStore.addHistory(entry)
    │                       │
    │                       ▼
    │               emit remediation.action.executed
    │
    └──► Results returned to caller
```

## Components

### RemediationEngine (`lib/remediation/remediationEngine.js`)
Central orchestrator. Accepts events via `ingest(event)`, evaluates policies, executes actions, tracks history. Supports enable/disable, approval workflows, and custom `onAction` callbacks.

### RemediationActions (`lib/remediation/remediationActions.js`)
8 built-in actions, each with typed parameter schemas:

| Action | Category | Destructive | Reversible | Description |
|--------|----------|-------------|------------|-------------|
| `auto_scale` | scaling | no | yes | Adjust cluster worker count |
| `reroute_traffic` | routing | no | yes | Switch AI traffic to alternative provider |
| `retry_with_backoff` | recovery | no | no | Retry tasks with modified backoff |
| `isolate_node` | safety | yes | yes | Remove failing node from rotation |
| `circuit_breaker` | safety | no | yes | Open circuit for degraded service |
| `rate_limit` | traffic_management | no | yes | Throttle request rate |
| `restart_worker` | recovery | yes | no | Restart misbehaving worker |
| `notify` | alerting | no | no | Send alert/notification |

Custom actions can be registered via `actions.registerAction(key, handler, meta)`.

### RemediationPolicies (`lib/remediation/remediationPolicies.js`)
Policy definitions map intelligence events to actions. Each policy specifies:
- **match**: event types, rules, patterns, anomaly types, min confidence/priority, rate limiting per window
- **action**: which action to execute with parameter overrides
- **safety**: cooldown period, max actions/hour, approval requirement

7 default policies are loaded automatically:

| Policy | Trigger | Action | Approval Required |
|--------|---------|--------|-------------------|
| Auto-scale on Cluster Imbalance | `cluster_imbalance` pattern | `auto_scale` (up 2) | no |
| Reroute on Provider Degradation | `ai_provider_degradation` insight | `reroute_traffic` | no |
| Circuit Breaker on Latency Burst | `high_latency_burst` pattern | `circuit_breaker` | yes |
| Isolate Failing Node | `repeated_failures` pattern | `isolate_node` | yes |
| Retry on State Error | `state_transition_error` insight | `retry_with_backoff` | no |
| Rate Limit on Volume Spike | `volume_spike` anomaly | `rate_limit` | no |
| Notify on Critical Insight | Any critical insight | `notify` | no |

### RemediationStore (`lib/remediation/remediationStore.js`)
In-memory storage with optional JSON file persistence. Stores action history (bounded, default 1000 entries) and key-value state. Supports `toJSON()`/`fromJSON()` for serialization.

### RemediationAPI (`lib/remediation/remediationAPI.js`)
14 REST endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/remediation/health` | Engine health status |
| GET | `/api/v1/remediation/policies` | List policies |
| GET | `/api/v1/remediation/policies/:id` | Get policy by ID |
| POST | `/api/v1/remediation/policies` | Create policy |
| PUT | `/api/v1/remediation/policies/:id` | Update policy |
| DELETE | `/api/v1/remediation/policies/:id` | Delete policy |
| POST | `/api/v1/remediation/actions/execute` | Execute action manually |
| GET | `/api/v1/remediation/actions` | List registered actions |
| GET | `/api/v1/remediation/actions/:id` | Get action metadata |
| GET | `/api/v1/remediation/history` | Get action history |
| GET | `/api/v1/remediation/history/stats` | Get history statistics |
| GET | `/api/v1/remediation/approvals` | List pending approvals |
| POST | `/api/v1/remediation/approvals/:id/approve` | Approve pending action |
| POST | `/api/v1/remediation/approvals/:id/reject` | Reject pending action |

## EventBus Integration

The engine attaches via `attachToEventBus(eventBus, engine)` which subscribes to `*` wildcard and processes only `intelligence.*` events, skipping `remediation.*` events to prevent feedback loops.

## Safety Model

1. **Cooldown**: Each policy has a minimum interval between executions
2. **Rate limiting**: Max actions per hour per policy
3. **Approval gates**: Destructive actions (isolate, restart) require operator approval by default
4. **Max concurrent actions**: Configurable limit (default 10)
5. **Disable switch**: Engine can be disabled entirely
6. **Simulated mode**: Actions execute in simulated mode unless real handlers are registered

## Usage

```js
const { createRemediationEngine } = require('./lib/remediation');

const engine = createRemediationEngine({
  autoExecute: true,
  policies: { defaultPolicies: true },
});

// Connect to event bus
const { getEventBus } = require('./lib/events');
const bus = getEventBus();
const detach = require('./lib/remediation').attachToEventBus(bus, engine);

// Manual action execution
const result = await engine.actions.execute('auto_scale', {
  direction: 'up',
  amount: 2,
});
```
