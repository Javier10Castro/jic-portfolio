class PluginKnowledge {
  constructor() {
    this._entries = [];
    this._counter = 0;
  }

  capture(projectId, pluginData) {
    if (!projectId) throw new Error('projectId is required');
    const id = 'plug_k_' + (++this._counter);
    const entry = {
      id,
      projectId,
      pluginData: pluginData || {},
      plugins: (pluginData && pluginData.plugins) || [],
      integrations: (pluginData && pluginData.integrations) || [],
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

module.exports = { PluginKnowledge };
