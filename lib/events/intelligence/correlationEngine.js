class CorrelationEngine {
  constructor() {
    this._graph = new Map();
    this._edges = [];
    this._maxEdges = 2000;
    this._maxNodes = 500;
  }

  ingest(event) {
    const type = event.type || 'unknown';
    const source = event.source || 'unknown';
    const correlationId = event.correlationId;

    this._ensureNode(type, source);
    if (correlationId) this._linkTemporal(type, correlationId, event);

    return this._detectNewEdges(type);
  }

  getGraph() {
    const nodes = [];
    for (const [id, node] of this._graph) {
      nodes.push({
        id,
        type: node.type,
        source: node.source,
        eventCount: node.eventCount,
        firstSeen: node.firstSeen,
        lastSeen: node.lastSeen,
      });
    }
    return { nodes, edges: this._edges.slice(-500) };
  }

  getNode(id) {
    return this._graph.get(id) || null;
  }

  clear() {
    this._graph.clear();
    this._edges = [];
  }

  _ensureNode(type, source) {
    const id = type + ':' + source;
    if (this._graph.has(id)) {
      const node = this._graph.get(id);
      node.eventCount++;
      node.lastSeen = Date.now();
      return;
    }
    if (this._graph.size >= this._maxNodes) {
      const oldest = this._graph.keys().next().value;
      this._graph.delete(oldest);
    }
    this._graph.set(id, {
      id,
      type,
      source,
      eventCount: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });
  }

  _linkTemporal(type, correlationId, event) {
    const source = event.source || 'unknown';
    const key = 'corr:' + correlationId;
    if (!this._graph.has(key)) {
      this._graph.set(key, {
        id: key,
        type: 'correlation',
        source: 'system',
        eventCount: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        correlationId,
      });
    }
    const corrNode = this._graph.get(key);
    corrNode.eventCount++;
    corrNode.lastSeen = Date.now();

    this._addEdge(key, type + ':' + source, 'temporal', { correlationId, eventType: type });
  }

  _addEdge(from, to, relation, metadata) {
    const edge = { from, to, relation, metadata, timestamp: Date.now() };
    this._edges.push(edge);
    if (this._edges.length > this._maxEdges) this._edges.shift();
    return edge;
  }

  _detectNewEdges(type) {
    const newEdges = [];
    const causal = {
      'workflow.failure': 'agent.task.failure',
      'ai.fallback': 'cluster.worker.overload',
      'cluster.worker.offline': 'workflow.retry',
      'api.error': 'workflow.failure',
    };
    for (const [cause, effect] of Object.entries(causal)) {
      if (type === cause) {
        const sourceId = type + ':' + 'unknown';
        const targetId = effect + ':' + 'unknown';
        if (this._graph.has(sourceId) || true) {
          this._addEdge(sourceId, targetId, 'causal', { confidence: 0.7 });
          newEdges.push({ from: sourceId, to: targetId, relation: 'causal', confidence: 0.7 });
        }
      }
    }
    return newEdges;
  }
}

module.exports = CorrelationEngine;
