import ExperimentStorage from './experimentStorage.js';

let _experimentIdCounter = 0;

class ExperimentManager {
  constructor(storage) {
    this._storage = storage || new ExperimentStorage();
  }

  createExperiment(config) {
    const experiment = {
      id: `exp_${++_experimentIdCounter}_${Date.now()}`,
      name: config.name,
      description: config.description || '',
      variants: config.variants || [],
      metrics: config.metrics || [],
      tags: config.tags || [],
      status: 'draft',
      createdAt: new Date(),
      startedAt: null,
      stoppedAt: null
    };
    this._storage.saveExperiment(experiment);
    return experiment;
  }

  getExperiment(id) {
    return this._storage.getExperiment(id);
  }

  updateExperiment(id, updates) {
    const experiment = this._storage.getExperiment(id);
    if (!experiment) return null;
    const allowed = ['name', 'description', 'variants', 'metrics', 'tags'];
    for (const key of allowed) {
      if (key in updates) {
        experiment[key] = updates[key];
      }
    }
    this._storage.saveExperiment(experiment);
    return experiment;
  }

  listExperiments(filter = {}) {
    return this._storage.listExperiments(filter);
  }

  startExperiment(id) {
    const experiment = this._storage.getExperiment(id);
    if (!experiment) return null;
    experiment.status = 'running';
    experiment.startedAt = new Date();
    this._storage.saveExperiment(experiment);
    return experiment;
  }

  stopExperiment(id) {
    const experiment = this._storage.getExperiment(id);
    if (!experiment) return null;
    experiment.status = 'stopped';
    experiment.stoppedAt = new Date();
    this._storage.saveExperiment(experiment);
    return experiment;
  }

  archiveExperiment(id) {
    const experiment = this._storage.getExperiment(id);
    if (!experiment) return null;
    experiment.status = 'archived';
    this._storage.saveExperiment(experiment);
    return experiment;
  }

  deleteExperiment(id) {
    this._storage.deleteExperiment(id);
  }

  clear() {
    this._storage.clear();
  }
}

export default ExperimentManager;
export { ExperimentManager };
