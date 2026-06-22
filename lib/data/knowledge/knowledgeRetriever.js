class KnowledgeRetriever {
  constructor() {
    this._documents = new Map();
  }

  retrieve(query, options) {
    if (!query) return [];
    const limit = (options && options.limit) || 10;
    const q = query.toLowerCase();
    const results = [];
    this._documents.forEach((doc, id) => {
      let score = 0;
      if ((doc.title || '').toLowerCase().includes(q)) score += 0.5;
      if ((doc.content || '').toLowerCase().includes(q)) {
        const matches = (doc.content.toLowerCase().match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += Math.min(0.5, matches * 0.1);
      }
      if (score > 0) results.push({ id, ...doc, score });
    });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  retrieveById(id) {
    if (id == null) return null;
    const doc = this._documents.get(id);
    return doc ? { ...doc } : null;
  }

  batchRetrieve(ids) {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => this.retrieveById(id)).filter(Boolean);
  }

  clear() {
    this._documents.clear();
  }
}

module.exports = { KnowledgeRetriever };
