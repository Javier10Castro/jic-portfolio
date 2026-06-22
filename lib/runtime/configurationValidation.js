class ConfigurationValidation {
  constructor() {
    this._schemas = new Map();
  }

  validate(config, rules) {
    if (!config || typeof config !== 'object') {
      return { valid: false, errors: ['config must be an object'] };
    }
    if (!Array.isArray(rules)) {
      return { valid: false, errors: ['rules must be an array'] };
    }
    const errors = [];
    for (const rule of rules) {
      if (!rule.field) {
        errors.push('Each rule must have a field');
        continue;
      }
      const value = config[rule.field];
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`'${rule.field}' is required`);
        continue;
      }
      if (value === undefined || value === null) continue;
      if (rule.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
          errors.push(`'${rule.field}' must be of type ${rule.type}, got ${actualType}`);
        }
      }
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors.push(`'${rule.field}' must be >= ${rule.min}`);
      }
      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors.push(`'${rule.field}' must be <= ${rule.max}`);
      }
      if (rule.pattern && typeof value === 'string' && !new RegExp(rule.pattern).test(value)) {
        errors.push(`'${rule.field}' does not match pattern ${rule.pattern}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  addSchema(name, schema) {
    if (!name || !schema) {
      throw new Error('name and schema are required');
    }
    this._schemas.set(name, schema.map(r => ({ ...r })));
  }

  getSchema(name) {
    if (!name) return null;
    const schema = this._schemas.get(name);
    return schema ? schema.map(r => ({ ...r })) : null;
  }

  validateAgainstSchema(config, schemaName) {
    const schema = this._schemas.get(schemaName);
    if (!schema) {
      return { valid: false, errors: [`Schema '${schemaName}' not found`] };
    }
    return this.validate(config, schema);
  }

  clear() {
    this._schemas.clear();
  }
}

module.exports = { ConfigurationValidation };
