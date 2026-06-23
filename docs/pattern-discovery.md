# Pattern Discovery

## Overview

The Pattern Discovery subsystem identifies reusable patterns, best practices, anti-patterns, success factors, and failure patterns from platform knowledge.

## Components

### Pattern Discovery
- **discover(name, sourceData, algorithm)** — Captures a discovered pattern from source data
- **findByName(name)** — Finds patterns by name

### Pattern Mining
- **mine(source, config)** — Performs frequency analysis on arrays of data
- Returns patterns with frequency count and confidence (count/source.length)
- Threshold: Only returns patterns with frequency > 1

### Best Practice Extractor
- **extract(name, source, evidence)** — Extracts a best practice with supporting evidence
- Confidence = min(1, evidence.length * 0.2)

### Anti-Pattern Detector
- **detect(name, sourceData, indicators)** — Records anti-pattern detection
- Severity: high (>3 indicators), medium (>1), low (≤1)

### Success Factors
- **identify(projectId, factors, metrics)** — Records success factors with metrics
- **topFactors(limit)** — Returns highest-scoring factors sorted by success rate

### Failure Patterns
- **record(projectId, failure, impact)** — Logs failure with severity and impact
- **commonPatterns(limit)** — Returns most frequent failure patterns with counts

## Scoring

| Component | Score Range | Thresholds |
|-----------|-------------|------------|
| Best Practice | 0-1 confidence | ≥0.6 recommended |
| Anti-Pattern | low/med/high severity | high requires action |
| Success Factor | 0-1 score | ≥0.7 significant |
| Failure Pattern | count frequency | ≥3 recurring |
