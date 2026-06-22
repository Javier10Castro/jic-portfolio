class DatasetImporter {
  constructor() {
    this.data = new Map();
  }

  importJSON(json) {
    let parsed;
    if (typeof json === 'string') {
      try {
        parsed = JSON.parse(json);
      } catch {
        return { success: false, error: 'Invalid JSON string' };
      }
    } else {
      parsed = json;
    }
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'JSON must be an array of entries' };
    }
    const validation = this.validateEntries(parsed);
    if (!validation.valid) {
      return { success: false, error: validation.error, entries: [] };
    }
    return { success: true, entries: parsed, count: parsed.length };
  }

  importCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'CSV must have a header row and at least one data row' };
    }
    const headers = this._parseCSVLine(lines[0]);
    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this._parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;
      const entry = {};
      for (let j = 0; j < headers.length; j++) {
        entry[headers[j].trim()] = this._coerceValue(values[j].trim());
      }
      entries.push(entry);
    }
    return { success: true, entries, count: entries.length };
  }

  importFromFile(filePath) {
    return {
      success: true,
      entries: [],
      filePath,
      count: 0,
      message: 'Simulated import from ' + filePath,
    };
  }

  validateEntries(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { valid: false, error: 'Entries must be a non-empty array' };
    }
    for (let i = 0; i < entries.length; i++) {
      if (typeof entries[i] !== 'object' || entries[i] === null || Array.isArray(entries[i])) {
        return { valid: false, error: `Entry at index ${i} must be a plain object` };
      }
    }
    return { valid: true };
  }

  clear() {
    this.data.clear();
  }

  _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  _coerceValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value === '' || value === 'undefined') return undefined;
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return num;
    return value;
  }
}

module.exports = DatasetImporter;
