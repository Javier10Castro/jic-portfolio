const STATUSES = ['idle', 'busy', 'degraded', 'offline', 'stale'];

const WORKER_TYPES = ['workflow', 'ai', 'deployment', 'background', 'scheduled'];

class WorkerNode {
  constructor(options = {}) {
    this.id = options.id || WorkerNode._generateId();
    this.hostname = options.hostname || 'localhost';
    this.version = options.version || '1.0.0';
    this.type = options.type || 'workflow';
    this.status = options.status || 'idle';
    this.cpu = options.cpu || 0;
    this.memory = options.memory || { used: 0, total: 1024 };
    this.runningTasks = options.runningTasks || [];
    this.queueSize = options.queueSize || 0;
    this.completedTasks = options.completedTasks || 0;
    this.failedTasks = options.failedTasks || 0;
    this.lastHeartbeat = options.lastHeartbeat || Date.now();
    this.startedAt = options.startedAt || Date.now();
    this.tags = options.tags || {};
    this.weight = options.weight || 1;
    this.capabilities = options.capabilities || [];
    this.metadata = options.metadata || {};
  }

  static _generateId() {
    return 'w-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }

  markBusy() {
    this.status = 'busy';
  }

  markIdle() {
    this.status = 'idle';
  }

  markDegraded(reason) {
    this.status = 'degraded';
    this.metadata.degradedReason = reason;
  }

  markOffline() {
    this.status = 'offline';
  }

  markStale() {
    this.status = 'stale';
  }

  addTask(taskId) {
    if (!this.runningTasks.includes(taskId)) {
      this.runningTasks.push(taskId);
      this.queueSize = this.runningTasks.length;
    }
  }

  removeTask(taskId) {
    const idx = this.runningTasks.indexOf(taskId);
    if (idx !== -1) {
      this.runningTasks.splice(idx, 1);
      this.queueSize = this.runningTasks.length;
    }
  }

  heartbeat() {
    this.lastHeartbeat = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      hostname: this.hostname,
      version: this.version,
      type: this.type,
      status: this.status,
      cpu: this.cpu,
      memory: this.memory,
      runningTasks: this.runningTasks,
      queueSize: this.queueSize,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      lastHeartbeat: this.lastHeartbeat,
      startedAt: this.startedAt,
      tags: this.tags,
      weight: this.weight,
      capabilities: this.capabilities,
      metadata: this.metadata,
      uptime: Date.now() - this.startedAt,
      isHealthy: this.status === 'idle' || this.status === 'busy',
    };
  }

  static fromJSON(data) {
    return new WorkerNode(data);
  }
}

module.exports = { WorkerNode, STATUSES, WORKER_TYPES };
