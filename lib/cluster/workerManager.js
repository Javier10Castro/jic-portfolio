const WorkerRegistry = require('./workerRegistry');
const { WorkerNode } = require('./workerNode');
const HeartbeatMonitor = require('./heartbeatMonitor');
const { ClusterEvents, EVENT_TYPES } = require('./clusterEvents');
const ClusterMetrics = require('./clusterMetrics');

class WorkerManager {
  constructor(options = {}) {
    this._registry = options.registry || new WorkerRegistry();
    this._events = options.eventBus || new ClusterEvents();
    this._metrics = options.metrics || new ClusterMetrics();
    this._heartbeatMonitor = options.heartbeatMonitor || new HeartbeatMonitor({
      eventBus: this._events,
      onWorkerOffline: (w) => this._handleWorkerOffline(w),
      onWorkerStale: (w) => this._handleWorkerStale(w),
    });
    this._heartbeatMonitor.setReceiveWorker((id, data) => this._receiveWorkerUpdate(id, data));
  }

  async registerWorker(options) {
    const worker = new WorkerNode(options);
    const registered = await this._registry.register(worker);
    this._metrics.recordWorkerEvent(worker.id, { type: 'joined' });
    this._events.emit('cluster.worker.joined', {
      workerId: worker.id,
      type: worker.type,
      hostname: worker.hostname,
      timestamp: Date.now(),
    });
    return registered;
  }

  async unregisterWorker(workerId) {
    const worker = await this._registry.getWorker(workerId);
    if (!worker) return false;
    await this._registry.unregister(workerId);
    this._metrics.recordWorkerEvent(workerId, { type: 'left' });
    this._events.emit('cluster.worker.left', {
      workerId,
      reason: 'manual',
      timestamp: Date.now(),
    });
    return true;
  }

  async getWorker(workerId) {
    return this._registry.getWorker(workerId);
  }

  async listWorkers(filter) {
    return this._registry.listWorkers(filter);
  }

  async getOnlineWorkers() {
    return this._registry.getOnlineWorkers();
  }

  async getAvailableWorkers() {
    return this._registry.getAvailableWorkers();
  }

  async workerCount() {
    return this._registry.workerCount();
  }

  async workerCountByStatus() {
    return this._registry.workerCountByStatus();
  }

  async workerCountByType() {
    return this._registry.workerCountByType();
  }

  async receiveHeartbeat(workerId, data = {}) {
    this._heartbeatMonitor.receiveHeartbeat(workerId, data);
    this._metrics.recordHeartbeat(workerId);
    const worker = await this._registry.getWorker(workerId);
    if (worker) {
      worker.heartbeat();
      if (data.cpu !== undefined) worker.cpu = data.cpu;
      if (data.memory !== undefined) worker.memory = data.memory;
      if (data.runningTasks !== undefined) {
        worker.runningTasks = data.runningTasks;
        worker.queueSize = data.runningTasks.length || data.runningTasks;
      }
      if (worker.status === 'offline' || worker.status === 'stale') {
        worker.markIdle();
        this._events.emit('cluster.worker.joined', {
          workerId, reason: 'reconnected', timestamp: Date.now(),
        });
      }
      const storage = this._registry._storage;
      if (storage) await storage.storeWorker(worker.toJSON());
    }
  }

  async _receiveWorkerUpdate(workerId, updates) {
    await this._registry.updateWorker(workerId, updates);
  }

  startHeartbeatMonitor(getWorkersFn) {
    this._heartbeatMonitor.start(getWorkersFn);
  }

  stopHeartbeatMonitor() {
    this._heartbeatMonitor.stop();
  }

  async _handleWorkerOffline(worker) {
    this._metrics.recordWorkerEvent(worker.id, { type: 'offline' });
    this._events.emit('cluster.failover', {
      workerId: worker.id,
      reason: 'offline',
      timestamp: Date.now(),
    });
  }

  async _handleWorkerStale(worker) {
    this._metrics.recordWorkerEvent(worker.id, { type: 'stale' });
  }

  getHeartbeatStatus() {
    return this._heartbeatMonitor.getStatus();
  }

  getRegistry() {
    return this._registry;
  }
}

module.exports = WorkerManager;
