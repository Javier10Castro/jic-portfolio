class ContextMatcher {
  constructor() {
    this._contexts = new Map();
  }

  register(id, contextData) {
    if (!id || !contextData) throw new Error('id and contextData are required');
    this._contexts.set(id, contextData);
  }

  match(query, threshold) {
    if (!query) return [];
    const t = threshold || 0.3;
    const results = [];
    for (const [id, data] of this._contexts) {
      const score = this._computeSimilarity(query, data);
      if (score >= t) {
        results.push({ id, score, data });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  _computeSimilarity(a, b) {
    if (typeof a === 'string' && typeof b === 'string') {
      const aWords = new Set(a.toLowerCase().split(/\s+/));
      const bWords = new Set(b.toLowerCase().split(/\s+/));
      if (aWords.size === 0 && bWords.size === 0) return 1;
      let intersection = 0;
      for (const w of aWords) {
        if (bWords.has(w)) intersection++;
      }
      return intersection / Math.max(aWords.size, bWords.size);
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length === 0 && bKeys.length === 0) return 1;
      let matches = 0;
      for (const k of aKeys) {
        if (b[k] === a[k]) matches++;
      }
      return matches / Math.max(aKeys.length, bKeys.length);
    }
    return a === b ? 1 : 0;
  }

  remove(id) {
    return this._contexts.delete(id);
  }

  list() {
    return Array.from(this._contexts.entries()).map(([id, data]) => ({ id, data }));
  }

  clear() {
    this._contexts.clear();
  }
}

module.exports = { ContextMatcher };
