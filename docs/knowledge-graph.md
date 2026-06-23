# Knowledge Graph

## Overview

The Knowledge Graph is a graph-based data structure that stores entities and their relationships. It supports traversal, querying, and versioning to enable rich knowledge exploration.

## Components

### Entity Registry
- **register(type, name, attributes)** — Creates a new entity with unique ID
- **findByType(type)** — Returns all entities of a given type
- **update(id, attributes)** — Merges attributes into an existing entity

### Relationship Manager
- **define(sourceId, targetId, type, properties)** — Creates a directed relationship
- **findBySource / findByTarget** — Lists relationships by endpoint

### Graph Traversal
- **bfs(startId, maxDepth)** — Breadth-first search (returns visited nodes with depth)
- **dfs(startId, maxDepth)** — Depth-first search
- **findPath(fromId, toId)** — Shortest path via BFS
- **getNeighbors(nodeId)** — List of connected nodes with direction and relation type

### Graph Queries
- **findNodes(query)** — Filter nodes by property values
- **findSubgraph(nodeIds)** — Extract subgraph containing specified nodes
- **getConnectedComponents()** — Finds all disconnected subgraphs

### Graph Versioning
- **snapshot(graphState, label)** — Captures current graph state
- **diff(versionA, versionB)** — Computes added/removed nodes and edges
- **getLatest()** — Returns most recent version

## Graph Model

```
Entities → Nodes (typed with properties)
Relationships → Directed Edges (typed with properties)
Versions → Immutable snapshots of full graph state
```

## Edge Cases

- Self-referencing relationships are allowed
- Multiple relationships between same nodes are tracked separately
- Removing a node cascades to all incident edges
- Diff works across non-consecutive versions
