class WorkspaceManager {
  constructor() {
    this._workspaces = new Map();
    this._counter = 0;
  }

  create(projectId, data) {
    if (!projectId) throw new Error('projectId is required');
    const id = 'ws_' + (++this._counter);
    const workspace = {
      id,
      projectId,
      files: data && data.files ? data.files : [],
      env: (data && data.env) || {},
      config: (data && data.config) || {},
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this._workspaces.set(id, workspace);
    return workspace;
  }

  get(projectId) {
    if (!projectId) return null;
    return Array.from(this._workspaces.values()).find(w => w.projectId === projectId) || null;
  }

  addFile(projectId, file) {
    if (!projectId || !file) return null;
    const ws = this.get(projectId);
    if (!ws) return null;
    ws.files.push(Object.assign({ addedAt: new Date().toISOString() }, file));
    ws.updatedAt = new Date().toISOString();
    return ws;
  }

  update(projectId, updates) {
    const ws = this.get(projectId);
    if (!ws) return null;
    Object.assign(ws, updates, { updatedAt: new Date().toISOString() });
    return ws;
  }

  remove(projectId) {
    const ws = this.get(projectId);
    if (!ws) return false;
    return this._workspaces.delete(ws.id);
  }

  list() {
    return Array.from(this._workspaces.values());
  }

  clear() {
    this._workspaces.clear();
    this._counter = 0;
  }
}

module.exports = { WorkspaceManager };
