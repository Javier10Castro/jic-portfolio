class EvolutionConstraints {
  constructor() {
    this._constraints = new Map();
  }

  add(id, constraint) {
    if (!id) throw new Error('id is required');
    if (!constraint) throw new Error('constraint is required');
    if (!this._constraints.has(id)) {
      this._constraints.set(id, []);
    }
    const entry = { ...constraint, createdAt: new Date().toISOString() };
    this._constraints.get(id).push(entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._constraints.get(id) || null;
  }

  list() {
    const result = {};
    for (const [k, v] of this._constraints) {
      result[k] = v;
    }
    return result;
  }

  check(id, plan) {
    if (!id || !plan) return { valid: true, violations: [] };
    const constraints = this._constraints.get(id);
    if (!constraints || constraints.length === 0) return { valid: true, violations: [] };
    const violations = [];
    for (const c of constraints) {
      if (c.type === 'maxHours' && (plan.estimatedHours || 0) > c.value) {
        violations.push({ constraint: c, message: `Estimated hours ${plan.estimatedHours} exceeds max ${c.value}` });
      }
      if (c.type === 'maxBreakingChanges' && (plan.breakingChanges || 0) > c.value) {
        violations.push({ constraint: c, message: `Breaking changes ${plan.breakingChanges} exceeds max ${c.value}` });
      }
    }
    return { valid: violations.length === 0, violations };
  }

  remove(id, index) {
    if (!id) return false;
    const constraints = this._constraints.get(id);
    if (!constraints || index < 0 || index >= constraints.length) return false;
    constraints.splice(index, 1);
    if (constraints.length === 0) this._constraints.delete(id);
    return true;
  }

  clear() {
    this._constraints.clear();
  }
}

module.exports = { EvolutionConstraints };
