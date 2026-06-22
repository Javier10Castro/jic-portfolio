function createPolicies() {
  return [
    {
      id: "deployment-max-environments",
      name: "Deployment Max Environments",
      description: "Max deployment environments",
      version: 1,
      type: "deployment",
      severity: "medium",
      enforcement: "hard",
      enabled: true,
      tags: ["deployment", "environments", "limit"],
      conditions: [{ field: "deployment.environments.count", operator: "gt", value: 5 }],
      actions: [{ type: "deny", message: "Deployment environments exceed 5" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "deployment-required-approval",
      name: "Deployment Required Approval",
      description: "Require approval for prod deployments",
      version: 1,
      type: "deployment",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["deployment", "approval", "production"],
      conditions: [{ field: "deployment.environment", operator: "eq", value: "production" }],
      actions: [{ type: "require_approval", message: "Production deployment requires approval" }],
      approval: { required: true, workflow: "deployment-approval-flow", approvers: ["engineering-lead", "qa-lead"] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "deployment-min-health-checks",
      name: "Deployment Min Health Checks",
      description: "Min health checks",
      version: 1,
      type: "deployment",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["deployment", "health", "checks"],
      conditions: [{ field: "deployment.health_checks.min", operator: "gt", value: 0 }],
      actions: [{ type: "deny", message: "At least one health check must be configured" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "deployment-max-instances-per-service",
      name: "Deployment Max Instances Per Service",
      description: "Max instances per service",
      version: 1,
      type: "deployment",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["deployment", "instances", "service"],
      conditions: [{ field: "deployment.service.instances", operator: "gt", value: 10 }],
      actions: [{ type: "deny", message: "Service instances exceed 10" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "deployment-rollback-enabled",
      name: "Deployment Rollback Enabled",
      description: "Require rollback capability",
      version: 1,
      type: "deployment",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["deployment", "rollback", "reliability"],
      conditions: [{ field: "deployment.rollback.enabled", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "Rollback must be enabled for deployments" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "deployment-min-replicas",
      name: "Deployment Min Replicas",
      description: "Min replicas for HA",
      version: 1,
      type: "deployment",
      severity: "low",
      enforcement: "soft",
      enabled: true,
      tags: ["deployment", "replicas", "ha"],
      conditions: [{ field: "deployment.service.replicas", operator: "lt", value: 2 }],
      actions: [{ type: "warn", message: "Service should have at least 2 replicas for high availability" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "deployment-max-cpu",
      name: "Deployment Max CPU",
      description: "Max CPU per instance",
      version: 1,
      type: "deployment",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["deployment", "cpu", "resources"],
      conditions: [{ field: "deployment.resources.cpu", operator: "gt", value: 8 }],
      actions: [{ type: "deny", message: "CPU per instance exceeds 8 cores" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "deployment-max-memory",
      name: "Deployment Max Memory",
      description: "Max memory per instance",
      version: 1,
      type: "deployment",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["deployment", "memory", "resources"],
      conditions: [{ field: "deployment.resources.memory", operator: "gt", value: 16384 }],
      actions: [{ type: "deny", message: "Memory per instance exceeds 16,384 MB" }],
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
