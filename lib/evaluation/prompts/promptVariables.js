class PromptVariables {
  constructor() {
    this._definitions = new Map();
  }

  define(name, definition) {
    this._definitions.set(name, {
      name,
      type: definition.type || 'string',
      default: definition.default !== undefined ? definition.default : null,
      options: definition.options || [],
      description: definition.description || '',
      required: definition.required !== undefined ? definition.required : false
    });
  }

  get(name) {
    return this._definitions.has(name) ? { ...this._definitions.get(name) } : null;
  }

  list() {
    const result = [];
    for (const def of this._definitions.values()) {
      result.push({ ...def });
    }
    return result;
  }

  resolve(name, value) {
    const def = this._definitions.get(name);
    if (!def) {
      return { value: value !== undefined ? value : null };
    }

    const resolvedValue = (value === undefined || value === null) ? def.default : value;

    if (resolvedValue === null && def.required) {
      return { value: null, error: `Variable '${name}' is required but no value provided` };
    }

    if (resolvedValue !== null) {
      const validation = this._validateType(name, resolvedValue, def);
      if (!validation.valid) {
        return { value: null, error: validation.error };
      }
    }

    return { value: resolvedValue };
  }

  resolveAll(values) {
    const resolved = {};
    const errors = {};

    for (const name of this._definitions.keys()) {
      const result = this.resolve(name, values[name]);
      if (result.error) {
        errors[name] = result.error;
      } else {
        resolved[name] = result.value;
      }
    }

    return { resolved, errors };
  }

  _validateType(name, value, def) {
    if (def.type === 'string') {
      if (typeof value !== 'string') {
        return { valid: false, error: `Variable '${name}' expected string, got ${typeof value}` };
      }
    } else if (def.type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: `Variable '${name}' expected number, got ${typeof value}` };
      }
    } else if (def.type === 'boolean') {
      if (typeof value !== 'boolean') {
        return { valid: false, error: `Variable '${name}' expected boolean, got ${typeof value}` };
      }
    } else if (def.type === 'select') {
      if (def.options.length > 0 && !def.options.includes(value)) {
        return { valid: false, error: `Variable '${name}' must be one of: ${def.options.join(', ')}` };
      }
    }

    return { valid: true };
  }

  validate(name, value) {
    const def = this._definitions.get(name);
    if (!def) {
      return { valid: false, error: `Variable '${name}' is not defined` };
    }

    if (def.required && (value === undefined || value === null)) {
      return { valid: false, error: `Variable '${name}' is required` };
    }

    if (value !== undefined && value !== null) {
      return this._validateType(name, value, def);
    }

    return { valid: true };
  }

  undefine(name) {
    return this._definitions.delete(name);
  }

  clear() {
    this._definitions.clear();
  }
}

module.exports = { PromptVariables };
