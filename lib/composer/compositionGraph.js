class CompositionGraph {
  constructor() {
    this._graphs = new Map();
  }

  createGraph(compositionId, nodes = [], edges = []) {
    if (!compositionId) {
      throw new Error('compositionId is required');
    }
    const graph = {
      id: compositionId,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || 'unknown',
        name: n.name || '',
        dependencies: Array.isArray(n.dependencies) ? [...n.dependencies] : []
      })),
      edges: edges.map(e => ({
        from: e.from || e.source || '',
        to: e.to || e.target || '',
        type: e.type || 'dependency'
      })),
      createdAt: new Date().toISOString()
    };
    this._graphs.set(compositionId, graph);
    return graph;
  }

  getGraph(compositionId) {
    if (!compositionId) return null;
    return this._graphs.get(compositionId) || null;
  }

  addNode(compositionId, node) {
    if (!compositionId || !node) {
      throw new Error('compositionId and node are required');
    }
    let graph = this._graphs.get(compositionId);
    if (!graph) {
      graph = { id: compositionId, nodes: [], edges: [], createdAt: new Date().toISOString() };
      this._graphs.set(compositionId, graph);
    }
    const entry = {
      id: node.id || `node-${graph.nodes.length}`,
      type: node.type || 'unknown',
      name: node.name || '',
      dependencies: Array.isArray(node.dependencies) ? [...node.dependencies] : []
    };
    graph.nodes.push(entry);
    return entry;
  }

  addEdge(compositionId, edge) {
    if (!compositionId || !edge) {
      throw new Error('compositionId and edge are required');
    }
    let graph = this._graphs.get(compositionId);
    if (!graph) {
      graph = { id: compositionId, nodes: [], edges: [], createdAt: new Date().toISOString() };
      this._graphs.set(compositionId, graph);
    }
    const entry = {
      from: edge.from || edge.source || '',
      to: edge.to || edge.target || '',
      type: edge.type || 'dependency'
    };
    graph.edges.push(entry);
    return entry;
  }

  removeNode(compositionId, nodeId) {
    if (!compositionId || !nodeId) return false;
    const graph = this._graphs.get(compositionId);
    if (!graph) return false;
    const index = graph.nodes.findIndex(n => n.id === nodeId);
    if (index === -1) return false;
    graph.nodes.splice(index, 1);
    graph.edges = graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    return true;
  }

  getNodes(compositionId) {
    if (!compositionId) return [];
    const graph = this._graphs.get(compositionId);
    return graph ? [...graph.nodes] : [];
  }

  getEdges(compositionId) {
    if (!compositionId) return [];
    const graph = this._graphs.get(compositionId);
    return graph ? [...graph.edges] : [];
  }

  getAdjacencyList(compositionId) {
    if (!compositionId) return {};
    const graph = this._graphs.get(compositionId);
    if (!graph) return {};
    const adj = {};
    for (const node of graph.nodes) {
      adj[node.id] = [];
    }
    for (const edge of graph.edges) {
      if (adj[edge.from]) {
        adj[edge.from].push(edge.to);
      }
    }
    return adj;
  }

  clear() {
    this._graphs.clear();
  }
}

module.exports = { CompositionGraph };
