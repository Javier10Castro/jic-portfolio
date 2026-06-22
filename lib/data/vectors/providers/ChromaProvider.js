class ChromaProvider {
  constructor() { this.name = 'chroma'; }
  connect(config) { if (!config.host) return { success: false, error: 'host required' }; return { success: true, instance: { provider: 'chroma', config } }; }
  add(instance, collection, embeddings) { return { success: true, count: embeddings.length }; }
  query(instance, collection, queryEmbedding, nResults) { return { success: true, results: [{ id: '1', distance: 0.15 }] }; }
  deleteCollection(instance, collection) { return { success: true }; }
}
module.exports = { ChromaProvider };
