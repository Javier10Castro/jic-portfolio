const EVENT_TYPES = [
  'cluster.started',
  'cluster.stopped',
  'cluster.worker.joined',
  'cluster.worker.left',
  'cluster.leader.changed',
  'cluster.task.dispatched',
  'cluster.task.completed',
  'cluster.task.failed',
  'cluster.failover',
  'cluster.heartbeat',
  'cluster.queue.depth',
  'cluster.load.balanced',
];

class ClusterEvents {
  constructor() {
    this._listeners = new Map();
    this._history = [];
    this._maxHistory = 1000;
  }

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

  emit(type, data = {}) {
    const entry = { type, timestamp: Date.now(), data };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) this._history.shift();
    const handlers = this._listeners.get(type);
    if (handlers) handlers.forEach(h => { try { h(entry); } catch (e) { } });
    const wildcard = this._listeners.get('*');
    if (wildcard) wildcard.forEach(h => { try { h(entry); } catch (e) { } });
  }

  getHistory(filter) {
    let entries = this._history;
    if (filter && filter.type) entries = entries.filter(e => e.type === filter.type);
    if (filter && filter.since) entries = entries.filter(e => e.timestamp >= filter.since);
    if (filter && filter.limit) entries = entries.slice(-filter.limit);
    return entries;
  }

  clear() {
    this._history = [];
    this._listeners.clear();
  }
}

module.exports = { ClusterEvents, EVENT_TYPES };
