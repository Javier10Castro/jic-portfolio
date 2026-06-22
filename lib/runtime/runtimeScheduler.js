class RuntimeScheduler {
  constructor() {
    this._tasks = new Map();
    this._paused = false;
  }

  schedule(name, task, interval) {
    if (!name || typeof task !== 'function' || typeof interval !== 'number' || interval <= 0) {
      return null;
    }
    if (this._tasks.has(name)) {
      return null;
    }
    const entry = {
      name: name,
      task: task,
      interval: interval,
      lastRun: 0,
      nextRun: Date.now() + interval,
    };
    this._tasks.set(name, entry);
    return {
      name: name,
      nextRun: entry.nextRun,
      interval: interval,
    };
  }

  cancel(name) {
    if (!this._tasks.has(name)) {
      return false;
    }
    this._tasks.delete(name);
    return true;
  }

  list() {
    const result = [];
    for (const [, entry] of this._tasks) {
      result.push({
        name: entry.name,
        interval: entry.interval,
        lastRun: entry.lastRun,
        nextRun: entry.nextRun,
      });
    }
    return result;
  }

  tick() {
    if (this._paused) {
      return [];
    }
    const now = Date.now();
    const executed = [];
    for (const [name, entry] of this._tasks) {
      if (now >= entry.nextRun) {
        try {
          entry.task();
        } catch (_) {
        }
        entry.lastRun = now;
        entry.nextRun = now + entry.interval;
        executed.push(name);
      }
    }
    return executed;
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

module.exports = { RuntimeScheduler };
