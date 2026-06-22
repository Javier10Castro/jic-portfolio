class IntegrityChecker {
  constructor() {
    this._results = [];
  }

  checkReferential(data, references) {
    if (!Array.isArray(data) || !Array.isArray(references)) return [];
    const violations = [];
    data.forEach((rec, i) => {
      references.forEach(ref => {
        const val = rec[ref.field];
        if (val !== undefined && val !== null) {
          const exists = data.some(r => r[ref.references] === val);
          if (!exists) {
            const v = { row: i, field: ref.field, message: `Referential integrity violation: ${ref.field} -> ${ref.references}` };
            violations.push(v);
            this._results.push(v);
          }
        }
      });
    });
    return violations;
  }

  checkNotNull(data, fields) {
    if (!Array.isArray(data) || !Array.isArray(fields)) return [];
    const violations = [];
    data.forEach((rec, i) => {
      fields.forEach(field => {
        if (rec[field] === undefined || rec[field] === null || rec[field] === '') {
          const v = { row: i, field, message: `Not-null constraint violated on ${field}` };
          violations.push(v);
          this._results.push(v);
        }
      });
    });
    return violations;
  }

  checkUnique(data, fields) {
    if (!Array.isArray(data) || !Array.isArray(fields)) return [];
    const violations = [];
    const seen = {};
    data.forEach((rec, i) => {
      const fingerprint = fields.map(f => String(rec[f] || '')).join('|');
      if (seen[fingerprint] !== undefined) {
        const v = { row: i, fields, message: `Unique constraint violated: ${fingerprint}` };
        violations.push(v);
        this._results.push(v);
      } else {
        seen[fingerprint] = i;
      }
    });
    return violations;
  }

  checkCustom(data, checks) {
    if (!Array.isArray(data) || !Array.isArray(checks)) return [];
    const violations = [];
    data.forEach((rec, i) => {
      checks.forEach(check => {
        if (typeof check.fn === 'function' && !check.fn(rec)) {
          const v = { row: i, message: check.message || 'Custom check failed' };
          violations.push(v);
          this._results.push(v);
        }
      });
    });
    return violations;
  }

  getResults() {
    return [...this._results];
  }

  clear() {
    this._results = [];
  }
}

module.exports = { IntegrityChecker };
