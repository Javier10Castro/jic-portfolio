const IntelligenceEngine = require('./intelligenceEngine');
const PatternDetector = require('./patternDetector');
const AnomalyDetector = require('./anomalyDetector');
const CorrelationEngine = require('./correlationEngine');
const InsightGenerator = require('./insightGenerator');
const EventScorer = require('./eventScorer');
const IntelligenceStore = require('./intelligenceStore');
const IntelligenceAPI = require('./intelligenceAPI');

let _defaultEngine = null;

function createIntelligenceEngine(options = {}) {
  return new IntelligenceEngine(options);
}

function getIntelligenceEngine() {
  if (!_defaultEngine) _defaultEngine = createIntelligenceEngine();
  return _defaultEngine;
}

function resetDefaultEngine() {
  _defaultEngine = null;
}

function attachToEventBus(eventBus, engine) {
  const eng = engine || getIntelligenceEngine();
  const off = eventBus.on('*', (event) => {
    if (event.type && event.type.startsWith('intelligence.')) return;
    eng.ingest(event);
  });
  return off;
}

module.exports = {
  IntelligenceEngine,
  PatternDetector,
  AnomalyDetector,
  CorrelationEngine,
  InsightGenerator,
  EventScorer,
  IntelligenceStore,
  IntelligenceAPI,
  createIntelligenceEngine,
  getIntelligenceEngine,
  resetDefaultEngine,
  attachToEventBus,
};
