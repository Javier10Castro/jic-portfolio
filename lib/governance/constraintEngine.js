const expressionEvaluator = require('./expressionEvaluator');

class ConstraintEngine {
  constructor() {
    this.constraints = new Map();
  }

  validateConstraints(data, constraints) {
    if (!data || !Array.isArray(constraints)) return { valid: true, errors: [] };
    const allErrors = [];
    for (const constraint of constraints) {
      const result = this.checkConstraint(data, constraint);
      if (!result.valid) allErrors.push(...result.errors);
    }
    return { valid: allErrors.length === 0, errors: allErrors };
  }

  addConstraint(name, constraint) {
    if (!name || !constraint) return;
    this.constraints.set(name, constraint);
  }

  removeConstraint(name) {
    this.constraints.delete(name);
  }

  getConstraints() {
    return Array.from(this.constraints.entries()).map(([name, constraint]) => ({ name, constraint }));
  }

  checkConstraint(data, constraint) {
    if (!constraint) return { valid: true, errors: [] };
    const errors = [];
    const actual = expressionEvaluator.evaluateField(constraint.field, data);
    if (constraint.required && (actual === undefined || actual === null || actual === '')) {
      errors.push(`Field '${constraint.field}' is required`);
    }
    if (actual !== undefined && actual !== null) {
      if (constraint.type === 'number' || constraint.type === 'integer') {
        const num = Number(actual);
        if (isNaN(num)) errors.push(`Field '${constraint.field}' must be a number`);
        else {
          if (constraint.type === 'integer' && !Number.isInteger(num)) errors.push(`Field '${constraint.field}' must be an integer`);
          if (constraint.min !== undefined && num < constraint.min) errors.push(`Field '${constraint.field}' must be >= ${constraint.min}`);
          if (constraint.max !== undefined && num > constraint.max) errors.push(`Field '${constraint.field}' must be <= ${constraint.max}`);
        }
      }
      if (constraint.type === 'string' && typeof actual !== 'string') {
        errors.push(`Field '${constraint.field}' must be a string`);
      }
      if (constraint.pattern && typeof actual === 'string') {
        if (!new RegExp(constraint.pattern).test(actual)) errors.push(`Field '${constraint.field}' does not match pattern ${constraint.pattern}`);
      }
      if (constraint.enum && !constraint.enum.includes(actual)) {
        errors.push(`Field '${constraint.field}' must be one of: ${constraint.enum.join(', ')}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  clear() {
    this.constraints.clear();
  }
}

module.exports = new ConstraintEngine();
