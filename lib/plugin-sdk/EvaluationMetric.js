class EvaluationMetric {
  constructor(config) {
    this.name = config.name;
    this.description = config.description || '';
    this.type = config.type || 'score';
    this.scale = config.scale || { min: 0, max: 1 };
    this.higherIsBetter = config.higherIsBetter !== undefined ? config.higherIsBetter : true;
    this.calculate = config.calculate || function() { return 0; };
  }

  evaluate(input, output, expected) {
    const value = this.calculate(input, output, expected);
    return {
      name: this.name,
      value,
      normalized: this._normalize(value),
      higherIsBetter: this.higherIsBetter,
      timestamp: Date.now(),
    };
  }

  _normalize(value) {
    const range = this.scale.max - this.scale.min;
    if (range === 0) return 0;
    return Math.max(0, Math.min(1, (value - this.scale.min) / range));
  }
}

function createEvaluationMetric(config) {
  return new EvaluationMetric(config);
}

module.exports = { EvaluationMetric, createEvaluationMetric };
