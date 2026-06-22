class CompositionRegistry {
  constructor() {
    this._compositions = new Map();
  }

  register(composition) {
    if (!composition) {
      throw new Error('composition is required');
    }
    if (!composition.id) {
      throw new Error('composition must have an id');
    }
    if (this._compositions.has(composition.id)) {
      throw new Error(`composition with id '${composition.id}' is already registered`);
    }
    this._compositions.set(composition.id, composition);
    return composition;
  }

  get(id) {
    if (!id) return null;
    return this._compositions.get(id) || null;
  }

  unregister(id) {
    if (!id) return false;
    return this._compositions.delete(id);
  }

  list() {
    return Array.from(this._compositions.values());
  }

  clear() {
    this._compositions.clear();
  }
}

module.exports = { CompositionRegistry };
