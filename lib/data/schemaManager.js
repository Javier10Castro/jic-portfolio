class SchemaManager {
  constructor() { this._schemas = {}; }

  define(name, schema) { this._schemas[name] = { ...schema, definedAt: Date.now() }; }
  get(name) { return this._schemas[name] || null; }
  drop(name) { delete this._schemas[name]; }
  list() { return Object.entries(this._schemas).map(([name, s]) => ({ name, fields: Object.keys(s).filter(k => k !== 'definedAt') })); }
  count() { return Object.keys(this._schemas).length; }
  clear() { this._schemas = {}; }
}
module.exports = { SchemaManager };
