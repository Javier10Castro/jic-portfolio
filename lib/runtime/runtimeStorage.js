class RuntimeStorage {
  constructor() {
    this._store = new Map();
  }

  set(key, value) {
    if (key === undefined || key === null) {
      return false;
    }
    this._store.set(key, value);
    return true;
  }

  get(key) {
    if (!this._store.has(key)) {
      return null;
    }
    return this._store.get(key);
  }

  delete(key) {
    if (!this._store.has(key)) {
      return false;
    }
    this._store.delete(key);
    return true;
  }

  has(key) {
    return this._store.has(key);
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

module.exports = { RuntimeStorage };
