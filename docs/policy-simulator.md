# Policy Simulation

## Overview

Risk-free what-if analysis for policy enforcement. The simulation engine evaluates policies against hypothetical data without executing any actions, making side-effect-free predictions about which policies would match, which actions would fire, and what the impact would be.

## Components

| Component | Responsibility |
|---|---|
| SimulationEngine | Manages simulation runs, coordinates evaluator and analyzer |
| SimulationRunner | Executes scenario-based simulations with parameterized data |
| ImpactAnalyzer | Analyzes simulation results for affected resources, blocked actions, cost impact, user impact |

## Simulation vs Real Execution

| Aspect | Simulation | Real Execution |
|---|---|---|
| Side effects | None — actions are analyzed but not applied | Actions are executed |
| Enforcement | All modes treated as audit (analyze only) | hard/soft/audit enforced |
| Data | Can use real data or hypothetical scenarios | Always uses real data |
| Approvals | Approvals are noted but not created | Approval workflows are created |
| Audit logging | Simulation events (not violations) | Full audit trail |
| Notifications | Suppressed | Sent to configured channels |

## Scenario System

Scenarios allow testing multiple policies with different data configurations in a single simulation run.

```json
{
  "scenarios": [
    {
      "id": "high-traffic",
      "name": "High Traffic Scenario",
      "data": {
        "ai.request.tokens": 150000,
        "billing.monthlySpend": 7500,
        "deployment.environment": "production"
      }
    },
    {
      "id": "cost-spike",
      "name": "Cost Spike Scenario",
      "data": {
        "billing.monthlySpend": 12000,
        "ai.request.tokens": 50000
      }
    }
  ]
}
```

## Impact Analysis

The ImpactAnalyzer produces a comprehensive report for each simulation:

```
{
  "scenarios": [
    {
      "id": "high-traffic",
      "summary": {
        "totalPolicies": 72,
        "matchedPolicies": 5,
        "blockedActions": 2,
        "warnings": 3,
        "costImpact": { "estimatedSavings": 2500, "currency": "USD" },
        "affectedResources": ["ai-request-queue", "billing-account"],
        "userImpact": { "affectedUsers": 15, "severity": "medium" }
      },
      "policyResults": [
        {
          "policyId": "ai-token-limit",
          "matched": true,
          "actionType": "deny",
          "wouldBlock": true,
          "severity": "high"
        }
      ]
    }
  ]
}
```

### Analysis Dimensions

| Dimension | Description |
|---|---|
| Affected Resources | Which system resources would be impacted |
| Blocked Actions | Which operations would be prevented |
| Cost Impact | Estimated cost savings or increases |
| User Impact | Number of affected users and severity |

## Batch Simulation

Run simulations against multiple data sets or policy configurations in a single call:

```
POST /api/v1/governance/simulate/batch
{
  "scenarios": [...],
  "policyFilter": { "types": ["ai", "billing"], "enabled": true }
}
```

## Scenario Comparison

Compare results across scenarios to understand how different conditions affect policy enforcement:

```
{
  "comparison": {
    "scenarios": ["baseline", "high-traffic", "cost-spike"],
    "metrics": {
      "matchedPolicies": { "baseline": 2, "high-traffic": 5, "cost-spike": 3 },
      "blockedActions": { "baseline": 0, "high-traffic": 2, "cost-spike": 1 },
      "costImpact": { "baseline": 0, "high-traffic": 2500, "cost-spike": 5000 }
    }
  }
}
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/v1/governance/simulate | Run single simulation |
| POST | /api/v1/governance/simulate/batch | Run batch simulations |
| GET | /api/v1/governance/simulate/:id | Get simulation results |
| GET | /api/v1/governance/simulate/:id/compare | Compare simulation scenarios |
| GET | /api/v1/governance/simulate/history | Simulation run history |
