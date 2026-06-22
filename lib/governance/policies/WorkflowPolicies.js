function createPolicies() {
  return [
    {
      id: "workflow-max-steps",
      name: "Workflow Max Steps",
      description: "Max steps per workflow",
      version: 1,
      type: "workflow",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["workflow", "steps", "limit"],
      conditions: [{ field: "workflow.steps.count", operator: "gt", value: 30 }],
      actions: [{ type: "deny", message: "Workflow steps exceed 30 limit" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "workflow-execution-timeout",
      name: "Workflow Execution Timeout",
      description: "Workflow timeout",
      version: 1,
      type: "workflow",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["workflow", "execution", "timeout"],
      conditions: [{ field: "workflow.execution.duration", operator: "gt", value: 600000 }],
      actions: [{ type: "deny", message: "Workflow execution duration exceeds 600,000ms timeout" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "workflow-max-parallel",
      name: "Workflow Max Parallel",
      description: "Max parallel branches",
      version: 1,
      type: "workflow",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["workflow", "parallel", "branches"],
      conditions: [{ field: "workflow.branches.parallel", operator: "gt", value: 10 }],
      actions: [{ type: "warn", message: "Workflow parallel branches exceed 10" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "workflow-retry-limit",
      name: "Workflow Retry Limit",
      description: "Max retry attempts",
      version: 1,
      type: "workflow",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["workflow", "retry", "limit"],
      conditions: [{ field: "workflow.retry.max_attempts", operator: "gt", value: 5 }],
      actions: [{ type: "deny", message: "Workflow retry attempts exceed 5" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "workflow-nesting-depth",
      name: "Workflow Nesting Depth",
      description: "Max nesting depth",
      version: 1,
      type: "workflow",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["workflow", "nesting", "depth"],
      conditions: [{ field: "workflow.steps.nesting_depth", operator: "gt", value: 5 }],
      actions: [{ type: "deny", message: "Workflow nesting depth exceeds 5" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "workflow-cost-limit",
      name: "Workflow Cost Limit",
      description: "Workflow execution cost cap",
      version: 1,
      type: "workflow",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["workflow", "cost", "limit"],
      conditions: [{ field: "workflow.cost.per_execution", operator: "gt", value: 2.0 }],
      actions: [{ type: "deny", message: "Workflow cost per execution exceeds $2.00" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "workflow-required-approval",
      name: "Workflow Required Approval",
      description: "Approval for high-cost workflows",
      version: 1,
      type: "workflow",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["workflow", "approval", "cost"],
      conditions: [{ field: "workflow.cost.estimated", operator: "gt", value: 10.0 }],
      actions: [{ type: "require_approval", message: "High-cost workflow requires approval" }],
      approval: { required: true, workflow: "workflow-cost-approval", approvers: ["finance-manager"] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "workflow-concurrent-executions",
      name: "Workflow Concurrent Executions",
      description: "Max concurrent executions",
      version: 1,
      type: "workflow",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["workflow", "concurrent", "executions"],
      conditions: [{ field: "workflow.execution.concurrent", operator: "gt", value: 50 }],
      actions: [{ type: "deny", message: "Workflow concurrent executions exceed 50" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
}

function getPolicy(id) {
  return createPolicies().find(p => p.id === id) || null;
}

function getPoliciesByType(type) {
  return createPolicies().filter(p => p.type === type);
}

module.exports = { createPolicies, getPolicy, getPoliciesByType };
