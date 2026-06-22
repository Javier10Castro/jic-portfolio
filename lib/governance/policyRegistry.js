class PolicyRegistry {
  static get POLICY_TYPES() {
    return ['ai', 'agent', 'workflow', 'deployment', 'billing', 'security', 'plugin', 'integration', 'developer', 'data'];
  }

  static get ENFORCEMENT_MODES() {
    return ['hard', 'soft', 'audit'];
  }

  static get SEVERITY_LEVELS() {
    return ['critical', 'high', 'medium', 'low'];
  }

  constructor() {
    this._policies = new Map();
  }

  register(policy) {
    if (!policy || !policy.id || !policy.name || !policy.type || !policy.conditions) {
      throw new Error('Missing required fields: id, name, type, conditions');
    }
    if (!PolicyRegistry.POLICY_TYPES.includes(policy.type)) {
      throw new Error(`Invalid policy type: ${policy.type}`);
    }
    if (this._policies.has(policy.id)) {
      throw new Error(`Policy with id '${policy.id}' already exists`);
    }
    const entry = {
      ...policy,
      version: policy.version || 1,
      severity: policy.severity || 'medium',
      enforcement: policy.enforcement || 'audit',
      enabled: policy.enabled !== undefined ? policy.enabled : true,
      tags: policy.tags || [],
      actions: policy.actions || [],
      approval: policy.approval || { required: false, workflow: null, approvers: [] },
      metadata: policy.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this._policies.set(policy.id, entry);
    return entry;
  }

  unregister(id) {
    if (!id) return false;
    return this._policies.delete(id);
  }

  get(id) {
    if (!id) return null;
    return this._policies.get(id) || null;
  }

  list(filters) {
    let results = Array.from(this._policies.values());
    if (filters) {
      if (filters.type) results = results.filter(p => p.type === filters.type);
      if (filters.tag) results = results.filter(p => p.tags.includes(filters.tag));
      if (filters.severity) results = results.filter(p => p.severity === filters.severity);
      if (filters.enforcement) results = results.filter(p => p.enforcement === filters.enforcement);
      if (filters.enabled !== undefined) results = results.filter(p => p.enabled === !!filters.enabled);
    }
    return results;
  }

  search(query) {
    if (!query) return [];
    const lower = query.toLowerCase();
    return Array.from(this._policies.values()).filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.description && p.description.toLowerCase().includes(lower))
    );
  }

  count(filters) {
    return this.list(filters).length;
  }

  clear() {
    this._policies.clear();
  }

  getAll() {
    return Array.from(this._policies.values());
  }
}

module.exports = { PolicyRegistry };
