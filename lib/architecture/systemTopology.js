class SystemTopology {
  constructor() {
    this._topologies = new Map();
  }

  build(solutionId, nodes = [], edges = []) {
    if (!solutionId) {
      throw new Error('solutionId is required');
    }
    const topology = {
      solutionId,
      nodes: nodes.map(n => ({
        id: n.id || `node-${Math.random().toString(36).substr(2, 9)}`,
        type: n.type || 'unknown',
        name: n.name || '',
        layer: n.layer || 'default'
      })),
      edges: edges.map(e => ({
        source: e.source || '',
        target: e.target || '',
        type: e.type || 'dependency'
      })),
      timestamp: new Date().toISOString()
    };
    this._topologies.set(solutionId, topology);
    return topology;
  }

  get(id) {
    if (!id) return null;
    return this._topologies.get(id) || null;
  }

  addNode(solutionId, node) {
    if (!solutionId || !node) {
      throw new Error('solutionId and node are required');
    }
    let topology = this._topologies.get(solutionId);
    if (!topology) {
      topology = { solutionId, nodes: [], edges: [], timestamp: new Date().toISOString() };
      this._topologies.set(solutionId, topology);
    }
    const entry = {
      id: node.id || `node-${topology.nodes.length}`,
      type: node.type || 'unknown',
      name: node.name || '',
      layer: node.layer || 'default'
    };
    topology.nodes.push(entry);
    topology.timestamp = new Date().toISOString();
    return entry;
  }

  addEdge(solutionId, edge) {
    if (!solutionId || !edge) {
      throw new Error('solutionId and edge are required');
    }
    let topology = this._topologies.get(solutionId);
    if (!topology) {
      topology = { solutionId, nodes: [], edges: [], timestamp: new Date().toISOString() };
      this._topologies.set(solutionId, topology);
    }
    const entry = {
      source: edge.source || '',
      target: edge.target || '',
      type: edge.type || 'dependency'
    };
    topology.edges.push(entry);
    topology.timestamp = new Date().toISOString();
    return entry;
  }

  removeNode(solutionId, nodeId) {
    if (!solutionId || !nodeId) return false;
    const topology = this._topologies.get(solutionId);
    if (!topology) return false;
    const index = topology.nodes.findIndex(n => n.id === nodeId);
    if (index === -1) return false;
    topology.nodes.splice(index, 1);
    topology.edges = topology.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    return true;
  }

  listNodes(solutionId) {
    if (!solutionId) return [];
    const topology = this._topologies.get(solutionId);
    return topology ? [...topology.nodes] : [];
  }

  listEdges(solutionId) {
    if (!solutionId) return [];
    const topology = this._topologies.get(solutionId);
    return topology ? [...topology.edges] : [];
  }

  getLayered(solutionId) {
    if (!solutionId) return {};
    const topology = this._topologies.get(solutionId);
    if (!topology) return {};
    const layers = {};
    for (const node of topology.nodes) {
      const layer = node.layer || 'default';
      if (!layers[layer]) {
        layers[layer] = [];
      }
      layers[layer].push(node);
    }
    return layers;
  }

  clear() {
    this._topologies.clear();
  }
}

module.exports = { SystemTopology };
