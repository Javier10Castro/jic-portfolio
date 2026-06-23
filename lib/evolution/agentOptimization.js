class AgentOptimization {
  constructor() {
    this._optimizations = [];
    this._counter = 0;
  }

  analyze(evolutionId, agents) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'agentopt_' + (++this._counter);
    const agts = agents || [];
    const opportunities = [];
    for (const agent of agts) {
      if (agent.taskCount && agent.taskCount > 20) {
        opportunities.push({ agentId: agent.id || agent.name, type: 'split_agent', description: 'Agent handles too many tasks', taskCount: agent.taskCount });
      }
      if (agent.errorRate && agent.errorRate > 0.1) {
        opportunities.push({ agentId: agent.id || agent.name, type: 'improve_reliability', errorRate: agent.errorRate, threshold: 0.1 });
      }
      if (agent.avgResponseTime && agent.avgResponseTime > 5000) {
        opportunities.push({ agentId: agent.id || agent.name, type: 'reduce_latency', avgResponseTime: agent.avgResponseTime, threshold: 5000 });
      }
      if (agent.overlapWith && agent.overlapWith.length > 0) {
        opportunities.push({ agentId: agent.id || agent.name, type: 'reduce_overlap', overlappingAgents: agent.overlapWith });
      }
    }
    const analysis = {
      id, evolutionId,
      opportunities,
      totalOpportunities: opportunities.length,
      timestamp: new Date().toISOString()
    };
    this._optimizations.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._optimizations.find(o => o.id === id) || null;
  }

  list() {
    return this._optimizations;
  }

  clear() {
    this._optimizations = [];
    this._counter = 0;
  }
}

module.exports = { AgentOptimization };
