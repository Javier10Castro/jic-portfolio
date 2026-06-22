class LeaderRuntime {
  constructor() {
    this._leaders = {};
  }

  electLeader(group) {
    if (!group) {
      return null;
    }
    if (!this._leaders[group]) {
      this._leaders[group] = { nodeId: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, electedAt: Date.now() };
    }
    return this._leaders[group].nodeId;
  }

  isLeader(group, nodeId) {
    if (!group || !nodeId) {
      return false;
    }
    const leader = this._leaders[group];
    if (!leader) {
      return false;
    }
    return leader.nodeId === nodeId;
  }

  getLeader(group) {
    if (!group) {
      return null;
    }
    const leader = this._leaders[group];
    if (!leader) {
      return null;
    }
    return leader.nodeId;
  }

  stepDown(group) {
    if (!group) {
      return false;
    }
    if (!this._leaders[group]) {
      return false;
    }
    delete this._leaders[group];
    return true;
  }

  listGroups() {
    const result = [];
    for (const group of Object.keys(this._leaders)) {
      result.push({ group: group, leader: this._leaders[group].nodeId, electedAt: this._leaders[group].electedAt });
    }
    return result;
  }

  clear() {
    this._leaders = {};
  }
}

module.exports = { LeaderRuntime };
