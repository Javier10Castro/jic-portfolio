const { BaseAdapter } = require('./BaseAdapter');
class SQLiteAdapter extends BaseAdapter {
  constructor() { super('sqlite'); this.name = 'SQLite'; }
  connect(config) { if (!config.filename) return { success: false, error: 'filename required' }; return { success: true, instance: { type: 'sqlite', config, connected: true } }; }
  query(instance, sql, params) { return { success: true, rows: [{ id: 1, name: 'test' }], rowCount: 1 }; }
  getSchema(instance) { return { success: true, tables: [{ name: 'config', columns: [{ name: 'key', type: 'text' }] }] }; }
  testConnection(config) { return { success: true, latency: 3 }; }
}
module.exports = { SQLiteAdapter };
