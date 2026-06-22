class KnowledgeChunks {
  constructor() {
    this._chunks = new Map();
  }

  chunkDocument(doc, options) {
    if (!doc || !doc.content) return [];
    const chunkSize = (options && options.chunkSize) || 500;
    const overlap = (options && options.overlap) || 50;
    const content = doc.content;
    const chunks = [];
    let start = 0;
    let seq = 0;
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      chunks.push({
        id: `${doc.id || 'doc'}_chunk_${seq}`,
        docId: doc.id,
        seq,
        content: content.slice(start, end),
        start,
        end,
        createdAt: new Date().toISOString(),
      });
      seq++;
      start += chunkSize - overlap;
      if (start >= content.length) break;
    }
    this._chunks.set(doc.id, chunks);
    return chunks;
  }

  getChunks(docId) {
    if (docId == null) return [];
    return this._chunks.get(docId) || [];
  }

  removeChunks(docId) {
    if (docId == null) return false;
    return this._chunks.delete(docId);
  }

  clear() {
    this._chunks.clear();
  }
}

module.exports = { KnowledgeChunks };
