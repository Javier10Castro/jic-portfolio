# Enterprise Policy & Governance Platform

## Overview

Centralized policy engine governing all subsystems. Policies are declarative, versioned, auditable, enforceable, and support simulation mode for what-if analysis. The platform provides a single control point for defining, evaluating, enforcing, and auditing policies across AI routing, agents, workflows, deployments, billing, security, plugins, integrations, developer operations, and data.

## Architecture

46 modules across 9 subdirectories:

- **Core** — GovernanceManager, PolicyRegistry, PolicyCompiler, PolicyEvaluator, PolicyExecutor
- **Policies** — 72 default policies across 10 types (AI, Agent, Workflow, Deployment, Billing, Security, Plugin, Integration, Developer, Data)
- **Rule Engine** — RuleEngine, ConditionParser, ExpressionEvaluator, ConstraintEngine
- **Approvals** — ApprovalEngine, ApprovalManager, ApprovalWorkflow, ApprovalHistory, ApprovalRules
- **Compliance** — ComplianceEngine, ComplianceScanner, ComplianceReports, ComplianceTemplates
- **Audit** — AuditEngine, AuditTimeline, AuditRetention
- **Versioning** — PolicyVersioning, PolicyDiff, PolicyRollback
- **Simulation** — SimulationEngine, SimulationRunner, ImpactAnalyzer
- **Integration** — GovernanceIntegration (12 check* methods for AI Router subsystem integration)

## Key Concepts

- **Declarative Policies**: Policies are defined as JSON documents with a conditions/actions structure
- **Policy DSL**: JSON schema with dot-notation field references, 16 condition operators, 8 action types, 3 enforcement modes
- **Enforcement Modes**: hard (deny + log violation), soft (warn + allow + log), audit (allow + log)
- **Severity Levels**: critical, high, medium, low
- **Approval Workflows**: Multi-step approval workflows with routing rules, triggered by `require_approval` action type
- **Simulation Mode**: Side-effect-free policy evaluation for what-if analysis

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Enterprise Governance Platform                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ Policy  │ │  Rule    │ │Approval  │ │    Compliance      │  │
│  │ Engine  │ │  Engine  │ │Engine    │ │    Engine          │  │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘  │
│       │           │             │                │              │
│  ┌────┴────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────────┴───────────┐  │
│  │Simulant│ │  Audit   │ │Versioning│ │    Integration      │  │
│  │Engine  │ │  Engine  │ │          │ │     Layer           │  │
│  └────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Policy Evaluation Pipeline

```
Request → GovernanceManager → PolicyRegistry.getAll(enabled=true)
  → PolicyEvaluator.evaluateAll(compiled, data)
    → [matched/not_matched per policy]
      → PolicyExecutor.canExecute(matched)
        → if hard: deny + log violation
        → if soft: warn + allow + log
        → if audit: allow + log
        → if requires_approval: create approval request + pending
```

## Simulation Flow

```
SimulateRequest → SimulationEngine → PolicyEvaluator (side-effect free)
  → ImpactAnalyzer → {affected, blocked, warnings, costImpact, summary}
```

## Policy Types & Default Policies

| Policy Type | Count | Description |
|---|---|---|
| AI | 10 | Token limits, provider restrictions, model versions |
| Agent | 8 | Agent capabilities, memory limits, execution timeouts |
| Workflow | 8 | Max steps, allowed step types, timeout limits |
| Deployment | 8 | Environment restrictions, approval gates, rollback policy |
| Billing | 7 | Spending limits, invoice thresholds, credit usage |
| Security | 8 | IP whitelisting, MFA enforcement, session duration |
| Plugin | 8 | Plugin allowlist, permissions, version pinning |
| Integration | 7 | Connection limits, sync frequency, data scope |
| Developer | 7 | API rate limits, key rotation, SDK version requirements |
| Data | 8 | Retention periods, export controls, anonymization rules |

## API Endpoints

16 endpoints at `/api/v1/governance/` covering policy CRUD, evaluation, compliance scans, approval workflows, simulation, versioning, and reporting.

## UI

Governance Center UI with 7 tabs: Overview, Policies, Compliance, Approvals, Audit, Simulation, Reports. 7 dashboard widgets for key metrics.

## Integration

GovernanceIntegration provides 12 `check*` methods covering all subsystems: AI Routing, Agents, Workflows, Billing, Developer, Plugin, Marketplace, Integration, Security, Deployments, Evaluation, Data.

## Plugin SDK

Extensions available via Plugin SDK: PolicyProvider (custom policies), ComplianceTemplate (custom report templates), ApprovalRule (custom routing rules).
