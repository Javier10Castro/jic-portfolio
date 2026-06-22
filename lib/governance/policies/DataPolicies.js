function createPolicies() {
  return [
    {
      id: "data-retention-max",
      name: "Data Retention Max",
      description: "Max data retention period",
      version: 1,
      type: "data",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "retention", "limit"],
      conditions: [{ field: "data.retention.days", operator: "gt", value: 365 }],
      actions: [{ type: "deny", message: "Data retention period exceeds 365 days" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "data-pii-detection",
      name: "Data PII Detection",
      description: "PII must be masked",
      version: 1,
      type: "data",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "pii", "masking", "privacy"],
      conditions: [
        { field: "data.pii.detected", operator: "eq", value: true },
        { field: "data.pii.masked", operator: "eq", value: false }
      ],
      actions: [{ type: "deny", message: "Detected PII must be masked" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "data-encryption-required",
      name: "Data Encryption Required",
      description: "Encryption at rest required",
      version: 1,
      type: "data",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "encryption", "security"],
      conditions: [{ field: "data.encryption.at_rest", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "Encryption at rest must be enabled" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "data-export-restriction",
      name: "Data Export Restriction",
      description: "Limit data export volume",
      version: 1,
      type: "data",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "export", "restriction"],
      conditions: [{ field: "data.export.records", operator: "gt", value: 10000 }],
      actions: [{ type: "require_approval", message: "Data export over 10,000 records requires approval" }],
      approval: { required: true, workflow: "data-export-approval", approvers: ["data-protection-officer"] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "data-masking-rules",
      name: "Data Masking Rules",
      description: "Data masking for sensitive fields",
      version: 1,
      type: "data",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "masking", "sensitive"],
      conditions: [
        { field: "data.sensitive.accessed", operator: "eq", value: true },
        { field: "data.masking.enabled", operator: "eq", value: false }
      ],
      actions: [{ type: "deny", message: "Sensitive data access requires masking to be enabled" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "data-eu-residency",
      name: "Data EU Residency",
      description: "EU data residency requirement",
      version: 1,
      type: "data",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "eu", "residency", "gdpr"],
      conditions: [
        { field: "data.region", operator: "eq", value: "eu" },
        { field: "data.storage.region", operator: "neq", value: "eu" }
      ],
      actions: [{ type: "deny", message: "EU data must be stored in EU region" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "data-sharing-restriction",
      name: "Data Sharing Restriction",
      description: "Third-party data sharing",
      version: 1,
      type: "data",
      severity: "critical",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "sharing", "third-party", "consent"],
      conditions: [
        { field: "data.sharing.third_party", operator: "eq", value: true },
        { field: "data.sharing.consent_obtained", operator: "eq", value: false }
      ],
      actions: [{ type: "deny", message: "Consent must be obtained before sharing data with third parties" }],
      approval: { required: false, workflow: null, approvers: [] },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "data-audit-trail",
      name: "Data Audit Trail",
      description: "Data access audit trail required",
      version: 1,
      type: "data",
      severity: "high",
      enforcement: "hard",
      enabled: true,
      tags: ["data", "audit", "trail"],
      conditions: [{ field: "data.audit.enabled", operator: "eq", value: false }],
      actions: [{ type: "deny", message: "Data access audit trail must be enabled" }],
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
