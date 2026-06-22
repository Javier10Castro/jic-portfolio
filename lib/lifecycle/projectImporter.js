class ProjectImporter {
  constructor() {
    this._imports = [];
    this._counter = 0;
  }

  importProject(data, format) {
    if (!data || !format) {
      throw new Error('Data and format are required');
    }
    const validFormats = ['json', 'yaml', 'zip'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format "${format}". Must be one of: ${validFormats.join(', ')}`);
    }
    const warnings = [];
    let parsed = null;
    try {
      if (format === 'json') {
        parsed = typeof data === 'string' ? JSON.parse(data) : data;
      } else {
        parsed = { raw: data };
      }
    } catch (err) {
      throw new Error(`Failed to parse ${format} data: ${err.message}`);
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Import data must be a valid object');
    }
    if (!parsed.name) {
      warnings.push('Imported data has no name');
    }
    const id = `import_${++this._counter}`;
    const result = {
      projectId: id,
      name: parsed.name || `imported_${this._counter}`,
      format,
      importedAt: new Date().toISOString(),
      warnings
    };
    this._imports.push(result);
    return result;
  }

  validateImport(data, format) {
    if (!data || !format) {
      return { valid: false, errors: ['Data and format are required'] };
    }
    const validFormats = ['json', 'yaml', 'zip'];
    if (!validFormats.includes(format)) {
      return { valid: false, errors: [`Invalid format "${format}"`] };
    }
    const errors = [];
    try {
      if (format === 'json') {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (!parsed || typeof parsed !== 'object') {
          errors.push('Data must be a valid object');
        }
      }
    } catch (err) {
      errors.push(`Parse error: ${err.message}`);
    }
    return { valid: errors.length === 0, errors };
  }

  getImportHistory() {
    return [...this._imports];
  }

  clear() {
    this._imports = [];
  }
}

module.exports = { ProjectImporter };
