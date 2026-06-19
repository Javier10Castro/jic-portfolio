const { resolveDependencies, suggestParallelGroups, DEPENDENCIES } = require('./dependencyResolver');
const ExecutionGraph = require('./executionGraph');

const ALL_AGENTS = ['architect', 'designer', 'developer', 'content', 'seo', 'accessibility', 'performance', 'deployment', 'reviewer', 'qa'];

function planWorkflow(task, options = {}) {
  const agents = options.agents || ALL_AGENTS;
  const graph = new ExecutionGraph();

  for (const agent of agents) {
    graph.addNode(agent, { agent, task: task.type || 'website_generation', status: 'pending' });
  }

  const deps = resolveDependencies(task, agents);
  for (const entry of deps) {
    for (const dep of entry.dependencies) {
      graph.addEdge(dep, entry.agent);
    }
  }

  const parallelGroups = suggestParallelGroups(agents);
  const executionOrder = graph.getExecutionOrder();

  return {
    graph,
    executionOrder,
    parallelGroups,
    agents,
    totalAgents: agents.length,
    estimatedDuration: agents.length * 1000,
    validation: { valid: true },
  };
}

function estimateDuration(agents, options = {}) {
  const deps = resolveDependencies(null, agents);
  const levels = [];
  const assigned = new Set();

  while (assigned.size < agents.length) {
    const level = agents.filter(a => {
      if (assigned.has(a)) return false;
      const d = deps.find(dd => dd.agent === a);
      return d ? d.dependencies.every(dep => assigned.has(dep)) : true;
    });
    if (level.length === 0) break;
    level.forEach(a => assigned.add(a));
    levels.push(level);
  }

  const avgPerAgent = options.avgDuration || 2000;
  const parallelFactor = options.parallelFactor || 0.7;
  return Math.ceil(levels.length * avgPerAgent * parallelFactor);
}

module.exports = { planWorkflow, estimateDuration, ALL_AGENTS };
