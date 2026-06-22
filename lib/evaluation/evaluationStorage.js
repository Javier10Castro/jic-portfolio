class EvaluationStorage {
  constructor() {
    this._store = new Map();
    this._namespaces = new Map();
  }

  _ns(namespace, key) {
    return `${namespace}:${key}`;
  }

  set(namespace, key, value) {
    const fullKey = this._ns(namespace, key);
    this._store.set(fullKey, { value, updatedAt: Date.now() });
    if (!this._namespaces.has(namespace)) this._namespaces.set(namespace, new Set());
    this._namespaces.get(namespace).add(key);
  }

  get(namespace, key) {
    const entry = this._store.get(this._ns(namespace, key));
    return entry ? entry.value : undefined;
  }

  has(namespace, key) {
    return this._store.has(this._ns(namespace, key));
  }

  delete(namespace, key) {
    const result = this._store.delete(this._ns(namespace, key));
    if (result && this._namespaces.has(namespace)) {
      this._namespaces.get(namespace).delete(key);
    }
    return result;
  }

  list(namespace) {
    if (!this._namespaces.has(namespace)) return [];
    return Array.from(this._namespaces.get(namespace)).map(key => ({
      key,
      value: this.get(namespace, key),
    }));
  }

  clearNamespace(namespace) {
    if (!this._namespaces.has(namespace)) return;
    for (const key of this._namespaces.get(namespace)) {
      this._store.delete(this._ns(namespace, key));
    }
    this._namespaces.delete(namespace);
  }

  clear() {
    this._store.clear();
    this._namespaces.clear();
  }
}

module.exports = { EvaluationStorage };
