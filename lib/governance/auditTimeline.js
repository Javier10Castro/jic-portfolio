class AuditTimeline {
  constructor() {
    this.entries = [];
    this.nextId = 1;
  }

  addEntry(entry) {
    if (!entry) return null;
    const record = {
      id: `tl_${this.nextId++}`, type: entry.type || 'general',
      actor: entry.actor || 'system', action: entry.action || 'unknown',
      resource: entry.resource || '', details: entry.details || {},
      timestamp: entry.timestamp || new Date().toISOString()
    };
    this.entries.push(record);
    return record;
  }

  getTimeline(filters) {
    let results = [...this.entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (!filters) return results;
    if (filters.since) results = results.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    if (filters.until) results = results.filter(e => new Date(e.timestamp) <= new Date(filters.until));
    if (filters.type) results = results.filter(e => e.type === filters.type);
    if (filters.actor) results = results.filter(e => e.actor === filters.actor);
    if (filters.limit) results = results.slice(0, filters.limit);
    return results;
  }

  getTimelineByDate(date) {
    if (!date) return [];
    const target = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
    return this.entries.filter(e => e.timestamp.slice(0, 10) === target)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getRange(startDate, endDate) {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.entries.filter(e => {
      const t = new Date(e.timestamp);
      return t >= start && t <= end;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getSummary() {
    if (this.entries.length === 0) return { totalEntries: 0, dateRange: null, types: {} };
    const types = {};
    let minDate = this.entries[0].timestamp;
    let maxDate = this.entries[0].timestamp;
    for (const e of this.entries) {
      types[e.type] = (types[e.type] || 0) + 1;
      if (e.timestamp < minDate) minDate = e.timestamp;
      if (e.timestamp > maxDate) maxDate = e.timestamp;
    }
    return { totalEntries: this.entries.length, dateRange: { from: minDate, to: maxDate }, types };
  }

  clear() {
    this.entries = [];
    this.nextId = 1;
  }
}

module.exports = new AuditTimeline();
