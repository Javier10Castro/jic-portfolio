class SnapshotManager {
  constructor() {
    this._snapshots = new Map();
    this._counter = 0;
  }

  createSnapshot(projectId, type, data) {
    if (!projectId || !type || data === undefined) {
      throw new Error('projectId, type, and data are required');
    }
    const id = `snap_${++this._counter}`;
    const snapshot = {
      id,
      projectId,
      type,
      data,
      timestamp: new Date().toISOString(),
      version: this._counter
    };
    this._snapshots.set(id, snapshot);
    return snapshot;
  }

  getSnapshot(id) {
    return this._snapshots.get(id) || null;
  }

  listSnapshots(projectId, type) {
    return Array.from(this._snapshots.values()).filter(s => {
      if (s.projectId !== projectId) return false;
      if (type !== undefined && s.type !== type) return false;
      return true;
    });
  }

  restoreSnapshot(id) {
    if (!this._snapshots.has(id)) {
      throw new Error(`Snapshot "${id}" not found`);
    }
    return this._snapshots.get(id).data;
  }

  deleteSnapshot(id) {
    return this._snapshots.delete(id);
  }

  clear() {
    this._snapshots.clear();
  }
}

module.exports = { SnapshotManager };
