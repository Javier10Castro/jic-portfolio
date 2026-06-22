class CompositionConstraints {
  constructor() {
    this._constraints = new Map();
    this._counter = 0;
  }

  addConstraint(constraint) {
    if (!constraint) return null;
    const id = constraint.id || `constraint_${++this._counter}`;
    const entry = { ...constraint, id };
    this._constraints.set(id, entry);
    return entry;
  }

  removeConstraint(id) {
    if (!id) return false;
    return this._constraints.delete(id);
  }

  listConstraints() {
    return Array.from(this._constraints.values());
  }

  check(composition) {
    if (!composition) {
      return { compliant: false, violations: [{ message: 'Composition is null or undefined' }] };
    }
    const constraints = Array.from(this._constraints.values());
    const violations = [];
    let compliant = true;

    for (const constraint of constraints) {
      let violated = false;
      let message = '';

      if (constraint.type === 'maxModules' && composition.modules) {
        const max = constraint.value;
        if (composition.modules.length > max) {
          violated = true;
          message = `Exceeded maximum modules: ${composition.modules.length} > ${max}`;
        }
      } else if (constraint.type === 'requiredModule' && composition.modules) {
        const required = constraint.value;
        if (!composition.modules.includes(required)) {
          violated = true;
          message = `Missing required module: ${required}`;
        }
      } else if (constraint.type === 'forbiddenModule' && composition.modules) {
        const forbidden = constraint.value;
        if (composition.modules.includes(forbidden)) {
          violated = true;
          message = `Forbidden module present: ${forbidden}`;
        }
      }

      if (violated) {
        compliant = false;
        violations.push({ constraint: constraint.id, message });
      }
    }

    return { compliant, violations };
  }

  clear() {
    this._constraints.clear();
    this._counter = 0;
  }
}

module.exports = { CompositionConstraints };
