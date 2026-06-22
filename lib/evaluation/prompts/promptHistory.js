class PromptHistory {
  constructor() {
    this._entries = [];
    this._counter = 0;
  }

  record(action, promptId, details) {
    this._counter++;
    const entry = {
      id: `hist_${this._counter}`,
      action,
      promptId,
      details: details || {},
      timestamp: new Date().toISOString()
    };
    this._entries.push(entry);
    return { ...entry };
  }

  query(filter) {
    let results = [...this._entries];

    if (filter) {
      if (filter.promptId) {
        results = results.filter(e => e.promptId === filter.promptId);
      }
      if (filter.action) {
        results = results.filter(e => e.action === filter.action);
      }
      if (filter.since) {
        const since = new Date(filter.since);
        results = results.filter(e => new Date(e.timestamp) >= since);
      }
      if (filter.until) {
        const until = new Date(filter.until);
        results = results.filter(e => new Date(e.timestamp) <= until);
      }
      if (filter.limit) {
        results = results.slice(0, filter.limit);
      }
    }

    return results.map(e => ({ ...e }));
  }

  get(id) {
    const found = this._entries.find(e => e.id === id);
    return found ? { ...found } : null;
  }

  stats(promptId) {
    const filtered = promptId
      ? this._entries.filter(e => e.promptId === promptId)
      : this._entries;

    if (filtered.length === 0) {
      return {
        totalChanges: 0,
        byAction: {},
        firstChange: null,
        lastChange: null
      };
    }

    const byAction = {};
    for (const entry of filtered) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
    }

    const sorted = [...filtered].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
      totalChanges: filtered.length,
      byAction,
      firstChange: sorted[0].timestamp,
      lastChange: sorted[sorted.length - 1].timestamp
    };
  }

  clear() {
    this._entries = [];
    this._counter = 0;
  }
}

module.exports = { PromptHistory };
