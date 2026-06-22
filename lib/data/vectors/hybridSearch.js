class HybridSearch {
  constructor(semanticSearch, fullTextSearch) {
    this._semantic = semanticSearch;
    this._fullText = fullTextSearch;
  }

  search(query, options) {
    if (!query) return { results: [], query, took: 0 };
    const start = Date.now();
    const limit = (options && options.limit) || 10;
    const semanticWeight = (options && options.semanticWeight) || 0.7;
    const keywordWeight = (options && options.keywordWeight) || 0.3;
    const semanticResults = this._semantic ? this._semantic.search(query, { limit: 100 }).results : [];
    const keywordResults = this._fullText ? this._fullText.search(query, { limit: 100 }).results : [];
    const merged = new Map();
    semanticResults.forEach(r => merged.set(r.id, { ...r, semanticScore: r.score, keywordScore: 0 }));
    keywordResults.forEach(r => {
      if (merged.has(r.id)) {
        merged.get(r.id).keywordScore = r.score;
      } else {
        merged.set(r.id, { ...r, semanticScore: 0, keywordScore: r.score });
      }
    });
    const results = Array.from(merged.values()).map(r => ({
      id: r.id,
      text: r.text,
      score: r.semanticScore * semanticWeight + r.keywordScore * keywordWeight,
      semanticScore: r.semanticScore,
      keywordScore: r.keywordScore,
    }));
    results.sort((a, b) => b.score - a.score);
    return { results: results.slice(0, limit), query, took: Date.now() - start };
  }

  index(id, text, embedding) {
    let result = { id };
    if (this._semantic) result.semantic = this._semantic.index(id, text, embedding);
    if (this._fullText) result.fullText = this._fullText.index(id, text);
    return result;
  }

  remove(id) {
    if (id == null) return false;
    if (this._semantic) this._semantic.remove(id);
    if (this._fullText) this._fullText.remove(id);
    return true;
  }

  clear() {
    if (this._semantic) this._semantic.clear();
    if (this._fullText) this._fullText.clear();
  }
}

module.exports = { HybridSearch };
