class ExperimentStorage {
  constructor() {
    this._experiments = new Map();
    this._results = new Map();
  }

  saveExperiment(experiment) {
    this._experiments.set(experiment.id, experiment);
  }

  getExperiment(id) {
    return this._experiments.get(id) || null;
  }

  listExperiments(filter = {}) {
    let list = Array.from(this._experiments.values());
    if (filter.status) {
      list = list.filter(e => e.status === filter.status);
    }
    if (filter.tags) {
      list = list.filter(e => {
        if (!e.tags) return false;
        return filter.tags.some(t => e.tags.includes(t));
      });
    }
    return list;
  }

  saveResult(runId, result) {
    this._results.set(runId, result);
  }

  getResults(experimentId) {
    return Array.from(this._results.values()).filter(r => r.experimentId === experimentId);
  }

  getVariantData(experimentId, variantName) {
    return this.getResults(experimentId).filter(r => r.variant === variantName);
  }

  deleteExperiment(id) {
    this._experiments.delete(id);
    const toDelete = [];
    for (const [key, val] of this._results) {
      if (val.experimentId === id) toDelete.push(key);
    }
    for (const key of toDelete) this._results.delete(key);
  }

  clear() {
    this._experiments.clear();
    this._results.clear();
  }
}

export default ExperimentStorage;
export { ExperimentStorage };
