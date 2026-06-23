# System Topology — Phase 10.2.0

## Overview

The Topology Generator produces multi-view graph representations of the architecture. Each view exposes a different perspective — components, services, dependencies, agents, workflows, infrastructure, and layered organization — enabling comprehensive understanding of the system structure.

## Topology Generation

```
TopologyGenerator
    │
    ├── ComponentGraph          # Component-level architecture view
    ├── ServiceGraph            # Service boundaries and interactions
    ├── DependencyGraph         # Dependency and data flow analysis
    ├── AgentGraph              # AI agent topology and communication
    ├── WorkflowGraph           # Business and system workflows
    ├── InfrastructureGraph     # Deployment and infrastructure mapping
    └── LayeredView             # Cross-cutting layered perspective
```

| Component | Purpose |
|---|---|
| **ComponentGraph** | Maps architectural components with their interfaces and relationships |
| **ServiceGraph** | Shows service boundaries, API contracts, and inter-service communication |
| **DependencyGraph** | Identifies all dependencies with direction and type (compile, runtime, data) |
| **AgentGraph** | Visualizes AI agent topology, delegation, and communication channels |
| **WorkflowGraph** | Represents business and system workflow stages and transitions |
| **InfrastructureGraph** | Maps deployment targets, network topology, and infrastructure services |
| **LayeredView** | Organizes all elements into presentation, application, domain, and infrastructure layers |

## Component Graphs

Component graphs represent the structural building blocks of the system:

```json
{
  "type": "component",
  "nodes": [
    { "id": "order-service", "type": "service", "name": "Order Service", "layer": "application" },
    { "id": "payment-gateway", "type": "component", "name": "Payment Gateway", "layer": "domain" },
    { "id": "notification-queue", "type": "infrastructure", "name": "Notification Queue", "layer": "infrastructure" }
  ],
  "edges": [
    { "source": "order-service", "target": "payment-gateway", "type": "calls", "protocol": "gRPC" },
    { "source": "order-service", "target": "notification-queue", "type": "publishes", "protocol": "async" }
  ]
}
```

## Service Graphs

Service graphs focus on service boundaries and API interactions:

| Node Property | Description |
|---|---|
| `id` | Unique service identifier |
| `name` | Human-readable service name |
| `boundary` | bounded-context, subdomain, or external |
| `protocols` | REST, gRPC, GraphQL, async events |
| `ownedBy` | Team or domain owner |

## Dependency Graphs

Dependency graphs capture all dependency relationships:

| Dependency Type | Description | Visual |
|---|---|---|
| `compile` | Compile-time dependency | Solid line |
| `runtime` | Runtime service dependency | Dashed line |
| `data` | Data/store dependency | Dotted line |
| `event` | Event/message dependency | Arrow with circle |
| `infrastructure` | Infrastructure dependency | Dash-dot line |

## Agent Graphs

Agent graphs are specific to AI-native architectures:

```json
{
  "type": "agent",
  "nodes": [
    { "id": "orchestrator-agent", "role": "orchestrator", "model": "gpt-4", "capabilities": ["planning", "delegation"] },
    { "id": "research-agent", "role": "worker", "model": "gpt-4", "capabilities": ["web-search", "summarization"] },
    { "id": "code-agent", "role": "worker", "model": "claude-3", "capabilities": ["code-generation", "review"] }
  ],
  "edges": [
    { "source": "orchestrator-agent", "target": "research-agent", "type": "delegates", "protocol": "agent-to-agent" },
    { "source": "orchestrator-agent", "target": "code-agent", "type": "delegates", "protocol": "agent-to-agent" }
  ],
  "communication": {
    "pattern": "hierarchical",
    "protocol": "agent-message-bus"
  }
}
```

## Workflow Graphs

Workflow graphs represent system orchestration and business processes:

| Element | Description |
|---|---|
| `stage` | A named workflow step |
| `transition` | Condition/event that triggers next stage |
| `gateway` | Branching, merge, or parallel split |
| `timer` | Scheduled or timeout-based triggers |
| `error` | Error handling and compensation paths |

## Infrastructure Graphs

Infrastructure graphs map the deployment topology:

| Element | Description |
|---|---|
| `region` | Geographic deployment region |
| `cluster` | Container orchestration cluster |
| `service` | Deployed service or function |
| `dataStore` | Database, cache, or storage |
| `network` | VPC, subnet, load balancer, gateway |

## Layered Topology Views

The layered view organizes all elements into 4 standard layers:

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                  │
│  UI Components  │  API Gateway  │  CDN       │
├─────────────────────────────────────────────┤
│           Application Layer                  │
│  Services  │  Workflows  │  Orchestration   │
├─────────────────────────────────────────────┤
│           Domain Layer                       │
│  Domain Models  │  Business Logic  │  Events │
├─────────────────────────────────────────────┤
│           Infrastructure Layer               │
│  Databases  │  Queues  │  Caches  │  Storage │
└─────────────────────────────────────────────┘
```

Each layer enforces dependency direction — upper layers may depend on lower layers, but not vice versa.

## Output Format

```json
{
  "requestId": "arch-abc123",
  "graphs": {
    "component": { "nodes": 24, "edges": 38 },
    "service": { "nodes": 12, "edges": 18 },
    "dependency": { "nodes": 24, "edges": 52 },
    "agent": { "nodes": 5, "edges": 8 },
    "workflow": { "stages": 7, "transitions": 10 },
    "infrastructure": { "regions": 2, "clusters": 4, "services": 12 }
  },
  "layeredView": {
    "presentation": ["api-gateway", "web-app", "cdn"],
    "application": ["order-service", "user-service", "payment-service"],
    "domain": ["order-domain", "payment-domain", "user-domain"],
    "infrastructure": ["postgres", "redis", "kafka", "s3"]
  }
}
```
