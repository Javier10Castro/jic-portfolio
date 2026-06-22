class ApprovalHistory {
  constructor() {
    this.entries = [];
    this.nextId = 1;
  }

  record(entry) {
    if (!entry || !entry.requestId) return null;
    const record = {
      id: `hist_${this.nextId++}`,
      requestId: entry.requestId,
      action: entry.action || 'unknown',
      actor: entry.actor || 'system',
      reason: entry.reason || '',
      timestamp: entry.timestamp || new Date().toISOString()
    };
    this.entries.push(record);
    return record;
  }

  getHistory(requestId) {
    if (!requestId) return [];
    return this.entries.filter(e => e.requestId === requestId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  query(filters) {
    if (!filters) return [...this.entries];
    let results = [...this.entries];
    if (filters.actor) results = results.filter(e => e.actor === filters.actor);
    if (filters.action) results = results.filter(e => e.action === filters.action);
    if (filters.since) results = results.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    if (filters.limit) results = results.slice(0, filters.limit);
    return results;
  }

  getStats() {
    if (this.entries.length === 0) return { total: 0, byAction: {}, byActor: {} };
    const byAction = {};
    const byActor = {};
    for (const entry of this.entries) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byActor[entry.actor] = (byActor[entry.actor] || 0) + 1;
    }
    return { total: this.entries.length, byAction, byActor };
  }

  clear() {
    this.entries = [];
    this.nextId = 1;
  }
}

module.exports = new ApprovalHistory();
