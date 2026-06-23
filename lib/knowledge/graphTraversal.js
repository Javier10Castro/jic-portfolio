class GraphTraversal {
  constructor() {
    this._graph = null;
  }

  setGraph(graph) {
    this._graph = graph;
  }

  bfs(startId, maxDepth) {
    if (!startId) return [];
    const edges = this._graph ? this._graph.getAllEdges() : [];
    const visited = new Set();
    const queue = [{ id: startId, depth: 0 }];
    const result = [];
    visited.add(startId);
    const max = maxDepth || 10;
    while (queue.length > 0) {
      const current = queue.shift();
      if (current.depth > max) continue;
      result.push({ id: current.id, depth: current.depth });
      const neighbors = edges.filter(e => e.from === current.id || e.to === current.id);
      for (const edge of neighbors) {
        const nextId = edge.from === current.id ? edge.to : edge.from;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, depth: current.depth + 1 });
        }
      }
    }
    return result;
  }

  dfs(startId, maxDepth) {
    if (!startId) return [];
    const edges = this._graph ? this._graph.getAllEdges() : [];
    const visited = new Set();
    const stack = [{ id: startId, depth: 0 }];
    const result = [];
    const max = maxDepth || 20;
    while (stack.length > 0) {
      const current = stack.pop();
      if (current.depth > max) continue;
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      result.push({ id: current.id, depth: current.depth });
      const neighbors = edges.filter(e => e.from === current.id || e.to === current.id);
      for (const edge of neighbors) {
        const nextId = edge.from === current.id ? edge.to : edge.from;
        if (!visited.has(nextId)) {
          stack.push({ id: nextId, depth: current.depth + 1 });
        }
      }
    }
    return result;
  }

  findPath(fromId, toId) {
    if (!fromId || !toId) return null;
    const edges = this._graph ? this._graph.getAllEdges() : [];
    const visited = new Set();
    const queue = [[fromId]];
    visited.add(fromId);
    while (queue.length > 0) {
      const path = queue.shift();
      const last = path[path.length - 1];
      if (last === toId) return path;
      const neighbors = edges.filter(e => e.from === last || e.to === last);
      for (const edge of neighbors) {
        const nextId = edge.from === last ? edge.to : edge.from;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push([...path, nextId]);
        }
      }
    }
    return null;
  }

  getNeighbors(nodeId) {
    if (!nodeId) return [];
    const edges = this._graph ? this._graph.getAllEdges() : [];
    const neighbors = [];
    const seen = new Set();
    for (const edge of edges) {
      if (edge.from === nodeId && !seen.has(edge.to)) {
        seen.add(edge.to);
        neighbors.push({ id: edge.to, relation: edge.relation, direction: 'out' });
      }
      if (edge.to === nodeId && !seen.has(edge.from)) {
        seen.add(edge.from);
        neighbors.push({ id: edge.from, relation: edge.relation, direction: 'in' });
      }
    }
    return neighbors;
  }

  clear() {
    this._graph = null;
  }
}

module.exports = { GraphTraversal };
