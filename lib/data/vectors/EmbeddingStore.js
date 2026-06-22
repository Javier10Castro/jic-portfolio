class EmbeddingStore {
  constructor(name, dimensions = 1536) { this.name = name; this.dimensions = dimensions; this._vectors = []; }
  insert(id, vector, metadata) { this._vectors.push({ id, vector, metadata, insertedAt: Date.now() }); return { success: true, id }; }
  get(id) { const v = this._vectors.find(v => v.id === id); return v || null; }
  delete(id) { const idx = this._vectors.findIndex(v => v.id === id); if (idx >= 0) { this._vectors.splice(idx, 1); return { success: true }; } return { success: false, error: 'Not found' }; }
  count() { return this._vectors.length; }
  clear() { this._vectors = []; }
}
module.exports = { EmbeddingStore };
