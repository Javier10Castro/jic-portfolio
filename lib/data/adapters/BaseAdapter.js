class BaseAdapter {
  constructor(type) { this.type = type; }
  connect(config) { return { success: true, instance: { type: this.type, config } }; }
  disconnect(instance) { return { success: true }; }
  query(instance, sql, params) { return { success: true, rows: [], fields: [] }; }
  getSchema(instance) { return { success: true, tables: [] }; }
  testConnection(config) { return { success: true, latency: Math.floor(Math.random() * 50) + 5 }; }
}
module.exports = { BaseAdapter };
