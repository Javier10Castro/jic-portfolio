class FeatureFlagAudit {
  constructor() {
    this._auditLog = [];
  }

  recordChange(flagKey, action, actor, details) {
    if (!flagKey || !action || !actor) {
      throw new Error('flagKey, action, and actor are required');
    }
    this._auditLog.push({
      flagKey,
      action,
      actor,
      details: details || null,
      timestamp: new Date().toISOString()
    });
  }

  getHistory(flagKey) {
    if (!flagKey) return [];
    return this._auditLog
      .filter(e => e.flagKey === flagKey)
      .map(e => ({ ...e }));
  }

  query(filters) {
    let results = this._auditLog.map(e => ({ ...e }));
    if (filters) {
      if (filters.action) {
        results = results.filter(e => e.action === filters.action);
      }
      if (filters.actor) {
        results = results.filter(e => e.actor === filters.actor);
      }
      if (filters.since) {
        const since = new Date(filters.since).getTime();
        if (!isNaN(since)) {
          results = results.filter(e => new Date(e.timestamp).getTime() >= since);
        }
      }
    }
    if (filters && filters.limit && typeof filters.limit === 'number' && filters.limit > 0) {
      results = results.slice(0, filters.limit);
    }
    return results;
  }

  getStats() {
    if (this._auditLog.length === 0) {
      return { total: 0, byAction: {}, byFlag: {} };
    }
    const byAction = {};
    const byFlag = {};
    for (const entry of this._auditLog) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byFlag[entry.flagKey] = (byFlag[entry.flagKey] || 0) + 1;
    }
    return {
      total: this._auditLog.length,
      byAction: { ...byAction },
      byFlag: { ...byFlag }
    };
  }

  clear() {
    this._auditLog = [];
  }
}

module.exports = { FeatureFlagAudit };
