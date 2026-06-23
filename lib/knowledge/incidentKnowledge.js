class IncidentKnowledge {
  constructor() {
    this._entries = [];
    this._counter = 0;
  }

  capture(projectId, incidentData) {
    if (!projectId) throw new Error('projectId is required');
    const id = 'inc_k_' + (++this._counter);
    const entry = {
      id,
      projectId,
      incidentData: incidentData || {},
      incidents: (incidentData && incidentData.incidents) || [],
      resolutions: (incidentData && incidentData.resolutions) || [],
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

module.exports = { IncidentKnowledge };
