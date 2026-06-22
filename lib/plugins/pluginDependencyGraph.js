class PluginDependencyGraph {
  constructor(options = {}) {
    this._registry = options.registry;
  }

  buildGraph() {
    const plugins = this._registry.listPlugins();
    const graph = {};
    plugins.forEach(p => {
      graph[p.id] = { plugin: p, dependencies: Object.keys(p.manifest.dependencies || {}), dependents: [] };
    });
    plugins.forEach(p => {
      const deps = Object.keys(p.manifest.dependencies || {});
      deps.forEach(depId => {
        if (graph[depId]) graph[depId].dependents.push(p.id);
      });
    });
    return graph;
  }

  getDependencyChain(pluginId) {
    const graph = this.buildGraph();
    const chain = [];
    const visited = new Set();
    const traverse = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = graph[id];
      if (node) {
        node.dependencies.forEach(traverse);
        chain.push(id);
      }
    };
    traverse(pluginId);
    return chain;
  }

  getDependents(pluginId) {
    const graph = this.buildGraph();
    const dependents = [];
    const visited = new Set();
    const traverse = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = graph[id];
      if (node) {
        node.dependents.forEach(depId => { dependents.push(depId); traverse(depId); });
      }
    };
    traverse(pluginId);
    return dependents;
  }

  getInstallationOrder(pluginIds) {
    const graph = this.buildGraph();
    const order = [];
    const visited = new Set();
    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = graph[id];
      if (node) {
        node.dependencies.forEach(depId => {
          if (pluginIds.includes(depId) || !pluginIds.length) visit(depId);
        });
        order.push(id);
      }
    };
    const targets = pluginIds.length ? pluginIds : Object.keys(graph);
    targets.forEach(visit);
    return order;
  }

  getCycles() {
    const graph = this.buildGraph();
    const visited = new Set();
    const recStack = new Set();
    const cycles = [];
    const dfs = (id, path) => {
      visited.add(id);
      recStack.add(id);
      const node = graph[id];
      if (node) {
        node.dependencies.forEach(depId => {
          if (recStack.has(depId)) {
            const cycle = path.slice(path.indexOf(depId));
            cycle.push(depId);
            cycles.push(cycle);
          } else if (!visited.has(depId)) {
            dfs(depId, [...path, depId]);
          }
        });
      }
      recStack.delete(id);
    };
    Object.keys(graph).forEach(id => { if (!visited.has(id)) dfs(id, [id]); });
    return cycles;
  }
}

module.exports = { PluginDependencyGraph };
