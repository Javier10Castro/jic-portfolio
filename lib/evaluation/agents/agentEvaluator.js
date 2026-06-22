class AgentEvaluator {
  constructor() {
    this.history = new Map();
    this.agents = new Map();
  }

  evaluateAgent(agentId, input, expected) {
    const response = this._simulateResponse(input);
    const metrics = {
      latency: Math.random() * 500,
      tokenUsage: Math.floor(Math.random() * 1000),
      success: response === expected ? 1 : 0,
    };
    const details = { input, expected, actual: response, comparison: response === expected };
    const score = metrics.success;
    const result = { score, metrics, details };
    this.trackAgentPerformance(agentId, result);
    return result;
  }

  evaluateResponse(response, criteria) {
    const scores = {};
    for (const criterion of criteria) {
      scores[criterion] = Math.min(1, Math.max(0, Math.random() * 0.5 + 0.5));
    }
    return { scores };
  }

  evaluateDecision(decision, context) {
    const soundness = Math.min(1, Math.max(0, Math.random() * 0.4 + 0.6));
    const completeness = Math.min(1, Math.max(0, Math.random() * 0.4 + 0.6));
    return { soundness, completeness };
  }

  trackAgentPerformance(agentId, results) {
    if (!this.history.has(agentId)) {
      this.history.set(agentId, []);
    }
    this.history.get(agentId).push(results);
    if (!this.agents.has(agentId)) {
      this.agents.set(agentId, { id: agentId, createdAt: new Date() });
    }
  }

  getAgentScore(agentId) {
    const results = this.history.get(agentId);
    if (!results || results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return sum / results.length;
  }

  listAgents() {
    return Array.from(this.agents.values());
  }

  clear() {
    this.history.clear();
    this.agents.clear();
  }

  _simulateResponse(input) {
    return typeof input === 'string' ? input.split('').reverse().join('') : input;
  }
}

module.exports = AgentEvaluator;
