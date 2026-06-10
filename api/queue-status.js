const emailQueue = require('../lib/queue');

module.exports = async (req, res) => {
  const detailed = emailQueue.getDetailedStats();
  const stats = emailQueue.stats();

  const body = JSON.stringify({
    status: 'ok',
    timestamp: detailed.timestamp,
    queue: {
      depth: stats.depth,
      currentDepth: detailed.queue.depth,
      active: stats.active,
      activeWorkers: detailed.queue.active,
      maxDepth: detailed.queue.maxDepth,
      utilizationPercent: Math.round((detailed.queue.depth / detailed.queue.maxDepth) * 100),
    },
    throughput: {
      totalEnqueued: detailed.throughput.totalEnqueued,
      completed: stats.completed,
      failed: stats.failed,
      successRate: stats.completed + stats.failed > 0
        ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100) + '%'
        : '100%',
    },
    oldestRequest: {
      ageMs: detailed.oldestRequestAgeMs,
      ageSec: detailed.oldestRequestAgeSec,
      ageMin: Math.round(detailed.oldestRequestAgeMs / 60000),
    },
  });

  res.writeHead(200, { 'Content-Type': 'application/json' }).end(body);
};
