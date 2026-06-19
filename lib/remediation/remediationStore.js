class RemediationStore {
  constructor(options = {}) {
    this._data = {
      history: [],
      state: {},
    };
    this._maxHistory = options.maxHistory || 1000;
    this._filePath = options.filePath || null;
  }

  addHistory(entry) {
    this._data.history.push({ ...entry, storedAt: Date.now() });
    if (this._data.history.length > this._maxHistory) {
      this._data.history.splice(0, this._data.history.length - this._maxHistory);
    }
    if (this._filePath) this._persist();
    return entry;
  }

  getHistory(filter = {}) {
    let results = this._data.history;
    if (filter.action) results = results.filter(h => h.action === filter.action);
    if (filter.success !== undefined) results = results.filter(h => h.success === filter.success);
    if (filter.since) results = results.filter(h => h.timestamp >= filter.since);
    if (filter.policyId) results = results.filter(h => h.policyId === filter.policyId);
    return results.slice(-(filter.limit || 200));
  }

  getHistoryStats() {
    const total = this._data.history.length;
    const succeeded = this._data.history.filter(h => h.success).length;
    const failed = this._data.history.filter(h => !h.success).length;
    const byAction = {};
    for (const h of this._data.history) {
      byAction[h.action] = (byAction[h.action] || 0) + 1;
    }
    return { total, succeeded, failed, byAction };
  }

  setState(key, value) {
    this._data.state[key] = { value, updatedAt: Date.now() };
    if (this._filePath) this._persist();
  }

  getState(key) {
    return this._data.state[key]?.value ?? null;
  }

  getAllState() {
    return Object.entries(this._data.state).reduce((acc, [k, v]) => {
      acc[k] = v.value;
      return acc;
    }, {});
  }

  clear() {
    this._data = { history: [], state: {} };
  }

  toJSON() {
    return {
      version: '1.0',
      data: this._data,
      exportedAt: Date.now(),
    };
  }

  fromJSON(json) {
    if (json?.version === '1.0' && json.data) {
      this._data = json.data;
      return true;
    }
    return false;
  }

  _persist() {
    if (!this._filePath) return;
    try {
      const fs = require('fs');
      fs.writeFileSync(this._filePath, JSON.stringify(this.toJSON(), null, 2), 'utf8');
    } catch (e) {}
  }
}

module.exports = RemediationStore;
