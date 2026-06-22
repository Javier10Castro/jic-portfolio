class FullTextSearch {
  constructor() { this._documents = {}; }
  index(id, text, metadata) { this._documents[id] = { text, metadata, indexedAt: Date.now() }; return { success: true, id }; }
  search(query) {
    const q = query.toLowerCase();
    const results = Object.entries(this._documents)
      .filter(([, doc]) => doc.text.toLowerCase().includes(q))
      .map(([id, doc]) => ({ id, score: 1, snippet: doc.text.substring(0, 100), metadata: doc.metadata }));
    return { success: true, results, total: results.length };
  }
  delete(id) { delete this._documents[id]; return { success: true }; }
  count() { return Object.keys(this._documents).length; }
  clear() { this._documents = {}; }
}
module.exports = { FullTextSearch };
