class ApprovalRule {
  constructor(config) {
    this.name = config.name;
    this.policyType = config.policyType;
    this.conditions = config.conditions || [];
    this.requiredApprovers = config.requiredApprovers || [];
    this.workflow = config.workflow || 'simple';
    this.priority = config.priority || 0;
  }

  matches(policy, context) {
    if (this.policyType && policy.type !== this.policyType) return false;
    for (var i = 0; i < this.conditions.length; i++) {
      var condition = this.conditions[i];
      var actual = this._resolveField(condition.field, { policy: policy, context: context });
      if (!this._compare(actual, condition.operator, condition.value)) return false;
    }
    return true;
  }

  _resolveField(field, data) {
    var parts = field.split('.');
    var obj = data;
    for (var i = 0; i < parts.length; i++) {
      if (obj && typeof obj === 'object') obj = obj[parts[i]];
      else return undefined;
    }
    return obj;
  }

  _compare(actual, operator, expected) {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return actual > expected;
      case 'gte': return actual >= expected;
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      case 'in': return Array.isArray(expected) && expected.indexOf(actual) !== -1;
      default: return false;
    }
  }
}

module.exports = { ApprovalRule };
