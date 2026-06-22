class PgVectorProvider {
  constructor() { this.name = 'pgvector'; }
  connect(config) { if (!config.connectionString) return { success: false, error: 'connectionString required' }; return { success: true, instance: { provider: 'pgvector', config } }; }
  store(instance, collection, vectors) { return { success: true, count: vectors.length }; }
  search(instance, collection, queryVector, limit) { return { success: true, results: [{ id: '1', score: 0.95 }] }; }
  deleteCollection(instance, collection) { return { success: true }; }
}
module.exports = { PgVectorProvider };
