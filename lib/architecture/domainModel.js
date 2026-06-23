class DomainModel {
  constructor() {
    this._models = new Map();
  }

  define(solutionId, model) {
    if (!solutionId || !model) {
      throw new Error('solutionId and model are required');
    }
    if (!model.id || !model.name) {
      throw new Error('model must have an id and name');
    }
    const entry = {
      id: model.id,
      name: model.name,
      description: model.description || '',
      entities: Array.isArray(model.entities) ? [...model.entities] : [],
      valueObjects: Array.isArray(model.valueObjects) ? [...model.valueObjects] : [],
      aggregates: Array.isArray(model.aggregates) ? [...model.aggregates] : [],
      events: Array.isArray(model.events) ? [...model.events] : [],
      services: Array.isArray(model.services) ? [...model.services] : [],
      repositories: Array.isArray(model.repositories) ? [...model.repositories] : [],
      createdAt: new Date().toISOString()
    };
    if (!this._models.has(solutionId)) {
      this._models.set(solutionId, new Map());
    }
    this._models.get(solutionId).set(model.id, entry);
    return entry;
  }

  get(solutionId, modelId) {
    if (!solutionId || !modelId) return null;
    const models = this._models.get(solutionId);
    if (!models) return null;
    return models.get(modelId) || null;
  }

  list(solutionId) {
    if (!solutionId) return [];
    const models = this._models.get(solutionId);
    return models ? Array.from(models.values()) : [];
  }

  update(solutionId, modelId, changes) {
    if (!solutionId || !modelId || !changes) {
      throw new Error('solutionId, modelId and changes are required');
    }
    const models = this._models.get(solutionId);
    if (!models) return null;
    const model = models.get(modelId);
    if (!model) return null;
    const allowed = ['name', 'description', 'entities', 'valueObjects', 'aggregates', 'events', 'services', 'repositories'];
    for (const key of Object.keys(changes)) {
      if (allowed.includes(key)) {
        model[key] = changes[key];
      }
    }
    return model;
  }

  remove(solutionId, modelId) {
    if (!solutionId || !modelId) return false;
    const models = this._models.get(solutionId);
    if (!models) return false;
    return models.delete(modelId);
  }

  clear() {
    this._models.clear();
  }
}

module.exports = { DomainModel };
