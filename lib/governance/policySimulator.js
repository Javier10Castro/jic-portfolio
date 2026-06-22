function resolveValue(data, field) {
  if (!data || !field) return undefined;
  const parts = field.split('.');
  let current = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && part in current) current = current[part];
    else return undefined;
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
    case 'in': return Array.isArray(expected) && expected.includes(actual);
    case 'not_in': return Array.isArray(expected) && !expected.includes(actual);
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
    default: return false;
  }
}

class PolicySimulator {
  constructor() {
    this._history = [];
  }

  simulate(policy, data) {
    if (!policy || !data) return { policyId: policy ? policy.id : null, matched: false, conditions: [], actions: [], timestamp: new Date().toISOString() };
    const conditions = (policy.conditions || []).map(c => {
      const actual = resolveValue(data, c.field);
      const matched = evaluateSingle(c.operator, actual, c.value);
      return { field: c.field, operator: c.operator, expected: c.value, actual, matched };
    });
    const matched = conditions.every(c => c.matched);
    const actions = (policy.actions || []).map(a => ({
      type: a.type,
      wouldExecute: matched,
      message: a.message || ''
    }));
    const result = { policyId: policy.id, matched, conditions, actions, timestamp: new Date().toISOString() };
    this._history.push(result);
    return result;
  }

  simulateAll(policies, data) {
    if (!Array.isArray(policies)) return [];
    return policies.map(p => this.simulate(p, data));
  }

  getHistory(filters) {
    let results = [...this._history];
    if (filters) {
      if (filters.policyId) results = results.filter(r => r.policyId === filters.policyId);
      if (filters.matched !== undefined) results = results.filter(r => r.matched === !!filters.matched);
      if (filters.since) results = results.filter(r => new Date(r.timestamp) >= new Date(filters.since));
    }
    return results;
  }

  clear() {
    this._history = [];
  }
}

module.exports = { PolicySimulator };
