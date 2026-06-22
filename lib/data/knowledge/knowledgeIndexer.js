class KnowledgeIndexer {
  constructor() {
    this._index = new Map();
  }

  indexDocument(doc) {
    if (!doc) return null;
    const id = doc.id || (Date.now() + Math.random().toString(36).slice(2, 9));
    const entry = {
      id,
      title: doc.title || '',
      content: doc.content || '',
      tokens: (doc.content || '').split(/\s+/).filter(Boolean).length,
      chunks: doc.chunks || [],
      indexedAt: new Date().toISOString(),
    };
    this._index.set(id, entry);
    return entry;
  }

  search(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    return Array.from(this._index.values()).filter(entry => {
      return (entry.title && entry.title.toLowerCase().includes(q)) ||
             (entry.content && entry.content.toLowerCase().includes(q));
    });
  }

  remove(id) {
    if (id == null) return false;
    return this._index.delete(id);
  }

  list() {
    return Array.from(this._index.values());
  }

  clear() {
    this._index.clear();
  }
}

module.exports = { KnowledgeIndexer };
