class PatternDetector {
  constructor() {
    this._windows = new Map();
    this._patterns = [];
    this._maxPatterns = 500;
  }

  ingest(event) {
    const patterns = [];
    patterns.push(...this._checkRepeatedFailures(event));
    patterns.push(...this._checkRetryLoops(event));
    patterns.push(...this._checkClusterImbalance(event));
    patterns.push(...this._checkFallbackChains(event));
    patterns.push(...this._checkLatencyBursts(event));
    patterns.push(...this._checkStateTransitions(event));
    return patterns;
  }

  getPatterns(filter = {}) {
    let results = this._patterns;
    if (filter.severity) results = results.filter(p => p.severity === filter.severity);
    if (filter.type) results = results.filter(p => p.pattern === filter.type);
    if (filter.since) results = results.filter(p => p.timestamp >= filter.since);
    return results.slice(-100);
  }

  clear() {
    this._patterns = [];
    this._windows.clear();
  }

  _track(key, event, windowMs = 60000) {
    const now = Date.now();
    if (!this._windows.has(key)) this._windows.set(key, []);
    const events = this._windows.get(key);
    events.push({ event, time: now });
    while (events.length > 0 && now - events[0].time > windowMs) events.shift();
    return events;
  }

  _addPattern(pattern, severity, confidence, affectedSystems, event, detail) {
    const entry = {
      pattern,
      severity,
      confidence: Math.round(confidence * 100) / 100,
      affectedSystems: [...affectedSystems],
      timestamp: Date.now(),
      detail: detail || {},
      sourceEventId: event.id,
    };
    this._patterns.push(entry);
    if (this._patterns.length > this._maxPatterns) this._patterns.shift();
    return entry;
  }

  _checkRepeatedFailures(event) {
    const type = event.type || '';
    if (!type.includes('failure') && !type.includes('error') && !type.includes('failed')) return [];
    const key = 'failure:' + (event.source || 'unknown');
    const recent = this._track(key, event, 60000);
    if (recent.length >= 5) {
      return [this._addPattern('repeated_failures', 'critical', Math.min(1, recent.length / 20),
        [event.source], event, { count: recent.length, windowMs: 60000 })];
    }
    if (recent.length >= 3) {
      return [this._addPattern('repeated_failures', 'high', 0.6 + recent.length * 0.1,
        [event.source], event, { count: recent.length, windowMs: 60000 })];
    }
    return [];
  }

  _checkRetryLoops(event) {
    const payload = event.payload || {};
    const retryCount = payload.retryCount || payload.retry_count || 0;
    if (retryCount < 2) return [];
    const key = 'retry:' + (payload.workflowId || payload.taskId || event.correlationId || 'unknown');
    const recent = this._track(key, event, 120000);
    if (recent.length >= 3) {
      return [this._addPattern('retry_loop_detected', 'high', Math.min(0.95, 0.5 + recent.length * 0.1),
        [event.source, 'workflow'], event, { retryCount: recent.length, windowMs: 120000 })];
    }
    return [];
  }

  _checkClusterImbalance(event) {
    const type = event.type || '';
    if (!type.includes('cluster') && !type.includes('worker')) return [];
    const payload = event.payload || {};
    const workerCount = payload.workerCount || payload.worker_count || 0;
    const queueDepth = payload.queueDepth || payload.queue_depth || 0;
    if (workerCount > 0 && queueDepth > workerCount * 5) {
      return [this._addPattern('cluster_imbalance', 'high', Math.min(0.9, queueDepth / (workerCount * 10)),
        ['cluster', 'worker'], event, { workerCount, queueDepth, ratio: queueDepth / Math.max(1, workerCount) })];
    }
    return [];
  }

  _checkFallbackChains(event) {
    const type = event.type || '';
    if (!type.includes('fallback') && !type.includes('provider')) return [];
    const key = 'fallback:' + (event.correlationId || 'global');
    const recent = this._track(key, event, 300000);
    if (recent.length >= 2) {
      return [this._addPattern('ai_fallback_chain', 'medium', 0.5 + recent.length * 0.15,
        ['ai', 'provider'], event, { fallbackCount: recent.length, windowMs: 300000 })];
    }
    return [];
  }

  _checkLatencyBursts(event) {
    const payload = event.payload || {};
    const latency = payload.latency || 0;
    if (latency < 1000) return [];
    const key = 'latency:' + (event.source || 'unknown');
    this._track(key, event, 60000);
    const now = Date.now();
    const window = this._windows.get(key) || [];
    const recentLatencies = window.filter(w => now - w.time < 60000).map(w => w.event.payload?.latency || 0);
    if (recentLatencies.length < 3) return [];
    const avg = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
    if (avg > 3000) {
      return [this._addPattern('high_latency_burst', 'medium', Math.min(0.95, avg / 5000),
        [event.source], event, { averageLatency: avg, sampleCount: recentLatencies.length })];
    }
    return [];
  }

  _checkStateTransitions(event) {
    const type = event.type || '';
    if (!type.includes('state') && !type.includes('transition') && !type.includes('status')) return [];
    const payload = event.payload || {};
    const from = payload.from || payload.previousState || '';
    const to = payload.to || payload.currentState || payload.status || '';
    const unexpected = {
      'running_completed': true,
      'failed_running': true,
      'cancelled_running': true,
      'paused_completed': true,
    };
    const key = from + '_' + to;
    if (unexpected[key]) {
      return [this._addPattern('unexpected_state_transition', 'medium', 0.8,
        [event.source, 'workflow'], event, { from, to })];
    }
    return [];
  }
}

module.exports = PatternDetector;
