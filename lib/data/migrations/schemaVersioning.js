class SchemaVersioning {
  constructor() {
    this._schemas = {};
  }

  registerSchema(name, version, schema) {
    if (!name) return null;
    if (!this._schemas[name]) this._schemas[name] = [];
    const ver = version || 1;
    this._schemas[name].push({ version: ver, schema: schema || {}, registeredAt: Date.now() });
    return { name, version: ver };
  }

  getSchema(name) {
    if (!this._schemas[name] || this._schemas[name].length === 0) return null;
    const versions = this._schemas[name];
    return { ...versions[versions.length - 1] };
  }

  getSchemaVersion(name, version) {
    if (!this._schemas[name]) return null;
    const found = this._schemas[name].find(v => v.version === version);
    return found ? { ...found } : null;
  }

  listVersions(name) {
    if (!this._schemas[name]) return [];
    return this._schemas[name].map(v => ({ version: v.version, registeredAt: v.registeredAt }));
  }

  getCurrentVersion(name) {
    if (!this._schemas[name] || this._schemas[name].length === 0) return null;
    return this._schemas[name][this._schemas[name].length - 1].version;
  }

  clear() {
    this._schemas = {};
  }
}

module.exports = { SchemaVersioning };
