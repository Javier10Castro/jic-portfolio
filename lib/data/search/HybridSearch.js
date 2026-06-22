class HybridSearch {
  constructor() { this._fts = null; this._vectorSearch = null; }
  setEngines(fts, vectorSearch) { this._fts = fts; this._vectorSearch = vectorSearch; }
  search(query, queryVector, options = {}) {
    const alpha = options.alpha || 0.5;
    const ftsResults = this._fts ? this._fts.search(query).results : [];
    const vectorResults = this._vectorSearch && queryVector ? this._vectorSearch.search(null, queryVector, options.limit || 10).results : [];
    const combined = {};
    ftsResults.forEach(r => { combined[r.id] = { ...r, ftsScore: r.score, vectorScore: 0, combinedScore: alpha * (r.score || 0) }; });
    vectorResults.forEach(r => {
      if (combined[r.id]) { combined[r.id].vectorScore = r.score; combined[r.id].combinedScore = alpha * (combined[r.id].ftsScore || 0) + (1 - alpha) * (r.score || 0); }
      else combined[r.id] = { ...r, ftsScore: 0, vectorScore: r.score, combinedScore: (1 - alpha) * (r.score || 0) };
    });
    return { success: true, results: Object.values(combined).sort((a, b) => b.combinedScore - a.combinedScore).slice(0, options.limit || 10) };
  }
}
module.exports = { HybridSearch };
