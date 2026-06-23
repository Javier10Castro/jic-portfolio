class KnowledgeGraph {
  constructor() {
    this._nodes = new Map();
    this._edges = [];
    this._counter = 0;
  }

  addNode(entityId, type, properties) {
    if (!entityId) throw new Error('entityId is required');
    if (!type) throw new Error('type is required');
    const node = {
      id: entityId,
      type,
      properties: properties || {},
      createdAt: new Date().toISOString()
    };
    this._nodes.set(entityId, node);
    return node;
  }

  getNode(entityId) {
    return this._nodes.get(entityId) || null;
  }

  removeNode(entityId) {
    if (!entityId) return false;
    this._edges = this._edges.filter(e => e.from !== entityId && e.to !== entityId);
    return this._nodes.delete(entityId);
  }

  addEdge(from, to, relation, properties) {
    if (!from || !to || !relation) throw new Error('from, to, and relation are required');
    const id = 'edge_' + (++this._counter);
    const edge = {
      id, from, to, relation,
      properties: properties || {},
      createdAt: new Date().toISOString()
    };
    this._edges.push(edge);
    return edge;
  }

  removeEdge(id) {
    if (!id) return false;
    const idx = this._edges.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this._edges.splice(idx, 1);
    return true;
  }

  getEdges(from, to, relation) {
    let result = this._edges;
    if (from) result = result.filter(e => e.from === from);
    if (to) result = result.filter(e => e.to === to);
    if (relation) result = result.filter(e => e.relation === relation);
    return result;
  }

  getNodesByType(type) {
    if (!type) return [];
    return Array.from(this._nodes.values()).filter(n => n.type === type);
  }

  getAllNodes() {
    return Array.from(this._nodes.values());
  }

  getAllEdges() {
    return this._edges;
  }

  nodeCount() {
    return this._nodes.size;
  }

  edgeCount() {
    return this._edges.length;
  }

  clear() {
    this._nodes.clear();
    this._edges = [];
    this._counter = 0;
  }
}

module.exports = { KnowledgeGraph };
