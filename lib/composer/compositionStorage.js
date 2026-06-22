class CompositionStorage {
  constructor() {
    this._store = new Map();
  }

  set(key, value) {
    if (key === null || key === undefined) {
      throw new Error('key must not be null or undefined');
    }
    const stringKey = String(key);
    this._store.set(stringKey, value);
    return this;
  }

  get(key) {
    if (key === null || key === undefined) return null;
    const stringKey = String(key);
    return this._store.has(stringKey) ? this._store.get(stringKey) : null;
  }

  delete(key) {
    if (key === null || key === undefined) return false;
    const stringKey = String(key);
    return this._store.delete(stringKey);
  }

  has(key) {
    if (key === null || key === undefined) return false;
    const stringKey = String(key);
    return this._store.has(stringKey);
  }

  getAll() {
    const result = {};
    for (const [key, value] of this._store) {
      result[key] = value;
    }
    return result;
  }

  clear() {
    this._store.clear();
  }
}

module.exports = { CompositionStorage };
