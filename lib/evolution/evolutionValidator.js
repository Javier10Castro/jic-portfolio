class EvolutionValidator {
  constructor() {
    this._validations = [];
    this._counter = 0;
  }

  validate(evolutionId, plan) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'val_' + (++this._counter);
    const errors = [];
    const warnings = [];
    if (!plan) {
      errors.push({ field: 'plan', message: 'Plan is required' });
    } else {
      if (!plan.type && !plan.improvements) {
        errors.push({ field: 'type', message: 'Plan type or improvements required' });
      }
      if (plan.estimatedHours && plan.estimatedHours < 0) {
        errors.push({ field: 'estimatedHours', message: 'Estimated hours must be non-negative' });
      }
      if (plan.estimatedHours && plan.estimatedHours > 1000) {
        warnings.push({ field: 'estimatedHours', message: 'Estimated hours exceeds 1000, consider breaking into phases' });
      }
    }
    const result = {
      id, evolutionId,
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };
    this._validations.push(result);
    return result;
  }

  get(id) {
    if (!id) return null;
    return this._validations.find(v => v.id === id) || null;
  }

  list() {
    return this._validations;
  }

  clear() {
    this._validations = [];
    this._counter = 0;
  }
}

module.exports = { EvolutionValidator };
