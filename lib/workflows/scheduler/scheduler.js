const QueueManager = require('./queueManager');
const CronScheduler = require('./cronScheduler');

class Scheduler {
  constructor() {
    this._queue = new QueueManager();
    this._cron = new CronScheduler();
    this._delayed = new Map();
    this._delayedIdCounter = 0;
  }

  get queue() { return this._queue; }
  get cron() { return this._cron; }

  async scheduleDelayed(definitionId, delayMs, input = {}, options = {}) {
    const id = `delayed-${++this._delayedIdCounter}`;
    const entry = { id, definitionId, input, options, scheduledAt: Date.now(), delayMs };
    this._delayed.set(id, entry);

    setTimeout(() => {
      if (this._delayed.has(id)) {
        this._delayed.delete(id);
        this._queue.enqueue(definitionId, options.priority || 'normal', input);
      }
    }, delayMs);

    return { id, delayMs, scheduledAt: entry.scheduledAt, estimatedExecution: entry.scheduledAt + delayMs };
  }

  cancelDelayed(id) {
    return this._delayed.delete(id);
  }

  schedulePeriodic(definitionId, intervalMs, input = {}, options = {}) {
    let timer;
    let count = 0;
    const run = () => {
      if (options.maxRuns && count >= options.maxRuns) {
        clearInterval(timer);
        return;
      }
      count++;
      this._queue.enqueue(definitionId, options.priority || 'normal', input);
      if (options.onRun) options.onRun(count);
    };
    timer = setInterval(run, intervalMs);
    return { cancel: () => clearInterval(timer), id: `periodic-${definitionId}-${Date.now()}` };
  }

  async processNext(manager) {
    return await this._queue.processNext(manager);
  }

  async drain(manager) {
    return await this._queue.drain(manager);
  }

  listDelayed() {
    return Array.from(this._delayed.values()).map(d => ({
      id: d.id,
      definitionId: d.definitionId,
      delayMs: d.delayMs,
      scheduledAt: d.scheduledAt,
      remaining: Math.max(0, d.delayMs - (Date.now() - d.scheduledAt)),
    }));
  }

  clear() {
    this._queue.clear();
    this._cron.clear();
    for (const [, timer] of this._delayed) clearTimeout(timer);
    this._delayed.clear();
  }
}

module.exports = Scheduler;
