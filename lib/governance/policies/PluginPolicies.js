function createPolicies() {
  return [
    {
      id: "plugin-max-installed",
      name: "Plugin Max Installed",
      description: "Max plugins installed",
      version: 1,
      type: "plugin",
      severity: "low",
      enforcement: "soft",
      enabled: true,
      tags: ["plugin", "installed", "limit"],
      conditions: [{ field: "plugin.installed.count", operator: "gt", value: 20 }],
      actions: [{ type: "warn", message: "More than 20 plugins installed" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "plugin-verified-only",
      name: "Plugin Verified Only",
      description: "Only verified plugins",
      version: 1,
      type: "plugin",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["plugin", "verified", "security"],
      conditions: [{ field: "plugin.verified", operator: "eq", value: false }],
      actions: [{ type: "block", message: "Only verified plugins are allowed" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "plugin-permissions-review",
      name: "Plugin Permissions Review",
      description: "Review plugin permissions",
      version: 1,
      type: "plugin",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["plugin", "permissions", "review"],
      conditions: [{ field: "plugin.permissions.scope_count", operator: "gt", value: 10 }],
      actions: [{ type: "require_approval", message: "Plugin with extensive permissions requires review" }],
      approval: { required: true, workflow: "plugin-permissions-review", approvers: ["security-lead"] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "plugin-version-required",
      name: "Plugin Version Required",
      description: "Require min plugin version",
      version: 1,
      type: "plugin",
      severity: "low",
      enforcement: "soft",
      enabled: true,
      tags: ["plugin", "version", "minimum"],
      conditions: [{ field: "plugin.version.major", operator: "lt", value: 2 }],
      actions: [{ type: "warn", message: "Plugin major version must be at least 2" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "plugin-vulnerability-blacklist",
      name: "Plugin Vulnerability Blacklist",
      description: "Block known vulnerable plugins",
      version: 1,
      type: "plugin",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["plugin", "vulnerability", "blacklist"],
      conditions: [{ field: "plugin.vulnerability.critical", operator: "gt", value: 0 }],
      actions: [{ type: "block", message: "Plugin has known critical vulnerabilities" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "plugin-max-storage",
      name: "Plugin Max Storage",
      description: "Max plugin storage",
      version: 1,
      type: "plugin",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["plugin", "storage", "limit"],
      conditions: [{ field: "plugin.storage.mb", operator: "gt", value: 100 }],
      actions: [{ type: "deny", message: "Plugin storage exceeds 100 MB" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "plugin-network-access",
      name: "Plugin Network Access",
      description: "Restrict network access",
      version: 1,
      type: "plugin",
      severity: "medium",
      enforcement: "soft",
      enabled: true,
      tags: ["plugin", "network", "access"],
      conditions: [{ field: "plugin.network.allow_external", operator: "eq", value: true }],
      actions: [{ type: "warn", message: "Plugin has external network access enabled" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "plugin-deprecated-block",
      name: "Plugin Deprecated Block",
      description: "Block deprecated plugins",
      version: 1,
      type: "plugin",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["plugin", "deprecated", "block"],
      conditions: [{ field: "plugin.deprecated", operator: "eq", value: true }],
      actions: [{ type: "block", message: "Deprecated plugins are not allowed" }],
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
