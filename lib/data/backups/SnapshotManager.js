class SnapshotManager {
  constructor() { this._snapshots = []; }
  create(name, data) {
    const snapshot = { id: `snap-${Date.now()}`, name, data, createdAt: Date.now(), size: JSON.stringify(data).length };
    this._snapshots.push(snapshot);
    return { success: true, snapshot };
  }
  get(id) { return this._snapshots.find(s => s.id === id) || null; }
  list() { return this._snapshots.map(s => ({ id: s.id, name: s.name, createdAt: s.createdAt, size: s.size })); }
  delete(id) { const idx = this._snapshots.findIndex(s => s.id === id); if (idx >= 0) { this._snapshots.splice(idx, 1); return { success: true }; } return { success: false, error: 'Not found' }; }
  count() { return this._snapshots.length; }
  clear() { this._snapshots = []; }
}
module.exports = { SnapshotManager };
