class RuntimeKnowledge {
  constructor() {
    this._entries = [];
    this._counter = 0;
  }

  capture(projectId, runtimeData) {
    if (!projectId) throw new Error('projectId is required');
    const id = 'rt_k_' + (++this._counter);
    const entry = {
      id,
      projectId,
      runtimeData: runtimeData || {},
      configurations: (runtimeData && runtimeData.configurations) || [],
      incidents: (runtimeData && runtimeData.incidents) || [],
      capturedAt: new Date().toISOString()
    };
    this._entries.push(entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._entries.find(e => e.id === id) || null;
  }

  findByProject(projectId) {
    if (!projectId) return [];
    return this._entries.filter(e => e.projectId === projectId);
  }

  list() {
    return this._entries;
  }

  clear() {
    this._entries = [];
    this._counter = 0;
  }
}

module.exports = { RuntimeKnowledge };
