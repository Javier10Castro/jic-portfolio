class SnapshotProvider {
  constructor(config) {
    this.name = config.name;
    this.type = config.type || 'full';
  }
  createSnapshot(data) { return { id: Date.now(), type: this.type, size: JSON.stringify(data).length, timestamp: Date.now() }; }
  restoreSnapshot(id) { return { id, restored: true, timestamp: Date.now() }; }
  listSnapshots() { return []; }
}
module.exports = { SnapshotProvider };
