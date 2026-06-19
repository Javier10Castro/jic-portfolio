const EVENT_TYPES = [
  'agent.started', 'agent.completed', 'agent.failed',
  'agent.retry', 'agent.timeout',
  'agent.review.started', 'agent.review.completed',
  'workflow.started', 'workflow.completed', 'workflow.failed',
  'consensus.reached', 'consensus.conflict',
  'memory.shared.updated', 'memory.working.cleared',
];

class AgentEvents {
  constructor() {
    this._listeners = new Map();
    this._history = [];
    this._maxHistory = 500;
  }

  on(eventType, handler) {
    if (!EVENT_TYPES.includes(eventType)) {
      console.warn(`[AgentEvents] Unknown event type: "${eventType}"`);
    }
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, []);
    }
    this._listeners.get(eventType).push(handler);
    return () => this._off(eventType, handler);
  }

  emit(eventType, data = {}) {
    const entry = { type: eventType, data, timestamp: Date.now() };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) this._history.shift();

    const handlers = this._listeners.get(eventType) || [];
    for (const handler of handlers) {
      try { handler(entry); } catch (err) { console.error(`[AgentEvents] handler error: ${err.message}`); }
    }
    return entry;
  }

  getHistory(eventType, limit = 100) {
    const events = eventType ? this._history.filter(e => e.type === eventType) : this._history;
    return events.slice(-limit);
  }

  clear() {
    this._listeners.clear();
    this._history = [];
  }

  _off(eventType, handler) {
    const handlers = this._listeners.get(eventType);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  static getTypes() {
    return [...EVENT_TYPES];
  }
}

module.exports = { AgentEvents, EVENT_TYPES };
