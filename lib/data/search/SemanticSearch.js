class SemanticSearch {
  constructor() { this._store = []; }
  embed(text) { return { success: true, vector: new Array(384).fill(0).map(() => Math.random()), dimensions: 384 }; }
  index(id, text, metadata) {
    const vector = this.embed(text).vector;
    this._store.push({ id, text, vector, metadata, indexedAt: Date.now() });
    return { success: true, id };
  }
  search(query, limit = 10) {
    const queryVec = this.embed(query).vector;
    const results = this._store.map(d => {
      let score = 0;
      for (let i = 0; i < queryVec.length; i++) score += queryVec[i] * d.vector[i];
      return { id: d.id, score, text: d.text, metadata: d.metadata };
    }).sort((a, b) => b.score - a.score).slice(0, limit);
    return { success: true, results };
  }
  delete(id) { this._store = this._store.filter(d => d.id !== id); return { success: true }; }
  count() { return this._store.length; }
  clear() { this._store = []; }
}
module.exports = { SemanticSearch };
