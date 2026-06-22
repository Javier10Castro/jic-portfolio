class SemanticSearch {
  constructor(embeddingManager) {
    this._embeddingManager = embeddingManager;
    this._index = new Map();
    this._documents = new Map();
  }

  index(id, text, embedding) {
    if (id == null || !text) return null;
    if (embedding) {
      this._index.set(id, embedding);
      this._documents.set(id, text);
      return { id, indexed: true };
    }
    if (!this._embeddingManager) return null;
    const emb = this._embeddingManager.generate(text, 'default');
    if (!emb) return null;
    this._index.set(id, emb);
    this._documents.set(id, text);
    return { id, indexed: true };
  }

  search(query, options) {
    if (!query) return { results: [], query, took: 0 };
    const start = Date.now();
    const limit = (options && options.limit) || 10;
    const qEmb = this._embeddingManager ? this._embeddingManager.generate(query, 'default') : null;
    if (!qEmb) return { results: [], query, took: Date.now() - start };
    const results = [];
    this._index.forEach((emb, id) => {
      const score = this._cosineSimilarity(qEmb, emb);
      results.push({ id, score, text: this._documents.get(id) || '' });
    });
    results.sort((a, b) => b.score - a.score);
    return { results: results.slice(0, limit), query, took: Date.now() - start };
  }

  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  remove(id) {
    if (id == null) return false;
    this._documents.delete(id);
    return this._index.delete(id);
  }

  clear() {
    this._index.clear();
    this._documents.clear();
  }
}

module.exports = { SemanticSearch };
