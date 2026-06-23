class StudioStorage {
  constructor() {
    this._store = new Map();
  }

  set(key, value) {
    if (key === null || key === undefined) return this;
    this._store.set(String(key), value);
    return this;
  }

  get(key) {
    if (key === null || key === undefined) return null;
    return this._store.get(String(key)) || null;
  }

  has(key) {
    if (key === null || key === undefined) return false;
    return this._store.has(String(key));
  }

  delete(key) {
    if (key === null || key === undefined) return false;
    return this._store.delete(String(key));
  }

  getAll() {
    const obj = {};
    for (const [k, v] of this._store) {
      obj[k] = v;
    }
    return obj;
  }

  size() {
    return this._store.size;
  }

  clear() {
    this._store.clear();
  }
}

module.exports = { StudioStorage };
