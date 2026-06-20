class WebhookProcessor {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._handlers = {};
    this._logs = [];
  }

  registerHandler(provider, event, handler) {
    const key = `${provider}:${event}`;
    if (!this._handlers[key]) this._handlers[key] = [];
    this._handlers[key].push(handler);
  }

  process(provider, event, payload, options = {}) {
    const log = {
      id: `wh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      provider, event, payload, status: 'received', timestamp: Date.now()
    };
    this._logs.push(log);
    if (this._events) this._events.emit('webhook.received', { provider, event, payload });
    const key = `${provider}:${event}`;
    const handlers = this._handlers[key] || [];
    const wildcard = this._handlers[`${provider}:*`] || [];
    const results = [];
    [...handlers, ...wildcard].forEach(h => {
      try { results.push(h(payload, options)); } catch (e) { results.push({ error: e.message }); }
    });
    log.status = results.some(r => r && r.error) ? 'failed' : 'processed';
    log.results = results;
    if (this._events) this._events.emit('webhook.processed', { provider, event, status: log.status });
    return log;
  }

  getLogs(limit = 50) { return this._logs.slice(-limit); }
  clear() { this._logs = []; this._handlers = {}; }
}

module.exports = { WebhookProcessor };
