class Reranker {
  constructor() {
    this._cache = new Map();
  }

  rerank(results, query) {
    if (!Array.isArray(results) || !query) return [];
    const scored = results.map(r => {
      const text = r.text || '';
      const relevance = this.crossEncoderScore(query, text);
      return { ...r, originalScore: r.score || 0, score: relevance, reranked: true };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  crossEncoderScore(query, text) {
    if (!query || !text) return 0;
    const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const tTokens = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (qTokens.length === 0 || tTokens.length === 0) return 0;
    const matches = qTokens.filter(t => tTokens.includes(t)).length;
    return Math.min(1, matches / qTokens.length);
  }

  clear() {
    this._cache.clear();
  }
}

module.exports = { Reranker };
