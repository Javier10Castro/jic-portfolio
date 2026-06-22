class Repository {
  constructor(store, entityName) {
    this._store = store;
    this._entityName = entityName;
    this._entities = new Map();
  }

  create(entity) {
    if (!entity || typeof entity !== 'object') return null;
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    const stored = { ...entity, id };
    this._entities.set(id, stored);
    return stored;
  }

  get(id) {
    if (id == null) return null;
    const entity = this._entities.get(id);
    return entity ? { ...entity } : null;
  }

  update(id, changes) {
    if (id == null || !changes || typeof changes !== 'object') return null;
    const entity = this._entities.get(id);
    if (!entity) return null;
    const updated = { ...entity, ...changes, id };
    this._entities.set(id, updated);
    return updated;
  }

  delete(id) {
    if (id == null) return false;
    return this._entities.delete(id);
  }

  list(filters) {
    if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
      return Array.from(this._entities.values());
    }
    return Array.from(this._entities.values()).filter(entity => {
      return Object.entries(filters).every(([key, value]) => entity[key] === value);
    });
  }

  find(predicate) {
    if (typeof predicate !== 'function') return [];
    return Array.from(this._entities.values()).filter(predicate);
  }

  count(filters) {
    return this.list(filters).length;
  }

  clear() {
    this._entities.clear();
  }
}

module.exports = { Repository };
