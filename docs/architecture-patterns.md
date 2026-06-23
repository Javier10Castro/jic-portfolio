# Architecture Patterns — Phase 10.2.0

## Overview

The Pattern Engine manages a catalog of architecture patterns, evaluates them against requirements, and selects the optimal pattern (or combination) for each solution. Each pattern includes scoring criteria, applicability rules, and integration guidelines.

## Pattern System

```
PatternEngine
    │
    ├── PatternCatalog           # Registered patterns with metadata
    ├── PatternScorer            # Multi-dimension scoring logic
    ├── PatternSelector          # Top-N selection with combination logic
    ├── PatternValidator         # Pattern applicability validation
    └── PatternCombiner          # Pattern combination rules engine
```

| Component | Purpose |
|---|---|
| **PatternCatalog** | Registry of all architecture patterns with metadata, constraints, and compatibility rules |
| **PatternScorer** | Scores patterns across 7 dimensions: fit, scalability, cost, complexity, maintainability, security, performance |
| **PatternSelector** | Selects top patterns and validates combinations for synergy |
| **PatternValidator** | Checks pattern constraints, exclusions, and compatibility |
| **PatternCombiner** | Manages valid pattern combinations with conflict resolution |

## Default Patterns

| # | Pattern | Type | Best For |
|---|---|---|---|
| 1 | **Layered** | Structural | Traditional enterprise apps, CRUD systems |
| 2 | **Hexagonal** | Structural | Domain-driven design, testable systems |
| 3 | **Event Driven** | Messaging | Real-time systems, microservices communication |
| 4 | **Microservices** | Distribution | Large-scale, independently deployable services |
| 5 | **Modular Monolith** | Structural | Teams transitioning to microservices |
| 6 | **Serverless** | Deployment | Event-driven workloads, variable scale |
| 7 | **Pipeline** | Processing | Data processing, CI/CD, ETL workflows |
| 8 | **AI Native** | AI Systems | LLM applications, agent systems, RAG pipelines |

### Pattern Details

| Pattern | Characteristics | Constraints |
|---|---|---|
| **Layered** | Presentation → Business → Persistence → Infrastructure | Not suitable for highly scalable systems |
| **Hexagonal** | Ports & adapters, domain isolation | Higher initial complexity |
| **Event Driven** | Async messaging, event sourcing, CQRS | Eventual consistency, debugging complexity |
| **Microservices** | Bounded contexts, independent deployment | Network overhead, distributed transactions |
| **Modular Monolith** | Module isolation, single deployment | Module boundary discipline required |
| **Serverless** | Function-as-a-Service, auto-scaling | Cold starts, execution timeout limits |
| **Pipeline** | Stage-based processing, transform steps | Linear processing, stage coupling |
| **AI Native** | Agent orchestration, RAG, model chaining | Model cost, latency, hallucination risks |

## Pattern Selection Process

```
1. Requirements Input
    │
2. Pattern Scoring (7 dimensions × weight)
    │
3. Top-N Selection (top 3 patterns)
    │
4. Compatibility Check
    │
5. Combination Scoring
    │
6. Final Selection (single or combined)
    │
7. Validation & Export
```

## Scoring Methodology

Each pattern is scored across 7 dimensions on a 0–10 scale:

| Dimension | Weight | Description |
|---|---|---|
| **Fit** | 25% | How well the pattern matches requirements |
| **Scalability** | 15% | Ability to scale horizontally/vertically |
| **Cost** | 10% | Development and operational cost efficiency |
| **Complexity** | 10% | Implementation and maintenance complexity (inverted) |
| **Maintainability** | 15% | Ease of maintenance and evolution |
| **Security** | 15% | Security posture and compliance alignment |
| **Performance** | 10% | Expected performance characteristics |

**Formula**: `total = Σ(dimension_score × weight)`

### Scoring Example

```
Dimensions:  Fit(8)  Scalability(6)  Cost(7)  Complexity(5)  Maintainability(8)  Security(7)  Performance(6)
Weights:     0.25   0.15           0.10     0.10           0.15                0.15         0.10

Total = 8×0.25 + 6×0.15 + 7×0.10 + 5×0.10 + 8×0.15 + 7×0.15 + 6×0.10
     = 2.0 + 0.9 + 0.7 + 0.5 + 1.2 + 1.05 + 0.6
     = 6.95 / 10.0
```

## Evaluation Criteria

| Criterion | Description | Weight Range |
|---|---|---|
| Requirement Coverage | Percentage of functional requirements addressed | 0.15–0.25 |
| Quality Attribute Fit | Alignment with availability, security, performance targets | 0.10–0.20 |
| Team Maturity | Team's experience with the pattern | 0.05–0.15 |
| Operational Readiness | Infrastructure and operational capability | 0.05–0.10 |
| Migration Complexity | Effort to adopt from current state | 0.05–0.10 |
| Ecosystem Support | Tooling, library, and community support | 0.05–0.10 |

## Output Format

```json
{
  "requestId": "arch-abc123",
  "selectedPatterns": [
    {
      "pattern": "hexagonal",
      "score": 7.8,
      "rationale": "Best fit for domain-driven requirements with testability focus"
    },
    {
      "pattern": "event-driven",
      "score": 6.5,
      "rationale": "Supplementary for async communication between bounded contexts"
    }
  ],
  "scores": {
    "layered": 5.2,
    "hexagonal": 7.8,
    "event-driven": 6.5,
    "microservices": 4.3,
    "modular-monolith": 6.1,
    "serverless": 3.8,
    "pipeline": 2.4,
    "ai-native": 5.9
  },
  "combination": {
    "primary": "hexagonal",
    "secondary": ["event-driven"],
    "compatible": true
  }
}
```
