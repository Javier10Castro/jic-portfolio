const ClusterStorage = require('./clusterStorage');
const { WorkerNode, WORKER_TYPES } = require('./workerNode');

class WorkerRegistry {
  constructor(storage) {
    this._storage = storage || new ClusterStorage();
    this._workersByType = new Map();
    WORKER_TYPES.forEach(t => this._workersByType.set(t, new Set()));
  }

  async register(worker) {
    const node = worker instanceof WorkerNode ? worker : new WorkerNode(worker);
    await this._storage.storeWorker(node.toJSON());
    if (this._workersByType.has(node.type)) {
      this._workersByType.get(node.type).add(node.id);
    }
    return node;
  }

  async unregister(workerId) {
    const worker = await this._storage.getWorker(workerId);
    if (!worker) return false;
    await this._storage.removeWorker(workerId);
    if (this._workersByType.has(worker.type)) {
      this._workersByType.get(worker.type).delete(workerId);
    }
    return true;
  }

  async getWorker(workerId) {
    const data = await this._storage.getWorker(workerId);
    return data ? WorkerNode.fromJSON(data) : null;
  }

  async listWorkers(filter) {
    const list = await this._storage.listWorkers(filter);
    return list.map(d => WorkerNode.fromJSON(d));
  }

  async listWorkersByType(type) {
    const ids = this._workersByType.get(type);
    if (!ids || ids.size === 0) return [];
    const workers = [];
    for (const id of ids) {
      const w = await this.getWorker(id);
      if (w) workers.push(w);
    }
    return workers;
  }

  async getOnlineWorkers(filter) {
    const all = await this.listWorkers(filter);
    return all.filter(w => w.status !== 'offline' && w.status !== 'stale');
  }

  async getAvailableWorkers() {
    const all = await this.listWorkers();
    return all.filter(w => w.status === 'idle' || w.status === 'busy');
  }

  async workerCount() {
    return this._storage.workerCount();
  }

  async workerCountByStatus() {
    const all = await this.listWorkers();
    const counts = { idle: 0, busy: 0, degraded: 0, offline: 0, stale: 0 };
    all.forEach(w => { if (counts[w.status] !== undefined) counts[w.status]++; });
    return counts;
  }

  async workerCountByType() {
    const result = {};
    for (const [type, ids] of this._workersByType) {
      result[type] = ids.size;
    }
    return result;
  }

  async updateWorker(workerId, updates) {
    const worker = await this._storage.getWorker(workerId);
    if (!worker) return null;
    Object.assign(worker, updates, { updatedAt: Date.now() });
    await this._storage.storeWorker(worker);
    return WorkerNode.fromJSON(worker);
  }

  async workerExists(workerId) {
    const w = await this.getWorker(workerId);
    return w !== null;
  }
}

module.exports = WorkerRegistry;
