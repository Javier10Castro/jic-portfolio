class AuditEngine {
  constructor() {
    this.events = new Map();
    this.nextId = 1;
  }

  record(event) {
    if (!event) return null;
    const id = `evt_${this.nextId++}`;
    const record = {
      id, type: event.type || 'general', actor: event.actor || 'system',
      action: event.action || 'unknown', resource: event.resource || '',
      details: event.details || {}, timestamp: event.timestamp || new Date().toISOString()
    };
    this.events.set(id, record);
    return record;
  }

  query(filters) {
    let results = Array.from(this.events.values());
    if (!filters) return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (filters.type) results = results.filter(e => e.type === filters.type);
    if (filters.actor) results = results.filter(e => e.actor === filters.actor);
    if (filters.resource) results = results.filter(e => e.resource === filters.resource);
    if (filters.action) results = results.filter(e => e.action === filters.action);
    if (filters.since) results = results.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    if (filters.limit) results = results.slice(0, filters.limit);
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getEvent(id) {
    return this.events.get(id) || null;
  }

  getStats() {
    const all = Array.from(this.events.values());
    const byType = {};
    const byActor = {};
    for (const e of all) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      byActor[e.actor] = (byActor[e.actor] || 0) + 1;
    }
    return { total: all.length, byType, byActor };
  }

  clear() {
    this.events.clear();
    this.nextId = 1;
  }
}

module.exports = new AuditEngine();
