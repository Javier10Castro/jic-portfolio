const { EventSerializer } = require('./eventSerializer');

class EventStore {
  constructor() {
    this._events = [];
    this._indexByType = new Map();
    this._indexByCorrelation = new Map();
    this._indexBySource = new Map();
    this._maxEvents = 50000;
  }

  async append(event) {
    const normalized = EventSerializer.clone(event);
    normalized.storedAt = Date.now();
    this._events.push(normalized);

    if (!this._indexByType.has(normalized.type)) this._indexByType.set(normalized.type, []);
    this._indexByType.get(normalized.type).push(this._events.length - 1);

    if (normalized.correlationId) {
      if (!this._indexByCorrelation.has(normalized.correlationId)) this._indexByCorrelation.set(normalized.correlationId, []);
      this._indexByCorrelation.get(normalized.correlationId).push(this._events.length - 1);
    }

    if (normalized.source) {
      if (!this._indexBySource.has(normalized.source)) this._indexBySource.set(normalized.source, []);
      this._indexBySource.get(normalized.source).push(this._events.length - 1);
    }

    if (this._events.length > this._maxEvents) this._events.shift();

    return normalized;
  }

  async getById(eventId) {
    return this._events.find(e => e.id === eventId) || null;
  }

  async query(filter = {}) {
    let results = this._events;

    if (filter.type) results = results.filter(e => e.type === filter.type);
    if (filter.source) results = results.filter(e => e.source === filter.source);
    if (filter.correlationId) results = results.filter(e => e.correlationId === filter.correlationId);
    if (filter.since) results = results.filter(e => e.timestamp >= filter.since);
    if (filter.until) results = results.filter(e => e.timestamp <= filter.until);
    if (filter.severity) results = results.filter(e => e.severity === filter.severity);
    if (filter.typePattern) {
      const re = new RegExp(filter.typePattern.replace(/\*/g, '.*'));
      results = results.filter(e => re.test(e.type));
    }

    if (filter.sort === 'asc') results = [...results].sort((a, b) => a.timestamp - b.timestamp);
    else results = [...results].sort((a, b) => b.timestamp - a.timestamp);

    if (filter.offset) results = results.slice(filter.offset);
    if (filter.limit) results = results.slice(0, filter.limit);

    return results;
  }

  async count(filter = {}) {
    const results = await this.query(filter);
    return results.length;
  }

  async getTimeRange(filter = {}) {
    let events = this._events;
    if (filter.type) events = events.filter(e => e.type === filter.type);
    if (filter.source) events = events.filter(e => e.source === filter.source);
    if (filter.correlationId) events = events.filter(e => e.correlationId === filter.correlationId);
    if (events.length === 0) return null;
    return {
      start: Math.min(...events.map(e => e.timestamp)),
      end: Math.max(...events.map(e => e.timestamp)),
      count: events.length,
    };
  }

  async getTypes() {
    return Array.from(this._indexByType.keys());
  }

  async getSources() {
    return Array.from(this._indexBySource.keys());
  }

  async clear() {
    this._events = [];
    this._indexByType.clear();
    this._indexByCorrelation.clear();
    this._indexBySource.clear();
  }

  async snapshot() {
    return {
      totalEvents: this._events.length,
      uniqueTypes: this._indexByType.size,
      uniqueSources: this._indexBySource.size,
      uniqueCorrelations: this._indexByCorrelation.size,
      maxEvents: this._maxEvents,
    };
  }
}

module.exports = EventStore;
