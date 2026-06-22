class IntegrationAudit {
  constructor({ storage }) {
    this._storage = storage;
    this._entries = [];
  }

  log(provider, action, details) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      provider,
      action,
      details: details || {}
    };
    this._entries.push(entry);
    return entry;
  }

  query(filter) {
    let results = this._entries;
    if (filter) {
      if (filter.provider) {
        results = results.filter(e => e.provider === filter.provider);
      }
      if (filter.action) {
        results = results.filter(e => e.action === filter.action);
      }
      if (filter.since) {
        results = results.filter(e => e.timestamp >= filter.since);
      }
    }
    return results;
  }

  getByProvider(provider) {
    return this._entries.filter(e => e.provider === provider);
  }

  getStats() {
    const uniqueProviders = new Set();
    const actionCounts = {};

    for (const entry of this._entries) {
      uniqueProviders.add(entry.provider);
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    }

    return {
      totalEntries: this._entries.length,
      uniqueProviders: uniqueProviders.size,
      actions: actionCounts
    };
  }

  clear() {
    this._entries = [];
  }
}

module.exports = { IntegrationAudit };
