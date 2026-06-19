const DEPENDENCIES = {
  architect: [],
  designer: ['architect'],
  developer: ['architect', 'designer'],
  content: ['architect'],
  seo: ['developer', 'content'],
  accessibility: ['developer'],
  performance: ['developer'],
  deployment: ['developer', 'seo', 'accessibility', 'performance'],
  reviewer: ['architect', 'designer', 'developer', 'content', 'seo', 'accessibility', 'performance'],
  qa: ['reviewer', 'deployment'],
};

const PARALLEL_GROUPS = [
  ['designer', 'content'],
  ['seo', 'accessibility', 'performance'],
];

function resolveDependencies(task, agents) {
  const graph = [];
  for (const agent of agents) {
    const deps = DEPENDENCIES[agent] || [];
    graph.push({ agent, dependencies: deps.filter(d => agents.includes(d)) });
  }
  return graph;
}

function suggestParallelGroups(agents) {
  return PARALLEL_GROUPS.filter(group => group.every(a => agents.includes(a)));
}

function validateDependencyOrder(executionOrder, agents) {
  const executed = new Set();
  for (const agent of executionOrder) {
    const deps = DEPENDENCIES[agent] || [];
    for (const dep of deps) {
      if (agents.includes(dep) && !executed.has(dep)) {
        return { valid: false, error: `"${agent}" depends on "${dep}" which has not been executed` };
      }
    }
    executed.add(agent);
  }
  return { valid: true };
}

module.exports = { DEPENDENCIES, PARALLEL_GROUPS, resolveDependencies, suggestParallelGroups, validateDependencyOrder };
