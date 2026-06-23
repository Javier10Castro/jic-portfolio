class CaseSimilarity {
  constructor() {
    this._weights = {
      problem: 0.4,
      solution: 0.3,
      outcome: 0.2,
      name: 0.1
    };
  }

  setWeights(weights) {
    if (weights) this._weights = { ...this._weights, ...weights };
  }

  compare(caseA, caseB) {
    if (!caseA || !caseB) return 0;
    let score = 0;
    if (caseA.name && caseB.name) {
      score += this._weights.name * this._textSimilarity(caseA.name, caseB.name);
    }
    if (caseA.problem && caseB.problem) {
      score += this._weights.problem * this._textSimilarity(
        typeof caseA.problem === 'string' ? caseA.problem : JSON.stringify(caseA.problem),
        typeof caseB.problem === 'string' ? caseB.problem : JSON.stringify(caseB.problem)
      );
    }
    if (caseA.solution && caseB.solution) {
      score += this._weights.solution * this._textSimilarity(
        typeof caseA.solution === 'string' ? caseA.solution : JSON.stringify(caseA.solution),
        typeof caseB.solution === 'string' ? caseB.solution : JSON.stringify(caseB.solution)
      );
    }
    if (caseA.outcome && caseB.outcome) {
      score += this._weights.outcome * this._objectSimilarity(caseA.outcome, caseB.outcome);
    }
    return Math.min(1, Math.max(0, score));
  }

  _textSimilarity(a, b) {
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const bWords = new Set(b.toLowerCase().split(/\s+/));
    if (aWords.size === 0 && bWords.size === 0) return 1;
    let intersection = 0;
    for (const w of aWords) {
      if (bWords.has(w)) intersection++;
    }
    return intersection / Math.max(aWords.size, bWords.size);
  }

  _objectSimilarity(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    if (keys.size === 0) return 1;
    let matches = 0;
    for (const k of keys) {
      if (a[k] === b[k]) matches++;
    }
    return matches / keys.size;
  }

  clear() {
    this._weights = { problem: 0.4, solution: 0.3, outcome: 0.2, name: 0.1 };
  }
}

module.exports = { CaseSimilarity };
