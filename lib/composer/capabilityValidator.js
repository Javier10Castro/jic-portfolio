class CapabilityValidator {
  constructor() {
    this._requiredFields = ['id', 'name', 'type', 'version'];
  }

  validate(capability) {
    if (!capability) {
      return { valid: false, errors: ['Capability is null or undefined'] };
    }
    const errors = [];
    for (const field of this._requiredFields) {
      if (!capability[field] || (typeof capability[field] === 'string' && capability[field].trim() === '')) {
        errors.push(`Missing or empty required field: ${field}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  validateCompatibility(capability, requirements) {
    if (!capability) {
      return { compatible: false, errors: ['Capability is null or undefined'] };
    }
    if (!requirements) {
      return { compatible: true, errors: [] };
    }
    const errors = [];
    if (requirements.type && capability.type !== requirements.type) {
      errors.push(
        `Type mismatch: expected ${requirements.type}, got ${capability.type}`
      );
    }
    if (requirements.name && capability.name !== requirements.name) {
      errors.push(
        `Name mismatch: expected ${requirements.name}, got ${capability.name}`
      );
    }
    return { compatible: errors.length === 0, errors };
  }

  clear() {
    this._requiredFields = ['id', 'name', 'type', 'version'];
  }
}

module.exports = { CapabilityValidator };
