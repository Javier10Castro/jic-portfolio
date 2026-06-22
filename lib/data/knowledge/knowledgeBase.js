const { KnowledgeIndexer } = require('./knowledgeIndexer');
const { KnowledgeRetriever } = require('./knowledgeRetriever');
const { KnowledgeChunks } = require('./knowledgeChunks');
const { KnowledgeVersioning } = require('./knowledgeVersioning');
const { KnowledgeSnapshots } = require('./knowledgeSnapshots');

class KnowledgeBase {
  constructor() {
    this._indexer = new KnowledgeIndexer();
    this._retriever = new KnowledgeRetriever();
    this._chunker = new KnowledgeChunks();
    this._versioning = new KnowledgeVersioning();
    this._snapshots = new KnowledgeSnapshots();
  }

  addDocument(doc) {
    if (!doc) return null;
    const id = doc.id || (Date.now() + Math.random().toString(36).slice(2, 9));
    const document = { ...doc, id };
    const chunks = this._chunker.chunkDocument(document);
    document.chunks = chunks;
    this._indexer.indexDocument(document);
    this._retriever._documents.set(id, document);
    this._versioning.createVersion(document);
    return document;
  }

  getDocument(id) {
    if (id == null) return null;
    return this._retriever.retrieveById(id);
  }

  search(query, options) {
    return this._retriever.retrieve(query, options);
  }

  removeDocument(id) {
    if (id == null) return false;
    this._indexer.remove(id);
    this._chunker.removeChunks(id);
    return this._retriever._documents.delete(id);
  }

  getStats() {
    return {
      documentCount: this._retriever._documents.size,
      chunkCount: Array.from(this._chunker._chunks.values()).reduce((sum, c) => sum + c.length, 0),
      versionCount: Array.from(this._versioning._versions.values()).reduce((sum, v) => sum + v.length, 0),
      snapshotCount: this._snapshots._snapshots.size,
    };
  }

  clear() {
    this._indexer.clear();
    this._retriever.clear();
    this._chunker.clear();
    this._versioning.clear();
    this._snapshots.clear();
  }
}

module.exports = { KnowledgeBase };
