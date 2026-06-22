class DataWarehouse {
  constructor() { this._tables = {}; }
  createTable(name, schema) { this._tables[name] = { schema, rows: [], createdAt: Date.now() }; return { success: true }; }
  insert(tableName, row) { const t = this._tables[tableName]; if (!t) return { success: false, error: 'Table not found' }; t.rows.push({ ...row, insertedAt: Date.now() }); return { success: true }; }
  query(tableName, filter) {
    const t = this._tables[tableName];
    if (!t) return { success: false, error: 'Table not found' };
    let rows = [...t.rows];
    if (filter) Object.entries(filter).forEach(([k, v]) => { rows = rows.filter(r => r[k] === v); });
    return { success: true, rows, total: rows.length };
  }
  listTables() { return Object.keys(this._tables); }
  dropTable(name) { delete this._tables[name]; return { success: true }; }
  count() { return Object.keys(this._tables).length; }
  clear() { this._tables = {}; }
}
module.exports = { DataWarehouse };
