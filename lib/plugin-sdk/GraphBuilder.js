class GraphBuilder {
  constructor(name) { this.name = name; this._nodes = []; this._edges = []; }
  addNode(node) { this._nodes.push(node); }
  addEdge(edge) { this._edges.push(edge); }
  build() { return { nodes: [...this._nodes], edges: [...this._edges] }; }
  clear() { this._nodes = []; this._edges = []; }
}
module.exports = { GraphBuilder };
