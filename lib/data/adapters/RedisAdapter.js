const { BaseAdapter } = require('./BaseAdapter');
class RedisAdapter extends BaseAdapter {
  constructor() { super('redis'); this.name = 'Redis'; }
  connect(config) { if (!config.host) return { success: false, error: 'host required' }; return { success: true, instance: { type: 'redis', config, connected: true } }; }
  query(instance, command, args) { return { success: true, result: 'OK' }; }
  testConnection(config) { return { success: true, latency: 2 }; }
}
module.exports = { RedisAdapter };
