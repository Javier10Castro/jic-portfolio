# Recommendation Engine

## Overview

The Recommendation Engine generates contextual recommendations across architecture, workflow, and optimization domains using knowledge graph data and similarity matching.

## Components

### Recommendation Engine
- **generate(context, type, items)** — Creates a recommendation with priority
- Priority: high (>5 items), medium (>0), low (0)

### Context Matcher
- **register(id, contextData)** — Indexes a context profile
- **match(query, threshold)** — Returns contexts with similarity ≥ threshold (default 0.3)
- Text similarity uses word overlap; object similarity uses key matching

### Similar Project Finder
- **index(projectId, features)** — Indexes project features
- **findSimilar(query, limit)** — Returns top-N matches by similarity score
- Similar to ContextMatcher but project-specific

### Domain-Specific Recommenders
- **ArchitectureRecommendations** — Generate architecture improvement suggestions
- **WorkflowRecommendations** — Generate workflow optimization suggestions
- **OptimizationRecommendations** — Generate performance/cost optimization suggestions

## Recommendation Flow

```
Project Context → Context Matcher → Similar Projects → Domain Recommenders
                                                           ↓
                                              Ranked Recommendations
```

## Priority Levels

| Level | Criteria |
|-------|----------|
| High | >5 items or >3 suggestions |
| Medium | 1-5 items or 1-3 suggestions |
| Low | 0 items |
