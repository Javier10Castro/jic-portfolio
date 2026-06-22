const { BaseAdapter } = require('./BaseAdapter');
class MySQLAdapter extends BaseAdapter {
  constructor() { super('mysql'); this.name = 'MySQL'; }
  connect(config) { if (!config.host) return { success: false, error: 'host required' }; return { success: true, instance: { type: 'mysql', config, connected: true } }; }
  query(instance, sql, params) { return { success: true, rows: [{ id: 1, value: 'data' }], rowCount: 1 }; }
  getSchema(instance) { return { success: true, tables: [{ name: 'items', columns: [{ name: 'id', type: 'int' }] }] }; }
  testConnection(config) { return { success: true, latency: 15 }; }
}
module.exports = { MySQLAdapter };
