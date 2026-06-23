class SimilarProjectFinder {
  constructor() {
    this._projects = new Map();
  }

  index(projectId, features) {
    if (!projectId) throw new Error('projectId is required');
    if (!features) throw new Error('features is required');
    this._projects.set(projectId, { features, indexedAt: new Date().toISOString() });
  }

  findSimilar(query, limit) {
    if (!query) return [];
    const max = limit || 10;
    const scored = [];
    for (const [id, entry] of this._projects) {
      const score = this._computeSimilarity(query, entry.features);
      scored.push({ projectId: id, score, features: entry.features });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, max);
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
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      if (keys.size === 0) return 1;
      let matches = 0;
      for (const k of keys) {
        if (a[k] === b[k]) matches++;
      }
      return matches / keys.size;
    }
    return a === b ? 1 : 0;
  }

  get(projectId) {
    return this._projects.get(projectId) || null;
  }

  remove(projectId) {
    return this._projects.delete(projectId);
  }

  list() {
    return Array.from(this._projects.entries()).map(([id, entry]) => ({ projectId: id, ...entry }));
  }

  clear() {
    this._projects.clear();
  }
}

module.exports = { SimilarProjectFinder };
