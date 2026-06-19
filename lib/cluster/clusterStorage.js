class ClusterStorage {
  constructor() {
    this._workers = new Map();
    this._tasks = new Map();
    this._queues = { priority: [], fifo: [], lifo: [], scheduled: [], delayed: [], deadLetter: [] };
    this._leaders = [];
    this._metrics = [];
    this._events = [];
    this._maxMetrics = 10000;
    this._maxEvents = 5000;
  }

  // Workers
  async storeWorker(worker) {
    this._workers.set(worker.id, { ...worker, updatedAt: Date.now() });
  }

  async getWorker(workerId) {
    return this._workers.get(workerId) || null;
  }

  async listWorkers(filter) {
    let workers = Array.from(this._workers.values());
    if (filter && filter.status) workers = workers.filter(w => w.status === filter.status);
    if (filter && filter.type) workers = workers.filter(w => w.type === filter.type);
    return workers;
  }

  async removeWorker(workerId) {
    this._workers.delete(workerId);
  }

  async workerCount() {
    return this._workers.size;
  }

  // Tasks
  async storeTask(task) {
    this._tasks.set(task.id, { ...task, updatedAt: Date.now() });
  }

  async getTask(taskId) {
    return this._tasks.get(taskId) || null;
  }

  async listTasks(filter) {
    let tasks = Array.from(this._tasks.values());
    if (filter && filter.status) tasks = tasks.filter(t => t.status === filter.status);
    if (filter && filter.workerId) tasks = tasks.filter(t => t.workerId === filter.workerId);
    if (filter && filter.type) tasks = tasks.filter(t => t.type === filter.type);
    if (filter && filter.limit) tasks = tasks.slice(0, filter.limit);
    return tasks;
  }

  async removeTask(taskId) {
    this._tasks.delete(taskId);
  }

  async taskCount() {
    return this._tasks.size;
  }

  // Queue operations
  async enqueue(queueName, item) {
    if (!this._queues[queueName]) this._queues[queueName] = [];
    if (queueName === 'lifo') {
      this._queues[queueName].push(item);
    } else {
      this._queues[queueName].push(item);
    }
  }

  async dequeue(queueName) {
    const q = this._queues[queueName];
    if (!q || q.length === 0) return null;
    if (queueName === 'lifo') return q.pop();
    return q.shift();
  }

  async peek(queueName, count = 1) {
    const q = this._queues[queueName];
    if (!q) return [];
    return q.slice(0, count);
  }

  async queueSize(queueName) {
    const q = this._queues[queueName];
    return q ? q.length : 0;
  }

  async listQueues() {
    const result = {};
    for (const [name, items] of Object.entries(this._queues)) {
      result[name] = { size: items.length, type: name };
    }
    return result;
  }

  async removeFromQueue(queueName, taskId) {
    const q = this._queues[queueName];
    if (!q) return;
    const idx = q.findIndex(item => (item.id || item) === taskId);
    if (idx !== -1) q.splice(idx, 1);
  }

  async moveToDeadLetter(task, reason) {
    await this.enqueue('deadLetter', { ...task, deadLetterReason: reason, movedAt: Date.now() });
  }

  // Leaders
  async storeLeader(leader) {
    this._leaders.push({ ...leader, timestamp: Date.now() });
    if (this._leaders.length > 100) this._leaders.shift();
  }

  async getCurrentLeader() {
    if (this._leaders.length === 0) return null;
    return this._leaders[this._leaders.length - 1];
  }

  async getLeaderHistory(limit = 10) {
    return this._leaders.slice(-limit);
  }

  // Metrics
  async storeMetric(metric) {
    this._metrics.push({ ...metric, timestamp: Date.now() });
    if (this._metrics.length > this._maxMetrics) this._metrics.shift();
  }

  async getMetrics(filter) {
    let entries = this._metrics;
    if (filter && filter.name) entries = entries.filter(m => m.name === filter.name);
    if (filter && filter.since) entries = entries.filter(m => m.timestamp >= filter.since);
    if (filter && filter.limit) entries = entries.slice(-filter.limit);
    return entries;
  }

  async clear() {
    this._workers.clear();
    this._tasks.clear();
    this._queues = { priority: [], fifo: [], lifo: [], scheduled: [], delayed: [], deadLetter: [] };
    this._leaders = [];
    this._metrics = [];
  }

  async snapshot() {
    return {
      workers: this._workers.size,
      tasks: this._tasks.size,
      queues: Object.fromEntries(Object.entries(this._queues).map(([k, v]) => [k, v.length])),
      leaders: this._leaders.length,
      metrics: this._metrics.length,
    };
  }
}

module.exports = ClusterStorage;
