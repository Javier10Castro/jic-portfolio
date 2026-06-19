const PRIORITIES = { critical: 0, high: 1, normal: 2, low: 3 };

class QueueManager {
  constructor() {
    this._queues = {
      critical: [],
      high: [],
      normal: [],
      low: [],
    };
    this._processing = false;
    this._handlers = new Map();
  }

  enqueue(workflowId, priority = 'normal', data = {}) {
    const queue = this._queues[priority] || this._queues.normal;
    const entry = { workflowId, priority, timestamp: Date.now(), data };
    queue.push(entry);
    return entry;
  }

  dequeue() {
    for (const level of ['critical', 'high', 'normal', 'low']) {
      if (this._queues[level].length > 0) {
        return this._queues[level].shift();
      }
    }
    return null;
  }

  peek() {
    for (const level of ['critical', 'high', 'normal', 'low']) {
      if (this._queues[level].length > 0) {
        return this._queues[level][0];
      }
    }
    return null;
  }

  remove(workflowId) {
    for (const level of Object.keys(this._queues)) {
      const idx = this._queues[level].findIndex(e => e.workflowId === workflowId);
      if (idx !== -1) {
        this._queues[level].splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  getSize(priority) {
    if (priority) return (this._queues[priority] || []).length;
    return Object.fromEntries(
      Object.entries(this._queues).map(([k, v]) => [k, v.length])
    );
  }

  getAll() {
    return [...this._queues.critical, ...this._queues.high, ...this._queues.normal, ...this._queues.low];
  }

  clear() {
    for (const level of Object.keys(this._queues)) {
      this._queues[level] = [];
    }
  }

  registerHandler(type, handler) {
    this._handlers.set(type, handler);
  }

  async processNext(manager) {
    const entry = this.dequeue();
    if (!entry) return null;
    try {
      const handler = this._handlers.get('workflow');
      if (handler) {
        return await handler(entry, manager);
      }
      return await manager.startWorkflow(entry.workflowId, entry.data);
    } catch (err) {
      return { error: err.message };
    }
  }

  async drain(manager) {
    this._processing = true;
    const results = [];
    while (true) {
      const entry = this.dequeue();
      if (!entry) break;
      try {
        const handler = this._handlers.get('workflow');
        if (handler) {
          results.push(await handler(entry, manager));
        } else {
          results.push(await manager.startWorkflow(entry.workflowId, entry.data));
        }
      } catch (err) {
        results.push({ workflowId: entry.workflowId, error: err.message });
      }
    }
    this._processing = false;
    return results;
  }
}

module.exports = QueueManager;
