const VALID_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'in', 'not_in', 'exists', 'not_exists', 'matches', 'starts_with', 'ends_with'];
const VALID_ACTION_TYPES = ['deny', 'warn', 'notify', 'log', 'require_approval', 'block', 'quarantine', 'flag'];
const VALID_TYPES = ['ai', 'agent', 'workflow', 'deployment', 'billing', 'security', 'plugin', 'integration', 'developer', 'data'];
const VALID_ENFORCEMENT = ['hard', 'soft', 'audit'];
const VALID_SEVERITY = ['critical', 'high', 'medium', 'low'];

class PolicyCompiler {
  constructor() {
    this._compiled = new Map();
  }

  compile(policy) {
    const validation = this.validate(policy);
    if (!validation.valid) {
      throw new Error(`Policy validation failed: ${validation.errors.join('; ')}`);
    }
    const compiled = {
      id: policy.id,
      version: policy.version || 1,
      conditions: policy.conditions.map((c, i) => ({
        index: i,
        field: c.field,
        operator: c.operator,
        value: c.value,
        compiled: true
      })),
      actions: policy.actions.map((a, i) => ({
        index: i,
        type: a.type,
        message: a.message || '',
        params: { ...a },
        compiled: true
      })),
      name: policy.name,
      description: policy.description,
      type: policy.type,
      severity: policy.severity,
      enforcement: policy.enforcement,
      enabled: policy.enabled,
      tags: [...(policy.tags || [])],
      approval: { ...(policy.approval || { required: false, workflow: null, approvers: [] }) },
      metadata: { ...(policy.metadata || {}) },
      compiledAt: new Date().toISOString()
    };
    this._compiled.set(policy.id, compiled);
    return compiled;
  }

  compileBatch(policies) {
    if (!Array.isArray(policies)) return [];
    return policies.map(p => this.compile(p));
  }

  validate(policy) {
    const errors = [];
    if (!policy) { errors.push('Policy is null or undefined'); return { valid: false, errors }; }
    if (!policy.id || typeof policy.id !== 'string') errors.push('Missing or invalid id');
    if (!policy.name || typeof policy.name !== 'string') errors.push('Missing or invalid name');
    if (!policy.type || !VALID_TYPES.includes(policy.type)) errors.push(`Invalid type: ${policy.type}`);
    if (!Array.isArray(policy.conditions) || policy.conditions.length === 0) errors.push('Must have at least one condition');
    if (policy.conditions) {
      policy.conditions.forEach((c, i) => {
        if (!c.field) errors.push(`Condition[${i}] missing field`);
        if (!c.operator || !VALID_OPERATORS.includes(c.operator)) errors.push(`Condition[${i}] invalid operator: ${c.operator}`);
      });
    }
    if (policy.severity && !VALID_SEVERITY.includes(policy.severity)) errors.push(`Invalid severity: ${policy.severity}`);
    if (policy.enforcement && !VALID_ENFORCEMENT.includes(policy.enforcement)) errors.push(`Invalid enforcement: ${policy.enforcement}`);
    if (policy.actions) {
      policy.actions.forEach((a, i) => {
        if (!a.type || !VALID_ACTION_TYPES.includes(a.type)) errors.push(`Action[${i}] invalid type: ${a.type}`);
      });
    }
    return { valid: errors.length === 0, errors };
  }

  getCompiled(id) {
    if (!id) return null;
    return this._compiled.get(id) || null;
  }

  listCompiled() {
    return Array.from(this._compiled.values());
  }

  clear() {
    this._compiled.clear();
  }
}

module.exports = { PolicyCompiler };
