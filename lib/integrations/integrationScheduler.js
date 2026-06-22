class IntegrationScheduler {
  constructor() {
    this._jobs = {};
  }

  schedule(provider, interval, task) {
    this._jobs[provider] = {
      provider,
      interval,
      task,
      nextRun: Date.now() + interval,
      createdAt: Date.now()
    };
  }

  cancel(provider) {
    if (!this._jobs[provider]) return false;
    delete this._jobs[provider];
    return true;
  }

  getSchedule(provider) {
    return this._jobs[provider] || null;
  }

  listSchedules() {
    return Object.values(this._jobs);
  }

  tick() {
    const now = Date.now();
    for (const job of Object.values(this._jobs)) {
      if (now >= job.nextRun) {
        try {
          job.task();
        } catch (e) {
          /* silent */
        }
        job.nextRun = now + job.interval;
      }
    }
  }

  clear() {
    this._jobs = {};
  }
}

module.exports = { IntegrationScheduler };
