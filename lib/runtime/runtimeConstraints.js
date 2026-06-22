class RuntimeConstraints {
  constructor() {
    this._constraints = {};
  }

  addConstraint(name, constraint) {
    if (!name || !constraint) {
      return false;
    }
    if (!constraint.name || !constraint.field || !constraint.operator || constraint.value === undefined || !constraint.message) {
      return false;
    }
    const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'exists', 'regex'];
    if (!validOperators.includes(constraint.operator)) {
      return false;
    }
    if (this._constraints[name]) {
      return false;
    }
    this._constraints[name] = {
      name: constraint.name,
      field: constraint.field,
      operator: constraint.operator,
      value: constraint.value,
      message: constraint.message
    };
    return true;
  }

  removeConstraint(name) {
    if (!name) {
      return false;
    }
    if (!this._constraints[name]) {
      return false;
    }
    delete this._constraints[name];
    return true;
  }

  checkConstraint(constraint, data) {
    if (!constraint || !data) {
      return { passed: false, message: 'Invalid constraint or data' };
    }
    const fieldValue = data[constraint.field];
    switch (constraint.operator) {
      case 'eq':
        return { passed: fieldValue === constraint.value, message: fieldValue === constraint.value ? '' : constraint.message };
      case 'ne':
        return { passed: fieldValue !== constraint.value, message: fieldValue !== constraint.value ? '' : constraint.message };
      case 'gt':
        return { passed: fieldValue > constraint.value, message: fieldValue > constraint.value ? '' : constraint.message };
      case 'gte':
        return { passed: fieldValue >= constraint.value, message: fieldValue >= constraint.value ? '' : constraint.message };
      case 'lt':
        return { passed: fieldValue < constraint.value, message: fieldValue < constraint.value ? '' : constraint.message };
      case 'lte':
        return { passed: fieldValue <= constraint.value, message: fieldValue <= constraint.value ? '' : constraint.message };
      case 'in':
        return { passed: Array.isArray(constraint.value) && constraint.value.includes(fieldValue), message: Array.isArray(constraint.value) && constraint.value.includes(fieldValue) ? '' : constraint.message };
      case 'nin':
        return { passed: !Array.isArray(constraint.value) || !constraint.value.includes(fieldValue), message: !Array.isArray(constraint.value) || !constraint.value.includes(fieldValue) ? '' : constraint.message };
      case 'exists':
        return { passed: fieldValue !== undefined && fieldValue !== null, message: fieldValue !== undefined && fieldValue !== null ? '' : constraint.message };
      case 'regex':
        try {
          const regex = new RegExp(constraint.value);
          return { passed: regex.test(String(fieldValue)), message: regex.test(String(fieldValue)) ? '' : constraint.message };
        } catch (e) {
          return { passed: false, message: 'Invalid regex pattern' };
        }
      default:
        return { passed: false, message: 'Unknown operator' };
    }
  }

  checkAll(data) {
    if (!data) {
      return { passed: [], failed: [] };
    }
    const passed = [];
    const failed = [];
    for (const name of Object.keys(this._constraints)) {
      const constraint = this._constraints[name];
      const result = this.checkConstraint(constraint, data);
      if (result.passed) {
        passed.push({ name: name, constraint: constraint });
      } else {
        failed.push({ name: name, constraint: constraint, message: result.message });
      }
    }
    return { passed: passed, failed: failed };
  }

  listConstraints() {
    const result = [];
    for (const name of Object.keys(this._constraints)) {
      const c = this._constraints[name];
      result.push({ name: c.name, field: c.field, operator: c.operator, value: c.value, message: c.message });
    }
    return result;
  }

  clear() {
    this._constraints = {};
  }
}

module.exports = { RuntimeConstraints };
