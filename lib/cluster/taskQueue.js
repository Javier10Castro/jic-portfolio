const ClusterStorage = require('./clusterStorage');

const QUEUE_TYPES = ['priority', 'fifo', 'lifo', 'scheduled', 'delayed', 'deadLetter'];

class TaskQueue {
  constructor(storage) {
    this._storage = storage || new ClusterStorage();
    this._visibilityTimeouts = new Map();
  }

  // Priority queue — items with higher priority are dequeued first
  async enqueuePriority(task, priority = 0) {
    const item = { ...task, priority, enqueuedAt: Date.now() };
    await this._storage.enqueue('priority', item);
    this._storage.enqueue('priority', item);
    return item;
  }

  async dequeuePriority() {
    const q = await this._storage.listQueues();
    const priorityQ = await this._getRawQueue('priority');
    if (!priorityQ || priorityQ.length === 0) return null;
    priorityQ.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return priorityQ.shift();
  }

  // FIFO — first in, first out
  async enqueueFifo(task) {
    const item = { ...task, enqueuedAt: Date.now() };
    await this._storage.enqueue('fifo', item);
    return item;
  }

  async dequeueFifo() {
    return this._storage.dequeue('fifo');
  }

  // LIFO — last in, first out (stack)
  async enqueueLifo(task) {
    const item = { ...task, enqueuedAt: Date.now() };
    await this._storage.enqueue('lifo', item);
    return item;
  }

  async dequeueLifo() {
    return this._storage.dequeue('lifo');
  }

  // Scheduled — tasks that run at a specific time
  async enqueueScheduled(task, runAt) {
    const item = { ...task, runAt: runAt instanceof Date ? runAt.getTime() : runAt, enqueuedAt: Date.now() };
    await this._storage.enqueue('scheduled', item);
    return item;
  }

  async dequeueScheduled() {
    const now = Date.now();
    const q = await this._getRawQueue('scheduled');
    if (!q || q.length === 0) return null;
    const idx = q.findIndex(item => item.runAt <= now);
    if (idx === -1) return null;
    return q.splice(idx, 1)[0];
  }

  async getPendingScheduled() {
    const now = Date.now();
    const q = await this._getRawQueue('scheduled');
    if (!q) return [];
    return q.filter(item => item.runAt <= now);
  }

  // Delayed — tasks that run after a delay
  async enqueueDelayed(task, delayMs) {
    const runAt = Date.now() + delayMs;
    const item = { ...task, runAt, delayMs, enqueuedAt: Date.now() };
    await this._storage.enqueue('delayed', item);
    return item;
  }

  async dequeueDelayed() {
    const now = Date.now();
    const q = await this._getRawQueue('delayed');
    if (!q || q.length === 0) return null;
    const idx = q.findIndex(item => item.runAt <= now);
    if (idx === -1) return null;
    return q.splice(idx, 1)[0];
  }

  // Dead-letter — failed tasks
  async enqueueDeadLetter(task, reason) {
    const item = { ...task, deadLetterReason: reason, movedAt: Date.now() };
    await this._storage.enqueue('deadLetter', item);
    return item;
  }

  async dequeueDeadLetter() {
    return this._storage.dequeue('deadLetter');
  }

  // Visibility timeout — make task invisible for a period, then reappear
  async dequeueWithVisibility(queueName, timeoutMs = 30000) {
    let task;
    switch (queueName) {
      case 'priority': task = await this.dequeuePriority(); break;
      case 'fifo': task = await this.dequeueFifo(); break;
      case 'lifo': task = await this.dequeueLifo(); break;
      default: return null;
    }
    if (!task) return null;
    const visibilityTimeout = setTimeout(async () => {
      await this._storage.enqueue(queueName, task);
      this._visibilityTimeouts.delete(task.id);
    }, timeoutMs);
    this._visibilityTimeouts.set(task.id, visibilityTimeout);
    return task;
  }

  acknowledge(taskId) {
    const timeout = this._visibilityTimeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this._visibilityTimeouts.delete(taskId);
    }
  }

  // Utility
  async ackAndEnqueueDeadLetter(task, reason) {
    this.acknowledge(task.id);
    return this.enqueueDeadLetter(task, reason);
  }

  async size(queueName) {
    return this._storage.queueSize(queueName);
  }

  async allSizes() {
    const queues = await this._storage.listQueues();
    const result = {};
    for (const [name, info] of Object.entries(queues)) {
      result[name] = info.size;
    }
    return result;
  }

  async peek(queueName, count = 5) {
    return this._storage.peek(queueName, count);
  }

  async clear() {
    for (const t of this._visibilityTimeouts.values()) clearTimeout(t);
    this._visibilityTimeouts.clear();
  }

  async _getRawQueue(name) {
    return this._storage._queues[name] || [];
  }
}

module.exports = { TaskQueue, QUEUE_TYPES };
