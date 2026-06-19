const crypto = require('crypto');

class TracingEngine {
  constructor(storage) {
    this._storage = storage;
    this._active = new Map();
  }

  startTrace(name, service, options = {}) {
    const traceId = options.traceId || `tr-${crypto.randomBytes(12).toString('hex')}`;
    const spanId = `sp-${crypto.randomBytes(8).toString('hex')}`;
    const span = {
      traceId,
      spanId,
      parentSpanId: options.parentSpanId || null,
      name,
      service,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'started',
      tags: options.tags || {},
      metadata: options.metadata || {},
    };
    if (!this._active.has(traceId)) this._active.set(traceId, []);
    this._active.get(traceId).push(span);
    if (this._storage) this._storage.storeTrace(span).catch(() => {});
    return span;
  }

  startSpan(traceId, name, service, options = {}) {
    const active = this._active.get(traceId);
    const parentSpanId = options.parentSpanId || (active && active.length > 0 ? active[active.length - 1].spanId : null);
    return this.startTrace(name, service, { ...options, traceId, parentSpanId });
  }

  endSpan(traceId, spanId, status = 'completed', metadata = {}) {
    const spans = this._active.get(traceId);
    if (!spans) return null;
    const span = spans.find(s => s.spanId === spanId);
    if (!span) return null;
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    Object.assign(span.metadata, metadata);
    if (this._storage) this._storage.storeTrace(span).catch(() => {});
    return span;
  }

  endTrace(traceId, status = 'completed', metadata = {}) {
    const spans = this._active.get(traceId);
    if (!spans) return null;
    for (const span of spans) {
      if (span.status === 'started') {
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.status = status;
        Object.assign(span.metadata, metadata);
        if (this._storage) this._storage.storeTrace(span).catch(() => {});
      }
    }
    this._active.delete(traceId);
    return spans;
  }

  getTrace(traceId) {
    if (this._storage) return this._storage.getTrace(traceId);
    return [...(this._active.get(traceId) || [])];
  }

  async getTraces(filter = {}) {
    if (this._storage) return this._storage.getTraces(filter);
    let all = [];
    for (const [, spans] of this._active) all.push(...spans);
    if (filter.since) all = all.filter(s => (s.startTime || 0) >= filter.since);
    all.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
    return all.slice(0, filter.limit || 100);
  }

  async getTraceTree(traceId) {
    let spans = this._active.get(traceId);
    if (!spans && this._storage) {
      const stored = await this._storage.getTrace(traceId);
      spans = stored;
    }
    if (!spans || spans.length === 0) return [];
    const deduped = new Map();
    for (const span of spans) {
      deduped.set(span.spanId, span);
    }
    const unique = Array.from(deduped.values());
    const roots = unique.filter(s => !s.parentSpanId);
    const buildTree = (parent) => ({
      ...parent,
      children: unique.filter(s => s.parentSpanId === parent.spanId).map(buildTree),
    });
    return roots.map(buildTree);
  }

  getActiveTraces() {
    const result = [];
    for (const [traceId, spans] of this._active) {
      const root = spans.find(s => !s.parentSpanId);
      result.push({ traceId, rootSpan: root, spanCount: spans.length, openSpans: spans.filter(s => s.status === 'started').length });
    }
    return result;
  }

  generateTraceId() {
    return `tr-${crypto.randomBytes(12).toString('hex')}`;
  }
}

module.exports = TracingEngine;
