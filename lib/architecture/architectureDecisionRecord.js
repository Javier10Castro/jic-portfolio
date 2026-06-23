class ArchitectureDecisionRecord {
  constructor() {
    this._records = new Map();
    this._counter = 0;
  }

  create(architectureId, title, context, decision) {
    if (!architectureId || !title) {
      throw new Error('architectureId and title are required');
    }
    const id = `adr-${++this._counter}`;
    const record = { id, architectureId, title, context: context || '', decision: decision || '', status: 'proposed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this._records.set(id, record);
    return record;
  }

  accept(id) {
    const rec = this._records.get(id);
    if (!rec) return null;
    if (rec.status === 'deprecated') return null;
    rec.status = 'accepted';
    rec.updatedAt = new Date().toISOString();
    return rec;
  }

  deprecate(id, reason) {
    const rec = this._records.get(id);
    if (!rec) return null;
    rec.status = 'deprecated';
    rec.deprecationReason = reason || '';
    rec.updatedAt = new Date().toISOString();
    return rec;
  }

  supersede(id, newAdrId, reason) {
    const rec = this._records.get(id);
    if (!rec) return null;
    rec.status = 'superseded';
    rec.supersededBy = newAdrId;
    rec.supersedeReason = reason || '';
    rec.updatedAt = new Date().toISOString();
    return rec;
  }

  get(id) {
    if (!id) return null;
    return this._records.get(id) || null;
  }

  list(filters = {}) {
    let results = Array.from(this._records.values());
    if (filters.status) results = results.filter(r => r.status === filters.status);
    if (filters.architectureId) results = results.filter(r => r.architectureId === filters.architectureId);
    return results;
  }

  clear() {
    this._records.clear();
    this._counter = 0;
  }
}

module.exports = { ArchitectureDecisionRecord };
