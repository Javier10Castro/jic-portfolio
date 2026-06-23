class CaseRanking {
  constructor() {
    this._rankings = [];
  }

  rank(cases, criteria) {
    if (!cases || cases.length === 0) return [];
    const c = criteria || { relevance: 1, recency: 1, success: 1 };
    const scored = cases.map(item => {
      const caseData = item.case || item;
      let score = 0;
      if (c.relevance && item.score !== undefined) {
        score += c.relevance * item.score;
      }
      if (c.recency && caseData.storedAt) {
        const age = Date.now() - new Date(caseData.storedAt).getTime();
        const days = age / (1000 * 60 * 60 * 24);
        score += c.recency * Math.max(0, 1 - days / 365);
      }
      if (c.success && caseData.outcome) {
        const outcome = caseData.outcome;
        if (outcome.success === true || outcome.success === 'true') score += c.success * 0.5;
        if (outcome.score !== undefined) score += c.success * 0.5 * (outcome.score / 100);
      }
      return { ...item, rankScore: score };
    });
    scored.sort((a, b) => b.rankScore - a.rankScore);
    this._rankings = scored;
    return scored;
  }

  getRankings() {
    return this._rankings;
  }

  clear() {
    this._rankings = [];
  }
}

module.exports = { CaseRanking };
