class ConsensusEngine {
  constructor() {
    this._decisions = [];
    this._maxHistory = 100;
  }

  resolve(conflicts, context = {}) {
    if (!conflicts || conflicts.length === 0) return { resolved: true, decision: null, reason: 'No conflicts' };
    if (conflicts.length === 1) {
      const record = {
        timestamp: Date.now(),
        options: [{ agent: conflicts[0].agent, value: conflicts[0].value }],
        selected: { agent: conflicts[0].agent, value: conflicts[0].value, score: 0 },
        discarded: [],
        reason: 'Single option',
        context,
      };
      this._decisions.push(record);
      if (this._decisions.length > this._maxHistory) this._decisions.shift();
      return { resolved: true, decision: conflicts[0].value, agent: conflicts[0].agent, reason: 'Single option', score: 0, discarded: [] };
    }

    const scored = conflicts.map(c => ({
      ...c,
      score: this._scoreOption(c, context),
    }));

    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0];
    const runnersUp = scored.slice(1);

    const record = {
      timestamp: Date.now(),
      options: conflicts.map(c => ({ agent: c.agent, value: c.value })),
      selected: { agent: winner.agent, value: winner.value, score: winner.score },
      discarded: runnersUp.map(r => ({ agent: r.agent, value: r.value, score: r.score, reason: `Lower score: ${r.score} vs ${winner.score}` })),
      reason: `Selected "${winner.value}" from "${winner.agent}" (score: ${winner.score})`,
      context,
    };

    this._decisions.push(record);
    if (this._decisions.length > this._maxHistory) this._decisions.shift();

    return {
      resolved: true,
      decision: winner.value,
      agent: winner.agent,
      reason: record.reason,
      score: winner.score,
      discarded: record.discarded,
    };
  }

  _scoreOption(option, context) {
    let score = 0;

    if (option.confidence) score += option.confidence * 30;
    if (option.performance) score += option.performance * 15;
    if (option.cost) score -= option.cost * 10;
    if (option.dependencies) score += (option.dependencies || []).length * 2;
    if (context.preferredApproach && option.value === context.preferredApproach) score += 20;
    if (context.projectType && option.compatibility && option.compatibility.includes(context.projectType)) score += 10;

    const now = Date.now();
    if (option.lastUsed && (now - option.lastUsed) > 86400000) score += 5;

    return score;
  }

  getDecisionHistory(limit = 20) {
    return this._decisions.slice(-limit);
  }

  clear() {
    this._decisions = [];
  }
}

module.exports = ConsensusEngine;
