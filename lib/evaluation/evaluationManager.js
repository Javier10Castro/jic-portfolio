const { EvaluationEngine } = require('./evaluationEngine');
const { EVALUATION_TYPES, METRIC_TYPES } = require('./evaluationRegistry');

let _defaultEngine = null;

function createEngine(options = {}) {
  return new EvaluationEngine(options);
}

function getDefaultEngine() {
  if (!_defaultEngine) _defaultEngine = createEngine();
  return _defaultEngine;
}

module.exports = {
  EvaluationEngine,
  createEngine,
  getDefaultEngine,
  EVALUATION_TYPES,
  METRIC_TYPES,
};
