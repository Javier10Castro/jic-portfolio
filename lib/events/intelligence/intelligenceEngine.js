const PatternDetector = require('./patternDetector');
const AnomalyDetector = require('./anomalyDetector');
const CorrelationEngine = require('./correlationEngine');
const InsightGenerator = require('./insightGenerator');
const EventScorer = require('./eventScorer');
const IntelligenceStore = require('./intelligenceStore');

class IntelligenceEngine {
  constructor(options = {}) {
    this._patternDetector = new PatternDetector();
    this._anomalyDetector = new AnomalyDetector(options.anomaly || {});
    this._correlationEngine = new CorrelationEngine();
    this._insightGenerator = new InsightGenerator();
    this._eventScorer = new EventScorer();
    this._store = options.store || new IntelligenceStore(options.store || {});
    this._enabled = true;
    this._totalProcessed = 0;
    this._processingTime = 0;
    this._onInsight = options.onInsight || null;
    this._eventBus = options.eventBus || null;
  }

  get patternDetector() { return this._patternDetector; }
  get anomalyDetector() { return this._anomalyDetector; }
  get correlationEngine() { return this._correlationEngine; }
  get insightGenerator() { return this._insightGenerator; }
  get eventScorer() { return this._eventScorer; }
  get store() { return this._store; }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  isEnabled() { return this._enabled; }

  ingest(event) {
    if (!this._enabled) return null;
    const start = Date.now();
    this._totalProcessed++;

    const score = this._eventScorer.score(event);

    const patterns = this._patternDetector.ingest(event);
    const anomalies = this._anomalyDetector.ingest(event);
    const newEdges = this._correlationEngine.ingest(event);

    for (const p of patterns) this._store.push('patterns', p);
    for (const a of anomalies) this._store.push('anomalies', a);
    for (const e of newEdges) this._store.push('correlationGraphs', e);
    this._store.push('scores', { eventId: event.id, ...score, timestamp: Date.now() });

    const insights = this._insightGenerator.evaluate(
      this._store.get('anomalies', { limit: 50 }),
      this._store.get('patterns', { limit: 50 })
    );
    for (const i of insights) this._store.push('insights', i);

    if (insights.length > 0 && this._onInsight) {
      for (const insight of insights) {
        try { this._onInsight(insight, event); } catch (e) {}
      }
    }

    if (insights.length > 0 && this._eventBus) {
      for (const insight of insights) {
        try {
          this._eventBus.emit('intelligence.insight', insight, { source: 'intelligence' });
        } catch (e) {}
      }
    }

    const elapsed = Date.now() - start;
    this._processingTime += elapsed;
    return { score, patterns, anomalies, insights, processingMs: elapsed };
  }

  getHealth() {
    return {
      enabled: this._enabled,
      totalProcessed: this._totalProcessed,
      averageProcessingMs: this._totalProcessed > 0
        ? Math.round((this._processingTime / this._totalProcessed) * 100) / 100
        : 0,
      patternCount: this._store.get('patterns').length,
      anomalyCount: this._store.get('anomalies').length,
      insightCount: this._store.get('insights').length,
    };
  }

  clear() {
    this._patternDetector.clear();
    this._anomalyDetector.clear();
    this._correlationEngine.clear();
    this._insightGenerator.clear();
    this._store.clear();
    this._totalProcessed = 0;
    this._processingTime = 0;
  }
}

module.exports = IntelligenceEngine;
