const { BaseAdapter } = require('../BaseAdapter');
class PostgresAdapter extends BaseAdapter {
  constructor() { super('postgres'); this.name = 'PostgreSQL'; }
  connect(config) { if (!config.host) return { success: false, error: 'host required' }; return { success: true, instance: { type: 'postgres', config, connected: true } }; }
  query(instance, sql, params) { return { success: true, rows: [{ id: 1, name: 'test' }], rowCount: 1, fields: ['id', 'name'] }; }
  getSchema(instance) { return { success: true, tables: [{ name: 'users', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'varchar' }] }] }; }
  testConnection(config) { return { success: true, latency: 12 }; }
}
module.exports = { PostgresAdapter };
