const EVENT_TYPES = [
  'workflow.created',
  'workflow.started',
  'workflow.step.started',
  'workflow.step.completed',
  'workflow.paused',
  'workflow.resumed',
  'workflow.failed',
  'workflow.completed',
  'workflow.cancelled',
  'workflow.retry',
  'workflow.rollback',
];

class WorkflowEvents {
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
    if (handlers) {
      for (const handler of handlers) {
        try { handler(entry); } catch (e) { /* silent */ }
      }
    }

    const wildcard = this._listeners.get('*');
    if (wildcard) {
      for (const handler of wildcard) {
        try { handler(entry); } catch (e) { /* silent */ }
      }
    }

    return entry;
  }

  getHistory(type, limit = 100) {
    let events = this._history;
    if (type) events = events.filter(e => e.type === type);
    return events.slice(-limit);
  }

  clear() {
    this._history = [];
  }
}

module.exports = { WorkflowEvents, EVENT_TYPES };
