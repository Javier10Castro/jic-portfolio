class AgentComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, agents) {
    if (!appId || !Array.isArray(agents)) {
      return { composed: false, count: 0 };
    }
    const items = agents.map((a) => ({
      ...a,
      _id: a.id || `agent_${++this._counter}`,
    }));
    const existing = this._compositions.get(appId) || [];
    this._compositions.set(appId, [...existing, ...items]);
    return { composed: true, count: items.length };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  addAgent(appId, agent) {
    if (!appId || !agent) return null;
    const item = { ...agent, _id: agent.id || `agent_${++this._counter}` };
    const existing = this._compositions.get(appId) || [];
    existing.push(item);
    this._compositions.set(appId, existing);
    return item;
  }

  removeAgent(appId, agentId) {
    if (!appId || !agentId) return false;
    const existing = this._compositions.get(appId);
    if (!existing) return false;
    const filtered = existing.filter((a) => a._id !== agentId);
    if (filtered.length === existing.length) return false;
    this._compositions.set(appId, filtered);
    return true;
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { AgentComposer };
