class LessonExtractor {
  constructor() {
    this._extractions = [];
    this._counter = 0;
  }

  extract(source, sourceType, config) {
    if (!source) throw new Error('source is required');
    if (!sourceType) throw new Error('sourceType is required');
    const id = 'lext_' + (++this._counter);
    const extraction = {
      id,
      source,
      sourceType,
      config: config || {},
      lessons: [],
      extractedAt: new Date().toISOString()
    };
    if (typeof source === 'string') {
      const patterns = [
        { pattern: /learn(?:ed|ing)\s+(?:that|how|about|the)\s+(.+?)[.?!]/gi, label: 'learning' },
        { pattern: /lesson\s+(?:learned|is)\s+(.+?)[.?!]/gi, label: 'lesson' },
        { pattern: /key\s+(?:takeaway|insight|finding)\s+(.+?)[.?!]/gi, label: 'insight' }
      ];
      for (const { pattern, label } of patterns) {
        let match;
        while ((match = pattern.exec(source)) !== null) {
          extraction.lessons.push({ text: match[1].trim(), source: label });
        }
      }
    }
    this._extractions.push(extraction);
    return extraction;
  }

  get(id) {
    if (!id) return null;
    return this._extractions.find(e => e.id === id) || null;
  }

  list() {
    return this._extractions;
  }

  clear() {
    this._extractions = [];
    this._counter = 0;
  }
}

module.exports = { LessonExtractor };
