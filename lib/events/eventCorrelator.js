class EventCorrelator {
  constructor(eventBus) {
    this._eventBus = eventBus;
    this._traces = new Map();
    this._maxTraces = 5000;
  }

  startTrace(correlationId, metadata = {}) {
    if (!this._traces.has(correlationId)) {
      this._traces.set(correlationId, {
        correlationId,
        startedAt: Date.now(),
        events: [],
        completedAt: null,
        metadata,
        spans: new Map(),
      });
      if (this._traces.size > this._maxTraces) {
        const firstKey = this._traces.keys().next().value;
        this._traces.delete(firstKey);
      }
    }
    return correlationId;
  }

  async track(correlationId, type, payload, options = {}) {
    this.startTrace(correlationId, options.metadata);
    const trace = this._traces.get(correlationId);
    const event = {
      type,
      payload,
      timestamp: Date.now(),
      source: options.source || 'unknown',
      spanId: options.spanId || null,
      parentSpanId: options.parentSpanId || null,
    };
    trace.events.push(event);
    if (this._eventBus) {
      await this._eventBus.emit(type, payload, {
        source: options.source || 'correlator',
        correlationId,
        metadata: { ...options.metadata, correlated: true },
      });
    }
    return event;
  }

  startSpan(correlationId, spanName, options = {}) {
    this.startTrace(correlationId);
    const trace = this._traces.get(correlationId);
    const spanId = 'span-' + Math.random().toString(36).substring(2, 10);
    const span = {
      spanId,
      name: spanName,
      parentSpanId: options.parentSpanId || null,
      startedAt: Date.now(),
      completedAt: null,
      events: [],
      metadata: options.metadata || {},
    };
    trace.spans.set(spanId, span);
    return span;
  }

  endSpan(correlationId, spanId) {
    const trace = this._traces.get(correlationId);
    if (!trace) return;
    const span = trace.spans.get(spanId);
    if (!span) return;
    span.completedAt = Date.now();
    span.duration = span.completedAt - span.startedAt;
  }

  completeTrace(correlationId) {
    const trace = this._traces.get(correlationId);
    if (!trace) return;
    trace.completedAt = Date.now();
    trace.duration = trace.completedAt - trace.startedAt;
    for (const [, span] of trace.spans) {
      if (!span.completedAt) this.endSpan(correlationId, span.spanId);
    }
  }

  getTrace(correlationId) {
    const trace = this._traces.get(correlationId);
    if (!trace) return null;
    return {
      correlationId: trace.correlationId,
      startedAt: trace.startedAt,
      completedAt: trace.completedAt,
      duration: trace.duration || null,
      eventCount: trace.events.length,
      spanCount: trace.spans.size,
      spans: Array.from(trace.spans.values()).map(s => ({
        spanId: s.spanId,
        name: s.name,
        parentSpanId: s.parentSpanId,
        duration: s.completedAt ? s.completedAt - s.startedAt : null,
      })),
      metadata: trace.metadata,
    };
  }

  getTraceEvents(correlationId) {
    const trace = this._traces.get(correlationId);
    return trace ? trace.events : [];
  }

  query(filter = {}) {
    let results = Array.from(this._traces.values());
    if (filter.since) results = results.filter(t => t.startedAt >= filter.since);
    if (filter.until) results = results.filter(t => t.startedAt <= filter.until);
    if (filter.source) results = results.filter(t => {
      return t.events.some(e => e.source === filter.source);
    });
    if (filter.completed !== undefined) {
      results = results.filter(t => filter.completed ? t.completedAt : !t.completedAt);
    }
    if (filter.limit) results = results.slice(0, filter.limit);
    return results.map(t => ({
      correlationId: t.correlationId,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
      eventCount: t.events.length,
      spanCount: t.spans.size,
      duration: t.duration || null,
    }));
  }

  getActiveTraceCount() {
    let count = 0;
    for (const [, trace] of this._traces) {
      if (!trace.completedAt) count++;
    }
    return count;
  }

  getTotalTraceCount() {
    return this._traces.size;
  }

  clear() {
    this._traces.clear();
  }
}

module.exports = EventCorrelator;
