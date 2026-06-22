class CompositionPolicies {
  constructor() {
    this._policies = new Map();
    this._counter = 0;
  }

  addPolicy(policy) {
    if (!policy || typeof policy.rule !== 'function') return null;
    const id = policy.id || `policy_${++this._counter}`;
    const entry = {
      ...policy,
      id,
      severity: policy.severity || 'warning',
    };
    this._policies.set(id, entry);
    return entry;
  }

  removePolicy(id) {
    if (!id) return false;
    return this._policies.delete(id);
  }

  listPolicies() {
    return Array.from(this._policies.values());
  }

  evaluate(composition) {
    if (!composition) {
      return { passed: false, results: [] };
    }
    const policies = Array.from(this._policies.values());
    const results = [];
    let allPassed = true;

    for (const policy of policies) {
      let passed = false;
      let message = '';
      try {
        passed = !!policy.rule(composition);
        message = passed
          ? `Policy "${policy.name}" passed`
          : `Policy "${policy.name}" failed`;
      } catch (err) {
        passed = false;
        message = `Policy "${policy.name}" threw: ${err.message}`;
      }
      if (!passed) allPassed = false;
      results.push({ policy: policy.id, passed, message });
    }

    return { passed: allPassed, results };
  }

  clear() {
    this._policies.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionPolicies };
