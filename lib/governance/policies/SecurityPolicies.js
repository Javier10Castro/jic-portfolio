function createPolicies() {
  return [
    {
      id: "security-mfa-required",
      name: "Security MFA Required",
      description: "MFA required for all users",
      version: 1,
      type: "security",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "mfa", "authentication"],
      conditions: [{ field: "security.user.mfa_enabled", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "MFA must be enabled for all users" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "security-api-key-rotation",
      name: "Security API Key Rotation",
      description: "Require API key rotation",
      version: 1,
      type: "security",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "api-key", "rotation"],
      conditions: [{ field: "security.api_key.age_days", operator: "gt", value: 90 }],
      actions: [{ type: "deny", message: "API keys must be rotated every 90 days" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "security-ip-whitelist",
      name: "Security IP Whitelist",
      description: "Require IP whitelist",
      version: 1,
      type: "security",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "ip", "whitelist"],
      conditions: [{ field: "security.network.ip_whitelist.empty", operator: "eq", value: true }],
      actions: [{ type: "deny", message: "IP whitelist must be configured" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "security-max-sessions",
      name: "Security Max Sessions",
      description: "Max concurrent sessions",
      version: 1,
      type: "security",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "sessions", "concurrent"],
      conditions: [{ field: "security.user.active_sessions", operator: "gt", value: 5 }],
      actions: [{ type: "deny", message: "Concurrent active sessions exceed 5" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "security-audit-logging",
      name: "Security Audit Logging",
      description: "Audit logging required",
      version: 1,
      type: "security",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "audit", "logging"],
      conditions: [{ field: "security.audit.enabled", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "Audit logging must be enabled" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "security-password-policy",
      name: "Security Password Policy",
      description: "Password complexity",
      version: 1,
      type: "security",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "password", "complexity"],
      conditions: [{ field: "security.user.password_strength", operator: "lt", value: 3 }],
      actions: [{ type: "deny", message: "Password strength must be at least 3" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "security-sso-required",
      name: "Security SSO Required",
      description: "SSO required for enterprise",
      version: 1,
      type: "security",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "sso", "enterprise"],
      conditions: [
        { field: "security.sso.enabled", operator: "eq", value: false },
        { field: "security.organization.size", operator: "gt", value: 50 }
      ],
      actions: [{ type: "deny", message: "SSO is required for organizations with more than 50 users" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "security-rate-limit",
      name: "Security Rate Limit",
      description: "Rate limiting required",
      version: 1,
      type: "security",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["security", "rate-limit", "protection"],
      conditions: [{ field: "security.rate_limit.enabled", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "Rate limiting must be enabled" }],
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
