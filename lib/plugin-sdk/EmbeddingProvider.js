class EmbeddingProvider {
  constructor(config) {
    this.name = config.name;
    this.dimensions = config.dimensions || 384;
    this.model = config.model || 'default';
  }
  embed(text) { return { vector: new Array(this.dimensions).fill(0).map(() => Math.random()), dimensions: this.dimensions, text }; }
  embedBatch(texts) { return texts.map(t => this.embed(t)); }
}
module.exports = { EmbeddingProvider };
