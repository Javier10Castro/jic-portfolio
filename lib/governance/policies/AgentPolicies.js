function createPolicies() {
  return [
    {
      id: "agent-max-instances",
      name: "Agent Max Instances",
      description: "Max concurrent agent instances",
      version: 1,
      type: "agent",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["agent", "instances", "concurrency"],
      conditions: [{ field: "agent.instances.count", operator: "gt", value: 20 }],
      actions: [{ type: "deny", message: "Concurrent agent instances exceed 20" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "agent-execution-timeout",
      name: "Agent Execution Timeout",
      description: "Agent max execution time",
      version: 1,
      type: "agent",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["agent", "execution", "timeout"],
      conditions: [{ field: "agent.execution.duration", operator: "gt", value: 300000 }],
      actions: [{ type: "deny", message: "Agent execution duration exceeds 300,000ms timeout" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "agent-tool-restriction",
      name: "Agent Tool Restriction",
      description: "Limit agent tool access",
      version: 1,
      type: "agent",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["agent", "tools", "restriction"],
      conditions: [{ field: "agent.tools.count", operator: "gt", value: 15 }],
      actions: [{ type: "warn", message: "Agent has more than 15 tools available" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "agent-memory-limit",
      name: "Agent Memory Limit",
      description: "Agent memory usage limit",
      version: 1,
      type: "agent",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["agent", "memory", "limit"],
      conditions: [{ field: "agent.memory.mb", operator: "gt", value: 1024 }],
      actions: [{ type: "deny", message: "Agent memory usage exceeds 1,024 MB limit" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "agent-max-steps",
      name: "Agent Max Steps",
      description: "Max agent reasoning steps",
      version: 1,
      type: "agent",
      severity: "low",
      enforcement: "soft",
      enabled: true,
      tags: ["agent", "reasoning", "steps"],
      conditions: [{ field: "agent.reasoning.steps", operator: "gt", value: 50 }],
      actions: [{ type: "warn", message: "Agent reasoning steps exceed 50" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "agent-cost-per-run",
      name: "Agent Cost Per Run",
      description: "Max cost per agent run",
      version: 1,
      type: "agent",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["agent", "cost", "per-run"],
      conditions: [{ field: "agent.cost.per_run", operator: "gt", value: 0.5 }],
      actions: [{ type: "deny", message: "Agent cost per run exceeds $0.50 limit" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "agent-max-concurrent-tasks",
      name: "Agent Max Concurrent Tasks",
      description: "Max concurrent tasks",
      version: 1,
      type: "agent",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["agent", "tasks", "concurrency"],
      conditions: [{ field: "agent.tasks.concurrent", operator: "gt", value: 10 }],
      actions: [{ type: "deny", message: "Agent concurrent tasks exceed 10" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "agent-required-approval",
      name: "Agent Required Approval",
      description: "Require approval for destructive actions",
      version: 1,
      type: "agent",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["agent", "approval", "destructive"],
      conditions: [{ field: "agent.action.type", operator: "eq", value: "delete" }],
      actions: [{ type: "require_approval", message: "Destructive agent action requires approval" }],
      approval: { required: true, workflow: "agent-destructive-action-approval", approvers: ["security-lead", "engineering-lead"] },
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
