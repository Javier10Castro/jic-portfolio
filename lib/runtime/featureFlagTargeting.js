class FeatureFlagTargeting {
  constructor() {
    this._rules = new Map();
  }

  addTargeting(flagKey, rules) {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }
    if (!Array.isArray(rules)) {
      throw new Error('rules must be an array');
    }
    const validOperators = ['eq', 'neq', 'in', 'not_in', 'contains', 'gt', 'gte', 'lt', 'lte'];
    for (const rule of rules) {
      if (!rule.field || !rule.operator || rule.value === undefined) {
        throw new Error('Each rule must have field, operator, and value');
      }
      if (!validOperators.includes(rule.operator)) {
        throw new Error(`Invalid operator '${rule.operator}'`);
      }
    }
    this._rules.set(flagKey, rules.map(r => ({ ...r })));
  }

  getTargeting(flagKey) {
    if (!flagKey) return null;
    const rules = this._rules.get(flagKey);
    return rules ? rules.map(r => ({ ...r })) : null;
  }

  removeTargeting(flagKey) {
    if (!flagKey) return false;
    return this._rules.delete(flagKey);
  }

  evaluate(flagKey, context) {
    if (!flagKey) return false;
    const rules = this._rules.get(flagKey);
    if (!rules || rules.length === 0) return true;
    if (!context || typeof context !== 'object') return false;
    for (const rule of rules) {
      const ctxVal = context[rule.field];
      switch (rule.operator) {
        case 'eq':
          if (ctxVal !== rule.value) return false;
          break;
        case 'neq':
          if (ctxVal === rule.value) return false;
          break;
        case 'in':
          if (!Array.isArray(rule.value) || !rule.value.includes(ctxVal)) return false;
          break;
        case 'not_in':
          if (Array.isArray(rule.value) && rule.value.includes(ctxVal)) return false;
          break;
        case 'contains':
          if (typeof ctxVal !== 'string' || !ctxVal.includes(String(rule.value))) return false;
          break;
        case 'gt':
          if (typeof ctxVal !== 'number' || ctxVal <= rule.value) return false;
          break;
        case 'gte':
          if (typeof ctxVal !== 'number' || ctxVal < rule.value) return false;
          break;
        case 'lt':
          if (typeof ctxVal !== 'number' || ctxVal >= rule.value) return false;
          break;
        case 'lte':
          if (typeof ctxVal !== 'number' || ctxVal > rule.value) return false;
          break;
      }
    }
    return true;
  }

  clear() {
    this._rules.clear();
  }
}

module.exports = { FeatureFlagTargeting };
