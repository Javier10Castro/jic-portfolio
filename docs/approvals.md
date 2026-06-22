# Approval Workflows

## Overview

Multi-step approval workflows enable controlled policy enforcement. When a policy action type is `require_approval`, the system creates an approval request, routes it through configured approvers, and only proceeds with enforcement after approval is granted.

## Components

| Component | Responsibility |
|---|---|
| ApprovalManager | Central orchestrator — create, approve, reject, escalate requests |
| ApprovalWorkflow | Multi-step workflow definitions with ordered steps |
| ApprovalHistory | Immutable record of all approval events |
| ApprovalRules | Declarative routing rules that match policy types and context |

## Workflow Lifecycle

```
create request → route to approvers → approve/reject → advance workflow → complete
```

1. **Create request** — Triggered by policy action type `require_approval`
2. **Route to approvers** — ApprovalRules match the request to a workflow definition and assign step approvers
3. **Approve/reject** — Each designated approver can approve, reject, or escalate
4. **Advance workflow** — On approval, advance to next step or complete the workflow
5. **Complete** — All steps approved: enforcement proceeds. Any step rejected: enforcement denied

## Workflow Definitions

Named workflows with ordered steps:

```json
{
  "id": "deployment-approval",
  "name": "Deployment Approval Workflow",
  "steps": [
    {
      "order": 1,
      "name": "Team Lead Review",
      "approvers": ["team-leads"],
      "type": "any" 
    },
    {
      "order": 2,
      "name": "Security Review",
      "approvers": ["security-team"],
      "type": "any"
    }
  ]
}
```

Step types:
- `any` — Any designated approver can approve
- `all` — All designated approvers must approve
- `quorum` — Minimum N of M approvers must approve

## Approval Rules

Declarative matching determines which workflow applies:

| Rule Field | Description | Example |
|---|---|---|
| policyType | Match by policy type | `"security"` |
| enforcement | Match by enforcement mode | `"hard"` |
| severity | Match by severity level | `"critical"` |
| conditions | Context conditions | `{ "field": "deployment.env", "operator": "eq", "value": "production" }` |

### Routing Flow

```
ApprovalManager → findMatchingRules(policy, context) → select highest-priority match
  → load workflow definition → assign step approvers
  → create ApprovalRequest → notify first-step approvers
```

## Integration with Policy Enforcement

When PolicyExecutor encounters a matched policy with action type `require_approval`:

1. Policy execution is paused
2. ApprovalEngine.createRequest() is called with policy + context data
3. ApprovalRules route the request to the appropriate workflow
4. Approval request enters pending state
5. Designated approvers are notified
6. On complete approval: PolicyExecutor executes the action
7. On rejection: PolicyExecutor logs denial, action is blocked
