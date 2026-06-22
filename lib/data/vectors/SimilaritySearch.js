class SimilaritySearch {
  cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]; }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  search(store, queryVector, limit = 10, threshold = 0) {
    const results = store._vectors.map(v => ({ id: v.id, score: this.cosineSimilarity(queryVector, v.vector), metadata: v.metadata }))
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { success: true, results };
  }

  hybridSearch(store, queryVector, textFilter, limit = 10) {
    const results = store._vectors
      .filter(v => !textFilter || JSON.stringify(v.metadata).toLowerCase().includes(textFilter.toLowerCase()))
      .map(v => ({ id: v.id, score: this.cosineSimilarity(queryVector, v.vector), metadata: v.metadata }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { success: true, results };
  }
}
module.exports = { SimilaritySearch };
