class CompositionValidator {
  constructor() {
    this._results = new Map();
    this._counter = 0;
  }

  validate(composition) {
    const errors = [];

    if (!composition) {
      errors.push('composition is required');
      return { valid: false, errors };
    }
    if (!composition.id) {
      errors.push('composition must have an id');
    }
    if (!composition.name) {
      errors.push('composition must have a name');
    }
    if (!composition.blueprint) {
      errors.push('composition must have a blueprint');
    }
    if (!composition.capabilities) {
      errors.push('composition must have capabilities');
    }
    if (composition.blueprint && typeof composition.blueprint !== 'object') {
      errors.push('blueprint must be an object');
    }
    if (composition.capabilities && !Array.isArray(composition.capabilities)) {
      errors.push('capabilities must be an array');
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
    if (!blueprint.modules) {
      errors.push('blueprint must have a modules array');
      return { valid: false, errors };
    }
    if (!Array.isArray(blueprint.modules)) {
      errors.push('modules must be an array');
      return { valid: false, errors };
    }
    if (blueprint.modules.length === 0) {
      errors.push('modules array must not be empty');
    } else {
      blueprint.modules.forEach((mod, index) => {
        if (!mod.id) {
          errors.push(`module at index ${index} must have an id`);
        }
        if (!mod.type) {
          errors.push(`module at index ${index} must have a type`);
        }
      });
    }

    const valid = errors.length === 0;
    return { valid, errors };
  }

  clear() {
    this._results.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionValidator };
