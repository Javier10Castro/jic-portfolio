class AntiPatternDetector {
  constructor() {
    this._detections = [];
    this._counter = 0;
  }

  detect(name, sourceData, indicators) {
    if (!name) throw new Error('name is required');
    if (!sourceData) throw new Error('sourceData is required');
    const id = 'ap_' + (++this._counter);
    const severity = indicators && indicators.length > 3 ? 'high' : indicators && indicators.length > 1 ? 'medium' : 'low';
    const detection = {
      id,
      name,
      sourceData: JSON.parse(JSON.stringify(sourceData)),
      indicators: indicators || [],
      severity,
      detectedAt: new Date().toISOString()
    };
    this._detections.push(detection);
    return detection;
  }

  get(id) {
    if (!id) return null;
    return this._detections.find(d => d.id === id) || null;
  }

  findBySeverity(severity) {
    if (!severity) return [];
    return this._detections.filter(d => d.severity === severity);
  }

  list() {
    return this._detections;
  }

  clear() {
    this._detections = [];
    this._counter = 0;
  }
}

module.exports = { AntiPatternDetector };
