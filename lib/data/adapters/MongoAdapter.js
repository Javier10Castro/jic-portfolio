const { BaseAdapter } = require('./BaseAdapter');
class MongoAdapter extends BaseAdapter {
  constructor() { super('mongodb'); this.name = 'MongoDB'; }
  connect(config) { if (!config.uri) return { success: false, error: 'uri required' }; return { success: true, instance: { type: 'mongodb', config, connected: true } }; }
  query(instance, collection, filter) { return { success: true, documents: [{ _id: '1', name: 'doc' }], count: 1 }; }
  getSchema(instance) { return { success: true, collections: [{ name: 'documents' }] }; }
  testConnection(config) { return { success: true, latency: 20 }; }
}
module.exports = { MongoAdapter };
