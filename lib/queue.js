const crypto = require('crypto');
const log = require('./logger');

const INSTANCE_ID = crypto.randomUUID().slice(0, 8);

class BackgroundQueue {
  constructor(maxConcurrency = 1) {
    this.queue = [];
    this.active = 0;
    this.maxConcurrency = maxConcurrency;
    this.totalEnqueued = 0;
    this.completed = 0;
    this.failed = 0;
  }

  enqueue({ handler, req, label }) {
    this.totalEnqueued++;
    const id = this.totalEnqueued;
    const position = this.queue.length + this.active;
    this.queue.push({ handler, req, label, id });

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
    const maxRetries = 2;
    log.debugLog(req, 'queue_exit', { queueId: id, endpoint: label, active: this.active });

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      log.debugLog(req, 'smtp_attempt', { queueId: id, endpoint: label, attempt });
      try {
        await handler();
        this.completed++;
        log.debugLog(req, 'smtp_success', { queueId: id, endpoint: label, attempt });
        break;
      } catch (err) {
        if (attempt <= maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          log.warn(req, 'smtp_retry', { queueId: id, endpoint: label, attempt, nextDelayMs: delayMs, error: err.message });
          await new Promise(r => setTimeout(r, delayMs));
        } else {
          this.failed++;
          log.error(req, 'smtp_failover', err, { queueId: id, endpoint: label, attempts: attempt });
        }
      }
    }

    this.active--;
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
}

module.exports = new BackgroundQueue();
module.exports.BackgroundQueue = BackgroundQueue;
