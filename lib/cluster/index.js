const ClusterManager = require('./clusterManager');
const ClusterStorage = require('./clusterStorage');
const WorkerManager = require('./workerManager');
const WorkerRegistry = require('./workerRegistry');
const { WorkerNode, STATUSES, WORKER_TYPES } = require('./workerNode');
const HeartbeatMonitor = require('./heartbeatMonitor');
const LeaderElection = require('./leaderElection');
const { TaskDispatcher, TASK_STATUSES } = require('./taskDispatcher');
const { TaskQueue, QUEUE_TYPES } = require('./taskQueue');
const { LoadBalancer, STRATEGIES } = require('./loadBalancer');
const DistributedScheduler = require('./distributedScheduler');
const ClusterMetrics = require('./clusterMetrics');
const { ClusterEvents, EVENT_TYPES } = require('./clusterEvents');

const _defaultCluster = new ClusterManager();

function startCluster(options) {
  return _defaultCluster.start(options);
}

function stopCluster() {
  return _defaultCluster.stop();
}

function registerWorker(options) {
  return _defaultCluster.registerWorker(options);
}

function removeWorker(workerId) {
  return _defaultCluster.removeWorker(workerId);
}

function dispatchWorkflow(workflowDef, input, options) {
  return _defaultCluster.dispatchWorkflow(workflowDef, input, options);
}

function dispatchTask(task, options) {
  return _defaultCluster.dispatchTask(task, options);
}

function getClusterHealth() {
  return _defaultCluster.getClusterHealth();
}

function getClusterManager() {
  return _defaultCluster;
}

function createClusterManager(options) {
  return new ClusterManager(options);
}

module.exports = {
  startCluster,
  stopCluster,
  registerWorker,
  removeWorker,
  dispatchWorkflow,
  dispatchTask,
  getClusterHealth,
  getClusterManager,
  createClusterManager,
  ClusterManager,
  ClusterStorage,
  WorkerManager,
  WorkerRegistry,
  WorkerNode,
  HeartbeatMonitor,
  LeaderElection,
  TaskDispatcher,
  TaskQueue,
  LoadBalancer,
  DistributedScheduler,
  ClusterMetrics,
  ClusterEvents,
  STATUSES,
  WORKER_TYPES,
  TASK_STATUSES,
  QUEUE_TYPES,
  STRATEGIES,
  EVENT_TYPES,
};
