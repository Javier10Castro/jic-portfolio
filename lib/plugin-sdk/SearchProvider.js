class SearchProvider {
  constructor(config) {
    this.name = config.name;
    this.type = config.type || 'fulltext';
  }
  search(index, query, options) { return { results: [], total: 0, query, took: 0 }; }
  indexDocument(index, doc) { return { indexed: true, id: doc.id || Date.now() }; }
  deleteDocument(index, id) { return { deleted: true }; }
}
module.exports = { SearchProvider };
