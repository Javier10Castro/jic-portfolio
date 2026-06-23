class KnowledgeExtractor {
  constructor(name) {
    this.name = name;
    this._extractors = {};
  }

  registerExtractor(type, extractor) {
    if (!this._extractors[type]) this._extractors[type] = [];
    this._extractors[type].push(extractor);
  }

  extract(type, source) {
    const extractors = this._extractors[type] || [];
    return extractors.map(fn => {
      try { return fn(source); } catch (e) { return { error: e.message }; }
    });
  }

  getExtractors(type) {
    if (!type) return { ...this._extractors };
    return this._extractors[type] || [];
  }

  getName() { return this.name; }
}

module.exports = { KnowledgeExtractor };
