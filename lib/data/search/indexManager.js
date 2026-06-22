class IndexManager {
  constructor() {
    this._indexes = {};
  }

  createIndex(name, config) {
    if (!name) return null;
    this._indexes[name] = {
      config: config || { fields: [], analyzers: {} },
      documents: {},
      createdAt: Date.now()
    };
    return { name, ...this._indexes[name].config };
  }

  getIndex(name) {
    return this._indexes[name] ? { name, ...this._indexes[name].config } : null;
  }

  listIndexes() {
    return Object.keys(this._indexes);
  }

  dropIndex(name) {
    delete this._indexes[name];
    return true;
  }

  addDocument(indexName, doc) {
    if (!this._indexes[indexName] || !doc || !doc.id) return null;
    this._indexes[indexName].documents[doc.id] = { ...doc, indexedAt: Date.now() };
    return { id: doc.id, indexed: true };
  }

  removeDocument(indexName, docId) {
    if (!this._indexes[indexName]) return false;
    delete this._indexes[indexName].documents[docId];
    return true;
  }

  clear() {
    this._indexes = {};
  }
}

module.exports = { IndexManager };
