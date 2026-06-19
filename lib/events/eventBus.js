const EventStore = require('./eventStore');
const EventSchemaRegistry = require('./eventSchemaRegistry');
const { EventSerializer } = require('./eventSerializer');

class EventBus {
  constructor(options = {}) {
    this._listeners = new Map();
    this._asyncListeners = new Map();
    this._store = options.store || new EventStore();
    this._schemaRegistry = options.schemaRegistry || new EventSchemaRegistry();
    this._history = [];
    this._maxHistory = 2000;
    this._enabled = true;
    this._onEmit = options.onEmit || null;
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }

  on(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const handlers = this._listeners.get(type);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  onAsync(type, handler) {
    if (!this._asyncListeners.has(type)) this._asyncListeners.set(type, []);
    this._asyncListeners.get(type).push(handler);
    return () => this.offAsync(type, handler);
  }

  offAsync(type, handler) {
    const handlers = this._asyncListeners.get(type);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  async emit(type, payload, options = {}) {
    if (!this._enabled) return null;

    const event = EventSerializer.normalize(type, payload, options);

    if (this._schemaRegistry.hasSchema(type)) {
      const validation = this._schemaRegistry.validate(type, event.payload);
      if (!validation.valid) {
        const dlq = options.deadLetterQueue || this._deadLetterQueue;
        if (dlq) await dlq.push(event, validation.errors);
        return null;
      }
    }

    const entry = { ...event, _emittedAt: Date.now() };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) this._history.shift();

    await this._store.append(event);

    const syncHandlers = this._listeners.get(type) || [];
    const wildcardSync = this._listeners.get('*') || [];
    for (const handler of [...syncHandlers, ...wildcardSync]) {
      try { handler(event); } catch (e) { /* silent */ }
    }

    const asyncHandlers = this._asyncListeners.get(type) || [];
    const wildcardAsync = this._asyncListeners.get('*') || [];
    const allAsync = [...asyncHandlers, ...wildcardAsync];
    if (allAsync.length > 0) {
      await Promise.all(allAsync.map(h => {
        try { return h(event); } catch (e) { return Promise.resolve(); }
      }));
    }

    if (this._onEmit) this._onEmit(event);

    return event;
  }

  async emitSync(type, payload, options = {}) {
    return this.emit(type, payload, { ...options, sync: true });
  }

  getHistory(filter = {}) {
    let entries = this._history;
    if (filter.type) entries = entries.filter(e => e.type === filter.type);
    if (filter.source) entries = entries.filter(e => e.source === filter.source);
    if (filter.since) entries = entries.filter(e => e.timestamp >= filter.since);
    if (filter.limit) entries = entries.slice(-filter.limit);
    return entries;
  }

  setDeadLetterQueue(dlq) {
    this._deadLetterQueue = dlq;
  }

  getStore() { return this._store; }
  getSchemaRegistry() { return this._schemaRegistry; }

  listenerCount(type) {
    const sync = (this._listeners.get(type) || []).length;
    const async = (this._asyncListeners.get(type) || []).length;
    return sync + async;
  }

  clear() {
    this._listeners.clear();
    this._asyncListeners.clear();
    this._history = [];
  }
}

module.exports = EventBus;
