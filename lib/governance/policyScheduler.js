class PolicyScheduler {
  constructor() {
    this._tasks = new Map();
    this._paused = false;
  }

  schedule(name, task, interval) {
    if (!name || typeof task !== 'function' || typeof interval !== 'number' || interval <= 0) {
      throw new Error('Invalid schedule parameters');
    }
    if (this._tasks.has(name)) throw new Error(`Task '${name}' already scheduled`);
    const entry = {
      id: name,
      name,
      task,
      interval,
      lastRun: null,
      nextRun: Date.now() + interval,
      createdAt: new Date().toISOString()
    };
    this._tasks.set(name, entry);
    return { id: name, name, nextRun: entry.nextRun, interval };
  }

  cancel(name) {
    if (!name) return false;
    return this._tasks.delete(name);
  }

  list() {
    return Array.from(this._tasks.values()).map(t => ({
      id: t.id,
      name: t.name,
      interval: t.interval,
      lastRun: t.lastRun,
      nextRun: t.nextRun,
      createdAt: t.createdAt
    }));
  }

  tick() {
    if (this._paused) return [];
    const now = Date.now();
    const results = [];
    for (const [name, entry] of this._tasks.entries()) {
      if (now >= entry.nextRun) {
        try {
          const result = entry.task();
          entry.lastRun = now;
          entry.nextRun = now + entry.interval;
          results.push({ id: name, name, success: true, result, executedAt: new Date(now).toISOString() });
        } catch (err) {
          entry.lastRun = now;
          entry.nextRun = now + entry.interval;
          results.push({ id: name, name, success: false, error: err.message, executedAt: new Date(now).toISOString() });
        }
      }
    }
    return results;
  }

  pause() {
    this._paused = true;
  }

  resume() {
    this._paused = false;
  }

  clear() {
    this._tasks.clear();
    this._paused = false;
  }
}

module.exports = { PolicyScheduler };
