class Validator {
  constructor() {
    this._rules = {};
  }

  validate(data, rules) {
    if (!data || !Array.isArray(rules)) return { valid: true, errors: [] };
    const errors = [];
    rules.forEach(rule => {
      const value = data[rule.field];
      const result = this.validateField(value, rule);
      if (!result.valid) errors.push({ field: rule.field, message: result.message });
    });
    return { valid: errors.length === 0, errors };
  }

  validateField(value, rule) {
    if (!rule) return { valid: true };
    if (rule.required && (value === undefined || value === null || value === '')) {
      return { valid: false, message: `${rule.field} is required` };
    }
    if (value === undefined || value === null) return { valid: true };
    if (rule.type === 'number' && typeof value !== 'number') return { valid: false, message: `${rule.field} must be a number` };
    if (rule.type === 'string' && typeof value !== 'string') return { valid: false, message: `${rule.field} must be a string` };
    if (rule.type === 'boolean' && typeof value !== 'boolean') return { valid: false, message: `${rule.field} must be a boolean` };
    if (rule.min !== undefined && value < rule.min) return { valid: false, message: `${rule.field} must be >= ${rule.min}` };
    if (rule.max !== undefined && value > rule.max) return { valid: false, message: `${rule.field} must be <= ${rule.max}` };
    if (rule.pattern && !new RegExp(rule.pattern).test(String(value))) return { valid: false, message: `${rule.field} does not match pattern` };
    if (rule.enum && !rule.enum.includes(value)) return { valid: false, message: `${rule.field} must be one of ${rule.enum.join(', ')}` };
    return { valid: true };
  }

  addRule(name, rule) {
    if (!name) return null;
    this._rules[name] = rule;
    return { name, ...rule };
  }

  getRules() {
    return { ...this._rules };
  }

  clear() {
    this._rules = {};
  }
}

module.exports = { Validator };
