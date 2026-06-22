class QdrantProvider {
  constructor() { this.name = 'qdrant'; }
  connect(config) { if (!config.url) return { success: false, error: 'url required' }; return { success: true, instance: { provider: 'qdrant', config } }; }
  store(instance, collection, vectors) { return { success: true, count: vectors.length }; }
  search(instance, collection, queryVector, limit) { return { success: true, results: [{ id: '1', score: 0.92 }] }; }
  deleteCollection(instance, collection) { return { success: true }; }
}
module.exports = { QdrantProvider };
