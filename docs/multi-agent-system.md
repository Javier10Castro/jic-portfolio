# Multi-Agent Orchestration System

## Architecture

The Multi-Agent System enables complex AI-powered workflows by coordinating 10 specialized agents through a DAG-based execution graph. Each agent is a specialized worker that performs a specific role in the website/app generation pipeline.

```
User Task → Agent Orchestrator → Execution Graph → Specialized Agents → Consensus Engine → Final Result
```

## Agents

| Agent | Role | Dependencies |
|-------|------|-------------|
| Architect | System architecture, technology stack, component design | — |
| Designer | Visual design system, layout, UI components | architect |
| Developer | Code generation, implementation | designer, content |
| Content | Copywriting, content strategy | architect, designer |
| SEO | Search engine optimization | developer, content |
| Accessibility | WCAG compliance, ARIA, semantic HTML | developer, content |
| Performance | Optimization, caching, bundling | developer |
| Deployment | Build config, CI/CD, hosting setup | developer |
| Reviewer | Code review, best practices, consistency | developer |
| QA | Testing strategy, test cases, quality gates | reviewer, deployment |

## Execution Flow

1. **Task Planning**: `taskPlanner.js` creates a DAG execution plan from the task definition, computing execution order and parallel groups based on agent dependencies.

2. **Dependency Resolution**: `dependencyResolver.js` maps each agent to its upstream dependencies and identifies parallel groups (e.g., SEO + Accessibility + Performance can run concurrently).

3. **DAG Execution**: `executionGraph.js` tracks node readiness, completion, and failure — supporting both sequential and parallel execution paths.

4. **Memory Management**:
   - `agentMemory.js` — per-agent store preserving execution history per session
   - `sharedMemory.js` — cross-agent artifact storage (output from one agent feeds into another)
   - `workingMemory.js` — execution state stack for tracking current phase/frame

5. **Coordination**:
   - `messageBus.js` — pub/sub messaging for inter-agent communication
   - `agentEvents.js` — typed event emission (agent.started, agent.completed, workflow.completed, etc.)
   - `consensusEngine.js` — resolves conflicting outputs by scoring options on confidence, performance, cost, and project type
   - `conflictResolver.js` — detects and resolves technology stack or architectural conflicts across agent outputs

6. **Workflow Modes**: sequential (default), parallel groups, single agent, review loop with QA gates

## Consensus Engine

When multiple agents produce conflicting outputs (e.g., Architect suggests React, Developer prefers Vue), the consensus engine resolves by scoring:

- Confidence ×30
- Performance ×15
- Cost ×−10
- Preferred approach ×+20
- Project type compatibility ×+10

The highest-scoring option is selected as the final decision.

## API

All agent endpoints are mounted at `/api/v1/agents/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents` | List all agents with metrics |
| GET | `/agents/:id` | Get agent details |
| POST | `/agents/run` | Execute a workflow |
| POST | `/agents/review` | Get review and QA results for a workflow |
| GET | `/agents/workflows` | List recent workflows |
| GET | `/agents/metrics` | Get aggregate agent metrics |
| POST | `/agents/cancel` | Cancel a running workflow |

### POST /agents/run

```json
{
  "task": {
    "type": "website",
    "description": "Landing page for a SaaS product",
    "requirements": {
      "framework": "react",
      "responsive": true
    }
  },
  "options": {
    "agents": ["architect", "designer", "developer", "reviewer", "qa"],
    "timeout": 30000,
    "retry": 2
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "workflowId": "wf-abc123",
    "agents": [
      { "name": "architect", "success": true, "output": { ... } }
    ],
    "review": { "passed": true, "score": 8.5 },
    "qa": { "passed": true, "score": 9.0 }
  }
}
```
