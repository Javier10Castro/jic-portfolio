class ConditionParser {
  constructor() {
    this.operators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'in', 'not_in', 'exists', 'not_exists', 'matches', 'starts_with', 'ends_with'];
  }

  parse(condition) {
    if (!condition || typeof condition !== 'object') return { field: '', operator: 'eq', value: null, tokens: [] };
    const tokens = this.tokenize(condition.field);
    return { ...condition, tokens };
  }

  parseExpression(expr) {
    if (!expr || typeof expr !== 'string') return { field: '', operator: 'eq', value: null };
    for (const op of this.operators.sort((a, b) => b.length - a.length)) {
      const escaped = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^(.+?)\\s+${escaped}\\s+(.+)$`);
      const match = expr.match(pattern);
      if (match) {
        let value = match[2].trim();
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (!isNaN(Number(value))) value = Number(value);
        else if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = null;
        return { field: match[1].trim(), operator: op, value };
      }
    }
    return { field: '', operator: 'eq', value: null };
  }

  tokenize(field) {
    if (!field || typeof field !== 'string') return [];
    return field.split('.').map(part => ({ type: 'identifier', value: part }));
  }

  validate(condition) {
    if (!condition || typeof condition !== 'object') return { valid: false, errors: ['Condition must be an object'] };
    const errors = [];
    if (!condition.field || typeof condition.field !== 'string') errors.push('Field is required and must be a string');
    if (!condition.operator || !this.operators.includes(condition.operator)) errors.push(`Operator must be one of: ${this.operators.join(', ')}`);
    if (condition.value === undefined || condition.value === null) errors.push('Value is required');
    return { valid: errors.length === 0, errors };
  }
}

module.exports = new ConditionParser();
