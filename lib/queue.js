const crypto = require('crypto');
const log = require('./logger');
const registry = require('./request-registry');

const INSTANCE_ID = crypto.randomUUID().slice(0, 8);

const MAX_QUEUE_DEPTH = 100;

class BackgroundQueue {
  constructor(maxConcurrency = 1) {
    this.queue = [];
    this.active = 0;
    this.maxConcurrency = maxConcurrency;
    this.totalEnqueued = 0;
    this.completed = 0;
    this.failed = 0;
    this._activeItems = [];
  }

  enqueue({ handler, req, label }) {
    const depth = this.queue.length + this.active;
    if (depth >= MAX_QUEUE_DEPTH) {
      log.warn(req, 'queue_overflow', { endpoint: label, depth, max: MAX_QUEUE_DEPTH });
      return null;
    }
    this.totalEnqueued++;
    const id = this.totalEnqueued;
    const position = this.queue.length + this.active;
    this.queue.push({ handler, req, label, id, enqueuedAt: Date.now() });

    log.debugLog(req, 'queue_enter', {
      queueId: id, endpoint: label,
      position, depth: this.queue.length + this.active,
    });

    setImmediate(() => this.drain());
    return { queueId: id, position, depth: this.queue.length + this.active };
  }

  drain() {
    while (this.active < this.maxConcurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      this.active++;
      this._process(item);
    }
  }

  async _process(item) {
    const { handler, req, label, id } = item;
    const maxRetries = 3;
    this._activeItems.push(item);
    const executionStartedAt = Date.now();
    log.debugLog(req, 'queue_exit', { queueId: id, endpoint: label, active: this.active });

    const rid = req ? log.requestId(req) : null;
    if (rid) registry.registerLifecycle(rid, { status: 'processing', executionStartedAt });

    let itemStatus = 'failed';
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      log.addTrace(req, 'email.retry', `attempt_${attempt}`);
      log.structured(req, { stage: 'email.retry', status: 'pending', attempt, maxRetries });
      log.debugLog(req, 'smtp_attempt', { queueId: id, endpoint: label, attempt });
      try {
        await handler();
        this.completed++;
        itemStatus = 'completed';
        log.debugLog(req, 'smtp_success', { queueId: id, endpoint: label, attempt });
        log.addTrace(req, 'email.retry', `success_attempt_${attempt}`);
        log.structured(req, { stage: 'email.retry', status: 'ok', attempt });
        break;
      } catch (err) {
        if (attempt <= maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          log.addTrace(req, 'email.retry', `fail_attempt_${attempt}`);
          log.structured(req, { stage: 'email.retry', status: 'fail', attempt, nextRetryMs: delayMs, error: err.message });
          log.warn(req, 'smtp_retry', { queueId: id, endpoint: label, attempt, nextDelayMs: delayMs, error: err.message });
          await new Promise(r => setTimeout(r, delayMs));
        } else {
          this.failed++;
          log.addTrace(req, 'email.retry', `failover_attempt_${attempt}`);
          log.structured(req, { stage: 'email.retry', status: 'failover', attempt, error: err.message });
          log.error(req, 'smtp_failover', err, { queueId: id, endpoint: label, attempts: attempt });
        }
      }
    }

    const executionFinishedAt = Date.now();
    if (rid) registry.registerLifecycle(rid, { status: itemStatus, executionFinishedAt });

    this.active--;
    const idx = this._activeItems.indexOf(item);
    if (idx >= 0) this._activeItems.splice(idx, 1);
    setImmediate(() => this.drain());
  }

  stats() {
    return {
      depth: this.queue.length,
      active: this.active,
      completed: this.completed,
      failed: this.failed,
    };
  }

  getDetailedStats() {
    const now = Date.now();
    let oldestAge = 0;
    const allItems = [...this.queue, ...(this._activeItems || [])];
    for (const item of allItems) {
      if (item.enqueuedAt) {
        const age = now - item.enqueuedAt;
        if (age > oldestAge) oldestAge = age;
      }
    }
    const lifecycle = registry.getAggregateMetrics();
    return {
      queue: {
        depth: this.queue.length,
        active: this.active,
        maxDepth: MAX_QUEUE_DEPTH,
      },
      throughput: {
        completed: this.completed,
        failed: this.failed,
        totalEnqueued: this.totalEnqueued,
      },
      lifecycle: {
        totalRequests: lifecycle.totalRequests,
        completedRequests: lifecycle.completedRequests,
        failedRequests: lifecycle.failedRequests,
        averageExecutionTimeMs: lifecycle.averageExecutionTimeMs,
        averageQueueWaitTimeMs: lifecycle.averageQueueWaitTimeMs,
      },
      oldestRequestAgeMs: Math.round(oldestAge),
      oldestRequestAgeSec: Math.round(oldestAge / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new BackgroundQueue();
module.exports.BackgroundQueue = BackgroundQueue;
