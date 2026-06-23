class KnowledgeEngine {
  constructor() {
    this._sessions = new Map();
    this._counter = 0;
  }

  ingest(sourceType, data) {
    if (!sourceType) throw new Error('sourceType is required');
    if (!data) throw new Error('data is required');
    const id = 'know_' + (++this._counter);
    const session = {
      id,
      sourceType,
      data: JSON.parse(JSON.stringify(data)),
      status: 'ingested',
      processedAt: null,
      createdAt: new Date().toISOString()
    };
    this._sessions.set(id, session);
    return session;
  }

  process(id) {
    const session = this._sessions.get(id);
    if (!session) return null;
    session.status = 'processing';
    session.processedAt = new Date().toISOString();
    return session;
  }

  complete(id, result) {
    const session = this._sessions.get(id);
    if (!session) return null;
    session.status = 'completed';
    session.result = result || {};
    return session;
  }

  fail(id, error) {
    const session = this._sessions.get(id);
    if (!session) return null;
    session.status = 'failed';
    session.error = error || 'unknown error';
    return session;
  }

  get(id) {
    if (!id) return null;
    return this._sessions.get(id) || null;
  }

  list(sourceType) {
    if (!sourceType) return Array.from(this._sessions.values());
    return Array.from(this._sessions.values()).filter(s => s.sourceType === sourceType);
  }

  clear() {
    this._sessions.clear();
    this._counter = 0;
  }
}

module.exports = { KnowledgeEngine };
