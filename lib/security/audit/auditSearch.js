class AuditSearch {
  constructor(auditLogger) {
    this._logger = auditLogger;
    this._savedSearches = new Map();
  }

  search(params) {
    const results = this._logger.query(params);
    if (params.sortBy) {
      const desc = params.sortOrder === 'desc';
      results.sort((a, b) => {
        const va = a[params.sortBy] || '';
        const vb = b[params.sortBy] || '';
        if (typeof va === 'string') return desc ? vb.localeCompare(va) : va.localeCompare(vb);
        return desc ? vb - va : va - vb;
      });
    }
    const page = params.page || 1;
    const limit = params.limit || 50;
    const start = (page - 1) * limit;
    return { results: results.slice(start, start + limit), total: results.length, page, limit };
  }

  findByActor(actor, limit = 50) {
    return this._logger.query({ actor, limit });
  }

  findByResource(resourceType, resourceId, limit = 50) {
    return this._logger.query({ resourceType, resourceId, limit });
  }

  findByTimeRange(since, until) {
    if (typeof since === 'string') since = new Date(since).getTime();
    if (typeof until === 'string') until = new Date(until).getTime();
    return this._logger.query({ since, until });
  }

  findSimilar(entryId) {
    const entry = this._logger.get(entryId);
    if (!entry) return [];
    return this._logger.query({
      actor: entry.actor,
      action: entry.action,
      since: entry.timestamp - 3600000,
      until: entry.timestamp + 3600000
    }).filter(e => e.id !== entryId);
  }

  saveSearch(name, params) {
    this._savedSearches.set(name, { name, params, createdAt: Date.now() });
  }

  getSavedSearch(name) {
    return this._savedSearches.get(name) || null;
  }

  listSavedSearches() {
    return Array.from(this._savedSearches.values());
  }

  deleteSavedSearch(name) {
    return this._savedSearches.delete(name);
  }

  exportResults(params, format = 'json') {
    const results = this._logger.query(params);
    if (format === 'csv') return this._toCsv(results);
    return JSON.stringify(results, null, 2);
  }

  _toCsv(entries) {
    if (entries.length === 0) return '';
    const headers = ['id', 'timestamp', 'action', 'actor', 'resourceType', 'resourceId', 'severity', 'outcome'];
    const rows = entries.map(e => headers.map(h => JSON.stringify(e[h] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
}

module.exports = { AuditSearch };
