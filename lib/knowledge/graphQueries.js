class GraphQueries {
  constructor() {
    this._graph = null;
  }

  setGraph(graph) {
    this._graph = graph;
  }

  findNodes(query) {
    if (!query || !this._graph) return [];
    const nodes = this._graph.getAllNodes();
    return nodes.filter(n => {
      for (const key of Object.keys(query)) {
        if (key === 'type') {
          if (n.type !== query.type) return false;
        } else if (key === 'name') {
          if (n.properties.name !== query.name) return false;
        } else if (key === 'id') {
          if (n.id !== query.id) return false;
        } else {
          if (n.properties[key] !== query[key]) return false;
        }
      }
      return true;
    });
  }

  findSubgraph(nodeIds) {
    if (!nodeIds || !this._graph) return { nodes: [], edges: [] };
    const idSet = new Set(nodeIds);
    const nodes = this._graph.getAllNodes().filter(n => idSet.has(n.id));
    const edges = this._graph.getAllEdges().filter(e => idSet.has(e.from) && idSet.has(e.to));
    return { nodes, edges };
  }

  findByProperty(prop, value) {
    if (!prop || !this._graph) return [];
    return this._graph.getAllNodes().filter(n => n.properties[prop] === value);
  }

  getConnectedComponents() {
    if (!this._graph) return [];
    const nodes = this._graph.getAllNodes();
    const edges = this._graph.getAllEdges();
    const visited = new Set();
    const components = [];
    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      const component = [];
      const queue = [node.id];
      visited.add(node.id);
      while (queue.length > 0) {
        const current = queue.shift();
        component.push(current);
        const conn = edges.filter(e => e.from === current || e.to === current);
        for (const edge of conn) {
          const neighbor = edge.from === current ? edge.to : edge.from;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      components.push(component);
    }
    return components;
  }

  clear() {
    this._graph = null;
  }
}

module.exports = { GraphQueries };
