const STRATEGIES = ['round_robin', 'least_busy', 'weighted', 'latency', 'cost', 'sticky'];

class LoadBalancer {
  constructor(options = {}) {
    this._strategy = options.strategy || 'round_robin';
    this._roundRobinIndex = new Map();
    this._stickyAssignments = new Map();
  }

  setStrategy(strategy) {
    if (!STRATEGIES.includes(strategy)) throw new Error(`Unknown strategy: ${strategy}`);
    this._strategy = strategy;
  }

  getStrategy() {
    return this._strategy;
  }

  async selectWorker(workers, task, strategy) {
    const s = strategy || this._strategy;
    if (!workers || workers.length === 0) return null;

    const online = workers.filter(w => w.status === 'idle' || w.status === 'busy');
    if (online.length === 0) return null;

    switch (s) {
      case 'round_robin': return this._roundRobin(online, task);
      case 'least_busy': return this._leastBusy(online);
      case 'weighted': return this._weighted(online, task);
      case 'latency': return this._latencyOptimized(online);
      case 'cost': return this._costOptimized(online);
      case 'sticky': return this._sticky(online, task);
      default: return this._roundRobin(online, task);
    }
  }

  _roundRobin(workers, task) {
    const key = task ? task.type || 'default' : 'default';
    if (!this._roundRobinIndex.has(key)) this._roundRobinIndex.set(key, 0);
    let idx = this._roundRobinIndex.get(key);
    const worker = workers[idx % workers.length];
    this._roundRobinIndex.set(key, idx + 1);
    return worker;
  }

  _leastBusy(workers) {
    let selected = workers[0];
    let minTasks = workers[0].runningTasks ? workers[0].runningTasks.length : Infinity;
    for (const w of workers) {
      const count = w.runningTasks ? w.runningTasks.length : 0;
      if (count < minTasks) {
        minTasks = count;
        selected = w;
      }
    }
    return selected;
  }

  _weighted(workers, task) {
    const totalWeight = workers.reduce((sum, w) => sum + (w.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const w of workers) {
      random -= w.weight || 1;
      if (random <= 0) return w;
    }
    return workers[workers.length - 1];
  }

  _latencyOptimized(workers) {
    let selected = workers[0];
    let minLatency = Infinity;
    for (const w of workers) {
      const lat = (w.metadata && w.metadata.avgLatency) || 0;
      if (lat < minLatency) {
        minLatency = lat;
        selected = w;
      }
    }
    return selected;
  }

  _costOptimized(workers) {
    let selected = workers[0];
    let minCost = Infinity;
    for (const w of workers) {
      const cost = (w.metadata && w.metadata.avgCost) || 0;
      if (cost < minCost) {
        minCost = cost;
        selected = w;
      }
    }
    return selected;
  }

  _sticky(workers, task) {
    if (!task || !task.workflowId) return this._leastBusy(workers);
    const existing = this._stickyAssignments.get(task.workflowId);
    if (existing) {
      const worker = workers.find(w => w.id === existing);
      if (worker && worker.status !== 'offline') return worker;
    }
    const selected = this._leastBusy(workers);
    this._stickyAssignments.set(task.workflowId, selected.id);
    return selected;
  }

  clearSticky(workflowId) {
    this._stickyAssignments.delete(workflowId);
  }

  getStrategies() {
    return [...STRATEGIES];
  }
}

module.exports = { LoadBalancer, STRATEGIES };
