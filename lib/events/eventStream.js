class EventStream {
  constructor(eventBus, options = {}) {
    this._eventBus = eventBus;
    this._bufferSize = options.bufferSize || 100;
    this._maxSubscribers = options.maxSubscribers || 1000;
    this._subscribers = new Map();
    this._buffer = [];
    this._running = false;
  }

  subscribe(filter, callback) {
    const id = 'sub-' + Math.random().toString(36).substring(2, 10);
    this._subscribers.set(id, { filter: filter || {}, callback, buffer: [] });
    if (this._subscribers.size > this._maxSubscribers) {
      const firstKey = this._subscribers.keys().next().value;
      this._subscribers.delete(firstKey);
    }
    return id;
  }

  unsubscribe(id) {
    this._subscribers.delete(id);
  }

  async start() {
    if (this._running) return;
    this._running = true;
    this._unsubscribe = this._eventBus.on('*', (event) => this._onEvent(event));
  }

  stop() {
    this._running = false;
    if (this._unsubscribe) this._unsubscribe();
    this._unsubscribe = null;
  }

  isRunning() {
    return this._running;
  }

  _onEvent(event) {
    this._buffer.push(event);
    if (this._buffer.length > this._bufferSize) this._buffer.shift();

    for (const [, sub] of this._subscribers) {
      if (this._matches(event, sub.filter)) {
        sub.buffer.push(event);
        if (sub.buffer.length > this._bufferSize) sub.buffer.shift();
        try { sub.callback(event); } catch (e) { /* silent */ }
      }
    }
  }

  _matches(event, filter) {
    if (filter.type && event.type !== filter.type) return false;
    if (filter.source && event.source !== filter.source) return false;
    if (filter.severity && event.severity !== filter.severity) return false;
    if (filter.correlationId && event.correlationId !== filter.correlationId) return false;
    if (filter.typePattern) {
      const re = new RegExp(filter.typePattern.replace(/\*/g, '.*'));
      if (!re.test(event.type)) return false;
    }
    return true;
  }

  getSubscriberBuffer(subId) {
    const sub = this._subscribers.get(subId);
    return sub ? sub.buffer : [];
  }

  getBuffer() {
    return [...this._buffer];
  }

  subscriberCount() {
    return this._subscribers.size;
  }

  clearBuffers() {
    this._buffer = [];
    for (const [, sub] of this._subscribers) sub.buffer = [];
  }
}

module.exports = EventStream;
