class KnowledgeRegistry {
  constructor() {
    this._entries = new Map();
    this._counter = 0;
  }

  register(name, type, metadata) {
    if (!name) throw new Error('name is required');
    if (!type) throw new Error('type is required');
    const id = 'kreg_' + (++this._counter);
    const entry = {
      id,
      name,
      type,
      metadata: metadata || {},
      registeredAt: new Date().toISOString()
    };
    this._entries.set(id, entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._entries.get(id) || null;
  }

  findByName(name) {
    if (!name) return null;
    return Array.from(this._entries.values()).find(e => e.name === name) || null;
  }

  findByType(type) {
    if (!type) return [];
    return Array.from(this._entries.values()).filter(e => e.type === type);
  }

  list() {
    return Array.from(this._entries.values());
  }

  count() {
    return this._entries.size;
  }

  clear() {
    this._entries.clear();
    this._counter = 0;
  }
}

module.exports = { KnowledgeRegistry };
