const { getClusterManager } = require('../../cluster');
const { success, created } = require('../responses');
const { ValidationError } = require('../errors');

function getManager() {
  return getClusterManager();
}

async function getClusterHealthEndpoint(req, res) {
  const health = await getManager().getClusterHealth();
  return success(res, health);
}

async function getWorkersEndpoint(req, res) {
  const { status, type, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  const workers = await getManager().getWorkers(filter);
  return success(res, {
    workers: workers.map(w => w.toJSON ? w.toJSON() : w),
    total: workers.length,
    limit: parseInt(limit) || 100,
  });
}

async function getQueuesEndpoint(req, res) {
  const queues = await getManager().getQueues();
  return success(res, { queues });
}

async function getClusterMetricsEndpoint(req, res) {
  const { name, since, limit } = req.query;
  const filter = {};
  if (name) filter.name = name;
  if (since) filter.since = parseInt(since);
  if (limit) filter.limit = parseInt(limit);
  const metrics = await getManager().getMetrics(filter);
  const live = getManager().getMetricsCollector().getAllMetrics();
  return success(res, { metrics, live, total: metrics.length });
}

async function getLeaderEndpoint(req, res) {
  const leader = await getManager().getLeader();
  return success(res, leader);
}

async function registerWorkerEndpoint(req, res) {
  const { type, hostname, capabilities, tags, weight } = req.body;
  if (!type) throw new ValidationError('Worker type is required');
  const worker = await getManager().registerWorker({
    type,
    hostname: hostname || 'localhost',
    capabilities: capabilities || [],
    tags: tags || {},
    weight: weight || 1,
  });
  return created(res, worker.toJSON ? worker.toJSON() : worker);
}

async function removeWorkerEndpoint(req, res) {
  const { workerId } = req.body;
  if (!workerId) throw new ValidationError('workerId is required');
  const removed = await getManager().removeWorker(workerId);
  return success(res, { removed, workerId });
}

async function dispatchEndpoint(req, res) {
  const { task, options } = req.body;
  if (!task) throw new ValidationError('task is required');
  const result = await getManager().dispatchTask(task, options || {});
  return created(res, result);
}

module.exports = {
  getClusterHealthEndpoint,
  getWorkersEndpoint,
  getQueuesEndpoint,
  getClusterMetricsEndpoint,
  getLeaderEndpoint,
  registerWorkerEndpoint,
  removeWorkerEndpoint,
  dispatchEndpoint,
};
