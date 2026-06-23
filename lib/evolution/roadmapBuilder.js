class RoadmapBuilder {
  constructor() {
    this._roadmaps = [];
    this._counter = 0;
  }

  build(evolutionId, phases) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!Array.isArray(phases)) throw new Error('phases must be an array');
    const id = 'roadmap_' + (++this._counter);
    const totalEstimatedHours = phases.reduce((s, p) => s + (p.estimatedHours || 0), 0);
    const roadmap = {
      id, evolutionId,
      phases: JSON.parse(JSON.stringify(phases)),
      phaseCount: phases.length,
      totalEstimatedHours,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    this._roadmaps.push(roadmap);
    return roadmap;
  }

  get(id) {
    if (!id) return null;
    return this._roadmaps.find(r => r.id === id) || null;
  }

  list() {
    return this._roadmaps;
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const roadmap = this._roadmaps.find(r => r.id === id);
    if (!roadmap) return null;
    roadmap.status = status;
    return roadmap;
  }

  clear() {
    this._roadmaps = [];
    this._counter = 0;
  }
}

module.exports = { RoadmapBuilder };
