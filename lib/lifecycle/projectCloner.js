class ProjectCloner {
  constructor() {
    this._clones = new Map();
    this._historyIndex = new Map();
    this._counter = 0;
  }

  cloneProject(projectId, newName, options) {
    if (!projectId || !newName) {
      throw new Error('projectId and newName are required');
    }
    const id = `clone_${++this._counter}`;
    const snapshotId = `snap_${Date.now()}_${this._counter}`;
    const clone = {
      newProjectId: id,
      name: newName,
      clonedFrom: projectId,
      snapshotId,
      options: options || {},
      timestamp: new Date().toISOString()
    };
    this._clones.set(id, clone);
    if (!this._historyIndex.has(projectId)) {
      this._historyIndex.set(projectId, []);
    }
    this._historyIndex.get(projectId).push(clone);
    return clone;
  }

  getCloneHistory(projectId) {
    if (!this._historyIndex.has(projectId)) return [];
    return [...this._historyIndex.get(projectId)];
  }

  clear() {
    this._clones.clear();
    this._historyIndex.clear();
  }
}

module.exports = { ProjectCloner };
