const emailQueue = require('../lib/queue');
const { getDetailedSnapshot, getSnapshot } = require('../lib/rate-limit');
const { deployInfo } = require('../lib/safeBodyParser');

module.exports = async (req, res) => {
  const url = req.url || '';
  const section = (url.match(/[?&]section=([a-z-]+)(&|$)/) || [])[1] || 'summary';

  const di = deployInfo();

  if (section === 'queue') {
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
      lifecycle: detailed.lifecycle,
    });
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(body);
  }

  if (section === 'rate-limit') {
    const detailed = getDetailedSnapshot();
    const basic = getSnapshot();
    const body = JSON.stringify({
      status: 'ok',
      timestamp: detailed.timestamp,
      instanceId: detailed.instanceId,
      ip: {
        currentEntries: basic.ipEntries,
        currentUsage: detailed.ip.entries,
        softLimit: detailed.ip.softLimit,
        hardLimit: detailed.ip.hardLimit,
        windowMs: detailed.ip.windowMs,
        oldestEntryAgeMs: detailed.ip.oldestEntryAgeMs,
        windowResetTime: detailed.ip.windowResetTime,
      },
      emailDedup: {
        cacheSize: basic.emailEntries,
        currentEntries: detailed.emailDedup.entries,
        limit: detailed.emailDedup.limit,
        windowMs: detailed.emailDedup.windowMs,
        oldestEntryAgeMs: detailed.emailDedup.oldestEntryAgeMs,
        windowResetTime: detailed.emailDedup.windowResetTime,
      },
      thresholds: {
        edgeSoftLimit: detailed.ip.softLimit,
        edgeHardLimit: detailed.ip.hardLimit,
        edgeWindowMs: detailed.ip.windowMs,
        emailDedupWindowMs: detailed.emailDedup.windowMs,
        emailDedupMaxPerWindow: detailed.emailDedup.limit,
      },
    });
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(body);
  }

  const queueStats = emailQueue.stats();
  const detailed = emailQueue.getDetailedStats();
  const rlSnapshot = getSnapshot();

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
    lifecycle: detailed.lifecycle,
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
