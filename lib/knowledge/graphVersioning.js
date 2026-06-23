class GraphVersioning {
  constructor() {
    this._versions = new Map();
    this._counter = 0;
  }

  snapshot(graphState, label) {
    if (!graphState) throw new Error('graphState is required');
    const id = 'ver_' + (++this._counter);
    const version = {
      id,
      label: label || 'snapshot_' + this._counter,
      state: JSON.parse(JSON.stringify(graphState)),
      createdAt: new Date().toISOString()
    };
    this._versions.set(id, version);
    return version;
  }

  get(id) {
    if (!id) return null;
    return this._versions.get(id) || null;
  }

  list() {
    return Array.from(this._versions.values());
  }

  getLatest() {
    const versions = this.list();
    if (versions.length === 0) return null;
    return versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  diff(versionIdA, versionIdB) {
    const a = this._versions.get(versionIdA);
    const b = this._versions.get(versionIdB);
    if (!a || !b) return null;
    const diff = { nodesAdded: [], nodesRemoved: [], edgesChanged: [] };
    const aNodes = new Set((a.state.nodes || []).map(n => n.id));
    const bNodes = new Set((b.state.nodes || []).map(n => n.id));
    for (const nId of bNodes) {
      if (!aNodes.has(nId)) diff.nodesAdded.push(nId);
    }
    for (const nId of aNodes) {
      if (!bNodes.has(nId)) diff.nodesRemoved.push(nId);
    }
    const aEdges = new Set((a.state.edges || []).map(e => e.id));
    const bEdges = new Set((b.state.edges || []).map(e => e.id));
    for (const eId of bEdges) {
      if (!aEdges.has(eId)) diff.edgesChanged.push(eId);
    }
    for (const eId of aEdges) {
      if (!bEdges.has(eId)) diff.edgesChanged.push(eId);
    }
    return diff;
  }

  clear() {
    this._versions.clear();
    this._counter = 0;
  }
}

module.exports = { GraphVersioning };
