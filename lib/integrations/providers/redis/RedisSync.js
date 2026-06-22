class RedisSync {
  constructor(config = {}) {
    this.config = config;
    this.connected = false;
    this.host = config.host || 'localhost';
    this.port = config.port || 6379;
    this.password = config.password || null;
    this.db = config.db || 0;
    this._store = {};
    this._subscribers = {};
  }

  connect() {
    this.connected = true;
    return { success: true, message: `Connected to Redis at ${this.host}:${this.port}` };
  }

  async disconnect() {
    this.connected = false;
    this._store = {};
    this._subscribers = {};
    return { success: true, message: 'Disconnected from Redis' };
  }

  async get(key) {
    return {
      success: true,
      data: {
        key,
        value: this._store[key] || null,
      },
    };
  }

  async set(key, value) {
    this._store[key] = value;
    return { success: true, data: { key, value }, message: 'OK' };
  }

  async delete(key) {
    const existed = key in this._store;
    delete this._store[key];
    return { success: true, data: { deleted: existed ? 1 : 0 } };
  }

  async keys(pattern = '*') {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched = Object.keys(this._store).filter(k => regex.test(k));
    return {
      success: true,
      data: matched,
      count: matched.length,
    };
  }

  async publish(channel, message) {
    const handlers = this._subscribers[channel] || [];
    for (const handler of handlers) {
      try { handler(message, channel); } catch (e) { /* ignore */ }
    }
    return { success: true, data: { channel, message, listeners: handlers.length } };
  }

  async subscribe(channel, handler) {
    if (!this._subscribers[channel]) {
      this._subscribers[channel] = [];
    }
    this._subscribers[channel].push(handler);
    return { success: true, data: { channel, subscribed: true } };
  }

  async testConnection() {
    const start = Date.now();
    try {
      await this.connect();
      return { success: true, latency: Date.now() - start };
    } catch (err) {
      return { success: false, latency: Date.now() - start, error: err.message };
    }
  }
}

module.exports = { RedisSync };
