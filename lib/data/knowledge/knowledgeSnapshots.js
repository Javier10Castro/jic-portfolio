class KnowledgeSnapshots {
  constructor() {
    this._snapshots = new Map();
  }

  createSnapshot(docs) {
    if (!Array.isArray(docs)) return null;
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    const snapshot = {
      id,
      data: JSON.parse(JSON.stringify(docs)),
      createdAt: new Date().toISOString(),
      count: docs.length,
    };
    this._snapshots.set(id, snapshot);
    return snapshot;
  }

  getSnapshot(id) {
    if (id == null) return null;
    const snap = this._snapshots.get(id);
    return snap ? { ...snap, data: [...snap.data] } : null;
  }

  listSnapshots() {
    return Array.from(this._snapshots.values()).map(s => ({ ...s, data: [...s.data] }));
  }

  restore(id) {
    if (id == null) return null;
    const snap = this._snapshots.get(id);
    if (!snap) return null;
    return JSON.parse(JSON.stringify(snap.data));
  }

  clear() {
    this._snapshots.clear();
  }
}

module.exports = { KnowledgeSnapshots };
