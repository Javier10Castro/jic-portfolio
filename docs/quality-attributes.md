# Quality Attributes — Phase 10.2.0

## Overview

The Quality Analyzer evaluates 7 quality attributes for each architecture solution. Each attribute is analyzed independently, then assessed for tradeoffs against the others. Results are visualized as a quality radar for stakeholder communication.

## Quality Attributes

| # | Attribute | Description | Measurement |
|---|---|---|---|
| 1 | **Availability** | System uptime and fault tolerance | % uptime, RTO, RPO |
| 2 | **Security** | Protection against threats and compliance | Risk score, compliance % |
| 3 | **Performance** | Response time and throughput | Latency (ms), throughput (rps) |
| 4 | **Scalability** | Ability to handle growth | Horizontal/vertical scaling factor |
| 5 | **Maintainability** | Ease of change and evolution | Cyclomatic complexity, cohesion |
| 6 | **Cost** | Development and operational expense | $/month, $/transaction |
| 7 | **Operability** | Monitoring, deployment, and operations | MTTR, deployment frequency |

## Analysis Methodology

### Availability

| Criterion | Assessment | Score |
|---|---|---|
| Fault tolerance | Redundancy, failover, replication | 0–10 |
| Disaster recovery | RTO < 1hr, RPO < 15min | 0–10 |
| SLI/SLO coverage | Measured SLIs with SLO targets | 0–10 |
| Circuit breakers | Bulkhead, timeout, retry patterns | 0–10 |

### Security

| Criterion | Assessment | Score |
|---|---|---|
| Authentication | MFA, SSO, OAuth 2.0 | 0–10 |
| Authorization | RBAC, ABAC, policy engine | 0–10 |
| Data protection | Encryption at rest and in transit | 0–10 |
| Compliance | SOC2, GDPR, HIPAA alignment | 0–10 |

### Performance

| Criterion | Assessment | Score |
|---|---|---|
| Response time | P50 < 200ms, P99 < 1s | 0–10 |
| Throughput | Handles peak load × 1.5 | 0–10 |
| Concurrency | Thread/connection pool optimization | 0–10 |
| Caching strategy | Multi-layer cache hit ratio > 80% | 0–10 |

### Scalability

| Criterion | Assessment | Score |
|---|---|---|
| Horizontal scaling | Stateless design, auto-scaling | 0–10 |
| Data scaling | Sharding, partitioning, read replicas | 0–10 |
| Load balancing | Distribution algorithms | 0–10 |
| Elasticity | Scale up/down within 30s | 0–10 |

### Maintainability

| Criterion | Assessment | Score |
|---|---|---|
| Code modularity | Module cohesion, coupling | 0–10 |
| Testability | Unit, integration, e2e coverage | 0–10 |
| Documentation | ADRs, API docs, runbooks | 0–10 |
| Observability | Logs, metrics, traces | 0–10 |

### Cost

| Criterion | Assessment | Score |
|---|---|---|
| Infrastructure | Compute, storage, network $ | 0–10 (inverted) |
| Development | Engineering effort estimate | 0–10 (inverted) |
| Operations | Monitoring, support, maintenance | 0–10 (inverted) |
| Licensing | Third-party and SaaS costs | 0–10 (inverted) |

### Operability

| Criterion | Assessment | Score |
|---|---|---|
| Deployment | CI/CD pipeline, blue/green | 0–10 |
| Monitoring | Dashboards, alerting, logging | 0–10 |
| Incident response | Runbooks, escalation, MTTR | 0–10 |
| Recovery | Automated rollback, self-healing | 0–10 |

## Tradeoff Analysis Between Attributes

Common tradeoff relationships:

| Tradeoff | Relationship | Typical Scenario |
|---|---|---|
| Availability ↔ Cost | ↑ Availability = ↑ Cost | Multi-region replication increases infrastructure cost |
| Performance ↔ Security | ↑ Security = ↓ Performance | Encryption overhead impacts latency |
| Scalability ↔ Maintainability | ↑ Scalability = ↓ Maintainability | Distributed systems harder to debug |
| Performance ↔ Cost | ↑ Performance = ↑ Cost | More/faster resources increase cost |
| Maintainability ↔ Performance | ↑ Maintainability = ↓ Performance | Abstraction layers add overhead |
| Security ↔ Maintainability | ↑ Security = ↓ Maintainability | Security controls add process complexity |

## Quality Radar

The quality radar visualizes attribute scores as a 7-axis spider chart:

```
            Availability
                │
          Cost ◄─┼──► Security
                │
      Performance◄─┼──► Scalability
                │
    Maintainability
        Operability
```

Each axis is scored 0–10. The radar reveals:
- **Balance** — Uniform vs skewed attribute coverage
- **Gaps** — Low-scoring attributes requiring attention
- **Tradeoffs** — Opposing attributes with inverse scores
- **Target zone** — Minimum acceptable score per attribute

## Output Format

```json
{
  "requestId": "arch-abc123",
  "attributes": {
    "availability": { "score": 8.5, "criteria": { "faultTolerance": 9, "disasterRecovery": 8, "sliSlo": 8, "circuitBreakers": 9 } },
    "security": { "score": 7.2, "criteria": { "authentication": 8, "authorization": 7, "dataProtection": 8, "compliance": 6 } },
    "performance": { "score": 6.8, "criteria": { "responseTime": 7, "throughput": 7, "concurrency": 6, "caching": 7 } },
    "scalability": { "score": 8.0, "criteria": { "horizontal": 9, "dataScaling": 8, "loadBalancing": 8, "elasticity": 7 } },
    "maintainability": { "score": 7.5, "criteria": { "modularity": 8, "testability": 8, "documentation": 7, "observability": 7 } },
    "cost": { "score": 6.0, "criteria": { "infrastructure": 6, "development": 5, "operations": 6, "licensing": 7 } },
    "operability": { "score": 8.2, "criteria": { "deployment": 9, "monitoring": 8, "incidentResponse": 8, "recovery": 8 } }
  },
  "tradeoffs": [
    { "attributeA": "availability", "attributeB": "cost", "impact": "High availability requires multi-region (cost +40%)" }
  ],
  "radar": { "average": 7.5, "min": 6.0, "max": 8.5 }
}
```
