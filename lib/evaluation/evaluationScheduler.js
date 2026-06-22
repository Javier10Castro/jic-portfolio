class EvaluationScheduler {
  constructor() {
    this._schedules = new Map();
    this._results = new Map();
    this._tickInterval = null;
    this._running = false;
  }

  schedule(id, config) {
    if (this._schedules.has(id)) throw new Error(`Schedule already exists: ${id}`);
    this._schedules.set(id, {
      id,
      ...config,
      createdAt: Date.now(),
      lastRun: null,
      nextRun: Date.now() + (config.intervalMs || 60000),
      runCount: 0,
    });
    return id;
  }

  cancel(id) {
    return this._schedules.delete(id);
  }

  getSchedule(id) {
    return this._schedules.get(id) || null;
  }

  listSchedules() {
    return Array.from(this._schedules.values());
  }

  getDueSchedules() {
    const now = Date.now();
    return Array.from(this._schedules.values()).filter(s => !s.paused && s.nextRun <= now);
  }

  async tick(runner) {
    const due = this.getDueSchedules();
    for (const schedule of due) {
      try {
        const result = await runner(schedule);
        this._results.set(schedule.id, { result, timestamp: Date.now() });
        schedule.lastRun = Date.now();
        schedule.nextRun = Date.now() + (schedule.intervalMs || 60000);
        schedule.runCount++;
      } catch (err) {
        schedule.lastRun = Date.now();
        schedule.nextRun = Date.now() + (schedule.intervalMs || 60000);
        schedule.runCount++;
      }
    }
    return due.length;
  }

  start(runner, intervalMs = 5000) {
    if (this._running) return;
    this._running = true;
    this._tickInterval = setInterval(() => this.tick(runner), intervalMs);
  }

  stop() {
    this._running = false;
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  pause(id) {
    const s = this._schedules.get(id);
    if (s) s.paused = true;
  }

  resume(id) {
    const s = this._schedules.get(id);
    if (s) {
      s.paused = false;
      s.nextRun = Date.now() + (s.intervalMs || 60000);
    }
  }

  getResult(id) {
    return this._results.get(id) || null;
  }

  clear() {
    this.stop();
    this._schedules.clear();
    this._results.clear();
  }
}

module.exports = { EvaluationScheduler };
