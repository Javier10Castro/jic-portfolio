class PolicyStorage {
  constructor() {
    this._data = new Map();
  }

  set(namespace, key, value) {
    if (!namespace || !key) return;
    if (!this._data.has(namespace)) this._data.set(namespace, new Map());
    this._data.get(namespace).set(key, value);
  }

  get(namespace, key) {
    if (!namespace || !key) return null;
    const ns = this._data.get(namespace);
    if (!ns) return null;
    return ns.get(key) !== undefined ? ns.get(key) : null;
  }

  has(namespace, key) {
    if (!namespace || !key) return false;
    const ns = this._data.get(namespace);
    if (!ns) return false;
    return ns.has(key);
  }

  delete(namespace, key) {
    if (!namespace || !key) return false;
    const ns = this._data.get(namespace);
    if (!ns) return false;
    return ns.delete(key);
  }

  list(namespace) {
    if (!namespace) return [];
    const ns = this._data.get(namespace);
    if (!ns) return [];
    return Array.from(ns.keys());
  }

  clearNamespace(namespace) {
    if (!namespace) return;
    this._data.delete(namespace);
  }

  clear() {
    this._data.clear();
  }

  getAll() {
    const result = {};
    for (const [ns, map] of this._data.entries()) {
      result[ns] = {};
      for (const [key, value] of map.entries()) {
        result[ns][key] = value;
      }
    }
    return result;
  }
}

module.exports = { PolicyStorage };
