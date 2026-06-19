class ExecutionGraph {
  constructor() {
    this._nodes = new Map();
    this._edges = [];
  }

  addNode(id, data = {}) {
    if (this._nodes.has(id)) throw new Error(`Node "${id}" already exists`);
    this._nodes.set(id, { id, ...data, status: 'pending', dependencies: [] });
  }

  addEdge(fromId, toId) {
    if (!this._nodes.has(fromId)) throw new Error(`Node "${fromId}" not found`);
    if (!this._nodes.has(toId)) throw new Error(`Node "${toId}" not found`);
    this._edges.push({ from: fromId, to: toId });
    this._nodes.get(toId).dependencies.push(fromId);
  }

  getNode(id) {
    return this._nodes.get(id) || null;
  }

  getReadyNodes() {
    const ready = [];
    for (const [id, node] of this._nodes) {
      if (node.status !== 'pending') continue;
      const depsMet = node.dependencies.every(depId => {
        const dep = this._nodes.get(depId);
        return dep && dep.status === 'completed';
      });
      if (depsMet) ready.push({ id, ...node });
    }
    return ready;
  }

  markCompleted(id, result) {
    const node = this._nodes.get(id);
    if (!node) return;
    node.status = 'completed';
    node.result = result;
    node.completedAt = Date.now();
  }

  markFailed(id, error) {
    const node = this._nodes.get(id);
    if (!node) return;
    node.status = 'failed';
    node.error = error;
    node.failedAt = Date.now();
  }

  markRunning(id) {
    const node = this._nodes.get(id);
    if (!node) return;
    node.status = 'running';
    node.startedAt = Date.now();
  }

  isComplete() {
    return Array.from(this._nodes.values()).every(n => n.status === 'completed' || n.status === 'failed');
  }

  hasFailures() {
    return Array.from(this._nodes.values()).some(n => n.status === 'failed');
  }

  getExecutionOrder() {
    const visited = new Set();
    const order = [];

    function dfs(id, nodes, edges) {
      if (visited.has(id)) return;
      visited.add(id);
      const deps = edges.filter(e => e.to === id).map(e => e.from);
      for (const dep of deps) dfs(dep, nodes, edges);
      order.push(id);
    }

    for (const [id] of this._nodes) dfs(id, this._nodes, this._edges);
    return order;
  }

  toJSON() {
    const nodes = [];
    for (const [id, node] of this._nodes) {
      nodes.push({ id, status: node.status, dependencies: node.dependencies, result: node.result || null, error: node.error || null, startedAt: node.startedAt, completedAt: node.completedAt });
    }
    return { nodes, edges: this._edges };
  }

  reset() {
    for (const [, node] of this._nodes) {
      node.status = 'pending';
      delete node.result;
      delete node.error;
      delete node.startedAt;
      delete node.completedAt;
      delete node.failedAt;
    }
  }
}

module.exports = ExecutionGraph;
