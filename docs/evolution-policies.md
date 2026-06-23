# Evolution Policies

## Overview

Policies and constraints govern the evolution process to ensure safe, backward-compatible changes.

## Components

### EvolutionPolicies
Define and manage evolution policies:
- Named policies with rule sets
- Enable/disable individual policies
- Rule-based governance

### EvolutionConstraints
Constraint enforcement for evolution plans:
- **maxHours**: Maximum estimated hours for a plan
- **maxBreakingChanges**: Maximum allowed breaking changes
- Custom constraint types supported

### EvolutionSimulation
Simulates evolution plans before execution:
- Estimates total hours from plan actions
- Counts breaking changes
- Computes risk level (low/medium/high)
- Calculates success probability

### EvolutionValidator
Validates evolution plans:
- Checks required fields (type, improvements)
- Validates estimated hours (non-negative)
- Warns on excessive scope (>1000 hours suggests phasing)
- Returns structured errors and warnings

## Validation Rules

Plans must have a type or improvements defined.
Estimated hours must be non-negative.
Plans exceeding 1000 hours receive a phasing recommendation.
