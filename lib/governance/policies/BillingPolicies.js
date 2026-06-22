function createPolicies() {
  return [
    {
      id: "billing-monthly-cap",
      name: "Billing Monthly Cap",
      description: "Monthly spend cap",
      version: 1,
      type: "billing",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["billing", "monthly", "cap", "spend"],
      conditions: [{ field: "billing.monthly.total", operator: "gt", value: 10000 }],
      actions: [{ type: "deny", message: "Monthly spending exceeds $10,000 cap" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "billing-daily-spike",
      name: "Billing Daily Spike",
      description: "Daily spend spike detection",
      version: 1,
      type: "billing",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["billing", "daily", "spike", "anomaly"],
      conditions: [{ field: "billing.daily.increase_percent", operator: "gt", value: 200 }],
      actions: [{ type: "warn", message: "Daily spend increased by more than 200%" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "billing-project-budget",
      name: "Billing Project Budget",
      description: "Per-project budget",
      version: 1,
      type: "billing",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["billing", "project", "budget"],
      conditions: [{ field: "billing.project.monthly", operator: "gt", value: 3000 }],
      actions: [{ type: "deny", message: "Project monthly spend exceeds $3,000 budget" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "billing-user-spend-limit",
      name: "Billing User Spend Limit",
      description: "Per-user spend limit",
      version: 1,
      type: "billing",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["billing", "user", "spend", "limit"],
      conditions: [{ field: "billing.user.monthly", operator: "gt", value: 1000 }],
      actions: [{ type: "deny", message: "User monthly spend exceeds $1,000 limit" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "billing-anomaly-detection",
      name: "Billing Anomaly Detection",
      description: "Anomalous spending patterns",
      version: 1,
      type: "billing",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["billing", "anomaly", "detection"],
      conditions: [{ field: "billing.anomaly.score", operator: "gt", value: 0.8 }],
      actions: [{ type: "notify", message: "Anomalous billing pattern detected" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "billing-free-tier-limit",
      name: "Billing Free Tier Limit",
      description: "Free tier usage limits",
      version: 1,
      type: "billing",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["billing", "free-tier", "limit"],
      conditions: [
        { field: "billing.tier", operator: "eq", value: "free" },
        { field: "billing.monthly.total", operator: "gt", value: 100 }
      ],
      actions: [{ type: "deny", message: "Free tier monthly spend exceeds $100 limit" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "billing-invoice-approval",
      name: "Billing Invoice Approval",
      description: "Require approval for large invoices",
      version: 1,
      type: "billing",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["billing", "invoice", "approval"],
      conditions: [{ field: "billing.invoice.amount", operator: "gt", value: 5000 }],
      actions: [{ type: "require_approval", message: "Invoice over $5,000 requires approval" }],
      approval: { required: true, workflow: "invoice-approval-flow", approvers: ["finance-manager", "cto"] },
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
