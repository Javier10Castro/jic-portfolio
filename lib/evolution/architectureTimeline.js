class ArchitectureTimeline {
  constructor() {
    this._timelines = [];
    this._counter = 0;
  }

  create(evolutionId, milestones) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!Array.isArray(milestones)) throw new Error('milestones must be an array');
    const id = 'timeline_' + (++this._counter);
    const sorted = JSON.parse(JSON.stringify(milestones)).sort((a, b) => (a.order || 0) - (b.order || 0));
    const timeline = {
      id, evolutionId,
      milestones: sorted,
      totalMilestones: sorted.length,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this._timelines.push(timeline);
    return timeline;
  }

  get(id) {
    if (!id) return null;
    return this._timelines.find(t => t.id === id) || null;
  }

  list() {
    return this._timelines;
  }

  updateMilestone(timelineId, milestoneIndex, updates) {
    if (!timelineId || milestoneIndex === undefined || !updates) return null;
    const timeline = this._timelines.find(t => t.id === timelineId);
    if (!timeline || milestoneIndex < 0 || milestoneIndex >= timeline.milestones.length) return null;
    Object.assign(timeline.milestones[milestoneIndex], updates);
    return timeline;
  }

  clear() {
    this._timelines = [];
    this._counter = 0;
  }
}

module.exports = { ArchitectureTimeline };
