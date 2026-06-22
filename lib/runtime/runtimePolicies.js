class RuntimePolicies {
  constructor() {
    this._policies = {};
  }

  definePolicy(name, policy) {
    if (!name || !policy) {
      return false;
    }
    if (!policy.name || !policy.description || !policy.rules || !policy.actions || !policy.severity) {
      return false;
    }
    if (this._policies[name]) {
      return false;
    }
    this._policies[name] = {
      name: policy.name,
      description: policy.description,
      rules: policy.rules,
      actions: policy.actions,
      severity: policy.severity
    };
    return true;
  }

  getPolicy(name) {
    if (!name) {
      return null;
    }
    const policy = this._policies[name];
    if (!policy) {
      return null;
    }
    return { name: policy.name, description: policy.description, rules: policy.rules, actions: policy.actions, severity: policy.severity };
  }

  listPolicies() {
    const result = [];
    for (const name of Object.keys(this._policies)) {
      const policy = this._policies[name];
      result.push({ name: policy.name, description: policy.description, rules: policy.rules, actions: policy.actions, severity: policy.severity });
    }
    return result;
  }

  updatePolicy(name, updates) {
    if (!name || !updates) {
      return false;
    }
    const policy = this._policies[name];
    if (!policy) {
      return false;
    }
    if (updates.description !== undefined) policy.description = updates.description;
    if (updates.rules !== undefined) policy.rules = updates.rules;
    if (updates.actions !== undefined) policy.actions = updates.actions;
    if (updates.severity !== undefined) policy.severity = updates.severity;
    return true;
  }

  removePolicy(name) {
    if (!name) {
      return false;
    }
    if (!this._policies[name]) {
      return false;
    }
    delete this._policies[name];
    return true;
  }

  clear() {
    this._policies = {};
  }
}

module.exports = { RuntimePolicies };
