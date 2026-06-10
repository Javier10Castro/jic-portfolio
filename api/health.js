const emailQueue = require('../lib/queue');
const { getSnapshot, clientIp } = require('../lib/rate-limit');
const { deployInfo } = require('../lib/safeBodyParser');

module.exports = async (req, res) => {
  const queueStats = emailQueue.stats();
  const rlSnapshot = getSnapshot();
  const di = deployInfo();

  const body = JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    instance: {
      id: rlSnapshot.instanceId,
      sha: di.sha,
      env: di.env,
      region: di.region,
    },
    queue: {
      size: queueStats.depth,
      active: queueStats.active,
      pending: Math.max(0, queueStats.depth - queueStats.active),
      completed: queueStats.completed,
      failed: queueStats.failed,
      maxDepth: 100,
    },
    rateLimit: {
      ipEntries: rlSnapshot.ipEntries,
      emailEntries: rlSnapshot.emailEntries,
      edgeSoftLimit: rlSnapshot.edgeSoftLimit,
      edgeHardLimit: rlSnapshot.edgeHardLimit,
      edgeWindowMs: rlSnapshot.edgeWindowMs,
      emailDedupWindowMs: rlSnapshot.emailDedupWindowMs,
    },
    memory: process.memoryUsage ? {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    } : null,
  });

  res.writeHead(200, { 'Content-Type': 'application/json' }).end(body);
};
