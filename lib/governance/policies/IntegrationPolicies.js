function createPolicies() {
  return [
    {
      id: "integration-max-active",
      name: "Integration Max Active",
      description: "Max active integrations",
      version: 1,
      type: "integration",
      severity: "low",
      enforcement: "soft",
      enabled: true,
      tags: ["integration", "active", "limit"],
      conditions: [{ field: "integration.active.count", operator: "gt", value: 15 }],
      actions: [{ type: "warn", message: "More than 15 active integrations" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "integration-data-access",
      name: "Integration Data Access",
      description: "Restrict data access scope",
      version: 1,
      type: "integration",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["integration", "data", "access"],
      conditions: [{ field: "integration.data.access_level", operator: "eq", value: "full" }],
      actions: [{ type: "require_approval", message: "Full data access integration requires approval" }],
      approval: { required: true, workflow: "integration-data-access-approval", approvers: ["security-lead", "data-protection-officer"] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "integration-rate-limit",
      name: "Integration Rate Limit",
      description: "Integration rate limiting",
      version: 1,
      type: "integration",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["integration", "rate", "limit"],
      conditions: [{ field: "integration.rate_limit.requests_per_minute", operator: "gt", value: 5000 }],
      actions: [{ type: "deny", message: "Integration request rate exceeds 5,000 per minute" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "integration-timeout",
      name: "Integration Timeout",
      description: "Integration timeout",
      version: 1,
      type: "integration",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["integration", "timeout", "performance"],
      conditions: [{ field: "integration.timeout.ms", operator: "gt", value: 30000 }],
      actions: [{ type: "warn", message: "Integration timeout exceeds 30,000ms" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "integration-auth-required",
      name: "Integration Auth Required",
      description: "OAuth required for auth",
      version: 1,
      type: "integration",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["integration", "auth", "oauth"],
      conditions: [{ field: "integration.auth.type", operator: "eq", value: "none" }],
      actions: [{ type: "deny", message: "Authentication must be configured for integration" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "integration-webhook-validation",
      name: "Integration Webhook Validation",
      description: "Webhook signature required",
      version: 1,
      type: "integration",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["integration", "webhook", "validation"],
      conditions: [{ field: "integration.webhook.signature_validation", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "Webhook signature validation must be enabled" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "integration-logging-required",
      name: "Integration Logging Required",
      description: "Integration activity logging",
      version: 1,
      type: "integration",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["integration", "logging", "audit"],
      conditions: [{ field: "integration.logging.enabled", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "Integration activity logging must be enabled" }],
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
