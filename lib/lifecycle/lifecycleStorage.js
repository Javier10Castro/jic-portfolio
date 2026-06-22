class LifecycleStorage {
  constructor() {
    this._store = new Map();
  }

  set(key, value) {
    if (key === undefined || key === null) {
      throw new Error('Key is required');
    }
    this._store.set(String(key), value);
  }

  get(key) {
    if (key === undefined || key === null) return null;
    const val = this._store.get(String(key));
    return val !== undefined ? val : null;
  }

  delete(key) {
    if (key === undefined || key === null) return false;
    return this._store.delete(String(key));
  }

  has(key) {
    if (key === undefined || key === null) return false;
    return this._store.has(String(key));
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

module.exports = { LifecycleStorage };
