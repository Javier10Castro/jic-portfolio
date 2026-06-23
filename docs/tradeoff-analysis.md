# Tradeoff Analysis — Phase 10.2.0

## Overview

The Tradeoff Analyzer evaluates architecture solutions across 5 analysis dimensions: requirements, constraints, risks, tradeoffs, and quality attributes. It provides structured analysis and decision support to guide architecture selection.

## Analysis Dimensions

```
TradeoffAnalyzer
    │
    ├── RequirementsAnalysis   # Functional and non-functional requirements evaluation
    ├── ConstraintAnalysis     # Technical, business, and regulatory constraints
    ├── RiskAnalysis           # Risk identification, assessment, and mitigation
    ├── TradeoffAnalysis       # Multi-option comparative tradeoff evaluation
    ├── QualityAnalysis        # Quality attribute scoring and radar
    └── DecisionSupport        # Recommendation with rationale
```

## Requirements Analysis

Evaluates how well each architecture option satisfies functional and non-functional requirements:

| Criterion | Description | Score |
|---|---|---|
| Functional coverage | % of functional requirements satisfied | 0–10 |
| NFR alignment | Performance, security, availability targets met | 0–10 |
| Requirement conflicts | Number of conflicting requirements identified | Count |
| Coverage gaps | Requirements not addressed by any option | List |

```json
{
  "type": "requirements",
  "functionalCoverage": 92,
  "nfrAlignment": 85,
  "conflicts": [
    { "requirementA": "Low latency", "requirementB": "End-to-end encryption", "description": "Encryption adds ~50ms latency per request" }
  ],
  "gaps": ["Real-time analytics dashboard"],
  "recommendations": ["Consider eventual consistency for analytics"]
}
```

## Constraint Analysis

Identifies and evaluates technical, business, and regulatory constraints:

| Constraint Type | Examples | Impact |
|---|---|---|
| **Technical** | Existing tech stack, legacy integration, platform limitations | Option elimination or modification |
| **Business** | Budget, timeline, team size, expertise | Priority adjustment |
| **Regulatory** | GDPR, SOC2, HIPAA, data residency | Mandatory requirements |
| **Operational** | On-call rotation, deployment window, SLAs | Architecture simplification |

```json
{
  "type": "constraints",
  "technical": [
    { "constraint": "Must use AWS", "impact": "Azure-only services excluded", "severity": "blocking" }
  ],
  "business": [
    { "constraint": "Budget < $10k/month infra", "impact": "Multi-region active-active excluded", "severity": "high" }
  ],
  "regulatory": [
    { "constraint": "Data must stay in EU", "impact": "EU region required, US replication restricted", "severity": "blocking" }
  ]
}
```

## Risk Analysis Methodology

Risks are assessed by likelihood and impact:

| Risk Score | Likelihood × Impact | Action |
|---|---|---|
| **Critical** (15–25) | High × High | Must mitigate before proceeding |
| **High** (10–14) | Medium × High or High × Medium | Mitigation plan required |
| **Medium** (5–9) | Low × High or Medium × Medium | Monitor with contingency |
| **Low** (1–4) | Low × Low or Low × Medium | Accept and track |

### Risk Matrix

| Impact ↓ / Likelihood → | Low (1) | Medium (2) | High (3) |
|---|---|---|---|
| **Low (1)** | 1 | 2 | 3 |
| **Medium (2)** | 2 | 4 | 6 |
| **High (3)** | 3 | 6 | 9 |

```json
{
  "type": "risks",
  "risks": [
    {
      "id": "risk-001",
      "description": "Third-party payment provider API rate limiting during peak load",
      "likelihood": 2,
      "impact": 3,
      "score": 6,
      "level": "high",
      "mitigation": "Implement client-side rate limiting with queue and retry",
      "owner": "payment-team"
    }
  ]
}
```

## Tradeoff Analysis Framework

Compares multiple architecture options across a common set of criteria:

```
Option A ──┬── Requirements Fit: 8
           ├── Constraint Compliance: 7
           ├── Risk Score: 4 (low)
           ├── Quality Average: 7.2
           └── Cost Index: 6

Option B ──┬── Requirements Fit: 9
           ├── Constraint Compliance: 5
           ├── Risk Score: 7 (high)
           ├── Quality Average: 8.1
           └── Cost Index: 4
```

```json
{
  "type": "tradeoff",
  "options": [
    {
      "option": "Hexagonal + Event-Driven",
      "scores": { "requirementsFit": 8, "constraintCompliance": 7, "riskScore": 4, "qualityAvg": 7.2, "costIndex": 6 },
      "totalWeighted": 7.1
    },
    {
      "option": "Microservices + CQRS",
      "scores": { "requirementsFit": 9, "constraintCompliance": 5, "riskScore": 7, "qualityAvg": 8.1, "costIndex": 4 },
      "totalWeighted": 6.8
    }
  ],
  "recommendation": "Hexagonal + Event-Driven",
  "rationale": "Better constraint compliance and lower risk outweigh marginal quality gain of microservices"
}
```

## Quality Attribute Analysis

Evaluates each option against the 7 quality attributes (see [Quality Attributes](quality-attributes.md)):

| Option | Availability | Security | Performance | Scalability | Maintainability | Cost | Operability |
|---|---|---|---|---|---|---|---|
| Hexagonal + Event-Driven | 7.5 | 7.0 | 6.5 | 8.0 | 8.5 | 6.5 | 7.5 |
| Microservices + CQRS | 8.5 | 7.5 | 7.0 | 9.0 | 5.0 | 4.0 | 6.0 |
| Modular Monolith | 6.0 | 6.5 | 8.0 | 5.0 | 8.0 | 8.0 | 8.5 |

## Decision Support

Produces a final recommendation with structured rationale:

```json
{
  "requestId": "arch-abc123",
  "recommendation": {
    "option": "Hexagonal + Event-Driven",
    "confidence": 0.85,
    "rationale": "Best overall balance of requirements fit, constraint compliance, and manageable risk",
    "keyDecisions": [
      { "decision": "Adopt hexagonal architecture for core domain services", "adr": "adr-001" },
      { "decision": "Use event-driven messaging for cross-domain communication", "adr": "adr-002" }
    ],
    "actionItems": [
      "Define port interfaces for payment gateway integration",
      "Set up event schema registry"
    ]
  },
  "analysis": {
    "requirements": { ... },
    "constraints": { ... },
    "risks": { ... },
    "tradeoffs": { ... },
    "quality": { ... }
  }
}
```
