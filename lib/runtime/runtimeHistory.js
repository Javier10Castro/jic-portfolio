class RuntimeHistory {
  constructor() {
    this._entries = [];
    this._nextId = 1;
  }

  record(entry) {
    if (!entry || !entry.type || !entry.source || !entry.action) {
      return null;
    }
    const record = {
      id: this._nextId++,
      type: entry.type,
      source: entry.source,
      action: entry.action,
      details: entry.details || null,
      timestamp: entry.timestamp || Date.now(),
    };
    this._entries.push(record);
    return record;
  }

  query(filters) {
    let results = this._entries.slice();
    if (filters) {
      if (filters.type) {
        results = results.filter(function (e) {
          return e.type === filters.type;
        });
      }
      if (filters.source) {
        results = results.filter(function (e) {
          return e.source === filters.source;
        });
      }
      if (filters.action) {
        results = results.filter(function (e) {
          return e.action === filters.action;
        });
      }
      if (filters.since !== undefined) {
        results = results.filter(function (e) {
          return e.timestamp >= filters.since;
        });
      }
      if (filters.limit !== undefined && filters.limit > 0) {
        results = results.slice(-filters.limit);
      }
    }
    return results;
  }

  get(id) {
    for (const entry of this._entries) {
      if (entry.id === id) {
        return entry;
      }
    }
    return null;
  }

  getStats() {
    const byType = {};
    const bySource = {};
    for (const entry of this._entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;
    }
    return {
      total: this._entries.length,
      byType: byType,
      bySource: bySource,
    };
  }

  clear() {
    this._entries = [];
    this._nextId = 1;
  }
}

module.exports = { RuntimeHistory };
