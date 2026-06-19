class SharedMemory {
  constructor() {
    this._artifacts = new Map();
    this._messages = [];
    this._context = {};
    this._maxMessages = 500;
  }

  setContext(key, value) {
    this._context[key] = value;
  }

  getContext(key) {
    return this._context[key];
  }

  getAllContext() {
    return { ...this._context };
  }

  addArtifact(name, data, meta = {}) {
    this._artifacts.set(name, { data, meta, createdAt: Date.now() });
  }

  getArtifact(name) {
    const art = this._artifacts.get(name);
    return art ? art.data : null;
  }

  hasArtifact(name) {
    return this._artifacts.has(name);
  }

  listArtifacts() {
    const list = [];
    for (const [name, art] of this._artifacts) {
      list.push({ name, meta: art.meta, createdAt: art.createdAt });
    }
    return list;
  }

  removeArtifact(name) {
    this._artifacts.delete(name);
  }

  addMessage(from, to, type, payload) {
    const msg = { from, to, type, payload, timestamp: Date.now(), id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` };
    this._messages.push(msg);
    if (this._messages.length > this._maxMessages) {
      this._messages = this._messages.slice(-this._maxMessages);
    }
    return msg;
  }

  getMessages(agentId, limit = 50) {
    const msgs = agentId ? this._messages.filter(m => m.from === agentId || m.to === agentId) : this._messages;
    return msgs.slice(-limit);
  }

  clear() {
    this._artifacts.clear();
    this._messages = [];
    this._context = {};
  }

  snapshot() {
    return {
      artifacts: this.listArtifacts(),
      messageCount: this._messages.length,
      contextKeys: Object.keys(this._context),
    };
  }
}

module.exports = SharedMemory;
