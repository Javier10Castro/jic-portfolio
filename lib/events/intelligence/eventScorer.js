const SCORE_WEIGHTS = {
  severity: { critical: 100, high: 75, medium: 50, low: 25, info: 5 },
  source: { system: 40, cluster: 35, workflow: 30, ai: 25, agent: 20, api: 15 },
  special: {
    failure: 50,
    retry: 35,
    timeout: 45,
    degrade: 40,
    error: 60,
    overload: 55,
    complete: 10,
    started: 5,
  },
};

class EventScorer {
  score(event) {
    const severityScore = SCORE_WEIGHTS.severity[event.severity] || 10;
    const sourceScore = SCORE_WEIGHTS.source[event.source] || 10;
    const specialBonus = this._specialBonus(event);
    const keywordBonus = this._keywordBonus(event);

    const raw = severityScore + sourceScore + specialBonus + keywordBonus;

    const importance = Math.min(100, raw);
    const urgency = Math.min(100, this._calcUrgency(event, severityScore));
    const systemImpact = Math.min(100, this._calcSystemImpact(event, severityScore));

    return { importance, urgency, systemImpact };
  }

  _specialBonus(event) {
    const type = event.type || '';
    let bonus = 0;
    for (const [keyword, score] of Object.entries(SCORE_WEIGHTS.special)) {
      if (type.includes(keyword)) bonus += score;
    }
    if (event.payload && event.payload.error) bonus += 30;
    if (event.payload && event.payload.retryCount && event.payload.retryCount > 2) bonus += 20;
    if (event.metadata && event.metadata.autoFixAvailable) bonus += 15;
    return bonus;
  }

  _keywordBonus(event) {
    return (event.type || '').split('.').length * 5;
  }

  _calcUrgency(event, severityScore) {
    const base = severityScore;
    const recency = Date.now() - (event.timestamp || Date.now());
    const timePenalty = Math.max(0, 30 - Math.floor(recency / 1000));
    const hasFailures = (event.payload && event.payload.failures) ? 20 : 0;
    return base + timePenalty + hasFailures;
  }

  _calcSystemImpact(event, severityScore) {
    const sourceWeight = SCORE_WEIGHTS.source[event.source] || 10;
    const base = severityScore * 0.6 + sourceWeight * 0.4;
    const cascadeBonus = (event.type || '').includes('failure') || (event.type || '').includes('degrade') ? 25 : 0;
    const workerImpact = (event.payload && event.payload.workerCount) ? Math.min(20, event.payload.workerCount * 2) : 0;
    return base + cascadeBonus + workerImpact;
  }
}

module.exports = EventScorer;
