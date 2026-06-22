# Feature Flags

## Overview

Enterprise feature flag system with targeting rules, progressive rollouts, A/B experiments, and full audit trail.

## Components

- **Manager**: Flag lifecycle orchestration
- **Registry**: Flag CRUD and search
- **Evaluator**: Flag evaluation with context
- **Targeting**: Targeting rules with 8 operators
- **Rollouts**: Progressive rollouts (0-100%)
- **Experiments**: A/B experiment variants
- **Audit**: Flag change audit logging

## Flag Lifecycle

```
create → target → evaluate → rollout → experiment → audit
```

## Targeting Rules

Rules use field/operator/value triplets with 8 operators:
- `eq` (equals)
- `neq` (not equals)
- `contains`
- `not_contains`
- `starts_with`
- `ends_with`
- `in` (in list)
- `not_in` (not in list)

## Progressive Rollouts

Percentage-based rollouts using hash bucketing:
- 0-100% traffic shifting
- Consistent hashing ensures same user sees same variant
- Gradual increase with monitoring gates

## A/B Experiment Variants

- Multiple experiment variants per flag
- Variant allocation percentages
- Metric tracking per variant

## Audit Trail

- Every flag change is logged
- Timestamp, actor, previous value, new value
- Searchable audit history
