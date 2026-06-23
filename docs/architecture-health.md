# Architecture Health

## Overview

Architecture health is measured through 10 specialized analyzers providing scores from 0-1.

## Analyzers

| Analyzer | Measures | Key Thresholds |
|----------|----------|----------------|
| ArchitectureAnalyzer | Component structure, defects | Score drops per defect |
| DependencyAnalyzer | Circular deps, orphaned deps | Circular detected via DFS |
| ComplexityAnalyzer | Module cyclomatic complexity | 5-10 medium, >10 high |
| PerformanceAnalyzer | Latency, throughput, errors | Latency >2s, throughput <100 |
| SecurityAnalyzer | Finding severity counts | Critical, high, medium buckets |
| CostAnalyzer | Current vs projected cost | Negative savings flagged |
| MaintainabilityAnalyzer | Duplication, comments, test coverage | Dup >20%, coverage <50% |
| TechnicalDebtAnalyzer | Debt items, hours, categories | Based on estimated remediation |
| ScalabilityAnalyzer | Concurrency, horizontal scaling | Max concurrent <100 |
| AvailabilityAnalyzer | Uptime, recovery time, redundancy | Uptime <99.9%, recovery >60s |

## Scoring

Each analyzer produces a normalized score between 0 and 1:
- 1.0 = No issues found
- 0.8+ = Minor issues
- 0.5-0.8 = Moderate issues requiring attention
- <0.5 = Critical issues requiring immediate action

## Health Dashboard

The Architecture Center UI displays aggregate health scores, component counts, dependency health, debt levels, and optimization opportunities across 8 widget types.
