const crypto = require('crypto');

class AuditLogger {
  constructor() {
    this._entries = [];
    this._maxEntries = 10000;
  }

  log(event) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: event.action,
      actor: event.actor,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      organizationId: event.organizationId || null,
      details: event.details || {},
      ip: event.ip || null,
      userAgent: event.userAgent || null,
      severity: event.severity || 'info',
      outcome: event.outcome || 'success'
    };
    this._entries.push(entry);
    if (this._entries.length > this._maxEntries) this._entries.shift();
    return entry;
  }

  query(filters = {}) {
    let results = [...this._entries];
    if (filters.action) results = results.filter(e => e.action === filters.action);
    if (filters.actor) results = results.filter(e => e.actor === filters.actor);
    if (filters.resourceType) results = results.filter(e => e.resourceType === filters.resourceType);
    if (filters.resourceId) results = results.filter(e => e.resourceId === filters.resourceId);
    if (filters.organizationId) results = results.filter(e => e.organizationId === filters.organizationId);
    if (filters.severity) results = results.filter(e => e.severity === filters.severity);
    if (filters.outcome) results = results.filter(e => e.outcome === filters.outcome);
    if (filters.since) results = results.filter(e => e.timestamp >= filters.since);
    if (filters.until) results = results.filter(e => e.timestamp <= filters.until);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(e =>
        e.action?.toLowerCase().includes(q) ||
        e.actor?.toLowerCase().includes(q) ||
        e.resourceType?.toLowerCase().includes(q) ||
        JSON.stringify(e.details).toLowerCase().includes(q)
      );
    }
    return results;
  }

  get(id) {
    return this._entries.find(e => e.id === id) || null;
  }

  getStats() {
    return {
      total: this._entries.length,
      byAction: this._aggregate('action'),
      bySeverity: this._aggregate('severity'),
      byOutcome: this._aggregate('outcome'),
      lastHour: this._entries.filter(e => e.timestamp > Date.now() - 3600000).length
    };
  }

  clear() {
    this._entries = [];
  }

  _aggregate(field) {
    const counts = {};
    for (const e of this._entries) {
      const key = e[field] || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }
}

module.exports = { AuditLogger };
