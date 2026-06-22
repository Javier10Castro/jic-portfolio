class ConsistencyChecker {
  constructor() {
    this._violations = [];
  }

  checkConsistency(data, rules) {
    if (!Array.isArray(data) || !Array.isArray(rules)) return [];
    const violations = [];
    rules.forEach(rule => {
      data.forEach((rec, i) => {
        if (rule.condition && !rule.condition(rec)) return;
        if (rule.validate && !rule.validate(rec)) {
          const v = { row: i, rule: rule.name || 'unnamed', message: rule.message || 'Consistency rule violated' };
          violations.push(v);
          this._violations.push(v);
        }
      });
    });
    return violations;
  }

  checkCrossField(data, fieldA, fieldB, relation) {
    if (!Array.isArray(data) || !fieldA || !fieldB) return [];
    const violations = [];
    data.forEach((rec, i) => {
      const a = rec[fieldA];
      const b = rec[fieldB];
      if (a === undefined || b === undefined) return;
      let failed = false;
      switch (relation) {
        case 'eq': failed = a !== b; break;
        case 'gt': failed = a <= b; break;
        case 'lt': failed = a >= b; break;
        case 'gte': failed = a < b; break;
        case 'lte': failed = a > b; break;
        default: failed = false;
      }
      if (failed) {
        const v = { row: i, fieldA, fieldB, relation, message: `Cross-field violation: ${fieldA} ${relation} ${fieldB}` };
        violations.push(v);
        this._violations.push(v);
      }
    });
    return violations;
  }

  checkTemporal(data, dateField, beforeField) {
    if (!Array.isArray(data) || !dateField || !beforeField) return [];
    const violations = [];
    data.forEach((rec, i) => {
      const dateVal = new Date(rec[dateField]);
      const beforeVal = new Date(rec[beforeField]);
      if (isNaN(dateVal.getTime()) || isNaN(beforeVal.getTime())) return;
      if (dateVal >= beforeVal) {
        const v = { row: i, dateField, beforeField, message: `${dateField} must be before ${beforeField}` };
        violations.push(v);
        this._violations.push(v);
      }
    });
    return violations;
  }

  getViolations() {
    return [...this._violations];
  }

  clear() {
    this._violations = [];
  }
}

module.exports = { ConsistencyChecker };
