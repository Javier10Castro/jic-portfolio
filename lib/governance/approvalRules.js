class ApprovalRules {
  constructor() {
    this.rules = new Map();
  }

  defineRule(name, rule) {
    if (!name || !rule) return;
    this.rules.set(name, {
      name, policyType: rule.policyType, enforcement: rule.enforcement || 'strict',
      conditions: rule.conditions || [], requiredApprovers: rule.requiredApprovers || [],
      workflow: rule.workflow || 'default'
    });
  }

  getRule(name) {
    return this.rules.get(name) || null;
  }

  listRules() {
    return Array.from(this.rules.values());
  }

  findMatchingRules(policy, context) {
    if (!policy) return [];
    return Array.from(this.rules.values()).filter(rule => this.evaluateRule(rule, policy, context));
  }

  evaluateRule(rule, policy, context) {
    if (!rule || !policy) return false;
    if (rule.policyType && policy.type !== rule.policyType) return false;
    if (rule.conditions && rule.conditions.length > 0) {
      return rule.conditions.every(cond => {
        const policyVal = policy[cond.field];
        if (cond.operator === 'eq') return policyVal === cond.value;
        if (cond.operator === 'neq') return policyVal !== cond.value;
        if (cond.operator === 'exists') return policyVal !== undefined;
        return true;
      });
    }
    return true;
  }

  removeRule(name) {
    this.rules.delete(name);
  }

  clear() {
    this.rules.clear();
  }
}

module.exports = new ApprovalRules();
