class DependencyAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, dependencies) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'dep_an_' + (++this._counter);
    const issues = [];
    const deps = Array.isArray(dependencies) ? dependencies : [];
    const circular = this._findCircular(deps);
    if (circular.length > 0) {
      issues.push({ type: 'circular_dependency', severity: 'high', details: circular });
    }
    const orphans = deps.filter(d => !d.source && !d.target);
    if (orphans.length > 0) {
      issues.push({ type: 'orphan_dependency', severity: 'medium', count: orphans.length });
    }
    const score = issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.25);
    const analysis = {
      id, evolutionId, score, issues,
      totalDependencies: deps.length,
      timestamp: new Date().toISOString()
    };
    this._analyses.push(analysis);
    return analysis;
  }

  _findCircular(deps) {
    const graph = new Map();
    for (const d of deps) {
      if (d.source && d.target) {
        if (!graph.has(d.source)) graph.set(d.source, []);
        graph.get(d.source).push(d.target);
      }
    }
    const visited = new Set();
    const stack = new Set();
    const cycles = [];
    const dfs = (node) => {
      visited.add(node);
      stack.add(node);
      const neighbors = graph.get(node) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          if (dfs(n)) return true;
        } else if (stack.has(n)) {
          cycles.push({ from: node, to: n });
        }
      }
      stack.delete(node);
      return false;
    };
    for (const node of graph.keys()) {
      if (!visited.has(node)) dfs(node);
    }
    return cycles;
  }

  get(id) {
    if (!id) return null;
    return this._analyses.find(a => a.id === id) || null;
  }

  list() {
    return this._analyses;
  }

  clear() {
    this._analyses = [];
    this._counter = 0;
  }
}

module.exports = { DependencyAnalyzer };
