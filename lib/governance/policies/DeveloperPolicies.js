function createPolicies() {
  return [
    {
      id: "developer-api-rate-limit",
      name: "Developer API Rate Limit",
      description: "API rate limit per developer",
      version: 1,
      type: "developer",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["developer", "api", "rate-limit"],
      conditions: [{ field: "developer.api.requests_per_minute", operator: "gt", value: 500 }],
      actions: [{ type: "deny", message: "Developer API requests exceed 500 per minute" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "developer-max-keys",
      name: "Developer Max Keys",
      description: "Max API keys per developer",
      version: 1,
      type: "developer",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["developer", "api-keys", "limit"],
      conditions: [{ field: "developer.api.keys.count", operator: "gt", value: 10 }],
      actions: [{ type: "deny", message: "Developer API keys exceed 10" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "developer-sandbox-required",
      name: "Developer Sandbox Required",
      description: "Sandbox for new developers",
      version: 1,
      type: "developer",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["developer", "sandbox", "environment"],
      conditions: [
        { field: "developer.account.age_days", operator: "lt", value: 30 },
        { field: "developer.environment", operator: "eq", value: "production" }
      ],
      actions: [{ type: "deny", message: "New developers must use sandbox environment" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "developer-webhook-limit",
      name: "Developer Webhook Limit",
      description: "Max webhooks per developer",
      version: 1,
      type: "developer",
      severity: "low",
      enforcement: "soft",
      enabled: true,
      tags: ["developer", "webhooks", "limit"],
      conditions: [{ field: "developer.webhooks.count", operator: "gt", value: 20 }],
      actions: [{ type: "warn", message: "Developer webhooks exceed 20" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "developer-access-review",
      name: "Developer Access Review",
      description: "Periodic access review required",
      version: 1,
      type: "developer",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["developer", "access", "review"],
      conditions: [{ field: "developer.access.last_review_days", operator: "gt", value: 90 }],
      actions: [{ type: "warn", message: "Developer access review overdue by more than 90 days" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "developer-quota",
      name: "Developer Quota",
      description: "Developer resource quota",
      version: 1,
      type: "developer",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["developer", "quota", "resources"],
      conditions: [{ field: "developer.quota.resources.used_percent", operator: "gt", value: 80 }],
      actions: [{ type: "warn", message: "Developer resource usage exceeds 80% of quota" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "developer-app-approval",
      name: "Developer App Approval",
      description: "App registration requires approval",
      version: 1,
      type: "developer",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["developer", "app", "approval"],
      conditions: [
        { field: "developer.app.count", operator: "gt", value: 5 },
        { field: "developer.verified", operator: "eq", value: false }
      ],
      actions: [{ type: "require_approval", message: "Unverified developer with multiple apps requires approval" }],
      approval: { required: true, workflow: "developer-app-approval-flow", approvers: ["engineering-lead"] },
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
