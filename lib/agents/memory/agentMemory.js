class AgentMemory {
  constructor(agentId) {
    this.agentId = agentId;
    this._store = new Map();
    this._history = [];
    this._maxHistory = 100;
  }

  set(key, value) {
    this._store.set(key, { value, timestamp: Date.now() });
  }

  get(key) {
    const entry = this._store.get(key);
    return entry ? entry.value : null;
  }

  has(key) {
    return this._store.has(key);
  }

  delete(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
    this._history = [];
  }

  remember(event, data) {
    this._history.push({ event, data, timestamp: Date.now() });
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(-this._maxHistory);
    }
  }

  recall(event) {
    return this._history.filter(h => h.event === event);
  }

  getHistory(limit = 50) {
    return this._history.slice(-limit);
  }

  snapshot() {
    const store = {};
    for (const [key, entry] of this._store) {
      store[key] = entry.value;
    }
    return { agentId: this.agentId, store, history: this._history.slice(-20) };
  }

  size() {
    return this._store.size;
  }
}

module.exports = AgentMemory;
