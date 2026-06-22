function resolveValue(data, field) {
  if (!data || !field) return undefined;
  const parts = field.split('.');
  let current = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function evaluateSingle(operator, actual, expected) {
  switch (operator) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'gt': return actual > expected;
    case 'gte': return actual >= expected;
    case 'lt': return actual < expected;
    case 'lte': return actual <= expected;
    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') return actual.includes(expected);
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;
    case 'not_contains':
      if (typeof actual === 'string' && typeof expected === 'string') return !actual.includes(expected);
      if (Array.isArray(actual)) return !actual.includes(expected);
      return true;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(actual);
    case 'exists': return actual !== undefined && actual !== null;
    case 'not_exists': return actual === undefined || actual === null;
    case 'matches':
      if (typeof actual !== 'string' || typeof expected !== 'string') return false;
      try { return new RegExp(expected).test(actual); } catch { return false; }
    case 'starts_with':
      if (typeof actual !== 'string' || typeof expected !== 'string') return false;
      return actual.startsWith(expected);
    case 'ends_with':
      if (typeof actual !== 'string' || typeof expected !== 'string') return false;
      return actual.endsWith(expected);
    default:
      return false;
  }
}

class PolicyEvaluator {
  constructor() {
    this._cache = new Map();
  }

  evaluate(policy, data) {
    if (!policy || !data) return { matched: false, results: [] };
    const conditions = policy.conditions || [];
    const results = conditions.map(condition => {
      const actual = resolveValue(data, condition.field);
      const matched = evaluateSingle(condition.operator, actual, condition.value);
      return { condition: { ...condition }, matched, actual };
    });
    const matched = results.every(r => r.matched);
    return { matched, results };
  }

  evaluateAll(policies, data) {
    if (!Array.isArray(policies)) return [];
    return policies.map(p => ({
      policyId: p.id || p.policyId,
      ...this.evaluate(p, data)
    }));
  }

  evaluateCondition(condition, data) {
    if (!condition || !data) return { matched: false };
    const actual = resolveValue(data, condition.field);
    const matched = evaluateSingle(condition.operator, actual, condition.value);
    return { condition: { ...condition }, matched, actual };
  }

  getMatchingPolicies(policies, data) {
    if (!Array.isArray(policies)) return [];
    return policies.filter(p => {
      const result = this.evaluate(p, data);
      return result.matched;
    });
  }

  clear() {
    this._cache.clear();
  }
}

module.exports = { PolicyEvaluator };
