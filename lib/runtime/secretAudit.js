class SecretAudit {
  constructor() {
    this._auditLog = [];
  }

  recordAccess(secretKey, action, actor) {
    if (!secretKey || !action || !actor) {
      throw new Error('secretKey, action, and actor are required');
    }
    const validActions = ['read', 'write', 'rotate', 'delete'];
    if (!validActions.includes(action)) {
      throw new Error(`action must be one of: ${validActions.join(', ')}`);
    }
    this._auditLog.push({
      secretKey,
      action,
      actor,
      timestamp: new Date().toISOString()
    });
  }

  query(filters) {
    let results = this._auditLog.map(e => ({ ...e }));
    if (filters) {
      if (filters.secretKey) {
        results = results.filter(e => e.secretKey === filters.secretKey);
      }
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
      return { total: 0, byAction: {}, bySecret: {} };
    }
    const byAction = {};
    const bySecret = {};
    for (const entry of this._auditLog) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      bySecret[entry.secretKey] = (bySecret[entry.secretKey] || 0) + 1;
    }
    return {
      total: this._auditLog.length,
      byAction: { ...byAction },
      bySecret: { ...bySecret }
    };
  }

  clear() {
    this._auditLog = [];
  }
}

module.exports = { SecretAudit };
