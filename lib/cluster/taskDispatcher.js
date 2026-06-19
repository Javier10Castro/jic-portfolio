const { TaskQueue } = require('./taskQueue');
const { LoadBalancer } = require('./loadBalancer');
const { ClusterEvents, EVENT_TYPES } = require('./clusterEvents');
const ClusterStorage = require('./clusterStorage');

const TASK_STATUSES = ['pending', 'queued', 'dispatched', 'running', 'completed', 'failed', 'cancelled', 'retrying'];

class TaskDispatcher {
  constructor(options = {}) {
    this._storage = options.storage || new ClusterStorage();
    this._queue = options.queue || new TaskQueue(this._storage);
    this._balancer = options.balancer || new LoadBalancer();
    this._events = options.eventBus || new ClusterEvents();
    this._getWorkers = options.getWorkers || (() => []);
    this._onTaskComplete = options.onTaskComplete || null;
    this._onTaskFailed = options.onTaskFailed || null;
    this._maxRetries = options.maxRetries || 3;
    this._dispatchedTasks = new Map();
  }

  setGetWorkers(fn) {
    this._getWorkers = fn;
  }

  async dispatch(task, options = {}) {
    const taskId = task.id || 't-' + Math.random().toString(36).substring(2, 10);
    const taskEntry = {
      id: taskId,
      type: task.type || 'workflow',
      payload: task.payload || task,
      status: 'pending',
      priority: task.priority || 0,
      workflowId: task.workflowId || null,
      agentId: task.agentId || null,
      createdAt: Date.now(),
      attempts: 0,
      maxRetries: options.maxRetries || this._maxRetries,
      strategy: options.strategy || this._balancer.getStrategy(),
      queueType: options.queueType || 'priority',
      ...task,
    };

    await this._storage.storeTask(taskEntry);

    const strategy = options.strategy || this._balancer.getStrategy();
    this._balancer.setStrategy(strategy);
    const workers = await this._getWorkers();
    let worker = await this._balancer.selectWorker(workers, taskEntry, strategy);

    if (!worker) {
      taskEntry.status = 'queued';
      await this._enqueue(taskEntry, options.queueType || 'priority');
      this._events.emit('cluster.task.dispatched', {
        taskId, status: 'queued', reason: 'no worker available', timestamp: Date.now(),
      });
      return { taskId, status: 'queued', workerId: null };
    }

    taskEntry.status = 'dispatched';
    taskEntry.workerId = worker.id;
    taskEntry.dispatchedAt = Date.now();
    taskEntry.attempts = 1;
    await this._storage.storeTask(taskEntry);
    this._dispatchedTasks.set(taskId, taskEntry);

    worker.addTask(taskId);
    worker.markBusy();
    await this._storage.storeWorker(worker.toJSON());

    this._events.emit('cluster.task.dispatched', {
      taskId, workerId: worker.id, strategy, timestamp: Date.now(),
    });

    return { taskId, status: 'dispatched', workerId: worker.id };
  }

  async completeTask(taskId, result) {
    const task = await this._storage.getTask(taskId);
    if (!task) return null;
    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;
    await this._storage.storeTask(task);
    this._dispatchedTasks.delete(taskId);

    if (task.workerId) {
      const data = await this._storage.getWorker(task.workerId);
      if (data) {
        const w = data instanceof WorkerNode ? data : WorkerNode.fromJSON(data);
        w.removeTask(taskId);
        w.completedTasks = (w.completedTasks || 0) + 1;
        if (w.runningTasks.length === 0) w.markIdle();
        await this._storage.storeWorker(w.toJSON());
      }
    }

    this._events.emit('cluster.task.completed', { taskId, workerId: task.workerId, timestamp: Date.now() });
    if (this._onTaskComplete) this._onTaskComplete(task, result);
    return task;
  }

  async failTask(taskId, error) {
    const task = await this._storage.getTask(taskId);
    if (!task) return null;

    if (task.attempts < task.maxRetries) {
      task.status = 'retrying';
      task.attempts++;
      task.lastError = error;
      await this._storage.storeTask(task);

      const delay = Math.min(1000 * Math.pow(2, task.attempts - 1), 30000);
      await this._queue.enqueueDelayed(task, delay);

      this._events.emit('cluster.task.failed', {
        taskId, workerId: task.workerId, error, attempt: task.attempts, retrying: true, timestamp: Date.now(),
      });

      if (task.workerId) {
        const data = await this._storage.getWorker(task.workerId);
        if (data) {
          const w = data instanceof WorkerNode ? data : WorkerNode.fromJSON(data);
          w.removeTask(taskId);
          w.failedTasks = (w.failedTasks || 0) + 1;
          if (w.runningTasks.length === 0) w.markIdle();
          await this._storage.storeWorker(w.toJSON());
        }
      }

      return { taskId, status: 'retrying', attempts: task.attempts };
    }

    task.status = 'failed';
    task.failedAt = Date.now();
    task.lastError = error;
    await this._storage.storeTask(task);
    this._dispatchedTasks.delete(taskId);

    await this._queue.enqueueDeadLetter(task, error);

    if (task.workerId) {
      const data = await this._storage.getWorker(task.workerId);
      if (data) {
        const w = data instanceof WorkerNode ? data : WorkerNode.fromJSON(data);
        w.removeTask(taskId);
        w.failedTasks = (w.failedTasks || 0) + 1;
        if (w.runningTasks.length === 0) w.markIdle();
        await this._storage.storeWorker(w.toJSON());
      }
    }

    this._events.emit('cluster.task.failed', {
      taskId, workerId: task.workerId, error, attempt: task.attempts, retrying: false, timestamp: Date.now(),
    });
    if (this._onTaskFailed) this._onTaskFailed(task, error);
    return { taskId, status: 'failed', attempts: task.attempts };
  }

  async cancelTask(taskId) {
    const task = await this._storage.getTask(taskId);
    if (!task) return null;
    task.status = 'cancelled';
    task.cancelledAt = Date.now();
    await this._storage.storeTask(task);
    this._dispatchedTasks.delete(taskId);
    if (task.workerId) {
      const data = await this._storage.getWorker(task.workerId);
      if (data) {
        const w = data instanceof WorkerNode ? data : WorkerNode.fromJSON(data);
        w.removeTask(taskId);
        await this._storage.storeWorker(w.toJSON());
      }
    }
    return task;
  }

  async _enqueue(task, queueType) {
    task.status = 'queued';
    switch (queueType) {
      case 'fifo': await this._queue.enqueueFifo(task); break;
      case 'lifo': await this._queue.enqueueLifo(task); break;
      case 'delayed': await this._queue.enqueueDelayed(task, task.delayMs || 0); break;
      case 'scheduled': await this._queue.enqueueScheduled(task, task.runAt || Date.now()); break;
      default: await this._queue.enqueuePriority(task, task.priority || 0); break;
    }
  }

  async processQueues() {
    const results = [];
    for (const qType of ['priority', 'scheduled', 'delayed', 'fifo', 'lifo']) {
      let task;
      if (qType === 'scheduled') task = await this._queue.dequeueScheduled();
      else if (qType === 'delayed') task = await this._queue.dequeueDelayed();
      else task = await this._queue['dequeue' + qType.charAt(0).toUpperCase() + qType.slice(1)]();
      if (task) {
        const dispatchResult = await this.dispatch(task, { queueType: qType });
        results.push(dispatchResult);
      }
    }
    return results;
  }

  async getTask(taskId) {
    return this._storage.getTask(taskId);
  }

  async listTasks(filter) {
    return this._storage.listTasks(filter);
  }

  async getDispatchedTasks() {
    return Array.from(this._dispatchedTasks.values());
  }

  async getQueueSizes() {
    return this._queue.allSizes();
  }
}

const { WorkerNode } = require('./workerNode');

module.exports = { TaskDispatcher, TASK_STATUSES };
