class ArchitectureValidator {
  constructor() {
    this._results = new Map();
    this._counter = 0;
  }

  validate(architecture) {
    const errors = [];
    if (!architecture) {
      errors.push('architecture is required');
      return { valid: false, errors };
    }
    if (!architecture.id) {
      errors.push('architecture must have an id');
    }
    if (!architecture.name) {
      errors.push('architecture must have a name');
    }
    if (!architecture.version) {
      errors.push('architecture must have a version');
    }
    if (!architecture.patterns) {
      errors.push('architecture must have patterns');
    }
    if (!architecture.components) {
      errors.push('architecture must have components');
    }
    const valid = errors.length === 0;
    if (valid) {
      this._counter++;
    }
    return { valid, errors };
  }

  validateBlueprint(blueprint) {
    const errors = [];
    if (!blueprint) {
      errors.push('blueprint is required');
      return { valid: false, errors };
    }
    if (!blueprint.name) {
      errors.push('blueprint must have a name');
    }
    if (!blueprint.version) {
      errors.push('blueprint must have a version');
    }
    if (!blueprint.components) {
      errors.push('blueprint must have a components array');
      return { valid: false, errors };
    }
    if (!Array.isArray(blueprint.components)) {
      errors.push('components must be an array');
      return { valid: false, errors };
    }
    if (!blueprint.modules) {
      errors.push('blueprint must have a modules array');
      return { valid: false, errors };
    }
    if (!Array.isArray(blueprint.modules)) {
      errors.push('modules must be an array');
      return { valid: false, errors };
    }
    const valid = errors.length === 0;
    return { valid, errors };
  }

  validatePattern(architecture, availablePatterns) {
    const errors = [];
    if (!architecture || !architecture.patterns) {
      return { valid: false, errors: ['architecture has no patterns'] };
    }
    if (!Array.isArray(availablePatterns)) {
      return { valid: false, errors: ['availablePatterns must be an array'] };
    }
    for (const pattern of architecture.patterns) {
      const found = availablePatterns.find(p => p.name === pattern || p.id === pattern);
      if (!found) {
        errors.push(`pattern '${pattern}' is not available`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  clear() {
    this._results.clear();
    this._counter = 0;
  }
}

module.exports = { ArchitectureValidator };
