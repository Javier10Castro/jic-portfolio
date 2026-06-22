class PineconeProvider {
  constructor() { this.name = 'pinecone'; }
  connect(config) { if (!config.apiKey) return { success: false, error: 'apiKey required' }; return { success: true, instance: { provider: 'pinecone', config } }; }
  upsert(instance, index, vectors) { return { success: true, upsertedCount: vectors.length }; }
  query(instance, index, queryVector, topK) { return { success: true, matches: [{ id: '1', score: 0.97 }] }; }
  deleteIndex(instance, index) { return { success: true }; }
}
module.exports = { PineconeProvider };
