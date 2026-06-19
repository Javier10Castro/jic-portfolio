class ExecutionGraph {
  constructor() {
    this._nodes = new Map();
    this._edges = [];
  }

  addNode(id, data = {}) {
    if (this._nodes.has(id)) throw new Error(`Node "${id}" already exists`);
    this._nodes.set(id, {
      id,
      status: 'pending',
      data: JSON.parse(JSON.stringify(data)),
      startedAt: null,
      completedAt: null,
      error: null,
      output: null,
      retries: 0,
    });
  }

  addEdge(from, to) {
    if (!this._nodes.has(from)) throw new Error(`Source node "${from}" not found`);
    if (!this._nodes.has(to)) throw new Error(`Target node "${to}" not found`);
    const exists = this._edges.some(e => e.from === from && e.to === to);
    if (!exists) this._edges.push({ from, to });
  }

  getNode(id) {
    const node = this._nodes.get(id);
    return node ? { ...node, dependencies: this.getDependencies(id) } : null;
  }

  getDependencies(id) {
    return this._edges.filter(e => e.to === id).map(e => e.from);
  }

  getDependents(id) {
    return this._edges.filter(e => e.from === id).map(e => e.to);
  }

  getReadyNodes() {
    const ready = [];
    for (const [id, node] of this._nodes) {
      if (node.status !== 'pending') continue;
      const deps = this.getDependencies(id);
      const allMet = deps.every(depId => {
        const dep = this._nodes.get(depId);
        return dep && dep.status === 'completed';
      });
      if (allMet) ready.push({ ...node, id, dependencies: deps });
    }
    return ready;
  }

  getRunningNodes() {
    return Array.from(this._nodes.values()).filter(n => n.status === 'running');
  }

  markStarted(id) {
    const node = this._nodes.get(id);
    if (!node) throw new Error(`Node "${id}" not found`);
    node.status = 'running';
    node.startedAt = Date.now();
  }

  markCompleted(id, output) {
    const node = this._nodes.get(id);
    if (!node) throw new Error(`Node "${id}" not found`);
    node.status = 'completed';
    node.completedAt = Date.now();
    node.output = output;
  }

  markFailed(id, error) {
    const node = this._nodes.get(id);
    if (!node) throw new Error(`Node "${id}" not found`);
    node.status = 'failed';
    node.completedAt = Date.now();
    node.error = error;
  }

  incrementRetry(id) {
    const node = this._nodes.get(id);
    if (!node) throw new Error(`Node "${id}" not found`);
    node.retries++;
    node.status = 'pending';
    node.startedAt = null;
    node.error = null;
  }

  isComplete() {
    return Array.from(this._nodes.values()).every(n => n.status === 'completed' || n.status === 'failed');
  }

  hasFailed() {
    return Array.from(this._nodes.values()).some(n => n.status === 'failed');
  }

  getExecutionOrder() {
    const visited = new Set();
    const order = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const deps = this.getDependencies(id);
      for (const dep of deps) visit(dep);
      order.push(id);
    };

    for (const [id] of this._nodes) visit(id);
    return order;
  }

  getParallelGroups() {
    const order = this.getExecutionOrder();
    const groups = [];
    const added = new Set();

    for (const nodeId of order) {
      const deps = this.getDependencies(nodeId);
      const depsInGroup = deps.filter(d => added.has(d));
      const allDepsResolved = deps.every(d => added.has(d));

      if (allDepsResolved) {
        if (groups.length === 0 || this._anyRunning(groups[groups.length - 1], nodeId)) {
          groups.push([nodeId]);
        } else {
          groups[groups.length - 1].push(nodeId);
        }
        added.add(nodeId);
      }
    }

    return groups;
  }

  _anyRunning(group, nodeId) {
    const deps = this.getDependencies(nodeId);
    return deps.some(d => group.includes(d));
  }

  toJSON() {
    const nodes = Array.from(this._nodes.entries()).map(([id, node]) => ({
      id,
      status: node.status,
      startedAt: node.startedAt,
      completedAt: node.completedAt,
      error: node.error,
      retries: node.retries,
    }));
    return { nodes, edges: [...this._edges] };
  }

  getVisualGraph() {
    const nodes = Array.from(this._nodes.entries()).map(([id, node]) => ({
      id,
      label: id,
      status: node.status,
      startedAt: node.startedAt,
      completedAt: node.completedAt,
      error: node.error,
    }));
    return { nodes, edges: [...this._edges] };
  }

  reset() {
    for (const [, node] of this._nodes) {
      if (node.status !== 'completed') {
        node.status = 'pending';
        node.startedAt = null;
        node.completedAt = null;
        node.error = null;
      }
    }
  }

  clear() {
    this._nodes.clear();
    this._edges = [];
  }
}

module.exports = ExecutionGraph;
