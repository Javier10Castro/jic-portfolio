class PromptTemplates {
  constructor() {
    this._cache = new Map();
  }

  _parseVariables(templateText) {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    const seen = new Set();
    let match;
    while ((match = regex.exec(templateText)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        variables.push(match[1]);
      }
    }
    return variables;
  }

  compile(templateText) {
    if (this._cache.has(templateText)) {
      return { ...this._cache.get(templateText) };
    }

    const variables = this._parseVariables(templateText);

    const compiled = {
      variables,
      render: (vars) => {
        return this.render(templateText, vars);
      }
    };

    this._cache.set(templateText, { variables: [...variables] });
    return compiled;
  }

  render(templateText, variables) {
    const extracted = this._parseVariables(templateText);
    const missing = extracted.filter(v => variables[v] === undefined || variables[v] === null);
    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }

    let result = templateText;
    for (const key of extracted) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), variables[key]);
    }
    return result;
  }

  validate(templateText) {
    const errors = [];
    const malformed = templateText.match(/\{\{[^}]*$/gm);
    if (malformed) {
      errors.push('Unclosed placeholder found');
    }

    const openCount = (templateText.match(/\{\{/g) || []).length;
    const closeCount = (templateText.match(/\}\}/g) || []).length;
    if (openCount !== closeCount) {
      errors.push('Mismatched curly braces');
    }

    const validPattern = /\{\{\w+\}\}/g;
    const allPlaceholders = templateText.match(/\{\{[^}]+\}\}/g) || [];
    for (const ph of allPlaceholders) {
      if (!validPattern.test(ph)) {
        errors.push(`Invalid placeholder: ${ph}`);
      }
      validPattern.lastIndex = 0;
    }

    return { valid: errors.length === 0, errors };
  }

  extractVariables(templateText) {
    return this._parseVariables(templateText);
  }

  preview(templateText, variables) {
    const extracted = this._parseVariables(templateText);
    let result = templateText;
    for (const key of extracted) {
      if (variables[key] !== undefined && variables[key] !== null) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), variables[key]);
      } else {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `[${key}]`);
      }
    }
    return result;
  }

  clear() {
    this._cache.clear();
  }
}

module.exports = { PromptTemplates };
