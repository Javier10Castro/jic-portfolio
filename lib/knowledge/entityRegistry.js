class EntityRegistry {
  constructor() {
    this._entities = new Map();
    this._counter = 0;
  }

  register(type, name, attributes) {
    if (!type) throw new Error('type is required');
    if (!name) throw new Error('name is required');
    const id = 'ent_' + (++this._counter);
    const entity = {
      id,
      type,
      name,
      attributes: attributes || {},
      registeredAt: new Date().toISOString()
    };
    this._entities.set(id, entity);
    return entity;
  }

  get(id) {
    if (!id) return null;
    return this._entities.get(id) || null;
  }

  findByName(name) {
    if (!name) return [];
    return Array.from(this._entities.values()).filter(e => e.name === name);
  }

  findByType(type) {
    if (!type) return [];
    return Array.from(this._entities.values()).filter(e => e.type === type);
  }

  update(id, attributes) {
    const entity = this._entities.get(id);
    if (!entity) return null;
    entity.attributes = { ...entity.attributes, ...(attributes || {}) };
    return entity;
  }

  remove(id) {
    if (!id) return false;
    return this._entities.delete(id);
  }

  list() {
    return Array.from(this._entities.values());
  }

  count() {
    return this._entities.size;
  }

  clear() {
    this._entities.clear();
    this._counter = 0;
  }
}

module.exports = { EntityRegistry };
