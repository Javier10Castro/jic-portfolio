class PatternEvaluator {
  constructor() {
    this._evaluations = new Map();
    this._counter = 0;
  }

  evaluate(pattern, context) {
    if (!pattern) {
      throw new Error('pattern is required');
    }
    const id = `eval-${++this._counter}`;
    const evaluation = { id, pattern, context: context || {}, score: 0, evaluatedAt: new Date().toISOString() };
    this._evaluations.set(id, evaluation);
    return evaluation;
  }

  get(id) {
    if (!id) return null;
    return this._evaluations.get(id) || null;
  }

  list() {
    return Array.from(this._evaluations.values());
  }

  clear() {
    this._evaluations.clear();
    this._counter = 0;
  }
}

module.exports = { PatternEvaluator };
