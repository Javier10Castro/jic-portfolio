# Workflow Execution Engine

## Architecture

The Workflow Execution Engine provides durable, resumable workflow execution with checkpoints, scheduling, retries, compensation, versioning, and execution history. It sits above the Multi-Agent Orchestrator as the execution runtime for all AI workflows.

```
User Request
     ↓
Workflow Engine
     ↓
Workflow Manager → Workflow Storage
     ↓
Execution Engine → Execution Graph
     ↓
Checkpoint Manager
     ↓
Agent Orchestrator (Multi-Agent System)
     ↓
AI Providers (AI Routing Layer)
     ↓
Generation Pipeline → Deployment
```

## Directory Structure

```
lib/workflows/
├── index.js                  # Entry point — 8 exported functions + all classes
├── workflowManager.js        # CRUD, lifecycle, versioning, orchestration
├── executionEngine.js        # DAG execution, parallel, conditional, loops
├── workflowDefinition.js     # JSON schema validation, typed steps
├── workflowStateMachine.js   # 10-state state machine with transitions
├── workflowEvents.js         # 11 event types, pub/sub, history
├── workflowStorage.js        # In-memory persistence layer
├── checkpointManager.js      # Auto-save/load/resume checkpoints
├── retryEngine.js            # Exponential/linear/fixed backoff, jitter
├── compensationEngine.js     # Undo deployment, persistence, artifacts
├── workflowVersioning.js     # Version tracking, migration, diff
├── workflowMetrics.js        # Execution duration, failures, retries
├── executionGraph.js         # DAG graph with visual output
└── scheduler/
    ├── scheduler.js          # Delayed + periodic execution
    ├── cronScheduler.js      # Cron-style scheduling
    └── queueManager.js       # Priority queue (critical/high/normal/low)
```

## State Machine

| State | Description | Transitions To |
|-------|-------------|----------------|
| CREATED | Workflow created | QUEUED, CANCELLED |
| QUEUED | Waiting for execution | RUNNING, CANCELLED, FAILED |
| RUNNING | Actively executing | WAITING, PAUSED, FAILED, COMPLETED, CANCELLED, RETRYING |
| WAITING | Waiting for external input | RUNNING, FAILED, CANCELLED |
| PAUSED | Temporarily stopped | RUNNING, CANCELLED, FAILED |
| FAILED | Execution failed | RETRYING, ROLLED_BACK, CANCELLED |
| RETRYING | Auto-retry in progress | RUNNING, FAILED, CANCELLED |
| COMPLETED | All steps succeeded | ROLLED_BACK |
| CANCELLED | Manually cancelled | — (terminal) |
| ROLLED_BACK | Compensation executed | — (terminal) |

## Supported Step Types

| Type | Description |
|------|-------------|
| `task` | Execute a handler function |
| `agent` | Execute an AI agent (uses AgentOrchestrator) |
| `parallel` | Execute branches concurrently |
| `conditional` | Branch based on condition evaluation |
| `foreach` | Iterate over a collection |
| `wait` | Delay execution |
| `subworkflow` | Execute a nested workflow definition |
| `noop` | No-op placeholder |

### Conditional Operators

`equals`, `notEquals`, `contains`, `gt`, `gte`, `lt`, `lte`, `exists`, `truthy`

## Checkpoint System

Automatic checkpoints are created after each completed step:

```json
{
  "id": "cp-a1b2c3d4-m5n6o7",
  "workflowId": "wf-1-a1b2c3",
  "timestamp": 1718800000000,
  "completedNodes": ["architect", "designer"],
  "currentNode": "developer",
  "errors": [],
  "outputs": { "architect": { ... } },
  "metadata": { "nodeCount": 2, "totalNodes": 5, "elapsed": 1234 }
}
```

## Retry Policies

| Policy | Description |
|--------|-------------|
| `exponential` | `baseDelay * 2^(attempt-1)` with optional jitter |
| `linear` | `baseDelay * attempt` |
| `fixed` | Constant `baseDelay` |
| `jitter` | Random 50% variation (enabled by default) |

Default: 3 retries, exponential backoff, 1s base delay, 60s max delay.

## API Endpoints

All mounted at `/api/v1/workflows/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows` | List workflows (filter by `status`, `type`) |
| GET | `/workflows/definitions` | List registered definitions |
| GET | `/workflows/:id` | Get workflow with execution result |
| POST | `/workflows` | Start a workflow `{ definitionId, input?, options? }` |
| POST | `/workflows/:id/pause` | Pause a running workflow |
| POST | `/workflows/:id/resume` | Resume a paused workflow |
| POST | `/workflows/:id/cancel` | Cancel a workflow |
| POST | `/workflows/:id/retry` | Retry a failed workflow |
| GET | `/workflows/:id/graph` | Get execution graph |
| GET | `/workflows/:id/events` | Get workflow events |
| GET | `/workflows/:id/checkpoints` | List checkpoints |

## Example Workflow Definition

```json
{
  "id": "website-generation",
  "name": "Website Generation",
  "type": "ai-pipeline",
  "version": 1,
  "steps": [
    { "id": "architect", "type": "agent", "agent": "architect", "params": { "description": "Design system architecture" } },
    { "id": "designer", "type": "agent", "agent": "designer", "dependsOn": "architect", "params": { "description": "Create visual design" } },
    { "id": "content", "type": "agent", "agent": "content", "dependsOn": "architect", "params": { "description": "Generate copy" } },
    {
      "id": "build-check", "type": "conditional",
      "dependsOn": ["designer", "content"],
      "condition": { "operator": "truthy", "field": "context.autoBuild" },
      "branches": {
        "true": [{ "id": "developer", "type": "agent", "agent": "developer", "params": {} }],
        "false": [{ "id": "wait-approval", "type": "wait", "duration": 300000 }]
      }
    },
    { "id": "review", "type": "agent", "agent": "reviewer", "dependsOn": "build-check", "params": {} },
    { "id": "qa", "type": "agent", "agent": "qa", "dependsOn": "review", "params": {} },
    { "id": "deploy", "type": "agent", "agent": "deployment", "dependsOn": "qa", "params": {} }
  ],
  "timeout": 3600000,
  "retryPolicy": { "maxRetries": 3, "backoff": "exponential", "baseDelay": 1000 }
}
```

## Execution Lifecycle

1. `createDefinition(def)` → registers workflow definition with versioning
2. `startWorkflow(defId, input)` → creates workflow record, queues execution
3. Execution engine builds DAG from steps, resolves dependencies
4. Ready nodes execute in parallel where possible
5. After each step: auto-checkpoint captures state
6. On completion: event emitted, metrics recorded
7. On failure: retry engine executes with configured policy
8. On final failure: compensation engine reverses completed steps
9. `resumeWorkflow(wfId)` → loads from checkpoint, continues from last completed node

## Compensation

When a workflow fails irrecoverably:

1. **Reverse order** — completed steps are undone in reverse execution order
2. **Registered compensators** — each step type can register a compensator function
3. **Built-in compensators**: undoDeployment, undoPersistence, undoGeneratedArtifacts
4. **Compensation record** — full audit trail of what was undone

## Scheduling

| Method | API | Description |
|--------|-----|-------------|
| Delayed | `scheduleDelayed(defId, delayMs, input)` | Execute after delay |
| Periodic | `schedulePeriodic(defId, intervalMs, input)` | Execute on interval |
| Cron | `cron.schedule(expression, defId)` | Execute on cron schedule |
| Priority | `queue.enqueue(defId, priority, input)` | critical > high > normal > low |

## Extension Guide

### Adding a new step type

1. Add type name to `STEP_TYPES` in `workflowDefinition.js`
2. Add validation rule in `_validateStep()`
3. Add handler case in `executionEngine._runStep()`

### Adding a new compensator

```js
const engine = require('./lib/workflows');
const mgr = engine.getWorkflowManager();
mgr.compensation.register('myStepType', async (step) => {
  // undo logic
  return { undone: true };
});
```

### Custom handler steps

Steps with type `task` can pass a `handler` function:
```js
{ id: 'custom', type: 'task', handler: async ({ context, outputs, params }) => {
  return { processed: true, result: params.value * 2 };
}}
```
