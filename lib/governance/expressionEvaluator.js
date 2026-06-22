class ExpressionEvaluator {
  constructor() {
    this.operators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'in', 'not_in', 'exists', 'not_exists', 'matches', 'starts_with', 'ends_with'];
  }

  evaluate(expression, data) {
    if (!expression || !data) return false;
    const actual = this.evaluateField(expression.field, data);
    return this.applyOperator(expression.operator, actual, expression.value);
  }

  evaluateField(field, data) {
    if (!field || !data) return undefined;
    const parts = field.split('.');
    let current = data;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
      current = current[part];
    }
    return current;
  }

  applyOperator(operator, actual, expected) {
    if (operator === 'exists') return actual !== undefined && actual !== null;
    if (operator === 'not_exists') return actual === undefined || actual === null;
    if (operator === 'eq') return actual === expected;
    if (operator === 'neq') return actual !== expected;
    if (operator === 'gt') return actual > expected;
    if (operator === 'gte') return actual >= expected;
    if (operator === 'lt') return actual < expected;
    if (operator === 'lte') return actual <= expected;
    if (operator === 'contains') return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected);
    if (operator === 'not_contains') return typeof actual === 'string' && typeof expected === 'string' && !actual.includes(expected);
    if (operator === 'in') return Array.isArray(expected) && expected.includes(actual);
    if (operator === 'not_in') return Array.isArray(expected) && !expected.includes(actual);
    if (operator === 'matches') return typeof actual === 'string' && typeof expected === 'string' && new RegExp(expected).test(actual);
    if (operator === 'starts_with') return typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected);
    if (operator === 'ends_with') return typeof actual === 'string' && typeof expected === 'string' && actual.endsWith(expected);
    return false;
  }

  getSupportedOperators() {
    return [...this.operators];
  }
}

module.exports = new ExpressionEvaluator();
