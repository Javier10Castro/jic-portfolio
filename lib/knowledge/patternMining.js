class PatternMining {
  constructor() {
    this._results = [];
    this._counter = 0;
  }

  mine(source, config) {
    if (!source) throw new Error('source is required');
    const id = 'pm_' + (++this._counter);
    const result = {
      id,
      source,
      config: config || {},
      patterns: [],
      minedAt: new Date().toISOString()
    };
    if (Array.isArray(source)) {
      const freq = {};
      for (const item of source) {
        const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
        freq[key] = (freq[key] || 0) + 1;
      }
      for (const [key, count] of Object.entries(freq)) {
        if (count > 1) {
          result.patterns.push({ value: key, frequency: count, confidence: count / source.length });
        }
      }
    }
    this._results.push(result);
    return result;
  }

  get(id) {
    if (!id) return null;
    return this._results.find(r => r.id === id) || null;
  }

  list() {
    return this._results;
  }

  clear() {
    this._results = [];
    this._counter = 0;
  }
}

module.exports = { PatternMining };
