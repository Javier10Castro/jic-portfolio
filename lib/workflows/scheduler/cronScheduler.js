class CronScheduler {
  constructor() {
    this._jobs = new Map();
    this._timers = new Map();
    this._jobIdCounter = 0;
  }

  schedule(expression, definitionId, options = {}) {
    const jobId = `cron-${++this._jobIdCounter}`;
    const job = {
      id: jobId,
      expression,
      definitionId,
      options,
      createdAt: Date.now(),
      lastRun: null,
      nextRun: this._nextDate(expression),
      runCount: 0,
    };
    this._jobs.set(jobId, job);
    this._startTimer(job);
    return job;
  }

  async trigger(jobId, manager) {
    const job = this._jobs.get(jobId);
    if (!job) throw new Error(`Job "${jobId}" not found`);
    return this._executeJob(job, manager);
  }

  async triggerAll(manager) {
    const results = [];
    for (const [, job] of this._jobs) {
      if (this._isDue(job)) {
        results.push(await this._executeJob(job, manager));
      }
    }
    return results;
  }

  cancel(jobId) {
    const timer = this._timers.get(jobId);
    if (timer) clearTimeout(timer);
    this._timers.delete(jobId);
    this._jobs.delete(jobId);
    return true;
  }

  list() {
    return Array.from(this._jobs.values()).map(j => ({
      id: j.id,
      expression: j.expression,
      definitionId: j.definitionId,
      lastRun: j.lastRun,
      nextRun: j.nextRun,
      runCount: j.runCount,
    }));
  }

  _startTimer(job) {
    const delay = Math.max(0, job.nextRun - Date.now());
    const timer = setTimeout(() => {
      if (this._jobs.has(job.id)) {
        this._timers.delete(job.id);
        this._startTimer(job);
      }
    }, delay);
    this._timers.set(job.id, timer);
  }

  async _executeJob(job, manager) {
    try {
      const result = await manager.startWorkflow(job.definitionId, job.options.input || {}, job.options);
      job.lastRun = Date.now();
      job.runCount++;
      job.nextRun = this._nextDate(job.expression);
      return { jobId: job.id, success: true, result };
    } catch (err) {
      return { jobId: job.id, success: false, error: err.message };
    }
  }

  _isDue(job) {
    return job.nextRun <= Date.now();
  }

  _nextDate(expression) {
    return Date.now() + 60000;
  }

  clear() {
    for (const [, timer] of this._timers) clearTimeout(timer);
    this._timers.clear();
    this._jobs.clear();
  }
}

module.exports = CronScheduler;
