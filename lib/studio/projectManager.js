class ProjectManager {
  constructor() {
    this._projects = new Map();
    this._counter = 0;
  }

  create(data) {
    if (!data) throw new Error('data is required');
    if (!data.prompt) throw new Error('prompt is required');
    const id = 'proj_' + (++this._counter);
    const project = {
      id,
      name: data.name || data.prompt.substring(0, 50),
      prompt: data.prompt,
      options: data.options || {},
      status: data.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buildId: data.buildId || null,
      architectureId: data.architectureId || null,
      compositionId: data.compositionId || null,
      deploymentId: data.deploymentId || null,
      previewUrl: data.previewUrl || null,
      liveUrl: data.liveUrl || null
    };
    this._projects.set(id, project);
    return project;
  }

  get(id) {
    if (!id) return null;
    return this._projects.get(id) || null;
  }

  update(id, updates) {
    const project = this._projects.get(id);
    if (!project) return null;
    Object.assign(project, updates, { updatedAt: new Date().toISOString() });
    return project;
  }

  list(filter) {
    let results = Array.from(this._projects.values());
    if (filter) {
      if (filter.status) results = results.filter(p => p.status === filter.status);
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  remove(id) {
    if (!id) return false;
    return this._projects.delete(id);
  }

  count() {
    return this._projects.size;
  }

  clear() {
    this._projects.clear();
    this._counter = 0;
  }
}

module.exports = { ProjectManager };
