const { ClusterEvents } = require('./clusterEvents');

class DistributedScheduler {
  constructor(options = {}) {
    this._dispatcher = options.dispatcher || null;
    this._events = options.eventBus || new ClusterEvents();
    this._leaderElection = options.leaderElection || null;
    this._checkInterval = options.checkInterval || 2000;
    this._timer = null;
    this._running = false;
    this._scheduledJobs = new Map();
    this._cronJobs = new Map();
    this._id = 'sched-' + Math.random().toString(36).substring(2, 8);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._timer = setInterval(async () => {
      if (this._leaderElection && !this._leaderElection.isLeader()) return;
      if (this._dispatcher) {
        await this._dispatcher.processQueues();
      }
      await this._processScheduledJobs();
    }, this._checkInterval);
  }

  stop() {
    this._running = false;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  isRunning() {
    return this._running;
  }

  scheduleTask(task, runAt) {
    const jobId = 'job-' + Math.random().toString(36).substring(2, 10);
    const job = { id: jobId, task, runAt: runAt instanceof Date ? runAt.getTime() : runAt, createdAt: Date.now() };
    this._scheduledJobs.set(jobId, job);
    return jobId;
  }

  scheduleDelayed(task, delayMs) {
    const jobId = 'job-' + Math.random().toString(36).substring(2, 10);
    const job = { id: jobId, task, runAt: Date.now() + delayMs, delayMs, createdAt: Date.now() };
    this._scheduledJobs.set(jobId, job);
    return jobId;
  }

  scheduleInterval(task, intervalMs) {
    const jobId = 'job-' + Math.random().toString(36).substring(2, 10);
    const scheduleNext = () => {
      const nextRun = Date.now() + intervalMs;
      const job = { id: jobId, task, runAt: nextRun, intervalMs, createdAt: Date.now() };
      this._scheduledJobs.set(jobId, job);
    };
    this._cronJobs.set(jobId, { id: jobId, task, intervalMs, scheduleNext });
    scheduleNext();
    return jobId;
  }

  cancelJob(jobId) {
    this._scheduledJobs.delete(jobId);
    this._cronJobs.delete(jobId);
  }

  async _processScheduledJobs() {
    const now = Date.now();
    const toRun = [];
    for (const [id, job] of this._scheduledJobs) {
      if (job.runAt <= now) {
        toRun.push(job);
        this._scheduledJobs.delete(id);
      }
    }
    for (const job of toRun) {
      try {
        if (this._dispatcher) {
          await this._dispatcher.dispatch(job.task);
        }
        if (this._cronJobs.has(job.id)) {
          const cron = this._cronJobs.get(job.id);
          if (cron && cron.scheduleNext) cron.scheduleNext();
        }
      } catch (e) {
      }
    }
  }

  getScheduledJobs() {
    return Array.from(this._scheduledJobs.values());
  }

  getCronJobs() {
    return Array.from(this._cronJobs.values());
  }
}

module.exports = DistributedScheduler;
