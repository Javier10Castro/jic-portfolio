class EvolutionPolicies {
  constructor() {
    this._policies = new Map();
  }

  define(id, policy) {
    if (!id) throw new Error('id is required');
    if (!policy) throw new Error('policy is required');
    const entry = {
      id,
      rules: policy.rules || [],
      enabled: policy.enabled !== false,
      createdAt: new Date().toISOString()
    };
    this._policies.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._policies.get(id) || null;
  }

  list() {
    return Array.from(this._policies.values());
  }

  enable(id) {
    if (!id) return null;
    const policy = this._policies.get(id);
    if (!policy) return null;
    policy.enabled = true;
    return policy;
  }

  disable(id) {
    if (!id) return null;
    const policy = this._policies.get(id);
    if (!policy) return null;
    policy.enabled = false;
    return policy;
  }

  remove(id) {
    if (!id) return false;
    return this._policies.delete(id);
  }

  clear() {
    this._policies.clear();
  }
}

module.exports = { EvolutionPolicies };
