class PolicyEngine {
  constructor() {
    this._policies = new Map();
    this._abacAttributes = new Map();
  }

  createPolicy(policy) {
    if (!policy.id) policy.id = require('crypto').randomUUID();
    if (!policy.name) throw new Error('Policy requires a name');
    this._policies.set(policy.id, {
      ...policy,
      enabled: policy.enabled !== false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return policy;
  }

  updatePolicy(id, updates) {
    const policy = this._policies.get(id);
    if (!policy) return null;
    Object.assign(policy, updates, { updatedAt: Date.now() });
    return policy;
  }

  deletePolicy(id) {
    return this._policies.delete(id);
  }

  getPolicy(id) {
    return this._policies.get(id) || null;
  }

  getPolicies(filter = {}) {
    let results = Array.from(this._policies.values());
    if (filter.enabled !== undefined) results = results.filter(p => p.enabled === filter.enabled);
    if (filter.type) results = results.filter(p => p.type === filter.type);
    return results;
  }

  evaluate(subject, resource, action, context = {}) {
    const applicable = this.getPolicies({ enabled: true }).filter(p => {
      if (p.resourceType && p.resourceType !== resource.type) return false;
      if (p.action && p.action !== action) return false;
      return true;
    });
    for (const policy of applicable) {
      const result = this._evaluatePolicy(policy, subject, resource, action, context);
      if (result !== null) return result;
    }
    return { allowed: true, source: 'default_allow' };
  }

  setAbacAttribute(entityId, key, value) {
    if (!this._abacAttributes.has(entityId)) this._abacAttributes.set(entityId, {});
    this._abacAttributes.get(entityId)[key] = value;
  }

  getAbacAttributes(entityId) {
    return this._abacAttributes.get(entityId) || {};
  }

  _evaluatePolicy(policy, subject, resource, action, context) {
    if (!policy.conditions || policy.conditions.length === 0) {
      return { allowed: policy.effect !== 'deny', source: `policy:${policy.name}`, policy: policy.id };
    }
    for (const condition of policy.conditions) {
      const matches = this._matchCondition(condition, subject, resource, action, context);
      if (!matches) continue;
      return { allowed: policy.effect !== 'deny', source: `policy:${policy.name}`, policy: policy.id, condition };
    }
    return null;
  }

  _matchCondition(condition, subject, resource, action, context) {
    if (condition.field === 'user.role') return condition.value === (subject.role || null);
    if (condition.field === 'resource.type') return condition.value === resource.type;
    if (condition.field === 'action') return condition.value === action;
    if (condition.field === 'context.ip') return condition.value === (context.ip || null);
    if (condition.field.startsWith('attribute.')) {
      const attr = condition.field.substring(10);
      return condition.value === (this.getAbacAttributes(subject.id || subject.userId)?.[attr] || null);
    }
    return false;
  }

  clear() {
    this._policies.clear();
    this._abacAttributes.clear();
  }
}

module.exports = { PolicyEngine };
