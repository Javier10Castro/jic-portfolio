# Application Graph

## Overview

The Application Graph models the structural relationships between all components in a composed application. It represents applications as directed graphs where nodes are discrete modules (services, APIs, agents, etc.) and edges define dependency, containment, and communication relationships.

## Graph Model

The graph is composed of **nodes** and **edges**:

- **Nodes**: Represent individual application components
- **Edges**: Represent relationships between nodes (directional)

### Node Structure

```json
{
  "id": "node-1",
  "type": "service",
  "name": "User Service",
  "metadata": {
    "version": "1.0.0",
    "provider": "internal"
  }
}
```

### Edge Structure

```json
{
  "source": "node-1",
  "target": "node-2",
  "type": "depends_on",
  "metadata": {
    "optional": false
  }
}
```

## Node Types

| Type | Description | Examples |
|---|---|---|
| **module** | Reusable functional unit | Capability module, library |
| **service** | Independent deployable service | User service, payment service |
| **API** | API endpoint or gateway | REST API, GraphQL endpoint |
| **agent** | AI agent with specific role | Chat agent, analysis agent |
| **workflow** | Multi-step orchestration | Onboarding workflow, order flow |
| **storage** | Data persistence layer | Database, cache, blob store |
| **security** | Security module | Auth provider, encryption module |

## Edge Types

| Type | Description |
|---|---|
| **depends_on** | Source node depends on target node (directional) |
| **contains** | Source node contains target node (composition) |
| **communicates_with** | Source node communicates with target node (bidirectional) |

## Topology Building

The `ApplicationTopology` builder constructs the graph from application definitions:

1. Parse application blueprint for all component references
2. Create nodes for each unique component
3. Create edges based on declared dependencies
4. Create containment edges for nested components
5. Create communication edges for inter-component messaging
6. Validate graph integrity (no dangling references)

## Dependency Resolution

The `DependencyResolver` processes the graph to determine execution order:

1. **Topological Sort**: Order nodes so each node appears after its dependencies
2. **Cycle Detection**: Detect and report circular dependencies using DFS
3. **Validation**: Ensure all dependency targets exist and are compatible
4. **Parallel Groups**: Identify nodes that can execute in parallel (no transitive dependencies)

### Cycle Detection

The resolver uses depth-first search with three node states:

- **unvisited**: Not yet processed
- **visiting**: Currently in the DFS stack (cycle detected)
- **visited**: Fully processed

A cycle is detected when a `visiting` node is encountered during traversal.

### Topological Sort

Kahn's algorithm produces a valid execution order:

1. Compute in-degree for all nodes
2. Enqueue nodes with in-degree 0
3. Process queue, decrementing in-degree of neighbors
4. Repeat until all nodes processed or cycle detected

## Adjacency Lists

The graph maintains adjacency lists for efficient traversal:

- **forward edges**: `node → [dependents]` — who depends on this node
- **reverse edges**: `node → [dependencies]` — who this node depends on

This enables O(1) lookup of both dependency and dependent relationships, supporting efficient topological sort, impact analysis, and change propagation.
