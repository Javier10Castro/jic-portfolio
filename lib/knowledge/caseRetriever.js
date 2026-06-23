class CaseRetriever {
  constructor() {
    this._source = [];
  }

  setSource(cases) {
    this._source = cases || [];
  }

  retrieve(query, limit) {
    if (!query) return [];
    const max = limit || 10;
    const results = [];
    for (const c of this._source) {
      let score = 0;
      if (typeof query === 'string' && c.name) {
        if (c.name.toLowerCase().includes(query.toLowerCase())) score = 0.8;
        if (c.problem && c.problem.toLowerCase().includes(query.toLowerCase())) score = Math.max(score, 0.6);
        if (c.solution && c.solution.toLowerCase().includes(query.toLowerCase())) score = Math.max(score, 0.4);
      }
      if (typeof query === 'object' && query.problem && c.problem) {
        const qWords = new Set(query.problem.toLowerCase().split(/\s+/));
        const cWords = new Set(c.problem.toLowerCase().split(/\s+/));
        let intersection = 0;
        for (const w of qWords) {
          if (cWords.has(w)) intersection++;
        }
        score = qWords.size > 0 ? intersection / Math.max(qWords.size, cWords.size) : 0;
        if (query.type && c.solution && typeof c.solution === 'string' && c.solution.includes(query.type)) {
          score = Math.min(1, score + 0.2);
        }
      }
      if (score > 0) {
        results.push({ case: c, score });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, max);
  }

  clear() {
    this._source = [];
  }
}

module.exports = { CaseRetriever };
