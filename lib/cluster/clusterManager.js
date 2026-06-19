const ClusterStorage = require('./clusterStorage');
const WorkerManager = require('./workerManager');
const WorkerRegistry = require('./workerRegistry');
const { WorkerNode, WORKER_TYPES } = require('./workerNode');
const HeartbeatMonitor = require('./heartbeatMonitor');
const LeaderElection = require('./leaderElection');
const { TaskDispatcher } = require('./taskDispatcher');
const { TaskQueue } = require('./taskQueue');
const { LoadBalancer } = require('./loadBalancer');
const DistributedScheduler = require('./distributedScheduler');
const ClusterMetrics = require('./clusterMetrics');
const { ClusterEvents, EVENT_TYPES } = require('./clusterEvents');

class ClusterManager {
  constructor(options = {}) {
    this._id = options.id || 'cluster-' + Math.random().toString(36).substring(2, 10);
    this._storage = options.storage || new ClusterStorage();
    this._events = options.eventBus || new ClusterEvents();
    this._metrics = options.metrics || new ClusterMetrics(this._storage);

    this._registry = options.registry || new WorkerRegistry(this._storage);
    this._workerManager = options.workerManager || new WorkerManager({
      registry: this._registry,
      eventBus: this._events,
      metrics: this._metrics,
    });

    this._queue = options.queue || new TaskQueue(this._storage);
    this._balancer = options.balancer || new LoadBalancer();
    this._dispatcher = options.dispatcher || new TaskDispatcher({
      storage: this._storage,
      queue: this._queue,
      balancer: this._balancer,
      eventBus: this._events,
      getWorkers: () => [],
    });
    this._dispatcher.setGetWorkers(() => this._workerManager.getAvailableWorkers());

    this._leaderElection = options.leaderElection || new LeaderElection({
      nodeId: this._id,
      eventBus: this._events,
      storage: this._storage,
      onBecomeLeader: (id, term) => this._onBecomeLeader(id, term),
      onLeaderChange: (newLeader, oldLeader) => this._onLeaderChange(newLeader, oldLeader),
    });

    this._scheduler = options.scheduler || new DistributedScheduler({
      dispatcher: this._dispatcher,
      eventBus: this._events,
      leaderElection: this._leaderElection,
    });

    this._running = false;
    this._startedAt = null;
  }

  async start(options = {}) {
    if (this._running) return;
    this._running = true;
    this._startedAt = Date.now();

    const simulateWorkers = options.simulateWorkers !== undefined ? options.simulateWorkers : true;
    const workerCount = options.workerCount || 5;
    const isLocal = options.isLocal !== undefined ? options.isLocal : true;

    if (simulateWorkers && isLocal) {
      await this._simulateWorkers(workerCount);
    }

    this._workerManager.startHeartbeatMonitor(() => this._workerManager.listWorkers());
    this._leaderElection.start(async () => {
      const workers = await this._workerManager.listWorkers();
      return workers.map(w => w.id);
    });
    this._scheduler.start();

    this._events.emit('cluster.started', {
      clusterId: this._id,
      workers: await this._workerManager.workerCount(),
      timestamp: this._startedAt,
    });

    return { clusterId: this._id, startedAt: this._startedAt };
  }

  async stop() {
    if (!this._running) return;
    this._scheduler.stop();
    this._leaderElection.stop();
    this._workerManager.stopHeartbeatMonitor();
    this._running = false;
    this._events.emit('cluster.stopped', {
      clusterId: this._id,
      timestamp: Date.now(),
    });
  }

  isRunning() {
    return this._running;
  }

  getClusterId() {
    return this._id;
  }

  async registerWorker(options) {
    return this._workerManager.registerWorker(options);
  }

  async removeWorker(workerId) {
    return this._workerManager.unregisterWorker(workerId);
  }

  async dispatchWorkflow(workflowDef, input, options) {
    const taskId = 'wf-' + Math.random().toString(36).substring(2, 10);
    const task = {
      id: taskId,
      type: 'workflow',
      workflowId: workflowDef.id || workflowDef,
      payload: input,
      priority: (options && options.priority) || 0,
      workflowDef,
      ...options,
    };
    return this._dispatcher.dispatch(task, options);
  }

  async dispatchTask(task, options) {
    return this._dispatcher.dispatch(task, options);
  }

  async completeTask(taskId, result) {
    return this._dispatcher.completeTask(taskId, result);
  }

  async failTask(taskId, error) {
    return this._dispatcher.failTask(taskId, error);
  }

  async cancelTask(taskId) {
    return this._dispatcher.cancelTask(taskId);
  }

  async getTask(taskId) {
    return this._dispatcher.getTask(taskId);
  }

  async listTasks(filter) {
    return this._dispatcher.listTasks(filter);
  }

  async getClusterHealth() {
    const workers = await this._workerManager.listWorkers();
    const workerStatus = await this._workerManager.workerCountByStatus();
    const workerTypes = await this._workerManager.workerCountByType();
    const leader = this._leaderElection.getStatus();
    const queues = await this._dispatcher.getQueueSizes();
    const taskCounts = {
      total: await this._storage.taskCount(),
      dispatched: (await this._dispatcher.getDispatchedTasks()).length,
    };

    const totalWorkers = workers.length;
    const healthyWorkers = workers.filter(w => w.status === 'idle' || w.status === 'busy').length;
    const degradedWorkers = workers.filter(w => w.status === 'degraded').length;
    const offlineWorkers = workers.filter(w => w.status === 'offline' || w.status === 'stale').length;

    const throughput = this._metrics.getCounter('tasks.completed');

    return {
      clusterId: this._id,
      status: offlineWorkers > totalWorkers / 2 ? 'degraded' : totalWorkers === 0 ? 'empty' : 'healthy',
      running: this._running,
      uptime: this._startedAt ? Date.now() - this._startedAt : 0,
      workers: {
        total: totalWorkers,
        healthy: healthyWorkers,
        degraded: degradedWorkers,
        offline: offlineWorkers,
        byStatus: workerStatus,
        byType: workerTypes,
      },
      leader,
      queues,
      tasks: taskCounts,
      throughput: { completed: throughput, failed: this._metrics.getCounter('tasks.failed') },
      metrics: this._metrics.snapshot(),
    };
  }

  async getWorkers(filter) {
    return this._workerManager.listWorkers(filter);
  }

  async getQueues() {
    const sizes = await this._dispatcher.getQueueSizes();
    const queues = [];
    for (const [name, size] of Object.entries(sizes)) {
      const tasks = await this._storage.peek(name, 5);
      queues.push({ name, size, sample: tasks.map(t => ({ id: t.id, type: t.type, priority: t.priority })) });
    }
    return queues;
  }

  async getMetrics(filter) {
    return this._storage.getMetrics(filter);
  }

  async getLeader() {
    return this._leaderElection.getStatus();
  }

  async setLoadBalancerStrategy(strategy) {
    this._balancer.setStrategy(strategy);
  }

  async receiveHeartbeat(workerId, data) {
    await this._workerManager.receiveHeartbeat(workerId, data);
  }

  getStorage() {
    return this._storage;
  }

  getMetricsCollector() {
    return this._metrics;
  }

  getDispatcher() {
    return this._dispatcher;
  }

  getScheduler() {
    return this._scheduler;
  }

  getLeaderElection() {
    return this._leaderElection;
  }

  getEventBus() {
    return this._events;
  }

  async _simulateWorkers(count) {
    const types = WORKER_TYPES;
    for (let i = 0; i < count; i++) {
      await this._workerManager.registerWorker({
        id: `sim-worker-${i + 1}`,
        hostname: `node-${i + 1}.cluster.local`,
        type: types[i % types.length],
        cpu: Math.random() * 80,
        memory: { used: Math.floor(Math.random() * 512), total: 1024 },
        weight: Math.floor(Math.random() * 5) + 1,
        capabilities: ['workflow', 'ai', 'deployment'].slice(0, (i % 3) + 1),
        tags: { region: 'us-west', zone: `zone-${(i % 3) + 1}` },
      });
    }
  }
}

module.exports = ClusterManager;
