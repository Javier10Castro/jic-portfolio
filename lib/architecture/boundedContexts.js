class BoundedContexts {
  constructor() {
    this._contexts = new Map();
  }

  define(solutionId, context) {
    if (!solutionId || !context) {
      throw new Error('solutionId and context are required');
    }
    if (!context.id || !context.name) {
      throw new Error('context must have an id and name');
    }
    const entry = {
      id: context.id,
      name: context.name,
      description: context.description || '',
      responsibilities: Array.isArray(context.responsibilities) ? [...context.responsibilities] : [],
      dependencies: Array.isArray(context.dependencies) ? [...context.dependencies] : [],
      entities: Array.isArray(context.entities) ? [...context.entities] : [],
      events: Array.isArray(context.events) ? [...context.events] : [],
      owner: context.owner || '',
      createdAt: new Date().toISOString()
    };
    if (!this._contexts.has(solutionId)) {
      this._contexts.set(solutionId, new Map());
    }
    this._contexts.get(solutionId).set(context.id, entry);
    return entry;
  }

  get(solutionId, contextId) {
    if (!solutionId || !contextId) return null;
    const contexts = this._contexts.get(solutionId);
    if (!contexts) return null;
    return contexts.get(contextId) || null;
  }

  list(solutionId) {
    if (!solutionId) return [];
    const contexts = this._contexts.get(solutionId);
    return contexts ? Array.from(contexts.values()) : [];
  }

  update(solutionId, contextId, changes) {
    if (!solutionId || !contextId || !changes) {
      throw new Error('solutionId, contextId and changes are required');
    }
    const contexts = this._contexts.get(solutionId);
    if (!contexts) return null;
    const context = contexts.get(contextId);
    if (!context) return null;
    const allowed = ['name', 'description', 'responsibilities', 'dependencies', 'entities', 'events', 'owner'];
    for (const key of Object.keys(changes)) {
      if (allowed.includes(key)) {
        context[key] = changes[key];
      }
    }
    return context;
  }

  remove(solutionId, contextId) {
    if (!solutionId || !contextId) return false;
    const contexts = this._contexts.get(solutionId);
    if (!contexts) return false;
    return contexts.delete(contextId);
  }

  clear() {
    this._contexts.clear();
  }
}

module.exports = { BoundedContexts };
