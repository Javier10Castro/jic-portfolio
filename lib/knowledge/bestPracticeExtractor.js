class BestPracticeExtractor {
  constructor() {
    this._practices = [];
    this._counter = 0;
  }

  extract(name, source, evidence) {
    if (!name) throw new Error('name is required');
    if (!source) throw new Error('source is required');
    const id = 'bp_' + (++this._counter);
    const practice = {
      id,
      name,
      source,
      evidence: evidence || [],
      confidence: Array.isArray(evidence) ? Math.min(1, evidence.length * 0.2) : 0.5,
      extractedAt: new Date().toISOString()
    };
    this._practices.push(practice);
    return practice;
  }

  get(id) {
    if (!id) return null;
    return this._practices.find(p => p.id === id) || null;
  }

  findByName(name) {
    if (!name) return [];
    return this._practices.filter(p => p.name === name);
  }

  list() {
    return this._practices;
  }

  clear() {
    this._practices = [];
    this._counter = 0;
  }
}

module.exports = { BestPracticeExtractor };
