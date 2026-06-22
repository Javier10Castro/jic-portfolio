class JudgeEngine {
  constructor() {
    this.config = {
      modelName: 'default-judge',
      temperature: 0.3,
      maxTokens: 1024,
    };
    this.history = [];
  }

  evaluate(input, output, criteria, rubric) {
    const scores = {};
    for (const criterion of criteria) {
      const base = 0.5 + Math.random() * 0.5;
      scores[criterion] = Math.round(base * 100) / 100;
    }
    const values = Object.values(scores);
    const overall = values.reduce((a, b) => a + b, 0) / values.length;
    const reasoning = `Evaluation based on ${criteria.join(', ')}. ` +
      `Output ${output ? 'addresses' : 'does not address'} input requirements.`;
    const confidence = Math.min(1, Math.max(0, 0.7 + (Math.random() - 0.5) * 0.4));
    const result = { scores, overall, reasoning, confidence };
    this.history.push(result);
    return result;
  }

  evaluateBatch(items) {
    return items.map(item =>
      this.evaluate(item.input, item.output, item.criteria, item.rubric)
    );
  }

  evaluatePair(outputA, outputB, criteria) {
    const evalA = this.evaluate('pair-input', outputA, criteria);
    const evalB = this.evaluate('pair-input', outputB, criteria);
    const preferred = evalA.overall >= evalB.overall ? 'A' : 'B';
    const reasoning = `Output ${preferred} scored higher on ${criteria.join(', ')}.`;
    return { preferred, reasoning, scores: { A: evalA.scores, B: evalB.scores } };
  }

  setJudgeModel(modelName) {
    this.config.modelName = modelName;
  }

  getConfig() {
    return { ...this.config };
  }

  clear() {
    this.history = [];
    this.config = {
      modelName: 'default-judge',
      temperature: 0.3,
      maxTokens: 1024,
    };
  }
}

module.exports = JudgeEngine;
