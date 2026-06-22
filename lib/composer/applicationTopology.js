class ApplicationTopology {
  constructor() {
    this._topologies = new Map();
  }

  build(appId, components = []) {
    if (!appId || !Array.isArray(components)) {
      throw new Error('appId and components array are required');
    }
    const nodes = components.map((c, index) => ({
      id: c.id || `node-${index}`,
      type: c.type || 'unknown',
      name: c.name || ''
    }));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          type: 'connected'
        });
      }
    }
    const topology = {
      appId,
      nodes,
      edges,
      timestamp: new Date().toISOString()
    };
    this._topologies.set(appId, topology);
    return topology;
  }

  get(appId) {
    if (!appId) return null;
    return this._topologies.get(appId) || null;
  }

  addNode(appId, node) {
    if (!appId || !node) {
      throw new Error('appId and node are required');
    }
    let topology = this._topologies.get(appId);
    if (!topology) {
      topology = { appId, nodes: [], edges: [], timestamp: new Date().toISOString() };
      this._topologies.set(appId, topology);
    }
    const entry = {
      id: node.id || `node-${topology.nodes.length}`,
      type: node.type || 'unknown',
      name: node.name || ''
    };
    topology.nodes.push(entry);
    topology.timestamp = new Date().toISOString();
    return entry;
  }

  addEdge(appId, edge) {
    if (!appId || !edge) {
      throw new Error('appId and edge are required');
    }
    let topology = this._topologies.get(appId);
    if (!topology) {
      topology = { appId, nodes: [], edges: [], timestamp: new Date().toISOString() };
      this._topologies.set(appId, topology);
    }
    const entry = {
      source: edge.source || '',
      target: edge.target || '',
      type: edge.type || 'connected'
    };
    topology.edges.push(entry);
    topology.timestamp = new Date().toISOString();
    return entry;
  }

  listNodes(appId) {
    if (!appId) return [];
    const topology = this._topologies.get(appId);
    return topology ? [...topology.nodes] : [];
  }

  listEdges(appId) {
    if (!appId) return [];
    const topology = this._topologies.get(appId);
    return topology ? [...topology.edges] : [];
  }

  clear() {
    this._topologies.clear();
  }
}

module.exports = { ApplicationTopology };
