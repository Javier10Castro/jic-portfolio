class EventDeadLetterQueue {
  constructor(options = {}) {
    this._maxSize = options.maxSize || 1000;
    this._events = [];
    this._onPush = options.onPush || null;
  }

  async push(event, errors = []) {
    if (this._events.length >= this._maxSize) this._events.shift();
    const entry = {
      event: JSON.parse(JSON.stringify(event)),
      errors,
      failedAt: Date.now(),
      retryCount: 0,
    };
    this._events.push(entry);
    if (this._onPush) this._onPush(entry);
    return entry;
  }

  async retry(index, eventBus) {
    const entry = this._events[index];
    if (!entry) return null;
    if (eventBus) {
      await eventBus.emit(entry.event.type, entry.event.payload, {
        source: 'deadLetter',
        correlationId: entry.event.correlationId,
        metadata: { ...entry.event.metadata, deadLetterRetry: entry.retryCount + 1 },
      });
    }
    entry.retryCount++;
    entry.lastRetriedAt = Date.now();
    return entry;
  }

  async retryAll(eventBus) {
    const results = [];
    for (let i = 0; i < this._events.length; i++) {
      const result = await this.retry(i, eventBus);
      results.push(result);
    }
    return results;
  }

  async remove(index) {
    if (index < 0 || index >= this._events.length) return false;
    this._events.splice(index, 1);
    return true;
  }

  async clear() {
    this._events = [];
  }

  list(filter = {}) {
    let results = this._events;
    if (filter.type) results = results.filter(e => e.event.type === filter.type);
    if (filter.since) results = results.filter(e => e.failedAt >= filter.since);
    if (filter.limit) results = results.slice(0, filter.limit);
    return results.map((e, i) => ({ index: i, ...e }));
  }

  count() {
    return this._events.length;
  }

  getStats() {
    const typeCounts = {};
    for (const entry of this._events) {
      const t = entry.event.type;
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    return {
      total: this._events.length,
      maxSize: this._maxSize,
      byType: typeCounts,
      totalRetries: this._events.reduce((s, e) => s + e.retryCount, 0),
    };
  }
}

module.exports = EventDeadLetterQueue;
