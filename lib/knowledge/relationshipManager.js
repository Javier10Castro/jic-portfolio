class RelationshipManager {
  constructor() {
    this._relationships = [];
    this._counter = 0;
  }

  define(sourceId, targetId, type, properties) {
    if (!sourceId || !targetId || !type) throw new Error('sourceId, targetId, and type are required');
    const id = 'rel_' + (++this._counter);
    const relationship = {
      id, sourceId, targetId, type,
      properties: properties || {},
      createdAt: new Date().toISOString()
    };
    this._relationships.push(relationship);
    return relationship;
  }

  get(id) {
    if (!id) return null;
    return this._relationships.find(r => r.id === id) || null;
  }

  findBySource(sourceId) {
    if (!sourceId) return [];
    return this._relationships.filter(r => r.sourceId === sourceId);
  }

  findByTarget(targetId) {
    if (!targetId) return [];
    return this._relationships.filter(r => r.targetId === targetId);
  }

  findByType(type) {
    if (!type) return [];
    return this._relationships.filter(r => r.type === type);
  }

  remove(id) {
    if (!id) return false;
    const idx = this._relationships.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this._relationships.splice(idx, 1);
    return true;
  }

  list() {
    return this._relationships;
  }

  count() {
    return this._relationships.length;
  }

  clear() {
    this._relationships = [];
    this._counter = 0;
  }
}

module.exports = { RelationshipManager };
